const GameArea = require('./GameArea.js');
const CirclePlayer = require('./CirclePlayer.js');
const SquarePlayer = require('./SquarePlayer.js');
const TrianglePlayer = require('./TrianglePlayer.js');
const ProjectileUtils = require('./ProjectileUtils');

function ClientGameArea()
{
	GameArea.call(this);
	
	this.canvas = document.getElementById("gameArea");
	this.x = 0;
	this.y = 0;
	this.keys = new Map();
	this.lastKeys = new Map();
	this.keysUpdated = [];
	this.canvas.width = window.innerWidth;
	this.canvas.height = window.innerHeight;
	this.context = this.canvas.getContext("2d");
	this.mainPlayerId;
	
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
	   let mainPlayer = this.getMainPlayer();
	   if (mainPlayer)
	   {
			   this.context.fillRect(miniMapX + mainPlayer.x * .05,
					   miniMapY + mainPlayer.y * .05, 2, 2);
	   }
        this.context.restore();
    }

	this.getMainPlayer = function()
	{	
		if (this.mainPlayerId && this.players)
		{
			let mainPlayer = this.players.get(this.mainPlayerId);
			return mainPlayer;
		}
		
		return null;
	}
	
	this.processMessage = function(type, data)
	{
		if (type == 'joinResponse')
		{
			this.mainPlayerId = data.id;
		}
		else if (type == 'addFlag')
		{
			this.addFlag(data.id, new Flag(data.team, data.id, data.x, data.y, this));
		}
		else if (type == 'updatePlayer')
		{
			this.updatePlayer(data.id, data);
		}
		else if (type == 'addProjectile')
		{
			let projectile = ProjectileUtils.create(data.type, data, this);
			
			this.addProjectile(data.id, projectile);
		}
		else if (type == 'removeProjectile')
		{
			this.removeProjectile(data.id);
		}
		else if (type == 'removePlayer')
		{
			this.removePlayer(data.id);
		}
		else if (type == 'playerEnabled')
		{
			this.setPlayerIsEnabled(data.id, data.isEnabled);
		}
		else
		{
			console.log('Hmm..., I\'ve never seen a message like this:', type, data);
		}
	}
	
	this.update = function()
	{
		// Clear the canvas
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Before drawing any items, translate the context to the GameArea's location
		this.context.save();  
		this.context.translate(this.x, this.y);
		
		// Draw background
		this.drawBackground();
		
		// Base update
		GameArea.prototype.update.call(this);
		
		// Draw Projectiles
		for (let [id, projectile] of this.projectiles)
		{
			projectile.draw(this.context);
		}
		
		// Draw Flags
		for (let [id, flag] of this.flags)
		{
			flag.draw(this.context);
		}
		
		// Draw Players
		for (let [id, player] of this.players)
		{
			player.draw(this.context);
		}

		// Done drawing, restore overall state
		this.context.restore();

		// Draw Mini Map
		this.drawMiniMap();		

		// Update Camera
		this.updateCamera();
	}

	this.updateCamera = function()
	{
		let mainPlayer = this.getMainPlayer();
		if (mainPlayer)
		{
			this.x = (this.canvas.width / 2) - mainPlayer.x;
			this.y = (this.canvas.height / 2) - mainPlayer.y;	
		}
	}
}

ClientGameArea.prototype = new GameArea();

module.exports = ClientGameArea;