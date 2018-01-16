function Connection(gameArea)
{
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
	this.connection = new WebSocket('ws://18.218.90.135:8082');
	//this.connection = new WebSocket('ws://localhost:8082');
	
	this.connection.onopen = function ()
	{
		// Send message to join the game
		this.send(JSON.stringify({type: 'joinRequest'}));
	};

	 this.connection.onerror = function (error) {
	   // just in there were some problems with connection...
	   alert("Sorry, but there\'s some problem with your "
			+ "connection or the server is down.");
	 };

	 this.connection.onmessage = function (message)
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
			gameArea.setMainPlayerId(json.data.id);
		}
		else if (json.type == 'addFlag')
		{
			gameArea.addFlag(json.data.ownerId, json.data.x,
				json.data.y, false);
		}
		else if (json.type == 'updatePlayer')
		{
			gameArea.updatePlayer(json.data.id, json.data);
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
}

module.exports = Connection;