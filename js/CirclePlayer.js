var Player = require('./Player.js');
var Circle = require('./Geometry/Circle.js');

function CirclePlayer(data, gameArea)
{
    Player.call(this, data, gameArea);
    this.type = "Sneak";
	this.activationCooldown = 75;
	
	this.front = new Circle(25);

    this.activateAbility = function()
    {
		this.gameArea.addProjectile(-1, "Bomb", this.x, this.y, this.angle, this.team, this.id, true);
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

    this.tryActivateAbility = function()
    {
        // User must unpress button before every use
        if (!this.wasUsingAbilityLastFrame)
        {
            // Remove and Detonate the current projectile, if it exists
            if (this.lastProjectile > 0 && gameArea.projectiles.get(this.lastProjectile))
            {
				this.gameArea.removeProjectile(this.lastProjectile, true);
				
                this.lastProjectile = -1;
            }
            else
            {
                Player.prototype.tryActivateAbility.call(this);
            }
        }
    }
	
	this.update = function()
	{
		Player.prototype.update.call(this);
		this.front.update(this.x, this.y, this.angle);
	}
}
CirclePlayer.prototype = new Player();

module.exports = CirclePlayer;