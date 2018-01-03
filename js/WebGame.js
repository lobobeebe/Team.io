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
	gameArea.joinGame();
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

 connection.onmessage = function (message)
 {
    try
	{
        var json = JSON.parse(message.data);
    }
	catch (e)
	{
        console.log('Invalid JSON: ', message.data);
        return;
    }

    if (json.type == 'joinResponse')
	{
		let mainPlayer = createPlayer(json.data.type, gameArea);
        mainPlayer.x = json.data.x;
        mainPlayer.y = json.data.y;
        mainPlayer.angle = json.data.angle;
        mainPlayer.team = json.data.team;
        mainPlayer.id = json.data.id;
		
		gameArea.mainPlayer = mainPlayer;
        gameArea.players.set(json.data.id, gameArea.mainPlayer);
    }
    else if (json.type == 'addPlayer')
	{
        var newPlayer = createPlayer(json.data.type, gameArea);
        newPlayer.x = json.data.x;
        newPlayer.y = json.data.y;
        newPlayer.angle = json.data.angle;
        newPlayer.team = json.data.team;
        newPlayer.id = json.data.id;
		
        gameArea.players.set(json.data.id, newPlayer);
    }
    else if (json.type == 'updatePlayer')
	{
		gameArea.updatePlayer(json.data.id, json.data.x, json.data.y, json.data.angle,
			json.data.team, json.data.playerId, false);
    }
    else if (json.type == 'addProjectile')
	{
		gameArea.addProjectile(json.data.id, json.data.type, json.data.x, json.data.y, json.data.angle,
			json.data.team, json.data.shooterId, false);
    }
    else if (json.type == 'removeProjectile')
    {
		gameArea.removeProjectile(json.data.id, false);
    }
    else if (json.type == 'removePlayer')
    {
		gameArea.removePlayer(json.data.id, false);
    }
    else if (json.type == 'playerEnabled')
    {
        gameArea.setPlayerIsEnabled(json.data.id, json.data.isEnabled, false);
    }
    else
	{
        console.log('Hmm..., I\'ve never seen JSON like this:', json);
    }
};
});
