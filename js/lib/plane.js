/**
 * @fileOverview Class representing a 2D plane
 * @name plane.js
 * @author Florent Grélard
 * @license
 */
import {halfLineIntersection, halfLineAndLineIntersection} from './lineintersection.js';

/**
 * Class representing a 2D plane
 */
export default class Plane {

    /**
     * Constructor
     * @param {Array<number>} center
     * @param {Array<number>} normal
     */
    constructor(center, normal) {
        /**
         * Plane center
         * @type {Array<number>}
         */
        this.center = center;

        /**
         * Plane normal
         * @type {Array<number>}
         */
        this.normal = normal.slice();
    }

    /**
     * Checks whether a point is above the plane
     * @param {Array<number>} p the point
     * @returns {boolean} whether p is above this plane
     */
    isAbove(p) {
        if (this.center[0] === p[0] && this.center[1] === p[1])
            return true;
        var d = this.normal[0] * this.center[0] + this.normal[1] * this.center[1];
	    var valueToCheckForPlane = p[0] * this.normal[0] + p[1] * this.normal[1];
	    return (valueToCheckForPlane >= d);
    }

    /**
     * Checks whether a sector is above the plane (that is to say it does not intersect the plane)
     * @param {Arc} arc the sector
     * @param {boolean=} isComplementary whether the plane is a complementary
     * @param {boolean=} isHalfLine function used for intersection
     * @returns {boolean}  whether the sector is above this plane
     */
    isSectorAbove(arc, isComplementary = false, isHalfLine = false) {
        var func = (isHalfLine) ? halfLineIntersection : halfLineAndLineIntersection;
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

    /**
     * Utility function to display the plane in the console
     * @returns {string} plane as a string
     */
    toString() {
        var cx = Math.round(this.center[0]).toString();
        var cy = Math.round(this.center[1]).toString();
        return "c=(" + cx.slice(0, cy.length) + "," + cy.slice(0, cy.length) +  "), v=(" + this.normal[0].toFixed(2) + "," + this.normal[1].toFixed(2) + ")";
    }

    /**
     * Checks whether two planes are the same
     * @param {Plane} other other plane
     * @returns {boolean} whether this plane and the other plane are the same
     */
    equals(other) {
        return (this.center[0] === other.center[0] &&
                this.center[1] === other.center[1] &&
                this.normal[0] === other.normal[0] &&
                this.normal[1] === other.normal[1]);
    }
}
