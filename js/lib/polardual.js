import Dual from './dual.js';
import {project} from './geometry.js';
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
        }
        else {
            theta = Math.acos((projection[0] - g[0]) / rho);
        }
        theta = (projection[1] - g[1] < 0) ? Math.PI-theta : theta;
        return [theta, rho];
    }


    static dualCone(arc, g, vertical = false) {
        return super.dualCone(arc, g, vertical);
    }

    static intersectionRequestRectangle(point, rectangle) {
        var a = point[0];
        var b = point[1];
        var low = [rectangle.minX, rectangle.minY];
        var up = [rectangle.maxX, rectangle.maxY];

        var R = Math.sqrt(a*a + b*b);
        var alphaC = Math.atan(b / a);
        if (alphaC < 0) {
            alphaC = Math.PI + alphaC;
        }
        //console.log(alphaC);
        // console.log(alphaC);
        return (alphaC >= rectangle.minX && alphaC <= rectangle.maxX);
        var rho = (x) => a * Math.cos(x) + b * Math.sin(x);
        var theta = (y) => (Math.acos(Math.abs(y) % Math.PI / R) + alphaC) % Math.PI;
        var thetaRange = (y) => (theta(y) > rectangle.maxX) ? theta(y) - Math.PI : ((theta(y) < rectangle.minX) ? theta(y) + Math.PI : theta(y));

        var lowI = [theta(low[1]), rho(low[0])];
        var upI = [theta(up[1]), rho(up[0])];

        var condition = (// (lowI[0] - Math.PI >= low[0] && lowI[0] - Math.PI<= up[0]) ||
            // (upI[0] - Math.PI >= low[0] && upI[0] - Math.PI <= up[0]) ||
            // (lowI[0] + Math.PI >= low[0] && lowI[0] + Math.PI<= up[0]) ||
            // (upI[0] + Math.PI >= low[0] && upI[0] + Math.PI <= up[0]) ||
            (lowI[0] >= low[0] && lowI[0] <= up[0]) ||
                (upI[0] >= low[0] && upI[0] <= up[0]) ||
                (lowI[1] >= low[1] && lowI[1] <= up[1]) ||
                (upI[1] >= low[1] && upI[1] <= up[1]));
        return condition;
    }
}
