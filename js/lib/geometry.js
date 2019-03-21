/**
 * @fileOverview Various geometry functions useful
 * @name geometry.js
 * @author Florent Grélard
 * @license
 */
import * as THREE from 'three';

/**
 * Converts an angle in degrees to a 2D vector
 * @param {number} angle
 * @returns {Array} the 2D vector
 */
export function  angleToVector(angle) {
    var rad = angle * Math.PI / 180;
    var x = Math.cos(rad);
    var y = Math.sin(rad);
    return [x, y];
}

/**
 * Converts a 2D vector to an angle in degrees
 * @param {Array} vector
 * @param {Array} vectorRef axis
 * @returns {number} angle in radians
 */
export function vectorToAngle(vector, vectorRef) {
    var dot = vectorRef[0]*vector[0] + vectorRef[1]*vector[1];
    var det = vectorRef[0]*vector[1] - vectorRef[1]*vector[0];
    var angle = Math.atan2(det, dot);
    return angle;
}


/**
 * Bounding box of positions
 * @param {Array} positions
 * @returns {Array} bounding box
 */
export function boundingBox(positions) {
    var low = [Number.MAX_VALUE, Number.MAX_VALUE];
    var up = [-Number.MAX_VALUE, -Number.MAX_VALUE];
    for (var i = 0; i < positions.length; i++) {
        var position = positions[i];
        for (let j = 0; j < 2; j++) {
            low[j] = (position[j] < low[j]) ? position[j] : low[j];
            up[j] = (position[j] > up[j]) ? position[j] : up[j];
        }
    }
    return [low, up];
}

/**
 * Bounding box as an object
 * @param {Array} array
 * @param {Object} feature a reference to the original object, useful to keep track of it in a R-tree for instance
 * @returns {Object} the bounding box
 */
export function bboxArrayToObject(array, feature) {
    return {minX: array[0][0],
            minY: array[0][1],
            maxX: array[1][0],
            maxY: array[1][1],
            feature: feature
           };

}

/**
 * Barycenter
 * @param {Array} positions
 * @returns {Array} barycenter
 */
export function centerOfMass(positions) {
    var g = [0,0];
    for (var p of positions) {
        g[0] += p[0];
        g[1] += p[1];
    }
    g[0] /= positions.length;
    g[1] /= positions.length;
    return g;
}


/**
 * Orthogonal projection of a point onto a segment [a,b]
 * @param {Array} p
 * @param {Array} a
 * @param {Array} b
 * @returns {Array} the projection
 */
export function project( p, a, b ) {
    var x1=a[0], y1=a[1], x2=b[0], y2=b[1], x3=p[0], y3=p[1];
    var px = x2-x1, py = y2-y1, dAB = px*px + py*py;
    var u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
    var x = x1 + u * px, y = y1 + u * py;
    return [x, y];
}


/**
 * Converts spherical coordinates to cartesian
 * @param {Object} spherical
 * @returns {Array} cartesian coordinates
 */
export function sphericalToCartesian(spherical) {
    var phi = spherical.phi;
    var theta = spherical.theta;
    return [
        spherical.norm * Math.sin(phi) * Math.cos(theta),
        spherical.norm * Math.sin(phi) * Math.sin(theta),
        spherical.norm * Math.cos(phi)
    ];

}


/**
 * Converts cartesian coordinates to spherical
 * @param {Array} coord
 * @returns {Object} sphericals
 */
export function cartesianToSpherical( coord ) {
    var x = coord[0];
    var y = coord[1];
    var z = coord[2];
    var radius = Math.sqrt( x * x + y * y + z * z );
    var theta = 0;
    var phi = 0;
	if ( radius !== 0 ) {
        theta = Math.atan2( y, x );
        var clampedRatio = Math.min(Math.max((z/radius), -1), 1);
		phi = Math.acos( clampedRatio );
    }
	return {theta: theta, phi: phi, norm: radius};
}


/**
 * Computes the plane given 3 points
 * @param {Array} p1
 * @param {Array} p2
 * @param {Array} p3
 * @returns {THREE.Plane}
 */
export function planeFromThreePoints(p1, p2, p3) {
    var plane = new THREE.Plane();
    plane.setFromCoplanarPoints(new THREE.Vector3(p1[0], p1[1], p1[2]),
                                new THREE.Vector3(p2[0], p2[1], p2[2]),
                                new THREE.Vector3(p3[0], p3[1], p3[2]));
    return plane;
}

/**
 * Intersection
 * @param {Array} point
 * @param {THREE.Plane} plane
 * @returns {THREE.Vector3|Boolean} the intersection
 */
export function intersectionLinePlane(point, plane) {
    var v1 = new THREE.Vector3(point[0], point[1], point[2]);
    v1 = v1.normalize();
    var line = new THREE.Line3(new THREE.Vector3(0,0,0), v1.multiplyScalar(10000));
    var target = new THREE.Vector3();
    var intersects = plane.intersectLine(line, target);
    if (intersects)
        return target;
    return intersects;
}
