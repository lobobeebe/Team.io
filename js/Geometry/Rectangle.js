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