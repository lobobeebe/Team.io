"use strict";

// websocket and http servers
const webSocketServer = require('websocket').server;
const http = require('http');
const fs = require("fs");
const url = require('url');
const path = require('path');
const Player = require('./js/Player.js');
const PlayerUtils = require('./js/PlayerUtils.js');
const ServerGameArea = require('./js/ServerGameArea.js');
const Client = require('./js/Client.js');

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'team.io';
// Port where we'll run the websocket server
var webSocketsServerPort = 8082;
var htmlServerPort = 80;

// maps file extention to MIME typere
const extMap =
{
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg'
};

/**
 * Global variables
 */
// List of currently connected clients
var clientMap = new Map();
var playerNum = 0;
var flagNum = 0;
var projectileNum = 0;

var gameArea = new ServerGameArea();

var gameInterval = setInterval(function()
{
	gameArea.update();
}, 20);

/**
 * HTTP Server for html
 */
 var serverHtml = http.createServer(function(request, response)
 {
     // parse URL
    const parsedUrl = url.parse(request.url);
    // extract URL path
    let pathname = `.${parsedUrl.pathname}`;

    if (pathname === './')
    {
        pathname = './index.html';
    }

    // based on the URL path, extract the file extention. e.g. .js, .html, ...
    const ext = path.parse(pathname).ext;

    // Check if the file exists
    fs.exists(pathname, function (exist)
    {
        if(!exist)
        {
            // if the file is not found, return 404
            response.statusCode = 404;
            response.end(`File ${pathname} not found!`);
        }
    });

    // read file from file system
    fs.readFile(pathname, function(err, data)
    {
        if(err)
        {
            response.statusCode = 500;
            response.end(`Error getting the file: ${err}.`);
        }
        else
        {
          // if the file is found, set Content-type and send data
            response.setHeader('Content-type', extMap[ext] || 'text/plain' );
            response.end(data);
        }
    });
 });

 serverHtml.listen(htmlServerPort, '0.0.0.0', function()
 {
   console.log((new Date()) + " HTML Server is listening on port "
       + htmlServerPort);
 });

/**
 * HTTP server for Web Socket
 */
var serverWebSocket = http.createServer(function(request, response) {
  // Not important for us. We're writing WebSocket server,
  // not HTTP server
}).listen(webSocketsServerPort, '0.0.0.0', function() {
  console.log((new Date()) + " WebSocket Server is listening on port "
      + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
  // WebSocket server is tied to a HTTP server. WebSocket
  // request is just an enhanced HTTP request. For more info
  // http://tools.ietf.org/html/rfc6455#page-6
  httpServer: serverWebSocket
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request)
{
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    // accept connection - you should check 'request.origin' to
    // make sure that client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin);

    console.log((new Date()) + ' Connection accepted.');

    // user sent some message
    connection.on('message', function(message)
	{
        try
		{
			var json = JSON.parse(message.utf8Data);
        }
		catch (e)
		{
			console.log('Invalid JSON: ', message.data);
			return;
        }

        if (json.type == "joinRequest")
		{
            //var types = ["Shield", "Shooter", "Sneak"];
            var types = ["Sneak"];
			
			// Create new player
			let playerData =
			{
				id: ++playerNum,
				x: Math.random() * 1000,
				y: Math.random() * 600,
				angle: Math.random() * Math.PI * 2,
				team: "White",
				type: types[Math.floor(Math.random() * types.length)]
			}
			gameArea.updatePlayer(playerData.id, playerData);
			clientMap.set(this, new Client(playerData.id));

			// Tell player his ID
            var joinResponse = JSON.stringify({ type: 'joinResponse', data: {id: playerData.id}});
            console.log((new Date()) + ' Sent message: ' + joinResponse);
            this.send(joinResponse);
			
            // Give new player the current location of all current players
            for (var [connection, client] of clientMap.entries())
			{
				let player = gameArea.players.get(client.playerId);
				if (player)
				{
					var addPlayer = JSON.stringify({ type: 'updatePlayer', data: player.getJson()});
					this.send(addPlayer);
				}
            }

            // Iterate over all clients and indicate that a new player has come online
            for (var [connection, client] of clientMap.entries())
			{
                if (connection != this)
				{
                    connection.send(
                        JSON.stringify({ type: 'updatePlayer', data: playerData} ));
                }
            }
        }
        else if (json.type == 'addProjectile')
		{
            let projectileId = projectileNum++;
            // Notify all clients of a new projectile
            for (let [connection, client] of clientMap.entries())
			{
                connection.send(
                    JSON.stringify({ type: 'addProjectile', data: {
                        id: projectileId,
                        type: json.data.type,
                        x: json.data.x,
                        y: json.data.y,
                        angle: json.data.angle,
                        team: json.data.team,
                        shooterId: json.data.shooterId
                    }}));
            }
        }
		else if (json.type == 'addFlag')
		{
            for (var [connection, client] of clientMap.entries())
			{
				connection.send(JSON.stringify(json));
            }
		}
		else if (json.type == 'input')
		{
			let inputClient = clientMap.get(this);
			if (inputClient)
			{
				let player = gameArea.players.get(inputClient.playerId);
				if (player)
				{
					player.processInput(json.data.key, json.data.isDown);
					
					// Update all clients
					for (let [connection, client] of clientMap.entries())
					{
						connection.send(
							JSON.stringify({ type: 'updatePlayer', data: player.getJson()} ));
					}
				}
			}
		}
        // Mimic each of these messages to all clients
        else if (json.type == 'removeProjectile' || json.type == 'removePlayer' ||
			json.type == 'playerEnabled' || json.type == 'addDetonation')
		{
            for (var [connection, client] of clientMap.entries())
			{
				if (connection != this)
				{
					connection.send(JSON.stringify(json));
				}
            }
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");

        // remove user from the list of connected clients
        var deletedId = clientMap.get(this).playerId;
        clientMap.delete(this);

        for (var [connection, client] of clientMap.entries()) {
            connection.send(
                JSON.stringify({ type: 'removePlayer', data: {id: deletedId}}));
        }
    });
});
