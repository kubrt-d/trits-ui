var socket = io();
var vue = new Vue({
   el: '#games',
   data: {
      games: []
   },
   computed:{
      groupedGames() {
         return chunk(this.games, 3)
      }
   }
});

socket.on('gameChange', function (games) {
   console.log('gameChange recieved');
   vue.games = games;
   console.log(games);
});

socket.on('gamesAll', function (games) {
   console.log('gamesAll recieved');
   vue.games = games;
   console.log(games);
});


socket.on('gamersInfo', function (count) {
   console.log(count);
});


function chunk (array, size) {
  if (Array.isArray(array)) { 
     return array.reduce(function (res, item, index) {
       if (index % size === 0) { res.push([]); }
       res[res.length-1].push(item);
       return res;
     }, []);
  }
}
