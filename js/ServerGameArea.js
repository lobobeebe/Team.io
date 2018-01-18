const GameArea = require('./GameArea');
const Client = require('./Client');

function ServerGameArea()
{
	GameArea.call(this);	
	
	// List of currently connected clients
	this.clientMap = new Map();
	
	// Game variables
	this.playerNum = 0;
	this.flagNum = 0;
	this.projectileNum = 0;
	
	this.addProjectile = function(projectile)
	{		
		// Update Projectile ID
		let id = this.projectileNum++;
		
		// Update the Message's Projectile ID
		let projectileData = projectile.getJson();
		projectileData.id = id;
		
		// Notify all clients of a new projectile
		for (let [connection, client] of this.clientMap.entries())
		{
			connection.send(JSON.stringify({ type: 'addProjectile', data: projectileData}));
		}
			
		// Base Add Projectile
		GameArea.prototype.addProjectile.call(this, id, projectile);
	}
	
	this.addFlag = function(flag)
	{
		// Update Flag ID
		let id = this.flagNum++;
		
		// Update the Message's Flag ID
		let flagData = flag.getJson();
		flagData.id = id;
		
		// Notify all clients of a new flag
		for (var [connection, client] of this.clientMap.entries())
		{
			connection.send(JSON.stringify({ type: 'addFlag', data: flagData}));
		}
		
		// Base Add Flag
		GameArea.prototype.addFlag.call(this, id, flag);
	}
	
	this.processDisconnection = function(disconnection)
	{
        let deletedClient = this.clientMap.get(disconnection);
		
		if(deletedClient)
		{
			let deletedId = deletedClient.playerId;
			
			// Remove user from the list of connected clients
			this.clientMap.delete(disconnection);
			
			// Remove the player from the Game Area
			this.removePlayer(deletedId);
		}
		else
		{
			console.log("Could not process a disconnection for " + disconnection);
		}
	}
	
	this.processMessage = function(recipientConnection, type, data)
	{
		if (type == "joinRequest")
		{
            var playerTypes = ["Shield", "Shooter", "Sneak"];
			
			// Create new player
			let playerData =
			{
				id: ++this.playerNum,
				x: Math.random() * 1000,
				y: Math.random() * 600,
				angle: Math.random() * Math.PI * 2,
				team: "White",
				type: playerTypes[Math.floor(Math.random() * playerTypes.length)]
			}
			
			this.updatePlayer(playerData.id, playerData);
			this.clientMap.set(recipientConnection, new Client(playerData.id));

			// Tell player his ID
            var joinResponse = JSON.stringify({ type: 'joinResponse', data: {id: playerData.id}});
            console.log((new Date()) + ' Sent message: ' + joinResponse);
            recipientConnection.send(joinResponse);
			
            // Give new player the current location of all current players
            for (var [connection, client] of this.clientMap.entries())
			{
				let player = this.players.get(client.playerId);
				if (player)
				{
					var addPlayer = JSON.stringify({ type: 'updatePlayer', data: player.getJson()});
					recipientConnection.send(addPlayer);
				}
            }

            // Iterate over all clients and indicate that a new player has come online
            for (var [connection, client] of this.clientMap.entries())
			{
                if (connection != this)
				{
                    connection.send(
                        JSON.stringify({ type: 'updatePlayer', data: playerData} ));
                }
            }
        }
		else if (type == 'input')
		{
			let inputClient = this.clientMap.get(recipientConnection);
			if (inputClient)
			{
				let player = this.players.get(inputClient.playerId);
				if (player)
				{
					player.processInput(data.key, data.isDown);
					
					// Update all clients with the new state of the player
					for (let [connection, client] of this.clientMap.entries())
					{
						connection.send(
							JSON.stringify({ type: 'updatePlayer', data: player.getJson()} ));
					}
				}
			}
		}
	}
	
	this.removePlayer = function(id)
	{
		// Notify all clients to remove player
		for (let [connection, client] of this.clientMap.entries())
		{
			connection.send(JSON.stringify({ type: 'removePlayer', data: {id: id}}));
		}
		
		// Base Remove Player
		GameArea.prototype.removePlayer.call(this, id);
	}
	
	this.removeProjectile = function(id)
	{
		// Notify all clients to remove projectile
		for (let [connection, client] of this.clientMap.entries())
		{
			connection.send(JSON.stringify({ type: 'removeProjectile', data: {id: id}}));
		}
		
		// Base Remove Projectile
		GameArea.prototype.removeProjectile.call(this, id);
	}
	
	this.setPlayerIsEnabled = function(id, isEnabled)
	{
		// Notify all clients to (en/dis)able player
		for (let [connection, client] of this.clientMap.entries())
		{
			connection.send(JSON.stringify({ type: 'playerEnabled', data: {id: id, isEnabled: isEnabled}}));
		}
		
		// Base set isEnabled
		GameArea.prototype.setPlayerIsEnabled.call(this, id, isEnabled);
	}
	
	this.update = function()
	{
		// Base update
		GameArea.prototype.update.call(this);
		
		// Check if any Projectiles hit a player
		for (let [projectileId, projectile] of this.projectiles)
		{
			for (let [playerId, player] of this.players)
			{
				if (player.isProjectileOpponent(projectile) && player.intersects(projectile.shape))
				{
					// Projectile has hit player. Remove it.
					player.hit(projectile);
					
					this.removeProjectile(projectileId);
				}
			}
		}
	}
}

ServerGameArea.prototype = new GameArea();

module.exports = ServerGameArea;