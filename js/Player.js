var Polygon = require('./Geometry/Polygon.js');
var Utils = require('./Geometry/Utils.js');

function Player(data, gameArea)
{
    this.activationCooldown = 50;
    this.angularSpeed = 0;
    this.enableTimeout = 5000;
    this.gameArea = gameArea;
    this.isEnabled = true;
    this.wasUsingAbilityLastFrame = false;
    this.lastActivatedFrame = -1000;
    this.lastProjectile = -1;
    this.maxAngularSpeed = .05;
    this.maxSpeed = 5;
    this.rect = new Polygon([
		{x: 0, y: 25},
		{x: -25, y: 25},
		{x: -25, y: -25},
		{x: 0, y: -25}
		]);
    this.angularSpeed = 0;
    this.speed = {x: 0, y: 0};
    this.type = "None";
	this.keys = [];
	
    this.id = (data ? data.id : 0);
    this.team = (data ? data.team : 0);
    this.angle = (data ? data.angle : 0);
    this.x = (data ? data.x : 0);
    this.y = (data ? data.y : 0);
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
        return {id: this.id, type: this.type, team: this.team, x: this.x, y: this.y, angle: {value: this.angle, speed: this.angularSpeed}, speed: this.speed, angularSpeed: this.angularSpeed};
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
    processInput: function(key, isDown)
    {
		this.keys[key] = isDown;
		let speed = {x: 0, y: 0};
		this.angularSpeed = 0;
		
		let maxSpeed = this.maxSpeed;
		let maxAngularSpeed = this.maxAngularSpeed;
		if (!this.isEnabled)
		{
			maxSpeed *= .75;
			maxAngularSpeed *= .75;
		}

        if (this.keys)
        {
            if (this.keys[87])
            { /* W: Move forward */
                speed.y -= 1;
            }
            if (this.keys[83])
            { /* S: Move backward */
                speed.y += 1;
            }
			
            if (this.keys[65])
            { /* A: Strafe left */
                speed.x -= 1;
            }
            if (this.keys[68])
            { /* D: Strafe right */
                speed.x += 1;
            }
			
			speed = Utils.asNormal(speed);
			this.speed.x = speed.x * maxSpeed;
			this.speed.y = speed.y * maxSpeed;
			
			/* Turn */
			if (this.keys[37])
			{
				this.angularSpeed -= maxAngularSpeed;
			}
			if (this.keys[39])
			{
				this.angularSpeed += maxAngularSpeed;
			}

            /* Space: Activate Ability */
            if (this.keys[32])
            {
                this.tryActivateAbility();
                this.wasUsingAbilityLastFrame = true;
            }
            else
            {
                this.wasUsingAbilityLastFrame = false;
            }

            // E: Drop Flag
            if (this.keys[69])
            {
                this.gameArea.addFlag(this.id, this.x, this.y, true);
            }
        }

        /* Point towards mouse */
        //let targetRotation = mod(Math.atan2(mouseY - this.y, mouseX - this.x), Math.PI * 2);
        //if (Math.abs(this.angle - targetRotation) >= this.angularSpeed)
        //{
        //    this.angle += this.angularSpeed * this.getRotationDirection(this.angle, targetRotation);
        //    this.angle = mod(this.angle, Math.PI * 2);
        //}
		
		
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
			
		this.x = Utils.clamp(nextX, this.gameArea.bounds.x - this.gameArea.bounds.halfWidth,
			this.gameArea.bounds.x + this.gameArea.bounds.halfWidth);
		this.y = Utils.clamp(nextY, this.gameArea.bounds.y - this.gameArea.bounds.halfHeight,
			this.gameArea.bounds.y + this.gameArea.bounds.halfHeight);
			
		// Angular update
		let nextAngle = this.angle + this.angularSpeed;
		this.angle = Utils.mod(nextAngle, Math.PI * 2);

        this.rect.update(this.x, this.y, this.angle);
    }
}

module.exports = Player;