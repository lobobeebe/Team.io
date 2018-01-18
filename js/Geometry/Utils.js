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
		if (Math.sign(module.exports.outerProduct(a, c, d)) != Math.sign(module.exports.outerProduct(b, c, d)) &&
			Math.sign(module.exports.outerProduct(c, a, b)) != Math.sign(module.exports.outerProduct(d, a, b)))
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