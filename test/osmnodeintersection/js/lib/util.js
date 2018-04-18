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


export function addRandomArcs(positions) {
    var arcs = [];
    for (var i = 0; i < positions.length; i++) {
        var coordinates = positions[i];
        var alpha = getRandomArbitrary(0,360);
        var omega = alpha + getRandomArbitrary(10,40);
        var radius = getRandomArbitrary(100,150);
        var arc =  new Arc(coordinates, radius, alpha, omega);
        arc.computeGeometry();
        arcs.push(arc);
    }
    return arcs;
}

export function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function euclideanDistance(point1, point2) {
    return Math.sqrt(Math.pow((point1[0]-point2[0]), 2) + Math.pow((point1[1]-point2[1]), 2));
}
