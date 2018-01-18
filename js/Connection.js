function Connection(gameArea)
{
	this.gameArea = gameArea;
	
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
	//this.connection = new WebSocket('ws://18.218.90.135:8082');
	this.connection = new WebSocket('ws://localhost:8082');
	
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

		gameArea.processMessage(json.type, json.data);
	};
}

module.exports = Connection;