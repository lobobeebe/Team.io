function Projectile(x, y, angle, team, gameArea)
{
    this.angle = angle;
    this.gameArea = gameArea;
    this.team = team;
    this.x = x;
    this.y = y;
    this.shooterId = -1;
    this.type = "None";
	
	this.shape = null;
}

Projectile.prototype =
{
    deactivate: function()
    {
        // No implementation at base
    },
    draw: function(context)
    {
		this.shape.draw(context);
		context.fill();
    },
	getJson: function()
	{
		let json = 
		{
			angle: this.angle,
			team: this.team,
			x: this.x,
			y: this.y,
			shooterId: this.shooterId,
			type: this.type
		}
		return json;
	},
    update: function()
    {
        if (this.speed > 0)
        {
            this.x += this.speed * Math.cos(this.angle);
            this.y += this.speed * Math.sin(this.angle);
			
			this.shape.update(this.x, this.y, this.angle);
        }
    }
}

module.exports = Projectile;