import Dual from './dual.js';
import {project, boundingBox, bboxArrayToObject} from './geometry.js';
import {euclideanDistance} from './distance.js';

export default class PolarDual extends Dual {

    static dualLine(vector, center, g, vertical = false) {
        var secondPoint = [center[0] + vector[0]*5,
                           center[1] + vector[1]*5];
        var projection = project(g, center, secondPoint);
        var rho = euclideanDistance(projection, g);
        rho = (projection[1] - g[1] < 0) ? -rho : rho;
        if (center[0] === g[0] && center[1] === g[1]) {
            rho = euclideanDistance(vector, g);
            var theta = Math.acos((vector[0] - g[0]) / rho);
            rho = 0;
        }
        else {
            theta = Math.acos((projection[0] - g[0]) / rho);
        }
        return [theta, rho];
    }


    static dualCone(arc, g, vertical = false) {
        var cone = super.dualCone(arc, g, vertical);
        var x0 = cone[0][0];
        var x1 = cone[1][0];
        //For vertical lines
        // if (x0 > x1) {
        //     cone[1][0] = Math.PI + x1;
        // }
        return cone;
    }

    static dualBoundingRectangle(arc, g, vertical = false) {
        var dualArc = this.dualCone(arc, g, vertical);
        var bbox = boundingBox(dualArc);
        var minX = bbox[0][0];
        var minY = bbox[0][1];
        var maxX = bbox[1][0];
        var maxY = bbox[1][1];

        //Finding local maximum
        var coord = [arc.center[0] - g[0],
                     arc.center[1] - g[1]];
        var max = Math.sqrt(Math.pow(coord[0], 2) +
                            Math.pow(coord[1], 2));
        var theta = Math.atan(coord[1] / coord[0]);
        if (theta < 0) {
            theta += Math.PI;
        }
        if (theta >= minX && theta <= maxX) {
            var rho = coord[0] * Math.cos(theta) + coord[1] * Math.sin(theta);
            if (rho < minY) {
                minY = rho;
            }
            if (rho > maxY) {
                maxY = rho;
            }
        }
        var bboxCoordinates = bboxArrayToObject(boundingBox([[minX, minY], [maxX, maxY]]), arc);

        //For vertical lines : two bounding rectangles
        if (arc.omega%180 > 90 && arc.alpha%180 < 90) {
            var first = dualArc[1];
            var second = dualArc[0];
            var rho1 = coord[0] * Math.cos(0) + coord[1] * Math.sin(0);
            var rho2 = coord[0] * Math.cos(Math.PI) + coord[1] * Math.sin(1);
            var bbox1 = boundingBox([[0, rho1], first]);
            var bbox2 = boundingBox([second, [Math.PI, rho2]]);

            var bboxCoordinates1 = bboxArrayToObject(bbox1, arc);
            var bboxCoordinates2 = bboxArrayToObject(bbox2, arc);
            console.log(arc.omega + " " + arc.alpha);
            return [bboxCoordinates1, bboxCoordinates2];

        }
        else {
            return [bboxCoordinates];
        }
    }

    static intersectionRequestRectangle(point, rectangle) {
        var a = point[0];
        var b = point[1];
        var rho = (x) => a * Math.cos(x) + b * Math.sin(x);
        var theta = (y, shift) => (a < 0) ? Math.acos(-y / R) + shift : Math.acos(y / R) + shift;
        var thetaCounterClockwise = (y, shift) => (a < 0) ? -Math.acos(-y / R) + shift : -Math.acos(y / R) + shift;
        var between = (a, b, c) => (b >= a && b <= c);
        var low = [rectangle.minX, rectangle.minY];
        var up = [rectangle.maxX, rectangle.maxY];

        var R = Math.sqrt(a*a + b*b);
        var alpha = Math.atan(b / a);
        var alphaN = alpha + 2 * Math.PI;

        var lowI = [theta(low[1]), rho(low[0])];
        var upI = [theta(up[1]), rho(up[0])];
        var thetaLPS = theta(low[1], alpha);
        var thetaLNS = theta(low[1], alphaN);
        var thetaLPC = thetaCounterClockwise(low[1], alpha);
        var thetaLNC = thetaCounterClockwise(low[1], alphaN);
        var thetaUPS = theta(up[1], alpha);
        var thetaUNS = theta(up[1], alphaN);
        var thetaUPC = thetaCounterClockwise(up[1], alpha);
        var thetaUNC = thetaCounterClockwise(up[1], alphaN);
        var condition = (between(low[0], thetaLPS, up[0]) ||
                         between(low[0], thetaLNS, up[0]) ||
                         between(low[0], thetaLPC, up[0]) ||
                         between(low[0], thetaLNC, up[0]) ||
                         between(low[0], thetaUPS, up[0]) ||
                         between(low[0], thetaUNS, up[0]) ||
                         between(low[0], thetaUPC, up[0]) ||
                         between(low[0], thetaUNC, up[0]) ||
                         between(low[1], lowI[1], up[1]) ||
                         between(low[1], upI[1], up[1]));
        return condition;
    }
}
