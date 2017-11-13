class Player {
    constructor(id) {
      this.id = id;
    }
}

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

function getRandID() {
    var possibleChars = "abcdefghijklmnopqrstuvwxyz123456789";
    var id = "";
    for (var i = 0; i < 5; i++) {
        id = id + (possibleChars.charAt(Math.floor(Math.random() * possibleChars.length)));
    }
    return id;
}

var express = require('express');
var router = express.Router();
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('client', express.static(__dirname + '/client'));

router.get('/game', function(req, res){
    res.render('game', {
          title: 'Game'
        });
});

serv.listen(2000);
console.log("Server started.");;
var SOCKET_LIST = {};
var PLAYER_LIST = [];
var NUM_PLAYERS = 0;
var GAME_LIST = [];

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    console.log("Current Players: ");

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
        socket.join("12345");
        for(var i in PLAYER_LIST) {
            if (PLAYER_LIST[i].id === socket.id) {
                PLAYER_LIST[i].name = data;
                game.addPlayer(PLAYER_LIST[i]);
                GAME_LIST.push(game);
                console.log("1st Player: " + GAME_LIST[0].players[0].name);
                socket.emit('updateH1', "join with code " + gameID);
              
            }            
        }
      updateGame(gameID);
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
        data.trim();
        console.log("(" + data + ")");
        var player;
        // find player
        for(var i in PLAYER_LIST) {
            if (PLAYER_LIST[i].id === socket.id) {
                player = PLAYER_LIST[i];
                for (var j in GAME_LIST) {
                    if (GAME_LIST[j].id === data) {
                        GAME_LIST[j].addPlayer(player);
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
setInterval(function() {

},1000/25);

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
    console.log("a: " + names)
    for(var i in GAME_LIST) {
        if (GAME_LIST[i].id === game) {
            for(var j in GAME_LIST[i].players) {
                GAME_LIST[i].players[j].socket.emit('updateText1', names);   
                   
              
            }
        }
    }
    io.in(game).emit('updateText1', names);
}
