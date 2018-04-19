/**
 * Computes the euclidean distance between two points
 * @param {Array} point1
 * @param {Array} point2
 * @returns {Number} the euclidean distance between point 1 and point 2
 */
export function euclideanDistance(point1, point2) {
    return Math.sqrt(Math.pow((point1[0]-point2[0]), 2) + Math.pow((point1[1]-point2[1]), 2));
}
