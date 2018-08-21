import bigdecimal from 'bigdecimal';

export var epsilon = 0.000001;

export function setEpsilon(eps) {
    epsilon = eps;
}

/**
 * Checks if coordinates are on a line
 * @param {Number} a lower bound
 * @param {Number} b value to check
 * @param {Number} c upper bound
 * @returns {Boolean} Between coordinates
 */
function between(a, b, c) {
    return a-epsilon <= b && b <= c+epsilon;
}

function averageDiff(a, b, c) {
    return (Math.abs(a - b) + Math.abs(c - b)) / 2;
}


/**
 * Intersection segment
 * @param {} x1 First segment first point x
 * @param {} y1 First segment first point y
 * @param {} x2 First segment second point x
 * @param {} y2 First segment second point y
 * @param {} x3 Second segment first point x
 * @param {} y3 Second segment first point y
 * @param {} x4 Second segment second point x
 * @param {} y4 Second segment second point y
 * @returns {} the intersection, if it exists
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
 * @param {} x1 First segment first point x
 * @param {} y1 First segment first point y
 * @param {} x2 First segment second point x
 * @param {} y2 First segment second point y
 * @param {} x3 Second segment first point x
 * @param {} y3 Second segment first point y
 * @param {} x4 Second segment second point x
 * @param {} y4 Second segment second point y
 * @returns {} the intersection, if it exists
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
 * Intersection half line
 * @param {} x1 First segment first point x
 * @param {} y1 First segment first point y
 * @param {} x2 First segment second point x
 * @param {} y2 First segment second point y
 * @param {} x3 Second segment first point x
 * @param {} y3 Second segment first point y
 * @param {} x4 Second segment second point x
 * @param {} y4 Second segment second point y
 * @returns {} the intersection, if it exists
 */
export function halfLineIntersection(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
        ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
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
    }
    return {x: x,y: y};
}

/**
 * Intersection line
 * @param {} x1 First segment first point x
 * @param {} y1 First segment first point y
 * @param {} x2 First segment second point x
 * @param {} y2 First segment second point y
 * @param {} x3 Second segment first point x
 * @param {} y3 Second segment first point y
 * @param {} x4 Second segment second point x
 * @param {} y4 Second segment second point y
 * @returns {} the intersection, if it exists
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
 * Helper function to check if there is intersection between two segments represented as linestring objects
 * @param {} s1 first linestring segment
 * @param {} s2 second linestring segment
 * @returns {} the intersection, if it exists
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
 * @param {} s1 first linestring half lines
 * @param {} s2 second linestring half lines
 * @returns {} the intersection, if it exists
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


export function segmentsEqual(s1, s2) {
    return (s1.getFirstCoordinate()[0] === s2.getFirstCoordinate()[0] &&
            s1.getFirstCoordinate()[1] === s2.getFirstCoordinate()[1] &&
            s1.getLastCoordinate()[0] === s2.getLastCoordinate()[0] &&
            s1.getLastCoordinate()[1] === s2.getLastCoordinate()[1]);
}
