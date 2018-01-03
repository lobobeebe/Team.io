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