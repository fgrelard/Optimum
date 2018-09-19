import {halfLineIntersection, halfLineAndLineIntersection} from './lineintersection.js';

export default class Plane {
    constructor(center, normal) {
        this.center = center;
        this.normal = normal.slice();
    }

    isAbove(p) {
        if (this.center[0] === p[0] && this.center[1] === p[1])
            return true;
        var d = this.normal[0] * this.center[0] + this.normal[1] * this.center[1];
	    var valueToCheckForPlane = p[0] * this.normal[0] + p[1] * this.normal[1];
	    return (valueToCheckForPlane >= d);
    }

    isSectorAbove(arc, isComplementary = false, isLine = false) {
        var func = (isLine) ? halfLineIntersection : halfLineAndLineIntersection;
        var isPointAbove = this.isAbove(arc.center);
        if (isPointAbove) return true;

        if (!arc.fullGeometry) {
            arc.computeGeometry();
        }
        var f  = arc.center;
        var la = arc.fullGeometry[1].getFlatCoordinates();
        var lo = arc.fullGeometry[2].getFlatCoordinates();

        var basisVector = [-this.normal[1], this.normal[0]];
        if (isComplementary) {
            basisVector = [-basisVector[0], -basisVector[1]];
        }
        var fPlane = this.center;
        var lPlane = [this.center[0] + basisVector[0] * 5,
                      this.center[1] + basisVector[1] * 5];

        var i1 = func(f[0], f[1],
                      la[0], la[1],
                      fPlane[0], fPlane[1],
                      lPlane[0], lPlane[1]);
        var i2 = func(f[0], f[1],
                      lo[0], lo[1],
                      fPlane[0], fPlane[1],
                      lPlane[0], lPlane[1]);
        var isSectorAbove = i1 || i2;
        return !!isSectorAbove;
       //return this.isAbove(la) || this.isAbove(lo);
    }

    toString() {
        var cx = Math.round(this.center[0]).toString();
        var cy = Math.round(this.center[1]).toString();
        return "c=(" + cx.slice(0, cy.length) + "," + cy.slice(0, cy.length) +  "), v=(" + this.normal[0].toFixed(2) + "," + this.normal[1].toFixed(2) + ")";
    }

    equals(other) {
        return (this.center[0] === other.center[0] &&
                this.center[1] === other.center[1] &&
                this.normal[0] === other.normal[0] &&
                this.normal[1] === other.normal[1]);
    }
}
