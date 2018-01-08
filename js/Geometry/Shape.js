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

/**
 * Determines if line AB intersects with CD
 * Two lines AB and CD intersect if both of the following are met
 * - A and B are on different sides of CD
 * - C and D are on different sides of AB.
 */
function doSegmentsDefinedByPointsIntersect(a, b, c, d)
{
    if (Math.sign(outerProduct(a, c, d)) != Math.sign(outerProduct(b, c, d)) &&
        Math.sign(outerProduct(c, a, b)) != Math.sign(outerProduct(d, a, b)))
    {
        return true;
    }

    return false;
}

/**
 * Returns the segment between points A and B
 */
function getSegmentFromPoints(a, b)
{
    return {x: b.x - a.x, y: b.y - a.y};
}

/**
 * Returns the outer product of a point A and segment CD
 * All points with similar outer products sign are on the same side of a line.
 */
function outerProduct(a, c, d)
{
    return (a.x - c.x) * (d.y - c.y) - (a.y - c.y) * (d.x - c.x);
}

function dotProduct(a, b)
{
    return (a.x * b.x) + (a.y * b.y);
}

function getRotatedCoordinates(x, y, angle)
{
    return {
        x: x * Math.cos(angle) - y * Math.sin(angle),
        y: y * Math.cos(angle) + x * Math.sin(angle)
    };
}

function clamp(number, min, max)
{
    return Math.max(min, Math.min(number, max));
}

function asNormal(vector)
{
	// Return base cases for Unit vectors or 0 vector
	if ((vector.x == 0 && vector.y == 0) || 
		(vector.x == 1 && vector.y == 0) || 
		(vector.x == 0 && vector.y == 1))
	{
		return vector;
	}
	
	let length = Math.sqrt(dotProduct(vector, vector));
	return {x: vector.x / length, y: vector.y / length};
}
