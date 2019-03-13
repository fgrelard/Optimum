export function  angleToVector(angle) {
    var rad = angle * Math.PI / 180;
    var x = Math.cos(rad);
    var y = Math.sin(rad);
    return [x, y];
}

export function vectorToAngle(vector, vectorRef) {
    var dot = vectorRef[0]*vector[0] + vectorRef[1]*vector[1];
    var det = vectorRef[0]*vector[1] - vectorRef[1]*vector[0];
    var angle = Math.atan2(det, dot);
    return angle;
}


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

export function bboxArrayToObject(array, feature) {
    return {minX: array[0][0],
            minY: array[0][1],
            maxX: array[1][0],
            maxY: array[1][1],
            feature: feature
           };

}

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


export function project( p, a, b ) {
    var x1=a[0], y1=a[1], x2=b[0], y2=b[1], x3=p[0], y3=p[1];
    var px = x2-x1, py = y2-y1, dAB = px*px + py*py;
    var u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
    var x = x1 + u * px, y = y1 + u * py;
    return [x, y];
}


export function sphericalToCartesian(spherical) {
    var phi = spherical.phi;
    var theta = spherical.theta;
    return [
        spherical.norm * Math.sin(phi) * Math.cos(theta),
        spherical.norm * Math.sin(phi) * Math.sin(theta),
        spherical.norm * Math.cos(phi)
    ];

}


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
