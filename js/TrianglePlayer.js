var Player = require('./Player.js');

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
		gameArea.addProjectile(-1, "Bullet", this.x + 25 * Math.cos(this.angle),
			this.y + 25 * Math.sin(this.angle), this.angle, this.team, this.id, true);
    }
	
	this.draw = function()
	{
		let context = this.gameArea.context;
		let colors = this.getColors();
		
		context.fillStyle = colors.secondary;
		this.front.draw(context);
		context.fill();
		
		Player.prototype.draw.call(this);
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