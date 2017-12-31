function Rectangle(halfWidth, halfHeight)
{
    // Initialize member variables
    this.centerX = 0;
    this.centerY = 0;
    this.angle = 0;
    this.halfWidth = halfWidth;
    this.halfHeight = halfHeight;

    // Locations of corners
    this.tl = {x: -halfWidth, y: -halfHeight};
    this.tr = {x: halfWidth, y: -halfHeight};
    this.bl = {x: -halfWidth, y: halfHeight};
    this.br = {x: halfWidth, y: halfHeight};

    this.getCoordinatesInLocalSpace = function(x, y)
    {
        return getRotatedCoordinates(x - this.centerX, y - this.centerY, -this.angle);
    }

    this.getLocalCoordinatesInWordSpace = function(x, y)
    {
        let pos = getRotatedCoordinates(x, y, this.angle);
        pos.x += this.centerX;
        pos.y += this.centerY;

        return pos;
    }

    /**
     * Function to determine if a point intersects this Rectangle.
     */
    this.intersectsPoint = function(x, y)
    {
        let localPos = this.getCoordinatesInLocalSpace(x, y);

        if (localPos.x <= this.halfWidth && localPos.x >= -this.halfWidth &&
            localPos.y <= this.halfHeight && localPos.y >= -this.halfHeight)
        {
            return true;
        }

        return false;
    }

    /**
     * Determines if a rectangle intersects with this rectangle
     * Two rectangles A and B intersect if and only if at least one of the following is satisfied:
     * - a corner of A is inside B;
     * - a corner of B is inside A;
     * - some edge of A intersect with some edge of B.
     */
    this.intersectsRect = function(rect)
    {
        // Determine if any corner of A intersects B
        if (rect.intersectsPoint(this.tl.x, this.tl.y) || rect.intersectsPoint(this.tr.x, this.tr.y) ||
            rect.intersectsPoint(this.br.x, this.br.y) || rect.intersectsPoint(this.bl.x, this.bl.y))
        {
            return true;
        }

        // Determine if any corner of B intersects A
        if (this.intersectsPoint(rect.tl.x, rect.tl.y) || this.intersectsPoint(rect.tr.x, rect.tr.y) ||
            this.intersectsPoint(rect.br.x, rect.br.y) || this.intersectsPoint(rect.bl.x, rect.bl.y))
        {
            return true;
        }

        // Check if any edge of A intersects with any edge of B
        if (doSegmentsDefinedByPointsIntersect(this.tl, this.tr, rect.tl, rect.tr) ||
            doSegmentsDefinedByPointsIntersect(this.tl, this.tr, rect.tr, rect.br) ||
            doSegmentsDefinedByPointsIntersect(this.tl, this.tr, rect.br, rect.bl) ||
            doSegmentsDefinedByPointsIntersect(this.tl, this.tr, rect.bl, rect.tl) ||

            doSegmentsDefinedByPointsIntersect(this.tr, this.br, rect.tl, rect.tr) ||
            doSegmentsDefinedByPointsIntersect(this.tr, this.br, rect.tr, rect.br) ||
            doSegmentsDefinedByPointsIntersect(this.tr, this.br, rect.br, rect.bl) ||
            doSegmentsDefinedByPointsIntersect(this.tr, this.br, rect.bl, rect.tl) ||

            doSegmentsDefinedByPointsIntersect(this.br, this.bl, rect.tl, rect.tr) ||
            doSegmentsDefinedByPointsIntersect(this.br, this.bl, rect.tr, rect.br) ||
            doSegmentsDefinedByPointsIntersect(this.br, this.bl, rect.br, rect.bl) ||
            doSegmentsDefinedByPointsIntersect(this.br, this.bl, rect.bl, rect.tl) ||

            doSegmentsDefinedByPointsIntersect(this.bl, this.tl, rect.tl, rect.tr) ||
            doSegmentsDefinedByPointsIntersect(this.bl, this.tl, rect.tr, rect.br) ||
            doSegmentsDefinedByPointsIntersect(this.bl, this.tl, rect.br, rect.bl) ||
            doSegmentsDefinedByPointsIntersect(this.bl, this.tl, rect.bl, rect.tl))
        {
            return true;
        }

        return false;
    }

    /**
     * Updates location and angle
     */
    this.update = function(centerX, centerY, angle)
    {
        // Update location and angle
        this.centerX = centerX;
        this.centerY = centerY;
        this.angle = angle;

        // Calculate locations of corners
        this.tl = getRotatedCoordinates(-halfWidth, -halfHeight, angle);
        this.tl.x += this.centerX;
        this.tl.y += this.centerY;
        this.tr = getRotatedCoordinates(halfWidth, -halfHeight, angle);
        this.tr.x += this.centerX;
        this.tr.y += this.centerY;
        this.bl = getRotatedCoordinates(-halfWidth, halfHeight, angle);
        this.bl.x += this.centerX;
        this.bl.y += this.centerY;
        this.br = getRotatedCoordinates(halfWidth, halfHeight, angle);
        this.br.x += this.centerX;
        this.br.y += this.centerY;
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
    return (a.x * b.x) - (a.y * b.y);
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
