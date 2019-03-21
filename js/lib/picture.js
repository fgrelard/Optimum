/**
 * @fileOverview Base class to represent a picture/photograph (metadata, isovist and image)
 * @name picture.js
 * @author Florent Grélard
 * @license
 */

import Point from 'ol/geom/Point';
import IsoVist from './isovistsectors2d';

/**
 * Base class to represent a picture/photograph (metadata, isovist and image)
 */
export default class Picture {

    /**
     * Constructor
     * @param {string} filename the path to the picture in the database
     * @param {Array<number>} position location of the picture
     * @param {Arc} arc the visibility cone
     */
    constructor(filename, position, arc) {
        /**
         * The path to the picture in the database
         * @type {string}
         */
        this.filename = filename;

        /**
         * Location of the picture
         * @type {Array<number>}
         */
        this.position = position;

        /**
         * Visibility cone
         * @type {Arc}
         */
        this.arc = arc;

        /**
         * Geometry used to display a picture automatically by OpenLayers
         * @type {ol.geom.Point}
         */
        this.geometry = new Point(position);

        /**
         * Whether this picture is selected (on click)
         * @type {boolean}
         */
        this.selected = false;

        /**
         * Isovist
         * @type {ol.geom.Polygon|Array<ol.geom.LineString>}
         */
        this.isovist = null;

        /**
         * Whether this picture visualizes a request area on the map
         * @type {boolean}
         */
        this.visualizesInput = false;
    }
}
