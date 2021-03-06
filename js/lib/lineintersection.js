/**
 * @fileOverview Intersections between shapes
 * @name lineintersection.js
 * @author Florent Grélard
 * @license
 */
import bigdecimal from 'bigdecimal';

/**
 * Error tolerance epsilon
 * @type {number}
 */
export var epsilon = 0.000001;

/**
 * Change the value of {@link epsilon}
 * @param {number} eps
 */
export function setEpsilon(eps) {
    epsilon = eps;
}

/**
 * Checks if number b is in the interval [a, c+epsilon]
 * @param {Number} a lower bound
 * @param {Number} b value to check
 * @param {Number} c upper bound
 * @returns {Boolean} Between coordinates
 */
function between(a, b, c) {
    return a-epsilon <= b && b <= c+epsilon;
}


/**
 * Mean absolute difference of b between a and c
 * @param {number} a first value
 * @param {number} b value to check
 * @param {number} c second value
 * @returns {number} mean absolute difference
 */
function averageDiff(a, b, c) {
    return (Math.abs(a - b) + Math.abs(c - b)) / 2;
}


/**
 * Exact Intersection segment
 * @param {number} x1 First segment first point x
 * @param {number} y1 First segment first point y
 * @param {number} x2 First segment second point x
 * @param {number} y2 First segment second point y
 * @param {number} x3 Second segment first point x
 * @param {number} y3 Second segment first point y
 * @param {number} x4 Second segment second point x
 * @param {number} y4 Second segment second point y
 * @returns {Boolean|{x,y}} the intersection, if it exists
 */
export function segmentIntersectionExact(x1,y1,x2,y2, x3,y3,x4,y4) {
    var bx1 = bigdecimal.BigDecimal(x1.toString());
    var bx2 = bigdecimal.BigDecimal(x2.toString());
    var bx3 = bigdecimal.BigDecimal(x3.toString());
    var bx4 = bigdecimal.BigDecimal(x4.toString());
    var by1 = bigdecimal.BigDecimal(y1.toString());
    var by2 = bigdecimal.BigDecimal(y2.toString());
    var by3 = bigdecimal.BigDecimal(y3.toString());
    var by4 = bigdecimal.BigDecimal(y4.toString());

    var x1y2 = bx1.multiply(by2);
    var y1x2 = by1.multiply(bx2);
    var x3x4 = bx3.subtract(bx4);
    var x1x2 = bx1.subtract(bx2);
    var x3y4 = bx3.multiply(by4);
    var y3x4 = by3.multiply(bx4);
    var y3y4 = by3.subtract(by4);
    var y1y2 = by1.subtract(by2);


    var detX12 = (x1y2.subtract(y1x2)).multiply(x3x4);
    var detX34 = (x3y4.subtract(y3x4)).multiply(x1x2);
    var detV = (x1x2.multiply(y3y4)).subtract((y1y2.multiply(x3x4)));

    var detY12 = (x1y2.subtract(y1x2)).multiply(y3y4);
    var detY34 = (x3y4.subtract(y3x4)).multiply(y1y2);


    var x = ((detX12.subtract(detX34)).divide(detV, 0)).floatValue();

    var y = ((detY12.subtract(detY34)).divide(detV, 0)).floatValue();

    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!between(x2, x, x1)) {return false;}
        } else {
            if (!between(x1, x, x2)) {return false;}
        }
        if (y1>=y2) {
            if (!between(y2, y, y1)) {return false;}
        } else {
            if (!between(y1, y, y2)) {return false;}
        }
        if (x3>=x4) {
            if (!between(x4, x, x3)) {return false;}
        } else {
            if (!between(x3, x, x4)) {return false;}
        }
        if (y3>=y4) {
            if (!between(y4, y, y3)) {return false;}
        } else {
            if (!between(y3, y, y4)) {return false;}
        }
    }

    return {x: x,y: y};
}


/**
 * Intersection segment
 * @param {number} x1 First segment first point x
 * @param {number} y1 First segment first point y
 * @param {number} x2 First segment second point x
 * @param {number} y2 First segment second point y
 * @param {number} x3 Second segment first point x
 * @param {number} y3 Second segment first point y
 * @param {number} x4 Second segment second point x
 * @param {number} y4 Second segment second point y
 * @returns {Boolean|{x,y}} the intersection, if it exists
 */
export function segmentIntersection(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
        ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!between(x2, x, x1)) {return false;}
        } else {
            if (!between(x1, x, x2)) {return false;}
        }
        if (y1>=y2) {
            if (!between(y2, y, y1)) {return false;}
        } else {
            if (!between(y1, y, y2)) {return false;}
        }
        if (x3>=x4) {
            if (!between(x4, x, x3)) {return false;}
        } else {
            if (!between(x3, x, x4)) {return false;}
        }
        if (y3>=y4) {
            if (!between(y4, y, y3)) {return false;}
        } else {
            if (!between(y3, y, y4)) {return false;}
        }
    }
    return {x: x,y: y};
}

/**
 * Intersection line
 * @param {number} x1 First segment first point x
 * @param {number} y1 First segment first point y
 * @param {number} x2 First segment second point x
 * @param {number} y2 First segment second point y
 * @param {number} x3 Second segment first point x
 * @param {number} y3 Second segment first point y
 * @param {number} x4 Second segment second point x
 * @param {number} y4 Second segment second point y
 * @returns {Boolean|{x,y}} the intersection, if it exists
 */
export function lineIntersection(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
        ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    }
    return {x: x,y: y};
}



/**
* Intersection half-line and line
 * @param {number} x1 First segment first point x
 * @param {number} y1 First segment first point y
 * @param {number} x2 First segment second point x
 * @param {number} y2 First segment second point y
 * @param {number} x3 Second segment first point x
 * @param {number} y3 Second segment first point y
 * @param {number} x4 Second segment second point x
 * @param {number} y4 Second segment second point y
 * @returns {Boolean|{x,y}} the intersection, if it exists
 */
export function halfLineAndLineIntersection(x1,y1,x2,y2, x3,y3,x4,y4) {
    var intersection = lineIntersection(x1,y1,x2,y2, x3,y3,x4,y4);
    if (!intersection) return false;
    var x = intersection.x;
    var y = intersection.y;
    if (x1>=x2) {
        if (x > x1) {return false;}
    } else {
        if (x < x1) {return false;}
    }
    if (y1>=y2) {
        if (y > y1) {return false;}
    } else {
        if (y < y1) {return false;}
    }
    return {x: x,y: y};
}

/**
 * Intersection half line
 * @param {number} x1 First segment first point x
 * @param {number} y1 First segment first point y
 * @param {number} x2 First segment second point x
 * @param {number} y2 First segment second point y
 * @param {number} x3 Second segment first point x
 * @param {number} y3 Second segment first point y
 * @param {number} x4 Second segment second point x
 * @param {number} y4 Second segment second point y
 * @returns {Boolean|{x,y}} the intersection, if it exists
 */
export function halfLineIntersection(x1,y1,x2,y2, x3,y3,x4,y4) {
    var obj = halfLineAndLineIntersection(x1,y1,x2,y2, x3,y3,x4,y4);
    if (!obj) return false;
    var x=obj.x;
    var y=obj.y;
    if (x3>=x4) {
        if (x > x3) {return false;}
    } else {
        if (x < x3) {return false;}
    }
    if (y3>=y4) {
        if (y > y3) {return false;}
    } else {
        if (y < y3) {return false;}
    }
    return {x: x,y: y};
}


/**
 * Helper function to check if there is intersection between two segments represented as linestring objects
 * @param {ol.geom.LineString} s1 first linestring segment
 * @param {ol.geom.LineString} s2 second linestring segment
 * @returns {Boolean|{x,y}} the intersection, if it exists
 */
export function segmentsIntersect(s1, s2) {
    var pS1F = s1.getFirstCoordinate();
    var pS1L = s1.getLastCoordinate();
    var pS2F = s2.getFirstCoordinate();
    var pS2L = s2.getLastCoordinate();


    var intersection = segmentIntersection(pS1F[0], pS1F[1],
                                           pS1L[0], pS1L[1],
                                           pS2F[0], pS2F[1],
                                           pS2L[0], pS2L[1]);
    return intersection;
}

/**
 * Helper function to check if there is intersection between two half lines represented as linestring objects where first coordinate is the start of the half line
 * @param {ol.geom.LineString} s1 first linestring half lines
 * @param {ol.geom.LineString} s2 second linestring half lines
 * @returns {Boolean|{x,y}} the intersection, if it exists
 */
export function halfLinesIntersect(s1, s2) {
    var pS1F = s1.getFirstCoordinate();
    var pS1L = s1.getLastCoordinate();
    var pS2F = s2.getFirstCoordinate();
    var pS2L = s2.getLastCoordinate();


    var intersection = halfLineIntersection(pS1F[0], pS1F[1],
                                           pS1L[0], pS1L[1],
                                           pS2F[0], pS2F[1],
                                           pS2L[0], pS2L[1]);
    return intersection;
}

/**
 * Checks whether a point belongs to a segment
 * @param {Array<number>} p the point
 * @param {ol.geom.LineString} s the segment
 * @returns {boolean} whether p belongs to s
 */
export function onSegment(p, s) {
    var p1 = s.getFirstCoordinate();
    var p2 = s.getLastCoordinate();

    var x1 = p1[0];
    var x2 = p2[0];
    var y1 = p1[1];
    var y2 = p2[1];

    var x = p[0];
    var y = p[1];

    if (x1 < x2) {
        if (!between(x1, x, x2)) return false;
    }
    else {
        if (!between(x2, x, x1)) return false;
    }

    if (y1 < y2) {
        if (!between(y1, y, y2)) return false;
    }
    else {
        if (!between(y2, y, y1)) return false;
    }

    return true;
}


/**
 * Checks whether two segments have the same coordinates
 * @param {ol.geom.LineString} s1
 * @param {ol.geom.LineString} s2
 * @returns {boolean} whether the segments are the same
 */
export function segmentsEqual(s1, s2) {
    return (s1.getFirstCoordinate()[0] === s2.getFirstCoordinate()[0] &&
            s1.getFirstCoordinate()[1] === s2.getFirstCoordinate()[1] &&
            s1.getLastCoordinate()[0] === s2.getLastCoordinate()[0] &&
            s1.getLastCoordinate()[1] === s2.getLastCoordinate()[1]);
}

/**
 * Checks whether two rectangles intersect, that is to say they overlap
 * @param {Object} a
 * @param {Object} b
 * @returns {boolean} whether rectangles intersect
 */
export function rectanglesIntersect(a, b) {
    var x = Math.max(a.minX, b.minX);
    var num1 = Math.min(a.maxX, b.maxX);
    var y = Math.max(a.minY, b.minY);
    var num2 = Math.min(a.maxY, b.maxY);
    if (num1 >= x && num2 >= y)
        return {minX: x, minY: y, maxX: num1, maxY:num2};
    else
        return false;
}

/**
 * Checks whether a rectangle is entirely contained inside another rectangle
 * @param {Array<number>} r1
 * @param {Array<number>} r2
 * @returns {boolean} whether r2 is entirely contained in r1
 */
export function rectangleContains(r1, r2) {
    var r1minX = r1[0];
    var r1minY = r1[1];
    var r1maxX = r1[2];
    var r1maxY = r1[3];

    var r2minX = r2[0];
    var r2minY = r2[1];
    var r2maxX = r2[2];
    var r2maxY = r2[3];

    return (r2minX >= r1minX && r2minX <= r1maxX &&
            r2maxX >= r1minX && r2maxX <= r1maxX &&
            r2minY >= r1minY && r2minY <= r1maxY &&
            r2maxY >= r1minY && r2maxY <= r1maxY);
}
