function Polygon()
{
    // Initialize member variables
	Shape.call(this);
	
	this.type = "Polygon";
}

Polygon.prototype = new Shape();

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