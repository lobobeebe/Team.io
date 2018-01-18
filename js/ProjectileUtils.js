const Bomb = require('./Bomb');
const Bullet = require('./Bullet');

module.exports = 
{
	create: function(projectileType, data, gameArea)
	{
		let projectile;

		switch (projectileType)
		{
			case "Bomb":
				projectile = new Bomb(data.x, data.y, data.angle, data.team, gameArea);
				break;

			case "Bullet":
			default:
				projectile = new Bullet(data.x, data.y, data.angle, data.team, data.gameArea);
				break;
		}

		projectile.shooterId = data.shooterId;

		return projectile;
	}
}