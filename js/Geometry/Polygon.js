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
		doSegmentsDefinedByPointsIntersect(this.points[i], this.points[j], p1, p2);
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
		let point = getRotatedCoordinates(this.localPoints[i].x, this.localPoints[i].y, angle);
		point.x += x;
		point.y += y;
		
		points.push(point);
	}
	
	this.points = points;
}