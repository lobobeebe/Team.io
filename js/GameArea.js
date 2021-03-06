var Rectangle = require('./Geometry/Rectangle.js');
var Player = require('./Player.js');
var PlayerUtils = require('./PlayerUtils.js');

function GameArea()
{
	this.frameNo = 0;
	
	this.players = new Map();
	this.projectiles = new Map();
	this.flags = new Map();
	
	this.bounds = new Rectangle(1000, 1000);

	this.stop = function()
	{
		clearInterval(this.interval);
	}
	
	this.updatePlayer = function(playerId, data)
	{
		let updatedPlayer = this.players.get(playerId);
		if (updatedPlayer)
		{
			updatedPlayer.x = (data.x || updatedPlayer.x);
			updatedPlayer.y = (data.y || updatedPlayer.y);
			updatedPlayer.speed = (data.speed || updatedPlayer.speed);
			
			if (data.angle)
			{
				updatedPlayer.angle = data.angle.value;
				updatedPlayer.angularSpeed = data.angle.speed;
			}
			
			updatedPlayer.team = (data.team || updatedPlayer.team);
		}
		else
		{
			let player = PlayerUtils.createPlayer(data, this);
			
			this.players.set(playerId, player);
		}
	}
}

GameArea.prototype.addFlag = function(id, flag)
{
	this.flags.set(id, flag);
}

GameArea.prototype.addPlayer = function(id, player)
{
	this.players.set(id, player);
}

GameArea.prototype.addProjectile = function(id, projectile)
{		
	this.projectiles.set(id, projectile);
}

GameArea.prototype.removeFlag = function(flagId)
{
	this.flags.delete(flagId);
}

GameArea.prototype.removePlayer = function(playerId)
{
	this.players.delete(playerId);
	
	// Remove all projectiles that were shot by the removed player
	let projectileIds = [];
	for (let [id, projectile] of this.projectiles)
	{
		if (projectile.shooterId == playerId)
		{
			this.removeProjectile(id);
		}
	}
	
	// Remove all flags that were placed by the removed player
	for (let [id, flag] of this.flags)
	{
		if (id == playerId)
		{
			this.removeFlag(id);
		}
	}
}

GameArea.prototype.removeProjectile = function(projectileId)
{
	let projectile = this.projectiles.get(projectileId);
	if (projectile)
	{
		projectile.deactivate();
	}
	
	this.projectiles.delete(projectileId);
}

GameArea.prototype.setPlayerIsEnabled = function(playerId, isEnabled)
{
	let player = this.players.get(playerId);
	
	if (player)
	{
		player.isEnabled = isEnabled;	
	}
}

GameArea.prototype.update = function()
{
	this.frameNo++;
	
	// Update Projectiles
	for (let [id, projectile] of this.projectiles)
	{
		projectile.update();
	}

	// Update Players
	for (let [id, player] of this.players)
	{
		player.update();
	}
	
	// Update Flags
	for (let [id, flag] of this.flags)
	{
		/*
		TODO: Intersect on flag does not work
		if (this.mainPlayer && this.mainPlayer.team == "White" &&
			this.mainPlayer.intersects(flag))
		{
			this.joinTeam(flag.ownerId);
		}
		*/
	}

	// Send player update information.
	// TODO: Consider reducing frequency of this update rate
	// if (this.mainPlayer)
	// {
		// this.updatePlayer(this.mainPlayer.id, this.mainPlayer.x, this.mainPlayer.y,
			// this.mainPlayer.angle, this.mainPlayer.team, true);
	// }
}

module.exports = GameArea;