/**
 * Computes the euclidean distance between two points
 * @param {Array} point1
 * @param {Array} point2
 * @returns {Number} the euclidean distance between point 1 and point 2
 */
export function euclideanDistance(point1, point2) {
    var sumDiffSq = 0;
    for (var i = 0; i < point1.length; i++) {
        sumDiffSq += Math.pow((point1[i] - point2[i]), 2);
    }
    return Math.sqrt(sumDiffSq);
}
