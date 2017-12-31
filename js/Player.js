function Player(gameArea)
{
    this.activationCooldown = 50;
    this.angle = 0;
    this.angularSpeed = 0;
    this.enableTimeout = 5000;
    this.gameArea = gameArea;
    this.id = 0;
    this.isActive = true;
    this.isEnabled = true;
    this.wasUsingAbilityLastFrame = false;
    this.lastActivatedFrame = -1000;
    this.lastProjectile = -1;
    this.maxAngularSpeed = 3;
    this.maxSpeed = 3;
    this.rect = new Rectangle(25, 25);
    this.angularSpeed = .05;
    this.speed = [0, 0];
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
    doesProjectileHit: function(projectile)
    {
        return this.rect.intersectsPoint(projectile.x, projectile.y);
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

        // TODO: Should only be done in debug
        //this.drawHitBox();
    },
    drawHitBox: function()
    {
        // Draw hitbox
        ctx.strokeStyle = 'Black';
        ctx.beginPath();
        ctx.moveTo(this.rect.tl.x, this.rect.tl.y);
        ctx.lineTo(this.rect.tr.x, this.rect.tr.y);
        ctx.lineTo(this.rect.br.x, this.rect.br.y);
        ctx.lineTo(this.rect.bl.x, this.rect.bl.y);
        ctx.lineTo(this.rect.tl.x, this.rect.tl.y);
        ctx.stroke();
    },
    reEnable: function()
    {
        this.gameArea.connection.send(JSON.stringify({ type: 'enablePlayer', data: this.id}));
    },
    getColors: function()
    {
        var colors = [];
        switch (this.team)
        {
            case "Blue":
                colors.push("Blue");
                if (this.isEnabled)
                {
                     colors.push("DarkBlue");
                }
                else
                {
                    colors.push("Blue");
                }
            case "Green":
                colors.push("Green");
                if (this.isEnabled)
                {
                     colors.push("DarkGreen");
                }
                else
                {
                    colors.push("Green");
                }
            case "Red":
                colors.push("Red");
                if (this.isEnabled)
                {
                     colors.push("DarkRed");
                }
                else
                {
                    colors.push("Red");
                }
            case "White":
            default:
                colors.push("White");
                if (this.isEnabled)
                {
                     colors.push("Gray");
                }
                else
                {
                    colors.push("White");
                }
        }

        return colors;
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
            if (projectile.type === "Bullet")
            {
                this.gameArea.connection.send(JSON.stringify({ type: 'removePlayer', data: this.id}));
            }
            else if (projectile.type === "Bomb")
            {
                if (this.isEnabled)
                {
                    var _this = this;
                    setTimeout(function()
                    {
                        if (this)
                        {
                            _this.reEnable();
                        }
                    }, this.enableTimeout);
                    this.gameArea.connection.send(JSON.stringify({ type: 'disablePlayer', data: this.id}));
                }
                else
                {
                    this.gameArea.connection.send(JSON.stringify({ type: 'removePlayer', data: this.id}));
                }
            }
        }
    },
    /**
     * Called once a frame to resolve interactions between players
     */
    interactWith: function(player)
    {
        // No implementation at base
    },
    processInput: function(keys, mouseX, mouseY)
    {
        this.speed = [0, 0];

        if (keys)
        {
            if (keys[87])
            { /* W: Move forward */
                this.speed[1] = this.maxSpeed;
            }
            if (keys[83])
            { /* S: Move backward */
                this.speed[1] = -this.maxSpeed;
            }
            if (keys[65])
            { /* A: Strafe left */
                this.speed[0] = this.maxSpeed;
            }
            if (keys[68])
            { /* D: Strafe right */
                this.speed[0] = -this.maxSpeed;
            }

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
                this.gameArea.flags.set(0, new Flag(this.team, this.id, this.x, this.y, this.gameArea));
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
        let cosAngle = Math.cos(this.angle);
        let sinAngle = Math.sin(this.angle);
        this.x = clamp(this.x + (this.speed[1] * cosAngle) + (this.speed[0] * sinAngle),
            this.gameArea.bounds.tl.x, this.gameArea.bounds.br.x);
        this.y = clamp(this.y + (this.speed[1] * sinAngle) - (this.speed[0] * cosAngle),
            this.gameArea.bounds.tl.y, this.gameArea.bounds.br.y);

        this.rect.update(this.x, this.y, this.angle);
    }
}

function CirclePlayer(gameArea)
{
    Player.call(this, gameArea);
    this.type = "Sneak";

    this.activateAbility = function()
    {
        gameArea.connection.send(
            JSON.stringify({ type: 'addProjectile', data: {type: "Bomb",
            x: this.x,
            y: this.y,
            angle: this.angle, team: this.team, shooterId: this.id}}));
    }

    this.innerDraw = function(ctx)
    {
        var colors = Player.prototype.getColors.call(this);
        ctx.fillStyle = colors[0];
        ctx.fillRect(-this.rect.halfWidth, -this.rect.halfHeight, this.rect.halfWidth, this.rect.halfHeight * 2);

        ctx.fillStyle = colors[1];
        ctx.beginPath();
        ctx.arc(0, 0, this.rect.halfWidth, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.fill();
    }

    this.tryActivateAbility = function()
    {
        // User must unpress button before every use
        if (!this.wasUsingAbilityLastFrame)
        {
            // Remove and Detonate the current projectile, if it exists
            if (this.lastProjectile > 0 && gameArea.projectiles.get(this.lastProjectile))
            {
                // Remove Projectile
                gameArea.connection.send(JSON.stringify(
                {
                    type: 'removeProjectile',
                    data: {
                        id: this.lastProjectile
                    }
                }));

                this.lastProjectile = -1;
            }
            else
            {
                Player.prototype.tryActivateAbility.call(this);
            }
        }
    }
}
CirclePlayer.prototype = new Player();

function TrianglePlayer(gameArea) {
    Player.call(this, gameArea);
    this.type = "Shooter";

    this.activateAbility = function() {
        gameArea.connection.send(
            JSON.stringify({ type: 'addProjectile', data: {type: "Bullet",
            x: this.x + this.rect.halfHeight * Math.cos(this.angle),
            y: this.y + this.rect.halfHeight * Math.sin(this.angle),
            angle: this.angle, team: this.team, shooterId: this.id}}));
    }

    this.innerDraw = function(ctx)
    {
        var colors = this.getColors();
        ctx.fillStyle = colors[0];
        ctx.fillRect(-this.rect.halfWidth, -this.rect.halfHeight, this.rect.halfWidth, this.rect.halfHeight * 2);

        ctx.fillStyle = colors[1];
        ctx.beginPath();
        ctx.moveTo(0, -this.rect.halfHeight);
        ctx.lineTo(this.rect.halfWidth, 0);
        ctx.lineTo(0, this.rect.halfHeight);
        ctx.closePath();
        ctx.fill();
    }
}
TrianglePlayer.prototype = new Player();

function SquarePlayer(gameArea)
{
    Player.call(this, gameArea);
    this.type = "Shield";
    this.shieldRect = new Rectangle(this.rect.halfWidth / 2, this.rect.halfHeight);

    this.drawHitBox = function()
    {
        Player.prototype.drawHitBox.call(this);

        // Draw shield hitbox
        ctx.strokeStyle = 'Red';
        ctx.beginPath();
        ctx.moveTo(this.shieldRect.tl.x, this.shieldRect.tl.y);
        ctx.lineTo(this.shieldRect.tr.x, this.shieldRect.tr.y);
        ctx.lineTo(this.shieldRect.br.x, this.shieldRect.br.y);
        ctx.lineTo(this.shieldRect.bl.x, this.shieldRect.bl.y);
        ctx.lineTo(this.shieldRect.tl.x, this.shieldRect.tl.y);
        ctx.stroke();
    }

    this.innerDraw = function(ctx)
    {
        // Get Colors
        var colors = this.getColors();

        // Draw Back
        ctx.fillStyle = colors[0];
        ctx.fillRect(-this.rect.halfWidth, -this.rect.halfHeight, this.rect.halfWidth, this.rect.halfHeight * 2);

        // Draw Shield
        ctx.fillStyle = colors[1];
        ctx.fillRect(0, -this.shieldRect.halfHeight, this.shieldRect.halfWidth * 2, this.shieldRect.halfHeight * 2);
    }

    this.hit = function(projectile)
    {
        // Bullets are blocked by the shield
        if (projectile.type === "Bullet")
        {
            if (!this.shieldRect.intersectsPoint(projectile.x, projectile.y))
            {
                console.log('projectile did not hit shield');
                Player.prototype.hit.call(this, projectile);
            }
        }
        else
        {
            Player.prototype.hit.call(this, projectile);
        }
    }

    /**
     * Overriding to destroy players who touch the shield
     */
    this.interactWith = function(player)
    {
        if (this.isPlayerOpponent(player) && player.isActive)
        {
            if (this.shieldRect.intersectsRect(player.rect))
            {
                this.gameArea.connection.send(JSON.stringify({ type: 'removePlayer', data: player.id}));
                player.isActive = false;
            }
        }
    }

    this.update = function()
    {
        // Update base`
        Player.prototype.update.call(this);

        // Update shield location
        let cosAngle = Math.cos(this.angle);
        let sinAngle = Math.sin(this.angle);

        this.shieldRect.update(this.x + (this.shieldRect.halfWidth * cosAngle),
            this.y + (this.shieldRect.halfWidth * sinAngle),
            this.angle);
    }
}
SquarePlayer.prototype = new Player();

function createPlayer(type, gameArea)
{
    var player = null;
    switch (type) {
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
