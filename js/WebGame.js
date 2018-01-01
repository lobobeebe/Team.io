$(function () {
"use strict";

// if user is running mozilla then use it's built-in WebSocket
window.WebSocket = window.WebSocket || window.MozWebSocket;
// if browser doesn't support WebSocket, just show
// some notification and exit
if (!window.WebSocket)
{
    alert("Your browser does not support WebSocket. Erroring out.");
    return;
}

// open connection
var connection = new WebSocket('ws://teams.us-east-2.elasticbeanstalk.com:8082');
//var connection = new WebSocket('ws://localhost:8082');

var gameArea = new GameArea(connection);

// Events
window.addEventListener('keydown', function (e) {
    e.preventDefault();
    gameArea.keys = (gameArea.keys || []);
    gameArea.keys[e.keyCode] = (e.type == "keydown");
})
window.addEventListener('keyup', function (e) {
    gameArea.keys[e.keyCode] = (e.type == "keydown");
})
window.addEventListener('mousemove', function (e) {
    gameArea.mouseX = e.pageX;
    gameArea.mouseY = e.pageY;
})


connection.onopen = function ()
{
   connection.send(JSON.stringify({ type: 'joinRequest'} ));

   var gameInterval = setInterval(function()
   {
       gameArea.update();
   }, 20);

};

 connection.onerror = function (error) {
   // just in there were some problems with connection...
   alert("Sorry, but there\'s some problem with your "
        + "connection or the server is down.");
 };

 connection.onmessage = function (message) {
    try {
        var json = JSON.parse(message.data);
    } catch (e) {
        console.log('Invalid JSON: ', message.data);
        return;
    }

    if (json.type == 'joinResponse') {
        gameArea.mainPlayer = createPlayer(json.data.type, gameArea);
        gameArea.mainPlayer.x = json.data.x;
        gameArea.mainPlayer.y = json.data.y;
        gameArea.mainPlayer.angle = json.data.angle;
        gameArea.mainPlayer.team = json.data.team;
        gameArea.mainPlayer.id = json.data.id;
        gameArea.players.set(json.data.id, gameArea.mainPlayer);
    }
    else if (json.type == 'addPlayer') {
        var newPlayer = createPlayer(json.data.type, gameArea);
        newPlayer.x = json.data.x;
        newPlayer.y = json.data.y;
        newPlayer.angle = json.data.angle;
        newPlayer.team = json.data.team;
        newPlayer.id = json.data.id;
        gameArea.players.set(json.data.id, newPlayer);
    }
    else if (json.type == 'updatePlayer') {
        var updatedPlayer = gameArea.players.get(json.data.id);
        if (updatedPlayer) {
            updatedPlayer.x = json.data.x;
            updatedPlayer.y = json.data.y;
            updatedPlayer.angle = json.data.angle;
            updatedPlayer.team = json.data.team;
        }
    }
    else if (json.type == 'addProjectile') {
        var newProjectile = createProjectile(json.data, gameArea);
        gameArea.projectiles.set(json.data.id, newProjectile);

        // If this projectile was added by the main player, set the projectile to the player's last projectile
        if (newProjectile.shooterId == gameArea.mainPlayer.id)
        {
            gameArea.mainPlayer.lastProjectile = json.data.id;
        }
    }
    else if (json.type == 'removeProjectile')
    {
        gameArea.projectiles.get(json.data.id).deactivate();
        gameArea.projectiles.delete(json.data.id);
    }
    else if (json.type == 'removePlayer')
    {
        // The only datum is the ID of the player to remove
        gameArea.players.delete(json.data);

        if (json.data == gameArea.mainPlayer.id)
        {
            // Restart
            gameArea.players = new Map();
            gameArea.projectiles = new Map();
            connection.send(JSON.stringify({ type: 'joinRequest'} ));
        }

    }
    else if (json.type == 'disablePlayer')
    {
        // The only datum is the ID of the player to disable
        gameArea.players.get(json.data).isEnabled = false;
    }
    else if (json.type == 'enablePlayer')
    {
        // The only datum is the ID of the player to enable
        let player = gameArea.players.get(json.data);
        if (player)
        {
            player.isEnabled = true;
        }
    }
    else {
        console.log('Hmm..., I\'ve never seen JSON like this:', json);
    }
};
});
