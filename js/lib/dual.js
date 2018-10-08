import {angleToVector, boundingBox} from './geometry.js';

export default class Dual {

    static dualLine(vector, center, g, vertical = false) {
        var centerNorm = [center[0] - g[0],
                          center[1] - g[1]];
        var x =  (vertical) ? vector[0] / vector[1] : vector[1] / vector[0];
        var y = (vertical) ? centerNorm[0] - x * centerNorm[1] : centerNorm[1] - x * centerNorm[0];
        return [x, -y];
    }

    static dualCone(arc, g, vertical = false) {
        var dual = [];
        var firstVector = angleToVector(arc.alpha);
        var secondVector = angleToVector(arc.omega);
        var firstLine = this.dualLine(firstVector, arc.center, g, vertical);
        var secondLine = this.dualLine(secondVector, arc.center, g, vertical);

        var positions = [firstLine, secondLine];
        return positions;
    }

    static dualBoundingRectangle(arc, g, vertical = false) {
        var dualArc = this.dualCone(arc, g, vertical);
        var bbox = boundingBox(dualArc);
        var bboxCoordinates = {minX: bbox[0][0],
                               minY: bbox[0][1],
                               maxX: bbox[1][0],
                               maxY: bbox[1][1],
                               feature: arc};
        return bboxCoordinates;
    }

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
