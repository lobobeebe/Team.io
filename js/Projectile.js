function Projectile(x, y, angle, team, gameArea)
{
    this.angle = angle;
    this.gameArea = gameArea;
    this.team = team;
    this.x = x;
    this.y = y;
    this.isActive = true;
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
    draw: function()
    {
		let context = this.gameArea.context;
		this.shape.draw(context);
		context.fill();
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

function Bullet(x, y, angle, team, gameArea)
{
    Projectile.call(this, x, y, angle, team, gameArea);
    this.height = 5;
    this.speed = 10;
    this.width = 10;
    this.type = "Bullet";
	this.shape = new Rectangle(5, 5);
}
Bullet.prototype = new Projectile();

function createProjectile(type, x, y, angle, team, shooterId, gameArea)
{
    let projectile = null;

    switch (type)
    {
        case "Bomb":
            projectile = new Bomb(x, y, angle, team, gameArea);
            break;

        case "Bullet":
        default:
            projectile = new Bullet(x, y, angle, team, gameArea);
            break;
    }

    projectile.shooterId = shooterId;

    return projectile;
}
