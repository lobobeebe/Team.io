(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
$(function () {
"use strict";

let Connection = require('./js/Connection.js');
let ClientGameArea = require('./js/ClientGameArea.js');

let gameArea = new ClientGameArea();
let webConnection = new Connection(gameArea);
let keys = [];

// Events
window.addEventListener('keydown', function (e)
{
    e.preventDefault();
	
	if (!keys[e.keyCode])
	{
		webConnection.connection.send(JSON.stringify({ type: 'input', data: {key: e.keyCode, isDown: true}}));
	}
	
	keys[e.keyCode] = true;
});

window.addEventListener('keyup', function (e)
{
	if (keys[e.keyCode])
	{
		webConnection.connection.send(JSON.stringify({ type: 'input', data: {key: e.keyCode, isDown: false}}));
	}
	
	keys[e.keyCode] = false;
});

window.addEventListener('mousemove', function (e)
{
    gameArea.mouseX = e.pageX;
    gameArea.mouseY = e.pageY;
});
		
var gameInterval = setInterval(function()
{
	gameArea.update();
}, 20);

});
},{"./js/ClientGameArea.js":3,"./js/Connection.js":4}],2:[function(require,module,exports){
var Player = require('./Player.js');
var Circle = require('./Geometry/Circle.js');

function CirclePlayer(data, gameArea)
{
    Player.call(this, data, gameArea);
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

module.exports = CirclePlayer;
},{"./Geometry/Circle.js":6,"./Player.js":11}],3:[function(require,module,exports){
var GameArea = require('./GameArea.js');
var CirclePlayer = require('./CirclePlayer.js');
var SquarePlayer = require('./SquarePlayer.js');
var TrianglePlayer = require('./TrianglePlayer.js');

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
	
	this.setMainPlayerId = function(id)
	{
		this.mainPlayerId = id;
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
			projectile.draw();
		}
		
		// Draw Flags
		for (let [id, flag] of this.flags)
		{
			flag.draw();
		}
		
		// Draw Players
		for (let [id, player] of this.players)
		{
			player.draw();
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
},{"./CirclePlayer.js":2,"./GameArea.js":5,"./SquarePlayer.js":13,"./TrianglePlayer.js":14}],4:[function(require,module,exports){
function Connection(gameArea)
{
	// if user is running mozilla then use it's built-in WebSocket
	window.WebSocket = window.WebSocket || window.MozWebSocket;
	// if browser doesn't support WebSocket, just show
	// some notification and exit
	if (!window.WebSocket)
	{
		alert("Your browser does not support WebSocket. Erroring out.");
		return;
	}

	// open connection
	this.connection = new WebSocket('ws://18.218.90.135:8082');
	//this.connection = new WebSocket('ws://localhost:8082');
	
	this.connection.onopen = function ()
	{
		// Send message to join the game
		this.send(JSON.stringify({type: 'joinRequest'}));
	};

	 this.connection.onerror = function (error) {
	   // just in there were some problems with connection...
	   alert("Sorry, but there\'s some problem with your "
			+ "connection or the server is down.");
	 };

	 this.connection.onmessage = function (message)
	 {
		try
		{
			var json = JSON.parse(message.data);
		}
		catch (e)
		{
			console.log('Invalid JSON: ', message.data);
			return;
		}

		if (json.type == 'joinResponse')
		{
			gameArea.setMainPlayerId(json.data.id);
		}
		else if (json.type == 'addFlag')
		{
			gameArea.addFlag(json.data.ownerId, json.data.x,
				json.data.y, false);
		}
		else if (json.type == 'updatePlayer')
		{
			gameArea.updatePlayer(json.data.id, json.data);
		}
		else if (json.type == 'addProjectile')
		{
			gameArea.addProjectile(json.data.id, json.data.type, json.data.x, json.data.y, json.data.angle,
				json.data.team, json.data.shooterId, false);
		}
		else if (json.type == 'removeProjectile')
		{
			gameArea.removeProjectile(json.data.id, false);
		}
		else if (json.type == 'removePlayer')
		{
			gameArea.removePlayer(json.data.id, false);
		}
		else if (json.type == 'playerEnabled')
		{
			gameArea.setPlayerIsEnabled(json.data.id, json.data.isEnabled, false);
		}
		else
		{
			console.log('Hmm..., I\'ve never seen JSON like this:', json);
		}
	};
}

module.exports = Connection;
},{}],5:[function(require,module,exports){
var Rectangle = require('./Geometry/Rectangle.js');
var Player = require('./Player.js');
var PlayerUtils = require('./PlayerUtils.js');

function GameArea()
{
	this.players = new Map();
	this.projectiles = new Map();
	this.flags = new Map();
	
	this.bounds = new Rectangle(1000, 1000);
	
	this.addFlag = function(id, flag)
	{
		this.flags.set(id, flag);
	}
	
	this.addProjectile = function(id, projectile)
	{		
		this.projectiles.set(id, projectile);
	}
	
	this.addPlayer = function(id, player)
	{
		this.players.set(id, player);
	}
	
	this.removeFlag = function(flagId)
	{
		this.flags.delete(flagId);
	}
	
	this.removePlayer = function(playerId)
	{
		this.players.delete(playerId);
		
		// Remove all projectiles that were shot by the removed player
		let projectileIds = [];
		for (let [id, projectile] of this.projectiles)
		{
			if (projectile.shooterId == playerId)
			{
				this.removeProjectile(id, false);
			}
		}
		
		// Remove all flags that were placed by the removed player
		for (let [id, flag] of this.flags)
		{
			if (id == playerId)
			{
				this.removeFlag(id, false);
			}
		}
	}
	
	this.removeProjectile = function(projectileId)
	{
		let projectile = this.projectiles.get(projectileId);
		if (projectile)
		{
			projectile.deactivate();
		}
		
		this.projectiles.delete(projectileId);
	}
	
	this.setPlayerIsEnabled = function(playerId, isEnabled)
	{
		let player = this.players.get(playerId);
		
		if (player)
		{
			player.isEnabled = isEnabled;	
		}
	}

	this.stop = function()
	{
		clearInterval(this.interval);
	}
	
	this.updatePlayer = function(playerId, data)
	{
		let updatedPlayer = this.players.get(playerId);
		if (updatedPlayer)
		{
			updatedPlayer.x = (data.x || updatedPlayer.x);
			updatedPlayer.y = (data.y || updatedPlayer.y);
			updatedPlayer.speed = (data.speed || updatedPlayer.speed);
			
			if (data.angle)
			{
				updatedPlayer.angle = data.angle.value;
				updatedPlayer.angularSpeed = data.angle.speed;
			}
			
			updatedPlayer.team = (data.team || updatedPlayer.team);
		}
		else
		{
			let player = PlayerUtils.createPlayer(data, this);
			
			this.players.set(playerId, player);
		}
	}
}

GameArea.prototype.update = function()
{
	// Update Projectiles
	for (let [id, projectile] of this.projectiles)
	{
		projectile.update();
	}

	// Update Players
	for (let [id, player] of this.players)
	{
		player.update();
	}
	
	// Update Flags
	for (let [id, flag] of this.flags)
	{
		/*
		TODO: Intersect on flag does not work
		if (this.mainPlayer && this.mainPlayer.team == "White" &&
			this.mainPlayer.intersects(flag))
		{
			this.joinTeam(flag.ownerId);
		}
		*/
	}

	// Send player update information.
	// TODO: Consider reducing frequency of this update rate
	// if (this.mainPlayer)
	// {
		// this.updatePlayer(this.mainPlayer.id, this.mainPlayer.x, this.mainPlayer.y,
			// this.mainPlayer.angle, this.mainPlayer.team, true);
	// }
}

module.exports = GameArea;
},{"./Geometry/Rectangle.js":8,"./Player.js":11,"./PlayerUtils.js":12}],6:[function(require,module,exports){
var Shape = require('./Shape.js');

function Circle(radius)
{
    // Initialize member variables
	Shape.call(this);
	
	this.radius = radius;
	this.squaredRadius = this.radius * this.radius;
	
	this.type = "Circle";
	
	this.points =
	[
		{x: this.x, y: this.y}
	]
}

Circle.prototype = new Shape();

Circle.prototype.draw = function(context)
{
	context.beginPath();
	context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
}

/**
 * Function to determine if a point intersects this Circle.
 */
Circle.prototype.intersectsPoint = function(x, y)
{
	let difference = {x: x - this.x, y: y - this.y};
	let distanceSquared = (difference.x * difference.x) + (difference.y * difference.y);
	
	if (distanceSquared <= this.squaredRadius)
	{
		return true;
	}
	
	return false;
}

Circle.prototype.intersectsSegment = function(p1, p2)
{
	let difference = {x: p2.x - p1.x, y: p2.y - p1.y};
	let startToCenter = {x: p1.x - this.x, y: p1.y - this.y};
	
	
	let a = dotProduct(difference, difference);
	let b = 2 * dotProduct(startToCenter, difference);
	let c = dotProduct(startToCenter, startToCenter) - this.squaredRadius;

	let discriminant = (b * b) - (4 * a * c);
	if (discriminant < 0)
	{
	  // no intersection
	}
	else
	{
	  // ray didn't totally miss sphere,
	  // so there is a solution to
	  // the equation.
	  discriminant = Math.sqrt(discriminant);

	  // either solution may be on or off the ray so need to test both
	  // t1 is always the smaller value, because BOTH discriminant and
	  // a are nonnegative.
	  let t1 = (-b - discriminant) / (2 * a);
	  let t2 = (-b + discriminant) / (2 * a);

	  // 3x HIT cases:
	  //          -o->             --|-->  |            |  --|->
	  // Impale(t1 hit,t2 hit), Poke(t1 hit,t2>1), ExitWound(t1<0, t2 hit), 

	  // 3x MISS cases:
	  //       ->  o                     o ->              | -> |
	  // FallShort (t1>1,t2>1), Past (t1<0,t2<0), CompletelyInside(t1<0, t2>1)

	  if (t1 >= 0 && t1 <= 1)
	  {
		// t1 is the intersection, and it's closer than t2
		// (since t1 uses -b - discriminant)
		// Impale, Poke
		return true;
	  }

	  // here t1 didn't intersect so we are either started
	  // inside the sphere or completely past it
	  if (t2 >= 0 && t2 <= 1)
	  {
		// ExitWound
		return true;
	  }

	  // no intn: FallShort, Past, CompletelyInside
	  return false;
	}
}

Circle.prototype.intersectsEdges = function(shape)
{
	if (shape.type == "Polygon")
	{
		return shape.intersectsEdges(this);
	}
	else if (shape.type == "Circle");
	{
		// Determine if two circles are intersecting by using single circle with radius equal to the sum of the others.
		let combinedCircle = new Circle(this.radius + shape.radius);
		combinedCircle.x = this.x;
		combinedCircle.y = this.y;
		
		return combinedCircle.intersectsPoint(shape.x, shape.y);
	}

	return false;
}

Circle.prototype.update = function(x, y, angle)
{
	Shape.prototype.update.call(this, x, y, angle);
	
	this.points =
	[
		{x: this.x, y: this.y}
	]
}

module.exports = Circle;
},{"./Shape.js":9}],7:[function(require,module,exports){
var Shape = require('./Shape.js');
var Utils = require('./Utils.js');

function Polygon(localPoints)
{
    // Initialize member variables
	Shape.call(this);
	
	this.localPoints = localPoints;
	this.points = localPoints;
	
	this.type = "Polygon";
}

Polygon.prototype = new Shape();

Polygon.prototype.draw = function(context)
{
	context.beginPath();
	context.moveTo(this.points[0].x, this.points[0].y);
	for (let i = 0; i < this.points.length; ++i)
	{
		context.lineTo(this.points[i].x, this.points[i].y)
	}
	context.closePath();
}

/**
 * Function to determine if a point intersects this Polygon.
 */
Polygon.prototype.intersectsPoint = function(x, y)
{
	let c = false;
	for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++)
	{
		if (((this.points[i].y > y) != (this.points[j].y > y)) &&
			(x < (this.points[j].x - this.points[i].x) * (y - this.points[i].y) / (this.points[j].y - this.points[i].y) + this.points[i].x))
		{
			c = !c;
		}
	}
	
	return c;
}

Polygon.prototype.intersectsSegment = function(p1, p2)
{
	for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++)
	{
		Utils.doSegmentsDefinedByPointsIntersect(this.points[i], this.points[j], p1, p2);
	}
}

Polygon.prototype.intersectsEdges = function(shape)
{
	// Check if any edge of A intersects with B
	for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++)
	{
		if (shape.intersectsSegment(this.points[i], this.points[j]))
		{
			return true;
		}
	}

	return false;
}

Polygon.prototype.update = function(x, y, angle)
{
	Shape.prototype.update.call(this, x, y, angle);
	
	let points = [];
	
	for (let i = 0; i < this.localPoints.length; ++i)
	{
		let point = Utils.getRotatedCoordinates(this.localPoints[i].x, this.localPoints[i].y, angle);
		point.x += x;
		point.y += y;
		
		points.push(point);
	}
	
	this.points = points;
}

module.exports = Polygon;
},{"./Shape.js":9,"./Utils.js":10}],8:[function(require,module,exports){
var Polygon = require('./Polygon.js');

function Rectangle(halfWidth, halfHeight)
{
    // Initialize member variables
	Polygon.call(this, [
		{x: -halfWidth, y: -halfHeight},
		{x: -halfWidth, y: halfHeight},
		{x: halfWidth, y: halfHeight},
		{x: halfWidth, y: -halfHeight}
	]);
	
    this.halfWidth = halfWidth;
    this.halfHeight = halfHeight;	
}

Rectangle.prototype = new Polygon();

module.exports = Rectangle;
},{"./Polygon.js":7}],9:[function(require,module,exports){
function Shape()
{
    // Initialize member variables
    this.x = 0;
    this.y = 0;
    this.angle = 0;

    // Locations of corners
	this.points = [];
}

Shape.prototype = 
{
	getCoordinatesInLocalSpace: function(x, y)
	{
		return getRotatedCoordinates(x - this.x, y - this.y, -this.angle);
	},
	getLocalCoordinatesInWordSpace: function(x, y)
    {
        let pos = getRotatedCoordinates(x, y, this.angle);
        pos.x += this.x;
        pos.y += this.y;

        return pos;
    },
	intersects: function(shape)
	{
		// Determine if any corner of A intersects B
		for (let point of this.points)
		{
			if (shape.intersectsPoint(point.x, point.y))
			{
				return true;
			}
		}

		// Determine if any corner of B intersects A
		for (let point of shape.points)
		{
			if (this.intersectsPoint(point.x, point.y))
			{
				return true;
			}
		}
		
		if (this.intersectsEdges(shape))
		{
			return true;
		}
	},
	/**
     * Updates location and angle
     */
	update: function(x, y, angle)
    {
		this.x = x;
		this.y = y;
		this.angle = angle;
	}
}

module.exports = Shape;
},{}],10:[function(require,module,exports){
module.exports = 
{
	mod: function(n, m)
	{
			return ((n % m) + m) % m;
	},
	
	/**
	 * Determines if line AB intersects with CD
	 * Two lines AB and CD intersect if both of the following are met
	 * - A and B are on different sides of CD
	 * - C and D are on different sides of AB.
	 */
	doSegmentsDefinedByPointsIntersect: function(a, b, c, d)
	{
		if (Math.sign(outerProduct(a, c, d)) != Math.sign(outerProduct(b, c, d)) &&
			Math.sign(outerProduct(c, a, b)) != Math.sign(outerProduct(d, a, b)))
		{
			return true;
		}

		return false;
	},

	/**
	 * Returns the segment between points A and B
	 */
	getSegmentFromPoints: function(a, b)
	{
		return {x: b.x - a.x, y: b.y - a.y};
	},

	/**
	 * Returns the outer product of a point A and segment CD
	 * All points with similar outer products sign are on the same side of a line.
	 */
	outerProduct: function(a, c, d)
	{
		return (a.x - c.x) * (d.y - c.y) - (a.y - c.y) * (d.x - c.x);
	},

	dotProduct: function(a, b)
	{
		return (a.x * b.x) + (a.y * b.y);
	},

	getRotatedCoordinates: function(x, y, angle)
	{
		return {
			x: x * Math.cos(angle) - y * Math.sin(angle),
			y: y * Math.cos(angle) + x * Math.sin(angle)
		};
	},

	clamp: function(number, min, max)
	{
		return Math.max(min, Math.min(number, max));
	},

	asNormal: function(vector)
	{
		// Return base cases for Unit vectors or 0 vector
		if ((vector.x == 0 && vector.y == 0) || 
			(vector.x == 1 && vector.y == 0) || 
			(vector.x == 0 && vector.y == 1))
		{
			return vector;
		}
		
		let length = Math.sqrt(module.exports.dotProduct(vector, vector));
		return {x: vector.x / length, y: vector.y / length};
	}

}
},{}],11:[function(require,module,exports){
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
},{"./Geometry/Polygon.js":7,"./Geometry/Utils.js":10}],12:[function(require,module,exports){
var CirclePlayer = require('./CirclePlayer.js');
var SquarePlayer = require('./SquarePlayer.js');
var TrianglePlayer = require('./TrianglePlayer.js');

module.exports = 
{
	createPlayer: function(data, gameArea)
	{
		let player;
		if (data.type == "Shield")
		{
			player = new SquarePlayer(data, gameArea);
		}
		else if (data.type == "Shooter")
		{
			player = new TrianglePlayer(data, gameArea);
		}
		else if (data.type == "Sneak")
		{
			player = new CirclePlayer(data, gameArea);
		}
		else
		{
			console.log("Unknown Player Type: " + data.type);
		}
		
		return player;
	}
}
},{"./CirclePlayer.js":2,"./SquarePlayer.js":13,"./TrianglePlayer.js":14}],13:[function(require,module,exports){
var Player = require('./Player.js');

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

module.exports = SquarePlayer;
},{"./Player.js":11}],14:[function(require,module,exports){
var Player = require('./Player.js');

function TrianglePlayer(data, gameArea)
{
    Player.call(this, data, gameArea);
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

module.exports = TrianglePlayer;
},{"./Player.js":11}]},{},[1]);
