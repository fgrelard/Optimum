import {halfLineIntersection} from './lineintersection.js';

export default class Plane {
    constructor(center, normal) {
        this.center = center;
        this.normal = normal;
    }

    isAbove(p) {
        var d = this.normal[0] * this.center[0] + this.normal[1] * this.center[1];
	    var valueToCheckForPlane = p[0] * this.normal[0] + p[1] * this.normal[1];
	    return (valueToCheckForPlane >= d);
    }

    isSectorAbove(arc) {
        var isPointAbove = this.isAbove(arc.center);
        if (isPointAbove) return true;

        if (!arc.fullGeometry) {
            arc.computeGeometry();
        }
        var f = arc.center;
        var la = arc.fullGeometry[1].getFlatCoordinates();
        var lo = arc.fullGeometry[2].getFlatCoordinates();

        var basisVector = [-this.normal[1], this.normal[0]];
        var fPlane = this.center;
        var lPlane = [this.center[0] + basisVector[0] * 5,
                      this.center[1] + basisVector[1] * 5];

        var i1 = halfLineIntersection(f[0], f[1],
                                      la[0], la[1],
                                      fPlane[0], fPlane[1],
                                      lPlane[0], lPlane[1]);
        var i2 = halfLineIntersection(f[0], f[1],
                                      la[0], la[1],
                                      fPlane[0], fPlane[1],
                                      lPlane[0], lPlane[1]);
        var isSectorAbove = i1 || i2;
        return !!isSectorAbove;
    }

    toString() {
        return "c=(" + this.center[0] + "," + this.center[1] +  "), v=(" + this.normal[0] + "," + this.normal[1] + ")";
    }
}
