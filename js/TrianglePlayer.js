const Player = require('./Player');
const Polygon = require('./Geometry/Polygon');
const Bullet = require('./Bullet');

function TrianglePlayer(data, gameArea)
{
    Player.call(this, data, gameArea);
    this.type = "Shooter";
	
	this.front = new Polygon([
		{x: 0, y:25},
		{x: 25, y: 0},
		{x:0, y: -25}
	]);

    this.activateAbility = function()
	{
		let projectile = new Bullet(this.x + 25 * Math.cos(this.angle), this.y + 25 * Math.sin(this.angle),
			this.angle, this.team, this.gameArea);
		this.gameArea.addProjectile(projectile);
    }
	
	this.draw = function(context)
	{
		let colors = this.getColors();
		
		context.fillStyle = colors.secondary;
		this.front.draw(context);
		context.fill();
		
		Player.prototype.draw.call(this, context);
	}
	
	this.intersects = function(shape)
	{
		return Player.prototype.intersects.call(this, shape) || this.front.intersects(shape);
	}
	
	this.update = function()
	{
		Player.prototype.update.call(this);
		this.front.update(this.x, this.y, this.angle);
	}
}
TrianglePlayer.prototype = new Player();

module.exports = TrianglePlayer;