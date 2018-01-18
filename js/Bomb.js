const Circle = require('./Geometry/Circle');
const Projectile = require('./Projectile');

function Bomb(x, y, angle, team, gameArea)
{
    Projectile.call(this, x, y, angle, team, gameArea);
    this.speed = 0;
    this.type = "Bomb";
	this.detonation = new Circle(100);
	this.shape = new Circle(15);
	
	this.shape.update(this.x, this.y, this.angle);
	this.detonation.update(this.x, this.y, this.angle);

    this.deactivate = function()
    {
		if (this.gameArea.mainPlayer && this.gameArea.mainPlayer.isProjectileOpponent(this) &&
			this.gameArea.mainPlayer.intersects(this.detonation))
		{
            this.gameArea.mainPlayer.hit(this);
		}
	}

    this.draw = function()
    {
        // Only draw Bomb if the mainPlayer is on the same team.
        if (this.gameArea.mainPlayer && !this.gameArea.mainPlayer.isProjectileOpponent(this))
        {
			Projectile.prototype.draw.call(this);
			
			let context = this.gameArea.context;
			
			context.save();
			context.setLineDash([15,15]);
			this.detonation.draw(context);
			context.stroke();
			context.restore();
        }
    }
	
	this.update = function()
	{
		Projectile.prototype.update.call(this);
		
		this.detonation.update(this.x, this.y, this.angle);
	}
}
Bomb.prototype = new Projectile();

module.exports = Bomb;