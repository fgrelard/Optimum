/**
 * @fileOverview Allows to create an arc, also called angular sectors
 * @name arc.js
 * @author Florent Grelard
 * @license
 */

import Polygon from 'ol/geom/Polygon.js';
import Point from 'ol/geom/Point.js';
import LineString from 'ol/geom/LineString.js';
import {angleToVector, vectorToAngle} from './geometry.js';
import {euclideanDistance} from './distance.js';

/** Class representing an arc, or circular sectors */
export default class Arc {

    /**
     * Creates an arc, or "circular sector" (a line string with n segments)
     * @param {Array.<number>} center starting position of the arc
     * @param {number} radius the radius
     * @param {number} alpha starting angle in degrees (0-360)
     * @param {number} omega end angle in degrees
     * @param {number} aspectRatio ratio image width-height
     */
    constructor(center, radius, alpha, omega, aspectRatio = 1.5) {
        /**
         * apex of the arc
         * @type {Array<number>}
         * @public
         */
        this.center = center;

        /**
         * radius of the arc
         * @type {number}
         * @public
         */
        this.radius = radius;

        /**
         * starting angle in degrees
         * @type {number}
         * @public
         */
        this.alpha = alpha;

        /**
         * end angle in degrees
         * @type {number}
         * @public
         */
        this.omega = omega;

        /**
         * ratio width/height of the image from which the arc is computed
         * @type {number}
         * @public
         */
        this.aspectRatio = aspectRatio;

        /**
         * geometry of the Arc,
         * it is computed thanks to the {@link computeGeometry} method
         * @type {ol.geom.Polygon}
         * @public
         */
        this.geometry = null;

        /**
         * geometry of the Arc: contains also end points,
         * it is computed thanks to the {@link computeGeometry} method
         * @type {Array<ol.geom.Polygon>}
         * @public
         */
        this.fullGeometry = null;


    }

    /**
     * Computes the geometry and assigns it to the geometry attribute of this class
     */
    computeGeometry() {
        var pointList=[];
        var segments = 100;
        pointList.push(this.center);
        var dAngle= segments+1;
        for(var i=0;i<dAngle;i++)
        {
            var Angle = this.alpha - (this.alpha-this.omega)*i/(dAngle-1);
            var x = this.center[0] + this.radius*Math.cos(Angle*Math.PI/180);
            var y = this.center[1] + this.radius*Math.sin(Angle*Math.PI/180);
            var point = [x, y];
            if (this.center.length > 2) {
                var fovV = (this.omega - this.alpha) * Math.PI / 180;
                var fovH = 2 * Math.atan(Math.tan(fovV/2.0)/this.aspectRatio);
                var z = this.center[2] + (this.radius * Math.tan(fovH));
                point.push(z);
            }
            pointList.push(point);
        }
        pointList.push(this.center);
        var ftArc = new Polygon([pointList]);
        var ftArcPt0 = new Point(pointList[1]);
        var ftArcPt1 = new Point(pointList[pointList.length-2]);
        var ftArcSehne = new LineString([pointList[1], pointList[pointList.length-2]]);

        var arrArc = [ftArc, ftArcPt0, ftArcPt1, ftArcSehne];
        this.fullGeometry = arrArc;
        this.geometry = ftArc;
    }

    /**
     * Checks the intersection between the arc and a point
     * @param {Array.<number>} p
     * @returns {Boolean} whether it intersects
     */
    intersects(p) {
        var norm = euclideanDistance(p, this.center);
        var vectorP = [(p[0] - this.center[0]) / norm,
                       (p[1] - this.center[1]) / norm];

        var angle = vectorToAngle(vectorP, [1, 0]) * 180 / Math.PI;
        if (angle < 0) {
            angle += 360;
        }
        return ((angle >= this.alpha && angle <= this.omega) ||
                (angle - 360 >= this.alpha && angle -360 <= this.omega));
    }

    /**
     * Checks whether other is the same arc as this one
     * @param {Arc} other other arc
     * @returns {Boolean} whether it is the same or not
     */
    equals(other) {
        var same_center = (this.center.length == other.center.length) && this.center.every(function(element, index) {
            return element === other.center[index];
        });
        return (same_center &&
                this.alpha === other.alpha &&
                this.omega === other.omega);
    }
}
