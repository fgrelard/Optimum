import Plane from './plane';

export default class Sector {
    constructor(center, normal1, normal2) {
        this.firstPlane = new Plane(center, normal1);
        this.secondPlane = new Plane(center, normal2);
    }

    isSectorAbove(arc, isLine = false) {
        return (this.firstPlane.isSectorAbove(arc, false, isLine) &&
                this.secondPlane.isSectorAbove(arc, false, isLine));
    }

    isSectorAboveComplementary(arc, isLine = false) {
        return (this.firstPlane.isSectorAbove(arc, false, isLine) ||
                this.secondPlane.isSectorAbove(arc, false, isLine));
    }


    isAbove(p) {
        return (this.firstPlane.isAbove(p) &&
                this.secondPlane.isAbove(p));
    }

    equals(other) {
        return (this.firstPlane.equals(other.firstPlane) &&
                this.secondPlane.equals(other.secondPlane));
    }

    sameCenter(other) {
        return (this.firstPlane.center[0] === other.firstPlane.center[0] &&
                this.firstPlane.center[1] === other.firstPlane.center[1]);
    }

    toString() {
        return this.firstPlane + "\n" + this.secondPlane;
    }
}
