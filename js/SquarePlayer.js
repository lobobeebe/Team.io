var Player = require('./Player');
var Polygon = require('./Geometry/Polygon');

function SquarePlayer(data, gameArea)
{
    Player.call(this, data, gameArea);
    this.type = "Shield";
	this.isCharging = false;
	this.chargeMaxSpeed = 7.5;
	this.chargeAngle = null;
	this.lastChargeTime = null;
	this.chargeTimeMs = 1000;
    this.shieldRect = new Polygon([
		{x: 0, y: 25},
		{x: 0, y: -25},
		{x: 25, y: -25},
		{x: 25, y: 25}
		]);
	
    this.activateAbility = function()
	{
		if (!this.isCharging)
		{
			this.isCharging = true;
			this.lastChargeTime = Date.now();
			this.chargeAngle = this.angle;
		}
    }
	
	this.draw = function(context)
	{
		Player.prototype.draw.call(this, context);
		
		let colors = this.getColors();
		
		context.fillStyle = colors.secondary;
		this.shieldRect.draw(context);
		context.fill();
	}
	
    this.hit = function(projectile)
    {
        // Bullets are blocked by the shield
        if (projectile.type == "Bullet")
        {
            if (!this.isEnabled || !this.shieldRect.intersects(projectile.shape))
            {
                Player.prototype.hit.call(this, projectile);
            }
        }
        else
        {
            Player.prototype.hit.call(this, projectile);
        }
    }
	
	this.intersects = function(shape)
	{
		return Player.prototype.intersects.call(this, shape) || this.shieldRect.intersects(shape);
	}

    /**
     * Overriding to destroy players who touch the shield
     */
    this.interactWith = function(player)
    {
        if (this.isPlayerOpponent(player) && this.isEnabled)
        {
            if (player.intersects(this.shieldRect))
            {
				player.kill();
            }
        }
    }

    this.update = function()
    {
		// Update Charge
		if (this.isCharging) 
		{
			this.angle = this.chargeAngle;
			this.speed.x = this.chargeMaxSpeed * Math.cos(this.angle);
			this.speed.y = this.chargeMaxSpeed * Math.sin(this.angle);
			
			// Reset charge
			if (Date.now() > this.lastChargeTime + this.chargeTimeMs)
			{
				this.isCharging = false;
			}
		}
		
        // Update base
        Player.prototype.update.call(this);
		
        // Update shield location
        this.shieldRect.update(this.x, this.y, this.angle);
		
    }
}
SquarePlayer.prototype = new Player();

module.exports = SquarePlayer;