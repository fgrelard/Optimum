import Dual from './dual.js';
import {project, boundingBox} from './geometry.js';
import {euclideanDistance} from './distance.js';

export default class PolarDual extends Dual {

    static dualLine(vector, center, g, vertical = false) {
        var secondPoint = [center[0] + vector[0]*5,
                           center[1] + vector[1]*5];
        var projection = project(g, center, secondPoint);
        var rho = euclideanDistance(projection, g);
        if (center[0] === g[0] && center[1] === g[1]) {
            rho = euclideanDistance(vector, g);
            var theta = Math.acos((vector[0] - g[0]) / rho);
            rho = 0;
        }
        else {
            theta = Math.acos((projection[0] - g[0]) / rho);
        }
        theta = (projection[1] - g[1] < 0) ? Math.PI-theta : theta;
        rho = (projection[1] - g[1] < 0) ? -rho : rho;
        return [theta, rho];
    }


    static dualCone(arc, g, vertical = false) {
        return super.dualCone(arc, g, vertical);
    }

    static dualBoundingRectangle(arc, g, vertical = false) {
        var dualArc = this.dualCone(arc, g, vertical);
        var bbox = boundingBox(dualArc);
        var minX = bbox[0][0];
        var minY = bbox[0][1];
        var maxX = bbox[1][0];
        var maxY = bbox[1][1];
        // var coord = [arc.center[0] - g[0],
        //              arc.center[1] - g[1]];
        // var max = Math.sqrt(Math.pow(coord[0], 2) +
        //                     Math.pow(coord[1], 2));
        // var theta = Math.atan(coord[1] / coord[0]);
        // if (theta < 0) {
        //     theta += Math.PI;
        // }
        // if (theta >= minX && theta <= maxX) {
        //     var rho = coord[0] * Math.cos(theta) + coord[1] * Math.sin(theta);
        //     if (rho < minY) {
        //         minY = rho;
        //     }
        //     if (rho > maxX) {
        //         maxY = rho;
        //     }
        // }
        var bboxCoordinates = {minX: minX,
                               minY: minY,
                               maxX: maxX,
                               maxY: maxY,
                               feature: arc};
        return bboxCoordinates;
    }

    static intersectionRequestRectangle(point, rectangle) {
        var a = point[0];
        var b = point[1];


        var low = [rectangle.minX, rectangle.minY];
        var up = [rectangle.maxX, rectangle.maxY];

        var R = Math.sqrt(a*a + b*b);
        var alphaC = Math.atan(b / a);
        if (alphaC < 0) {
            alphaC += Math.PI;
        }

        var rho = (x) => a * Math.cos(x) + b * Math.sin(x);
        var theta = (y) => (Math.acos(y / R) + alphaC) % (Math.PI);
        var thetaRange = (y) => (theta(y) > rectangle.maxX) ? theta(y) - Math.PI : ((theta(y) < rectangle.minX) ? theta(y) + Math.PI : theta(y));

        // var rhom = rho(rectangle.minX);
        // var rhoM = rho(rectangle.maxX);
        // var rhoMiddle = rho(rectangle.minX + 0.01);

        // if (rhoMiddle < rhom) {
        //     R = -R;
        // }
        // var m = rectangle.minY;
        // var M = rectangle.maxY;

        // for (var i = rectangle.minX; i < rectangle.maxX; i+=0.00001) {
        //     var rhoI = rho(i);
        //     if (rhoI >= m && rhoI <= M) {
        //         return true;
        //     }
        // }
        // return false;

        // return !((rhom > M && rhoM > M // && R > M
        //           && rhom > m && rhom > m // && R > m
        //          ) ||
        //          (rhom < m && rhoM < m // && R < m
        //           && rhom < M && rhom < M // && R < M
        //          ));
        var lowI = [theta(low[1]), rho(low[0])];
        var upI = [theta(up[1]), rho(up[0])];


        var condition = (
            (lowI[0] >= low[0] && lowI[0] <= up[0]) ||
                (upI[0] >= low[0] && upI[0] <= up[0]) ||
                (lowI[1] >= low[1] && lowI[1] <= up[1]) ||
                (upI[1] >= low[1] && upI[1] <= up[1]));
        return condition;
    }
}
