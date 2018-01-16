var GameArea = require('./GameArea.js');

function ServerGameArea()
{
	GameArea.call(this);
	
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