import Arc from './arc';

/**
 * Random number between min and max
 * @param {} min
 * @param {} max
 * @returns {} the random number
 */
export function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Random features with position
 * @param {ol.Extent} extent map extent
 * @param {Number} count number of features
 * @returns {Array} array with positions
 */
export function addRandomLocations(extent, count) {
    var coordinates = [];
    for (var i = 0; i < count; i++) {
        var extx = extent[2] - extent[0];
        var exty = extent[3] - extent[1];
        var middlex = extent[0]+extx/2;
        var middley = extent[1]+exty/2;
        var factorx = extx / 3;
        var factory = exty / 3;
        var randomCoordinates = [getRandomArbitrary(middlex-factorx, middlex+factorx), getRandomArbitrary(middley-factory, middley+factory)];
        coordinates.push(randomCoordinates);
    }
    return coordinates;
}


/**
 * Add random arcs (angles) at given locations
 * @param {Array.<Array>} positions the locations
 * @returns {Array.<Arc>} arcs
 */
export function addRandomArcs(positions) {
    var arcs = [];
    for (var i = 0; i < positions.length; i++) {
        var coordinates = positions[i];
        var alpha = getRandomArbitrary(0,360);
        var omega = alpha + getRandomArbitrary(10,20);
        var radius = 100;
        var arc =  new Arc(coordinates, radius, alpha, omega);
        arc.computeGeometry();
        arcs.push(arc);
    }
    return arcs;
}
