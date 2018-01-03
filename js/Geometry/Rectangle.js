function Rectangle(halfWidth, halfHeight)
{
    // Initialize member variables
	Polygon.call(this);
    this.halfWidth = halfWidth;
    this.halfHeight = halfHeight;

    // Locations of corners
    this.points =
	[
		{x: -halfWidth, y: -halfHeight},
		{x: -halfWidth, y: halfHeight},
		{x: halfWidth, y: halfHeight},
		{x: halfWidth, y: -halfHeight}
	]

    /**
     * Determines if a rectangle intersects with this rectangle
     * Two rectangles A and B intersect if and only if at least one of the following is satisfied:
     * - a corner of A is inside B;
     * - a corner of B is inside A;
     * - some edge of A intersect with some edge of B.
     */


    /**
     * Updates location and angle
     */
    this.update = function(x, y, angle)
    {
		Shape.prototype.update.call(this, x, y, angle);
		
        // Calculate locations of corners
        let tl = getRotatedCoordinates(-halfWidth, -halfHeight, angle);
        tl.x += x;
        tl.y += y;
		
        let tr = getRotatedCoordinates(-halfWidth, halfHeight, angle);
        tr.x += x;
        tr.y += y;
		
        let bl = getRotatedCoordinates(halfWidth, halfHeight, angle);
        bl.x += x;
        bl.y += y;
		
        let br = getRotatedCoordinates(halfWidth, -halfHeight, angle);
        br.x += x;
        br.y += y;
		
		this.points =
		[
			tl, tr, bl, br
		]
    }
}

Rectangle.prototype = new Polygon();