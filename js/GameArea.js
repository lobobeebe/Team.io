function GameArea(connection)
{
    this.canvas = document.getElementById("gameArea");
    this.connection = connection;
    this.mainPlayer = new TrianglePlayer(this);
    this.players = new Map();
    this.projectiles = new Map();
    this.flags = new Map();
    this.frameNo = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.bounds = new Rectangle(1000, 1000);
    this.keys = [];
    this.x = 0;
    this.y = 0;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.context = this.canvas.getContext("2d");

    this.drawBackground = function()
    {
        this.context.save();
        this.context.strokeStyle = 'Black';

        let gridSize = 100;
        this.context.beginPath();
        for (let x = -this.bounds.halfWidth; x <= this.bounds.halfWidth; x += gridSize)
        {
            this.context.moveTo(x, -this.bounds.halfHeight);
            this.context.lineTo(x, this.bounds.halfHeight);
        }

        for (let y = -this.bounds.halfHeight; y <= this.bounds.halfHeight; y += gridSize)
        {
            this.context.moveTo(-this.bounds.halfWidth, y);
            this.context.lineTo(this.bounds.halfWidth, y);
        }

        this.context.stroke();

        this.context.restore();
    }

    this.drawMiniMap = function()
    {
        this.context.save();
        let miniMapX = (this.canvas.width - 100);
        let miniMapY = 150;
        let miniMapHalfWidth = this.bounds.halfWidth * .05;
        let miniMapHalfHeight = this.bounds.halfHeight * .05;
        this.context.beginPath();
        this.context.rect(miniMapX - miniMapHalfWidth,
            miniMapY - miniMapHalfHeight, miniMapHalfWidth * 2, miniMapHalfHeight * 2);
        this.context.stroke();

        this.context.fillRect(miniMapX + this.mainPlayer.x * .05,
            miniMapY + this.mainPlayer.y * .05, 2, 2);
        this.context.restore();
    }

    this.stop = function()
    {
        clearInterval(this.interval);
    }

    this.update = function()
    {
        // Clear the canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Process Inputs
        this.mainPlayer.processInput(this.keys, this.mouseX - this.x, this.mouseY - this.y);

        // Update Camera
        this.updateCamera();

        // Before drawing any items, translate the context to the GameArea's location
        this.context.save();
        this.context.translate(this.x, this.y);

        // Draw background
        this.drawBackground();

        // Update Flags
        for (var [id, flag] of this.flags)
        {
            flag.draw();
        }

        // Update Projectiles
        for (var [id, projectile] of this.projectiles)
        {
            if (projectile.isActive)
            {
                projectile.update();
                projectile.draw();

                // Check if any Projectiles hit this player
                if (projectile.shooterId != this.mainPlayer.id &&
                    this.mainPlayer.doesProjectileHit(projectile))
                {
                    this.mainPlayer.hit(projectile);

                    // Projectile has hit player. Remove it.
                    this.connection.send(JSON.stringify(
                    {
                        type: 'removeProjectile',
                        data:
                        {
                            id: id
                        }
                    }));
                }
            }
            else
            {
                this.projectiles.delete(id);
            }
        }

        // Update Players
        for (var [id, player] of this.players)
        {
            player.update();
            player.draw();

            player.interactWith(this.mainPlayer);
        }

        // Done drawing, restore overall state
        this.context.restore();

        // Draw Mini Map
        this.drawMiniMap();

        // Send player update information.
        // TODO: Consider reducing frequency of this update rate
        this.connection.send(JSON.stringify({ type: 'updatePlayer', data: this.mainPlayer.getJson()}));

        ++this.frameNo;
    }

    this.updateCamera = function()
    {
        this.x = (this.canvas.width / 2) - this.mainPlayer.x;
        this.y = (this.canvas.height / 2) - this.mainPlayer.y;
    }

    this.reset = function ()
    {
        this.players = new Map();
        this.projectiles = new Map();
    }
}
