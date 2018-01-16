$(function () {
"use strict";

let Connection = require('./js/Connection.js');
let ClientGameArea = require('./js/ClientGameArea.js');

let gameArea = new ClientGameArea();
let webConnection = new Connection(gameArea);
let keys = [];

// Events
window.addEventListener('keydown', function (e)
{
    e.preventDefault();
	
	if (!keys[e.keyCode])
	{
		webConnection.connection.send(JSON.stringify({ type: 'input', data: {key: e.keyCode, isDown: true}}));
	}
	
	keys[e.keyCode] = true;
});

window.addEventListener('keyup', function (e)
{
	if (keys[e.keyCode])
	{
		webConnection.connection.send(JSON.stringify({ type: 'input', data: {key: e.keyCode, isDown: false}}));
	}
	
	keys[e.keyCode] = false;
});

window.addEventListener('mousemove', function (e)
{
    gameArea.mouseX = e.pageX;
    gameArea.mouseY = e.pageY;
});
		
var gameInterval = setInterval(function()
{
	gameArea.update();
}, 20);

});