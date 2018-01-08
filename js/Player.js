function Player(gameArea)
{
    this.activationCooldown = 50;
    this.angle = 0;
    this.angularSpeed = 0;
    this.enableTimeout = 5000;
    this.gameArea = gameArea;
    this.id = 0;
    this.isEnabled = true;
    this.wasUsingAbilityLastFrame = false;
    this.lastActivatedFrame = -1000;
    this.lastProjectile = -1;
    this.maxAngularSpeed = 3;
    this.maxSpeed = 5;
    this.rect = new Polygon([
		{x: 0, y: 25},
		{x: -25, y: 25},
		{x: -25, y: -25},
		{x: 0, y: -25}
		]);
    this.angularSpeed = .05;
    this.speed = {x: 0, y: 0};
    this.team = "White";
    this.type = "None";
    this.x = 255;
    this.y = 255;
}

Player.prototype =
{
    activateAbility: function()
    {
        // No implementation at base
    },
    isProjectileOpponent: function(projectile)
    {
        return ((projectile.team  == "White" && projectile.shooterId != this.id) ||
            projectile.team != this.team);
    },
    isPlayerOpponent: function(player)
    {
        return (player.team != this.team ||
            (player.team  == "White" && player.id != this.id));
    },
    draw: function()
    {
        let context = this.gameArea.context;
		let colors = this.getColors();
		
		context.fillStyle = colors.primary;
		this.rect.draw(context);
		context.fill();
    },
    reEnable: function()
    {
		this.gameArea.setPlayerIsEnabled(this.id, true, true);
    },
    getColors: function()
    {
        switch (this.team)
        {
            case "Blue":
                if (this.isEnabled)
                {
					return {primary: "Blue", secondary: "DarkBlue"};
                }
                else
                {
					return {primary: "Blue", secondary: "Blue"};
                }
				break;
            case "Green":
                if (this.isEnabled)
                {
					return {primary: "Green", secondary: "DarkGreen"};
                }
                else
                {
					return {primary: "Green", secondary: "Green"};
                }
				break;
            case "Red":
                if (this.isEnabled)
                {
					return {primary: "Red", secondary: "DarkRed"};
                }
                else
                {
					return {primary: "Red", secondary: "Red"};
                }
				break;
            case "White":
            default:
                if (this.isEnabled)
                {
					return {primary: "White", secondary: "Gray"};
                }
                else
                {
					return {primary: "White", secondary: "White"};
                }
				break;
        }
    },
    getJson: function()
    {
        return {type: this.type, team: this.team, x: this.x, y: this.y, angle: this.angle};
    },
    getRotationDirection: function(from, to)
    {
        let difference = to - from;

        if (Math.abs(difference) < Math.PI)
        {
            return Math.sign(difference);
        }

        if (to > from)
        {
            return -1;
        }

        return 1;
    },
    hit: function(projectile)
    {
        if (this.isProjectileOpponent(projectile))
        {
            if (projectile.type == "Bullet")
            {
				this.kill();
            }
            else if (projectile.type == "Bomb")
            {
                if (this.isEnabled)
                {
                    var _this = this;
                    setTimeout(function()
                    {
                        if (_this)
                        {
                            _this.reEnable();
                        }
                    }, this.enableTimeout);
					
                    this.gameArea.setPlayerIsEnabled(this.id, false, true);
                }
                else
                {
					this.kill();
                }
            }
        }
    },
	intersects: function(shape)
	{
		return this.rect.intersects(shape);
	},
    /**
     * Called once a frame to resolve interactions between players
     */
    interactWith: function(player)
    {
        // No implementation at base
    },
	kill: function()
	{
		this.gameArea.removePlayer(this.id, true);
		this.gameArea.joinGame();
	},
    processInput: function(keys, mouseX, mouseY)
    {
		this.speed = {x: 0, y: 0};
		
		let maxSpeed = this.maxSpeed;
		if (!this.isEnabled)
		{
			maxSpeed *= .75;
		}

        if (keys)
        {
            if (keys[87])
            { /* W: Move forward */
                this.speed.y = -1;
            }
            if (keys[83])
            { /* S: Move backward */
                this.speed.y = 1;
            }
            if (keys[65])
            { /* A: Strafe left */
                this.speed.x = -1;
            }
            if (keys[68])
            { /* D: Strafe right */
                this.speed.x = 1;
            }
			
			this.speed = asNormal(this.speed);
			this.speed.x *= maxSpeed;
			this.speed.y *= maxSpeed;

            /* Space: Activate Ability */
            if (keys[32])
            {
                this.tryActivateAbility();
                this.wasUsingAbilityLastFrame = true;
            }
            else
            {
                this.wasUsingAbilityLastFrame = false;
            }

            // E: Drop Flag
            if (keys[69])
            {
                this.gameArea.addFlag(this.id, this.x, this.y, true);
            }
        }

        /* Point towards mouse */
        let targetRotation = mod(Math.atan2(mouseY - this.y, mouseX - this.x), Math.PI * 2);
        if (Math.abs(this.angle - targetRotation) >= this.angularSpeed)
        {
            this.angle += this.angularSpeed * this.getRotationDirection(this.angle, targetRotation);
            this.angle = mod(this.angle, Math.PI * 2);
        }
    },
    squaredDistanceFrom: function(x, y)
    {
        var xDistance = this.x - x;
        var yDistance = this.y - y;
        return xDistance * xDistance + yDistance * yDistance;
    },
    tryActivateAbility: function()
    {
        if (this.isEnabled && this.gameArea.frameNo - this.lastActivatedFrame >= this.activationCooldown)
        {
            this.activateAbility();
            this.lastActivatedFrame = this.gameArea.frameNo;
        }
    },
    update: function()
    {
		/*
		// Move towards mouse
        let cosAngle = Math.cos(this.angle);
        let sinAngle = Math.sin(this.angle);
        let nextX = this.x + (this.speed.y * cosAngle) + (this.speed.x * sinAngle);
        let nextY = this.y + (this.speed.y * sinAngle) - (this.speed.x * cosAngle);
		*/
		
		// Simple directional movement
		let nextX = this.x + this.speed.x;
		let nextY = this.y + this.speed.y;
			
		this.x = clamp(nextX, this.gameArea.bounds.x - this.gameArea.bounds.halfWidth,
			this.gameArea.bounds.x + this.gameArea.bounds.halfWidth);
		this.y = clamp(nextY, this.gameArea.bounds.y - this.gameArea.bounds.halfHeight,
			this.gameArea.bounds.y + this.gameArea.bounds.halfHeight);

        this.rect.update(this.x, this.y, this.angle);
    }
}

function CirclePlayer(gameArea)
{
    Player.call(this, gameArea);
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

function TrianglePlayer(gameArea)
{
    Player.call(this, gameArea);
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

function SquarePlayer(gameArea)
{
    Player.call(this, gameArea);
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
	
	this.draw = function()
	{
		Player.prototype.draw.call(this);
		
		let context = this.gameArea.context;
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

function createPlayer(type, gameArea)
{
    var player = null;
    switch (type)
	{
        case "Shield":
            player = new SquarePlayer(gameArea);
            break;
        case "Shooter":
            player = new TrianglePlayer(gameArea);
            break;
        case "Sneak":
        default:
            player = new CirclePlayer(gameArea);
            break;
    }

    return player;

}

function mod(n, m)
{
        return ((n % m) + m) % m;
}
