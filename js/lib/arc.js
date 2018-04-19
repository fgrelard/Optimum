/**
 * @fileOverview Allows to create an arc or circular sector
 * @name arc.js
 * @author Florent Grelard
 * @license
 */

import Polygon from 'ol/geom/polygon.js';
import Point from 'ol/geom/point.js';
import LineString from 'ol/geom/linestring.js';


export default class Arc {

    /**
     * Creates an arc, or "circular sector" (a line string with n segments)
     * Note : geometry attribute is not initialized here, use computeGeometry() to initialize it
     * @param {} center starting position of the arc
     * @param {} radius
     * @param {} alpha starting angle in degrees (0-360)
     * @param {} omega end angle in degrees
     */
    constructor(center, radius, alpha, omega) {
        this.center = center;
        this.radius = radius;
        this.alpha = alpha;
        this.omega = omega;
        this.geometry = null;
    }

    /**
     * Computes the geometry and assigns it to the geometry attribute of this class
     * this.geometry is an array with four features: arc (linestring), arc extremity 1 (point), arc extremity 2 (point), chord (linestring)
     */
    computeGeometry() {
        var pointList=[];
        var segments = 100;

        pointList.push([this.center[0], this.center[1]]);
        var dAngle= segments+1;
        for(var i=0;i<dAngle;i++)
        {
            var Angle = this.alpha - (this.alpha-this.omega)*i/(dAngle-1);
            var x = this.center[0] + this.radius*Math.cos(Angle*Math.PI/180);
            var y = this.center[1] + this.radius*Math.sin(Angle*Math.PI/180);

            var point = [x, y];
            pointList.push(point);
        }

        pointList.push([this.center[0], this.center[1]]);

        var ftArc = new Polygon([pointList]);
        var arrArc = [ftArc];
        var ftArcPt0 = new Point(pointList[1]);
        var ftArcPt1 = new Point(pointList[pointList.length-2]);
        var ftArcSehne = new LineString([pointList[1], pointList[pointList.length-2]]);

        arrArc = [ftArc, ftArcPt0, ftArcPt1, ftArcSehne];
        this.geometry = arrArc;
    }
}
