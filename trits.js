var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var yamljs = require('yamljs');
var minimist = require('minimist');
var storage = require('node-persist');
var crc = require('crc');

storage.initSync({
    dir: __dirname + '/data/storage',
    continuous: true, 
});

var sockets = [];

var argv = minimist(process.argv.slice(2), {
    string: [ 'iri' ],    
    alias: {
        h: 'help',
        i: 'iri',
        u: 'auth',        
        r: 'refresh',
        p: 'port'
    }
});


if (argv.refresh) {
    if (argv.refresh < 1 || argv.refresh > 600 )   
    {
        console.log("Refresh Value must be within 1 to 600 seconds.");
        process.exit(0);
    }
}



setInterval(function(){
    checkGames();
}, argv.refresh*1000 || 1000);



function loadGames(){
  return yamljs.load(__dirname + '/data/games_state.yml');
}


function checkGames(){
  // For testing - query a YAML file instead of the Tangle 
  games_tree = loadGames();
  //console.log(games_tree);
  game_id = 0;
  checksum = crc.crc32(JSON.stringify(games_tree).toString(16));
  saved_checksum = storage.getItemSync('game_' + game_id);
  if (saved_checksum != checksum) {
    // Emit event
    //console.log('File changed old:' + saved_checksum + ' New: ' + saved_checksum); 
    // TODO - clients not connected to the main dashboard don't need this 
    //console.log('Sending updates to ' + sockets.length + 'clients');
    sockets.forEach(function (s){
        s.emit('gameChange', games_tree);
    });
    // Save new crc 
    storage.setItem('game_' + game_id,checksum);
  }
}


  
io.on('connection', function (s) {
  sockets.push(s);
  
  // Send general info 
  s.emit('gamersInfo', sockets.length);
  
  // Send all games 
  s.emit('gamesAll', loadGames());

  //updatePeerInfo();
  s.on('disconnect', function(data){
    var i = sockets.indexOf(s);
    if(i != -1) {
	    sockets.splice(i, 1);
    }
  });
  /*
  s.on('addPeer', function (data) {
    console.log("!!!!Adding peer",data);
    try{
        iota.api.addNeighbors([data.address], function(error, result) {
        if (error) {
            console.error(error);
            s.emit('result', error.message);
        } else {
            s.emit('result', "Peer added Successfully. Please also update your IRI config file (if required)");
            updatePeerInfo();
        }
        });
        saveConfig();
    }
    catch(e){
        s.emit('result', e.message);
    }
  });
  
  s.on('removePeer', function (data) {
    console.log("!!!!Removing peer",data);
    try {
        iota.api.removeNeighbors([data.address], function(error, result) {
        if (error) {
            console.error(error);
            s.emit('result', error.message);
        } else {
            s.emit('peerDeleted', data);            
        }
        });
    }
    catch(e){
        s.emit('result', e.message);
    }
  });
  
  s.on('updateTag', function (data) {
       gTags[data.address] = data.tag;
       saveConfig();
  });
*/  
});


var port = 3333;
var host = "127.0.0.1";

if (typeof argv.port === 'string'){
    var portArgs = argv.port.split(':');
    port = portArgs[1];
    host = portArgs[0];    
}
else if (argv.port){
    port = argv.port;
}

//process.exit(0);

console.log("Serving Trits dashboard at http://"+host+":"+port);
app.use(express.static(__dirname+'/public'));
server.listen(port,host);
