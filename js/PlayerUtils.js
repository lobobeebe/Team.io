var CirclePlayer = require('./CirclePlayer.js');
var SquarePlayer = require('./SquarePlayer.js');
var TrianglePlayer = require('./TrianglePlayer.js');

module.exports = 
{
	createPlayer: function(data, gameArea)
	{
		let player;
		if (data.type == "Shield")
		{
			player = new SquarePlayer(data, gameArea);
		}
		else if (data.type == "Shooter")
		{
			player = new TrianglePlayer(data, gameArea);
		}
		else if (data.type == "Sneak")
		{
			player = new CirclePlayer(data, gameArea);
		}
		else
		{
			console.log("Unknown Player Type: " + data.type);
		}
		
		return player;
	}
}