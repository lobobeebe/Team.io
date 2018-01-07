function ShapeGroup()
{
	this.shapes = [];
}

ShapeGroup.prototype = 
{
	intersects: function(otherShape)
	{
		for (let shape of this.shapes)
		{
			if (shape.intersects(otherShape))
			{
				
			}
		}
	}
}