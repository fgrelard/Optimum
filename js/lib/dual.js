/**
 * @fileOverview Affine dual
 * @name dual.js
 * @author Florent Grélard
 * @license
 */
import {angleToVector, boundingBox, bboxArrayToObject} from './geometry.js';

/** Class representing the affine dual transform
 */
export default class Dual {

    /**
     * Primal line to dual line
     * @param {Array<number>} vector coefficients
     * @param {Array<number>} center position
     * @param {Array<number>} g barycenter
     * @param {boolean=} vertical whether the line is vertical
     * @returns {Array<number>} the dual of the line, a point
     */
    static dualLine(vector, center, g, vertical = false) {
        var centerNorm = [center[0] - g[0],
                          center[1] - g[1]];
        var x =  (vertical) ? vector[0] / vector[1] : vector[1] / vector[0];
        var y = (vertical) ? centerNorm[0] - x * centerNorm[1] : centerNorm[1] - x * centerNorm[0];
        return [x, -y];
    }

    /**
     * Primal cone to dual cone
     * @param {Arc} arc
     * @param {Array<number>} g barycenter
     * @param {boolean=} vertical whether the line is vertical
     * @returns {Array<Array<number>>}  dual of a cone, a pair of coordinates
     */
    static dualCone(arc, g, vertical = false) {
        var dual = [];
        var firstVector = angleToVector(arc.alpha);
        var secondVector = angleToVector(arc.omega);
        var firstLine = this.dualLine(firstVector, arc.center, g, vertical);
        var secondLine = this.dualLine(secondVector, arc.center, g, vertical);

        var positions = [firstLine, secondLine];
        return positions;
    }

    /**
     * bounding dual rectangle of coordinates
     * @param {Arc} arc
     * @param {Array<number>} g barycenter
     * @param {boolean=} vertical whether the sector contains the vertical line
     * @returns {Array} the bounding box
     */
    static dualBoundingRectangle(arc, g, vertical = false) {
        var dualArc = this.dualCone(arc, g, vertical);
        var bbox = boundingBox(dualArc);
        var bboxCoordinates = bboxArrayToObject(bbox, arc);
        return [bboxCoordinates];
    }

    /**
     * Intersection between primal point and rectangle
     * @param {Array<number>} point request point
     * @param {Array} rectangle the bounding box
     * @returns {boolean} whether it intersects or not
     */
    static intersectionRequestRectangle(point, rectangle) {
        var a = point[0];
        var b = -point[1];
        var low = [rectangle.minX, rectangle.minY];
        var up = [rectangle.maxX, rectangle.maxY];

        var lowI = [(low[1] - b) / a, a * low[0] + b];
        var upI = [(up[1] - b) / a, a * up[0] + b];

        var condition = ((lowI[0] >= low[0] && lowI[0] <= up[0]) ||
                         (upI[0] >= low[0] && upI[0] <= up[0]) ||
                         (lowI[1] >= low[1] && lowI[1] <= up[1]) ||
                         (upI[1] >= low[1] && upI[1] <= up[1]));
        return condition;
    }
}
