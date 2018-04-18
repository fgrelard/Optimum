var eps = 0;

/**
 * Checks if coordinates are on a line
 * @param {Number} a lower bound
 * @param {Number} b value to check
 * @param {Number} c upper bound
 * @returns {Boolean} Between coordinates
 */
function between(a, b, c) {
    return a-eps <= b && b <= c+eps;
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
    return {x: x, y: y};
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