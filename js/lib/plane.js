import {halfLineIntersection} from './lineintersection.js';

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

    isSectorAbove(arc) {
        var isPointAbove = this.isAbove(arc.center);
        // console.log(this);
        // console.log(arc);
        if (isPointAbove) return true;

        if (!arc.fullGeometry) {
            arc.computeGeometry();
        }
        var la = arc.fullGeometry[1].getFlatCoordinates();
        var lo = arc.fullGeometry[2].getFlatCoordinates();
        return this.isAbove(la) || this.isAbove(lo);
    }

    toString() {
        return "c=(" + this.center[0] + "," + this.center[1] +  "), v=(" + this.normal[0] + "," + this.normal[1] + ")";
    }
}
