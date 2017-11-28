var SOCKET_LIST = {};
var PLAYER_LIST = [];
var NUM_PLAYERS = 0;
var GAME_LIST = [];

var express = require('express');
var router = express.Router();
var app = express();
var serv = require('http').Server(app);

// Set up express for delivering index.html page.
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('client', express.static(__dirname + '/client'));

// Start sever on heroku assigned port or 2000 for local testing
serv.listen(process.env.PORT || 2000);
console.log("Server started.");
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){ 
  // Initialize default socket variables
  socket.id = Math.random();
  socket.number = "" + Math.floor(10 * Math.random());
  SOCKET_LIST[socket.id] = socket;
  var p = new Player(socket.id);
  p.socket = socket;
  PLAYER_LIST.push(p);
  console.log('Player connected. ID: ' + socket.id);

  socket.on('disconnect',function() {
    delete SOCKET_LIST[socket.id];
    for (var i in PLAYER_LIST) {
      if (PLAYER_LIST[i].id === socket.id) {
        delete PLAYER_LIST[i];
      }
    }
    for (var i in GAME_LIST) {
      for (var j in GAME_LIST[i].players) {
        if (GAME_LIST[i].players[j].id === socket.id) {
          delete GAME_LIST[i].players[j];
          GAME_LIST[i].players.splice[j];
          GAME_LIST[i].numPlayers -= 1;
          for (var k in GAME_LIST[i].players) {
            GAME_LIST[i].players[k].socket.emit('clearTable', '');
            addCurrentToPlayer(GAME_LIST[i].id, GAME_LIST[i].players[k].socket);
          }
        }
      }
    }
    console.log('Player disconnected. ID: ' + socket.id);
  });

  socket.on('createGame', function(data) {
    console.log("New Player: " + data);
    NUM_PLAYERS++;
    var gameID = getRandID();
    var game = new Game(gameID);
    console.log("Game Started with id: " + gameID);
    this.join(gameID, function() {
      console.log(socket.id + " now in room " + gameID);
    });
    socket.emit("host", " ");
    for(var i in PLAYER_LIST) {
      if (PLAYER_LIST[i].id === socket.id) {
        PLAYER_LIST[i].name = data;
        game.addPlayer(PLAYER_LIST[i]);
        GAME_LIST.push(game);
        console.log("1st Player: " + GAME_LIST[0].players[0].name);
        socket.emit('updateH1', gameID);
        addToGame(gameID, PLAYER_LIST[i].name); 
      }            
    }
    updateGame(gameID);
  });

  socket.on('startGame', function(data) {
    for (var i in GAME_LIST) {
      if (data[0] === GAME_LIST[i].id) {
        if (GAME_LIST[i].numPlayers > 4) {
          players = GAME_LIST[i].players;
          shuffle(players);
          playerctr = 0;
          numGood = 0;
          numBad = 0;
          totalGood = 0;
          totalBad = 0;
          switch(GAME_LIST[i].numPlayers) {
            case 5:
              totalGood = 3;
              totalBad = 2;
              break;
            case 6:
              totalGood = 4;
              totalBad = 2;
              break;
            case 7:
              totalGood = 4;
              totalBad = 3;
              break;
            case 8:
              totalGood = 5;
              totalBad = 3;
              break;
            case 9:
              totalGood = 6;
              totalBad = 3;
              break;
            case 10:
              totalGood = 6;
              totalBad = 4;
              break;
          }
          // Merlin check
          if (data[1]) {
            players[playerctr].desc = "Merlin";
            players[playerctr].loyalty = "good";
            players[playerctr].socket.emit('setchar', players[playerctr].desc);
            players[playerctr].socket.emit('setCharDesc', "Merlin can see all Minions of Mordred except for Modred. At the end of the game if the good guys win, the Assassin has a chance to kill Merlin and the Minions of Mordred win.");
            players[playerctr].socket.emit('setCharDesc2', "The following players are minions of mordred:");
            numGood++;
            playerctr++;
          }
          // Percival check
          if (data[2]) {
            players[playerctr].desc = "Percival";
            players[playerctr].loyalty = "good";
            players[playerctr].socket.emit('setchar', players[playerctr].desc);
            players[playerctr].socket.emit('setCharDesc', "Percival knows both Merlin and Morgana, but not who's who.");
            players[playerctr].socket.emit('setCharDesc2', "The following players are Merlin or Morgana:");
            numGood++;
            playerctr++;
          }
          // Twins check
          if (data[3]) {
            // Create twin 1
            players[playerctr].desc = "Twin";
            players[playerctr].loyalty = "good";
            players[playerctr].socket.emit('setchar', players[playerctr].desc);
            players[playerctr].socket.emit('setCharDesc', "You have a twin. You know that this person is good.");
            players[playerctr].socket.emit('setCharDesc2', "Your twin is: ");
            playerctr++;
            numGood++;
            // Create twin 2
            players[playerctr].desc = "Twin";
            players[playerctr].loyalty = "good";
            players[playerctr].socket.emit('setchar', players[playerctr].desc);
            players[playerctr].socket.emit('setCharDesc', "You have a twin. You know that this person is good.");
            players[playerctr].socket.emit('setCharDesc2', "Your twin is: ");
            playerctr++;
            numGood++;
          }
          // Assassin check
          if (data[4]) {
            players[playerctr].desc = "Assassin";
            players[playerctr].loyalty = "bad";
            players[playerctr].socket.emit('setchar', players[playerctr].desc);
            players[playerctr].socket.emit('setCharDesc', "You are the assassin. Be on the lookout for someone that knows more than they should, they might be Merlin. At the end of the game, if you guess Merlin successfully the bad guys win.");
            players[playerctr].socket.emit('setCharDesc2', "The following players are also minions of mordred: ");
            playerctr++;
            numBad++;
          }
          // Morgana check
          if (data[5]) {
            players[playerctr].desc = "Morgana";
            players[playerctr].loyalty = "bad";
            players[playerctr].socket.emit('setchar', players[playerctr].desc);

            players[playerctr].socket.emit('setCharDesc', "You are Morgana. You reveal yourself to percival as Merlin.");
            players[playerctr].socket.emit('setCharDesc2', "The following players are also minions of mordred: ");
            playerctr++;
            numBad++;
          }
          // Mordred check
          if (data[6]) {
            players[playerctr].desc = "Mordred";
            players[playerctr].socket.emit('setchar', players[playerctr].desc);
            players[playerctr].loyalty = "hidden";
            players[playerctr].socket.emit('setCharDesc', "You are Mordred. Merlin does not know if you are a bad guy or not. Use this to the best of your ability.");
            players[playerctr].socket.emit('setCharDesc2', "The following players are minions of mordred: ");
            playerctr++;
            numBad++;
          }
          // Oberon check
          if (data[7]) {
            players[playerctr].desc = "Oberon";
            players[playerctr].loyalty = "hidden";
            players[playerctr].socket.emit('setchar', players[playerctr].desc);

            players[playerctr].socket.emit('setCharDesc', "You are Oberon. Your identity is unknown to both Merlin and your fellow minions of mordred.");
            players[playerctr].socket.emit('setCharDesc2', "");
            playerctr++;
            numBad++;
          }
          // Lancelot check
          if (data[8]) {
            players[playerctr].desc = "Loyal Lancelot";
            players[playerctr].loyalty = "good";
            players[playerctr].socket.emit('setchar', players[playerctr].desc);
            players[playerctr].socket.emit('setCharDesc', "You are the loyal Lancelot. Your identity is unknown. You are to begin as a good guy. After the third mission, you may have a change of heart.");
            players[playerctr].socket.emit('setCharDesc2', "");
            playerctr++;
            numGood++

            players[playerctr].desc = "Evil Lancelot";
            players[playerctr].loyalty = "bad lancelot";
            players[playerctr].socket.emit('setchar', players[playerctr].desc);
            players[playerctr].socket.emit('setCharDesc', "You are the evil Lancelot. Your identity is known to all bad guys. You are to begin as a bad guy. After the third mission, you may have a change of heart.");
            players[playerctr].socket.emit('setCharDesc2', "");
            playerctr++;
            numBad++
          }
          for (var i = numGood; i < totalGood; i++) {
            players[playerctr].desc = "Loyal Servant of Arthur";
            players[playerctr].loyalty = "good";
            players[playerctr].socket.emit('setchar', players[playerctr].desc);
            players[playerctr].socket.emit('setCharDesc2', "");
            players[playerctr].socket.emit('setCharDesc', "You are a loyal servant of Arthur. You must deduce who is a bad guy and prevent them from sabotaging missions.");
            playerctr++;
          }
          for (var i = numBad; i < totalBad; i++) {
            players[playerctr].desc = "Minion of Mordred";
            players[playerctr].loyalty = "bad";
            players[playerctr].socket.emit('setchar', players[playerctr].desc);
            players[playerctr].socket.emit('setCharDesc2', "");
            players[playerctr].socket.emit('setCharDesc', "You are a minion of Mordred. Play with your fellow minions to wreck havoc on the Arthur and his loyal servants.");
            playerctr++;
          }
          for (var i in players) {
            switch (players[i].desc) {
              case "Merlin": 
                for (var j in players) {
                  if (players[i] != players[j]) {
                    if (players[j].loyalty === "bad") {
                      players[i].socket.emit('setCharPlayers', players[j].name);
                    }
                  }
                }
                break;
              case "Percival":
                for (var j in players) {
                  if (players[i] != players[j]) {
                    if (players[j].desc === "Merlin") {
                      players[i].socket.emit('setCharPlayers', players[j].name);
                    }
                    if (players[j].desc === "Morgana") {
                      players[i].socket.emit('setCharPlayers', players[j].name);
                    }
                  }
                }
                break;
              case "Twin":
                for (var j in players) {
                  if (players[i] != players[j]) {
                    if (players[j].desc === "Twin") {
                      players[i].socket.emit('setCharPlayers', players[j].name);
                    }
                  }
                }
                break;
              case "Morgana":
                for (var j in players) {
                  if (players[i] != players[j]) {
                    if (players[j].loyalty === "bad") {
                      players[i].socket.emit('setCharPlayers', players[j].name);
                    }
                    if (players[j].desc === "Mordred") {
                      players[i].socket.emit('setCharPlayers', players[j].name);
                    }
                    if (players[j].desc === "Evil Lancelot") {
                      players[i].socket.emit('setCharPlayers', players[j].name + " - " + players[j].desc);
                    }
                  }
                }
                break;
              case "Assassin":
                for (var j in players) {
                  if (players[i] != players[j]) {
                    if (players[j].loyalty === "bad") {
                      players[i].socket.emit('setCharPlayers', players[j].name);
                    }
                    if (players[j].desc === "Mordred") {
                      players[i].socket.emit('setCharPlayers', players[j].name);
                    }
                    if (players[j].desc === "Evil Lancelot") {
                      players[i].socket.emit('setCharPlayers', players[j].name + " - " + players[j].desc);
                    }

                  }
                }
                break;
              case "Mordred":
                for (var j in players) {
                  if (players[i] != players[j]) {
                    if (players[j].loyalty === "bad") {
                      players[i].socket.emit('setCharPlayers', players[j].name);
                    }
                    if (players[j].desc === "Mordred") {
                      players[i].socket.emit('setCharPlayers', players[j].name);
                    }
                    if (players[j].desc === "Evil Lancelot") {
                      players[i].socket.emit('setCharPlayers', players[j].name + " - " + players[j].desc);
                    }

                  }
                }
            }
          }
        }
      }
    }
  });

  socket.on('sendName', function(data) {
    console.log("New Player: " + data);
    NUM_PLAYERS++;
    for(var i in PLAYER_LIST) {
      if (PLAYER_LIST[i].id === socket.id) {
        PLAYER_LIST[i].name = data;
        PLAYER_LIST[i].socket = socket;
      }
    }
  });

  socket.on('joinGame', function(data) {
    data = data. toLowerCase();;
    socket.emit('updateH1', data);
    console.log("(" + data + ")");
    var player;
    // find player
    for(var i in PLAYER_LIST) {
      if (PLAYER_LIST[i].id === socket.id) {
        player = PLAYER_LIST[i];
        for (var j in GAME_LIST) {
          if (GAME_LIST[j].id === data) {
            addCurrentToPlayer(data, socket);
            GAME_LIST[j].addPlayer(player);
            addToGame(data, player.name); 
          }
        }
        socket.join(data);
        console.log("Player successfully joined " + data);
      }
    }     
    console.log("Player: " + player.name + " (" + player.id + ") joining " + data);
    for(var i in GAME_LIST) {
      if (GAME_LIST.id === data) {
        GAME_LIST.push(player);
      }
    }
    game = data;
    updateGame(game);
  });
});

// Desc: updateGame() takes a game id as a parameter and gets a 
//       list of all current players and logs to the console.
// Pre:  Game id must already exist
// Post: All current players will be output to the the server log.
function updateGame(game) {

  console.log("updating game: (" + game + ")");
  var names = "";
  for(var i in GAME_LIST) {
    if (GAME_LIST[i].id === game) {
      for(var j in GAME_LIST[i].players){
        names = names + GAME_LIST[i].players[j].name + ", ";
      }
    }
  }
  console.log("Players currently in " + game + ": " + names)
  io.in(game).emit('updateText1', names);
}

// Desc: addToGame() takes a gameid and a name and sends the player name
//       to all current players already in the game.
// Pre:  Game must already be created with the current id.
// Post: All players in the game will receive name and add it to their
//       current players list.
function addToGame(game, name) {
  for(var i in GAME_LIST) {
    if (GAME_LIST[i].id === game) {
      for(var j in GAME_LIST[i].players) {
        GAME_LIST[i].players[j].socket.emit('addPlayer', name);            
      }
    }
  }
}

// Desc: addCurrentToPlayer() takes a gameid and a socket and sends all
//       current players in the game with id game to the socket passed.
// Pre:  Game must already be created with the current id. Socket must
//       already be initialized.
// Post: All current players in game will be sent to socket and added to
//       their current players list.
function addCurrentToPlayer(game, socket) {
  for(var i in GAME_LIST) {
    if (GAME_LIST[i].id === game) {
      for(var j in GAME_LIST[i].players) {
        socket.emit('addPlayer', GAME_LIST[i].players[j].name);
      }
    }
  }
}

// Desc: getRandID() returns a sequence of 5 random alphanumerics as a string
// Pre:  None
// Post: A random string will be returned.
function getRandID() {
  var possibleChars = "abcdefghijklmnopqrstuvwxyz123456789";
  var id = "";
  for (var i = 0; i < 5; i++) {
    id = id + (possibleChars.charAt(Math.floor(Math.random() * possibleChars.length)));
  }
  return id;
}

// Desc: shuffle() takes an array and shuffles it and then returns it
// Pre:  None
// Post: An array containing the same elements will be returned.
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// Desc: constructor(id) takes an id and stores it. Initializes an array of players.
//       and sets numPlayers to 0.
// Pre:  None
// Post: The id will be stored. An array of players will be instantiated and numPlayers
//       will be 0.
//
// Desc: addPlayer() takes a player object and adds it to the array of players. Also it 
//       increments numPlayers.
// Pre:  None.
// Post: player will be added to the array. numPlayers will be incremented.
class Game {
  constructor(id) {
    this.id = id;
    this.players = [];
    this.numPlayers = 0;
    this.addPlayer = function(player) {
      this.players[this.numPlayers] = player;
      this.numPlayers++;
    }
  } 
}

// Desc: constructor takes an id and stores it.
// Pre:  None.
// Post: id will be stored.
class Player {
  constructor(id) {
    this.id = id;
  }
}

