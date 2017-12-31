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
}

Projectile.prototype =
{
    deactivate: function()
    {
        // No implementation at base
    },
    draw: function()
    {
        ctx = this.gameArea.context;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.save();
        this.innerDraw(ctx);
        ctx.restore();

        ctx.restore();
    },
    innerDraw: function(ctx)
    {
        /* No implementation at base */
    },
    update: function()
    {
        if (this.speed > 0)
        {
            this.x += this.speed * Math.cos(this.angle);
            this.y += this.speed * Math.sin(this.angle);
        }
    }
}

function Bomb(x, y, angle, team, gameArea)
{
    Projectile.call(this, x, y, angle, team, gameArea);
    this.speed = 0;
    this.blastRadius = 100;
    this.radius = 15;
    this.type = "Bomb";

    this.deactivate = function()
    {
        // When bombs are deactivated, they explode.
        // Determine if main player is affected by explosion.
        var blastRadiusSquared = this.blastRadius * this.blastRadius;

        if (this.gameArea.mainPlayer.squaredDistanceFrom(this.x, this.y) <= blastRadiusSquared)
        {
            this.gameArea.mainPlayer.hit(this);
        }

        Projectile.prototype.deactivate.call(this);
    }

    this.draw = function()
    {
        // Only draw Bomb if the mainPlayer is on the same team.
        if (!this.gameArea.mainPlayer.isProjectileOpponent(this))
        {
            Projectile.prototype.draw.call(this);
        }
    }

    this.innerDraw = function()
    {
        ctx.fillStyle = "Black";
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
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

    this.innerDraw = function()
    {
        ctx.fillStyle = "Black";
        ctx.fillRect(-this.width, -this.height / 2, this.width, this.height);
    }
}
Bullet.prototype = new Projectile();

function createProjectile(json, gameArea)
{
    var projectile = null;

    switch (json.type)
    {
        case "Bomb":
            projectile = new Bomb(json.x, json.y, json.angle, json.team, gameArea);
            break;

        case "Bullet":
            projectile = new Bullet(json.x, json.y, json.angle, json.team, gameArea);
        default:
            break;
    }

    projectile.shooterId = json.shooterId;

    return projectile;
}
