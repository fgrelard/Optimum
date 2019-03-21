/**
 * @deprecated
 * @fileOverview Angular sector as two planes delimiting space used by {@link ASTreeSectors}
 * @name sector.js
 * @author Florent Grélard
 * @license
 */

import Plane from './plane';

/**
 * Angular sector as two planes delimiting space used by {@link ASTreeSectors}
 * @deprecated
 */
export default class Sector {

    /**
     * Constructor
     * @param {Array<number>} center center
     * @param {Array<number>} normal1 first plane normal
     * @param {Array<number>} normal2 second plane normal
     */
    constructor(center, normal1, normal2) {
        /**
         * First plane
         * @type {Plane}
         */
        this.firstPlane = new Plane(center, normal1);

        /**
         * Second plane
         * @type {Plane}
         */
        this.secondPlane = new Plane(center, normal2);
    }

    /**
     * Checks whether an angular sector is above this sector
     * @param {Arc} arc
     * @param {boolean=} isLine function to use for intersection
     * @returns {boolean} whether it is above this plane
     */
    isSectorAbove(arc, isLine = false) {
        return (this.firstPlane.isSectorAbove(arc, false, isLine) &&
                this.secondPlane.isSectorAbove(arc, false, isLine));
    }

    /**
     * Checks whether an angular sector is above the complementary of this sector
     * @param {Arc} arc
     * @param {boolean=} isLine function to use for intersection
     * @returns {boolean=} whether it is above this complementary
     */
    isSectorAboveComplementary(arc, isLine = false) {
        return (this.firstPlane.isSectorAbove(arc, false, isLine) ||
                this.secondPlane.isSectorAbove(arc, false, isLine));
    }


    /**
     * Checks whether a point is above this sector
     * @param {Array<number>} p
     * @returns {boolean} whether p is above this sector
     */
    isAbove(p) {
        return (this.firstPlane.isAbove(p) &&
                this.secondPlane.isAbove(p));
    }

    /**
     * Checks whether two sectors are the same
     * @param {Sector} other
     * @returns {boolean} whether the sectors are the same
     */
    equals(other) {
        return (this.firstPlane.equals(other.firstPlane) &&
                this.secondPlane.equals(other.secondPlane));
    }

    /**
     * Checks whether two sectors have the same center
     * @param {Sector} other
     * @returns {boolean} whether they have the same center
     */
    sameCenter(other) {
        return (this.firstPlane.center[0] === other.firstPlane.center[0] &&
                this.firstPlane.center[1] === other.firstPlane.center[1]);
    }

    /**
     * Utility function to display the sector in the console
     * @returns {string} sector as a string
     */
    toString() {
        return this.firstPlane + "\n" + this.secondPlane;
    }
}
