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
	
	this.poly = new Polygon();
	this.poly.points =
	[
		{x: this.canvas.width - 150, y: 100},
		{x: this.canvas.width - 150, y: 200},
		{x: this.canvas.width - 50, y: 200},
		{x: this.canvas.width - 50, y: 100}
	]

	this.mousePoly = new Polygon();
	this.mousePoly.points =
	[
		{x: 0, y: 0},
		{x: 0, y: 0},
		{x: 0, y: 0},
		{x: 0, y: 0}
	]
	
	this.addProjectile = function(id, type, x, y, angle, team, shooterId, fromLocal)
	{		
		if (fromLocal)
		{
			this.connection.send(
				JSON.stringify({ type: 'addProjectile', data:
				{type: type, x: x, y: y, angle: angle, team: team, shooterId: shooterId}}));
		}
		else
		{
			var newProjectile = createProjectile(type, x, y, angle, team, shooterId, this);
			this.projectiles.set(id, newProjectile);
			
			// If this projectile was added by the main player, set the projectile to the player's last projectile
			if (this.mainPlayer && newProjectile.shooterId == this.mainPlayer.id)
			{
				this.mainPlayer.lastProjectile = id;
			}
		}
	}
	
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

		// Draw Main Player
		if (this.mainPlayer)
		{
			this.context.fillRect(miniMapX + this.mainPlayer.x * .05,
				miniMapY + this.mainPlayer.y * .05, 2, 2);	
		}
        this.context.restore();
    }
	
	this.joinGame = function()
	{
		this.connection.send(JSON.stringify({ type: 'joinRequest' }));
	}
	
	this.removePlayer = function(playerId, fromLocal)
	{
        this.players.delete(playerId);
	
		if (fromLocal)
		{
			this.connection.send(JSON.stringify({ type: 'removePlayer', data: {id: playerId}}));
			
			if (this.mainPlayer && playerId == this.mainPlayer.id)
			{
				this.mainPlayer = null;
			}
		}
	}
	
	this.removeProjectile = function(projectileId, fromLocal)
	{
		let projectile = this.projectiles.get(projectileId);
		if (projectile)
        {
			projectile.deactivate();
		}
		
        this.projectiles.delete(projectileId);
		
		if (fromLocal)
		{
			this.connection.send(JSON.stringify({ type: 'removeProjectile', data: {id: projectileId}}));
		}
	}
	
	this.setPlayerIsEnabled = function(playerId, isEnabled, fromLocal)
	{
		let player = this.players.get(playerId);
		
		if (player)
		{
			player.isEnabled = isEnabled;	
		}
		
		if (fromLocal)
		{
			this.connection.send(JSON.stringify(
			{ type: 'playerEnabled', data: {id: playerId, isEnabled: isEnabled}}));
		}
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
		if (this.mainPlayer)
		{
			this.mainPlayer.processInput(this.keys, this.mouseX - this.x, this.mouseY - this.y);	
		}

        // Before drawing any items, translate the context to the GameArea's location
        this.context.save();  
        this.context.translate(this.x, this.y);

        // Draw background
        this.drawBackground();

        // Update Flags
        for (let [id, flag] of this.flags)
        {
            flag.draw();
        }

        // Update Projectiles
        for (let [id, projectile] of this.projectiles)
        {
			projectile.update();
			projectile.draw();

			// Check if any Projectiles hit this player
			if (this.mainPlayer && this.mainPlayer.isProjectileOpponent(projectile) &&
				this.mainPlayer.intersects(projectile.shape))
			{
				this.mainPlayer.hit(projectile);

				// Projectile has hit player. Remove it.
				this.removeProjectile(id, true);
			}
        }

        // Update Players
        for (let [id, player] of this.players)
        {
            player.update();
            player.draw();
			
			if (this.mainPlayer)
			{
				player.interactWith(this.mainPlayer);
			}
        }

        // Done drawing, restore overall state
        this.context.restore();

        // Draw Mini Map
        this.drawMiniMap();
	
        // Send player update information.
        // TODO: Consider reducing frequency of this update rate
		if (this.mainPlayer)
		{
			this.updatePlayer(this.mainPlayer.id, this.mainPlayer.x, this.mainPlayer.y,
				this.mainPlayer.angle, this.mainPlayer.team, true);
		}

        // Update Camera
        this.updateCamera();

        ++this.frameNo;
    }
	
	this.updatePlayer = function(playerId, x, y, angle, team, fromLocal)
	{
		if (fromLocal)
		{
			this.connection.send(JSON.stringify({ type: 'updatePlayer', data:
			{id: playerId, x: x, y: y, angle: angle, team: team, fromLocal}}));
		}
		else
		{
			let updatedPlayer = this.players.get(playerId);
			if (updatedPlayer)
			{
				updatedPlayer.x = x;
				updatedPlayer.y = y;
				updatedPlayer.angle = angle;
				updatedPlayer.team = team;
			}
		}
	}

    this.updateCamera = function()
    {
		if (this.mainPlayer)
		{
			this.x = (this.canvas.width / 2) - this.mainPlayer.x;
			this.y = (this.canvas.height / 2) - this.mainPlayer.y;	
		}
    }

    this.reset = function ()
    {
        this.players = new Map();
        this.projectiles = new Map();
    }
}
