/**
 * @fileOverview Cluster for pictures
 * @name cluster.js
 * @author Florent Grélard
 * @license
 */
import Picture from './picture';

/** Base class which allows to cluster pictures */
export default class Cluster {
    /**
     * Constructor
     * @param {Array.<Picture>} pictures
     * @param {String} label
     */
    constructor(pictures, label) {
        /**
         * pictures pertaining to this cluster
         * @type {Array.<Picture>}
         */
        this.pictures = pictures;

        /**
         * a label characterizing this cluster
         * @type {string|number}
         */
        this.label = label;
    }

    /**
     * Checks whether a picture is inside this cluster
     * @param {Picture} picture
     * @returns {Boolean} true if picture inside cluster, false else
     */
    hasPicture(picture) {
        for (var keyP in this.pictures) {
            var filename = this.pictures[keyP].getProperties().filename;
            if (filename === picture.filename)
                return true;
        }
        return false;
    }
}
