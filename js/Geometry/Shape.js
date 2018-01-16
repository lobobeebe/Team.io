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