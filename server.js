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
		
		gameArea.processMessage(this, json.type, json.data);
    });

    // user disconnected
    connection.on('close', function(connection) {
        console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");

		gameArea.processDisconnection(this);
    });
});