/**
 * @fileOverview Isovist computation inspired from Suleiman et al, A New Algorithm for 3D Isovists.
 * Space is delimited by a set of polygons, and visibility can be determined by spherical coordinates associated with these segments
 * @name isovistsectors3d.js
 * @author Florent Grélard
 * @license
 */

import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import MultiPolygon from 'ol/geom/MultiPolygon';
import LinearRing from 'ol/geom/LinearRing';
import * as Intersection from './lineintersection';
import {euclideanDistance} from './distance';
import {boundingExtent, containsExtent, intersects, getIntersection, getArea} from 'ol/extent';
import Arc from './arc';
import IsoVist2D from './isovistsectors2d.js';
import {toLonLat} from 'ol/proj';
import {cartesianToSpherical, sphericalToCartesian, planeFromThreePoints, intersectionLinePlane, centerOfMass} from './geometry';
import {polygon as PolygonModule}  from 'polygon-tools';

/** Object containing polygon and associated visibility sector
 */
class PolygonToAngle {
    /**
     * Constructor
     * @param {ol.geom.Polygon} Polygon
     * @param {ol.geom.Polygon} spherical extent
     */
    constructor(polygon, angle) {
        /**
         * polygon
         * @type {ol.geom.Polygon}
         */
        this.polygon = polygon;

        /**
         * angle
         * @type {ol.geom.Polygon}
         */
        this.angle = angle;
    }
}


/** Object containing segment and associated visibility sector
 */
class AngleToSegment {
    /**
     * Constructor
     * @param {Arc} angle
     * @param {ol.geom.LineString} segment
     */
    constructor(angle, segment) {
        /**
         * angle
         * @type {Arc}
         */
        this.angle = angle;

        /**
         * segment
         * @type {ol.geom.LineString}
         */
        this.segment = segment;
    }
}

/** Class allowing to compute the isovist in 3D, inspired by Suleiman et al's 'A New Algorithm for 3D Isovists"
 * the space is delimited by a set of polygons and visibility can be determined by spherical coordiantes associated with these segments
 * WORK IN PROGRESS: Need fixes for roofs + free segments
 */
export default class IsoVist3D extends IsoVist2D {
    /**
     * Constructor
     * @param {Arc} arc the field of view
     * @param {Array.<ol.Feature>} segments segments in map
     * @param {Boolean} isDisplayPartial if true display only partial visible segments, else display full visible segments
     * @param {Boolean} isDisplayPolygon should display polygon or line segments
     * @param {number} epsilon tolerance for intersection
     */
    constructor(arc, segments, isDisplayPartial = true, isDisplayPolygon = true, epsilon = 0.0001) {
        super(arc, segments, isDisplayPartial, isDisplayPolygon, epsilon);
        /**
         * arc the field of view
         * @type {Arc}
         */
        this.arc = arc;

        /**
         * building segments
         * @type {Array.<ol.Feature>} segments segments in map
         */
        this.segments = segments;

        /**
         * if true display only partial visible segments, else display full visible segments
         * @type {Boolean}
         */
        this.isDisplayPartial = isDisplayPartial;

        /**
         * if true, displays polygon, else, union of line segments
         * @type {Boolean}
         */
        this.isDisplayPolygon = isDisplayPolygon;

        /**
         * @type {number} epsilon tolerance for intersection
         */
        this.epsilon = epsilon;

    }



    /**
     * Converts a segment to a 3D polygon
     * @param {ol.geom.LineString} segment
     * @returns {ol.geom.Polygon} polygon
     */
    segmentTo3DPolygon(segment) {
        var p1 = segment.getFirstCoordinate();
        var p2 = segment.getLastCoordinate();
        var p3 = [p2[0], p2[1], 0]; //ground coordinate
        var p4 = [p1[0], p1[1], 0]; //ground coordinate
        return new Polygon([[p1, p2, p3, p4]]);
    }

    /**
     * Converts several segments to polygons
     * @param {Array<ol.geom.LineString>} segments
     * @returns {Array<ol.geom.Polygon>} polygons
     */
    segmentsToPolygons(segments) {
        var polygons = [];
        for (let segment of segments) {
            var p = this.segmentTo3DPolygon(segment);
            polygons.push(p);
        }
        var roofs = this.roofPolygons();
        Array.prototype.push.apply(polygons, roofs);
        return polygons;
    }


    /**
     * Roof Polygons
     * @returns {Array<ol.geom.Polygon>}
     */
    roofPolygons() {
        var polygons = [];
        for (let building of this.segments) {
            var geometry = building.getGeometry();
            if (this.isInFOV(geometry)) {
                polygons.push(geometry);
            }
        }
        return polygons;
    }

    /**
     * Translation of polygons by reference vector
     * @param {ol.geom.Polygon} polygon
     * @param {Array<number>} reference
     * @returns {ol.geom.Polygon} translated polygons
     */
    translatePolygon(polygon, reference) {
        let coordsTranslated = [];
        for (let coord of polygon.getCoordinates()[0]) {
            var coordTranslated = [coord[0] - reference[0],
                                   coord[1] - reference[1],
                                   coord[2] - reference[2]];
            coordsTranslated.push(coordTranslated);
        }
        return new Polygon([coordsTranslated]);
    }

    /**
     * Converts a polygon in cartesian coordinates to spherical coordinates
     * @param {ol.geom.Polygon} polygon
     * @returns {Object} spherical coordinates
     */
    polygonToSphericalCoordinates(polygon) {
        var sphericals = [];
        var translated = this.translatePolygon(polygon, this.arc.center);
        for (let coord of translated.getCoordinates()[0]) {
            var sphericalNorm = cartesianToSpherical(coord);
            sphericals.push(sphericalNorm);
        }
        return sphericals;
    }

    /**
     * Converts spherical coordinates to a polygon
     * @param {Object} sphericals
     * @returns {ol.geom.Polygon} polygon
     */
    sphericalCoordinatesToShape(sphericals) {
        var coords = [];
        for (let s of sphericals) {
            var p = [s.theta, s.phi];
            coords.push(p);
        }
        return new Polygon([coords]);
    }

    /**
     * Converts several polygons to their polygonal shape
     * @param {Array<ol.geom.Polygon>} polygons
     * @returns {Array<Object>} objects
     */
    polygonsToAngle(polygons) {
        var polyAngles = [];
        for (let polygon of polygons) {
            var spherical = this.polygonToSphericalCoordinates(polygon);
            var angleShape = this.sphericalCoordinatesToShape(spherical);
            var pToS = new PolygonToAngle(polygon, angleShape);
            polyAngles.push(pToS);
        }
        return polyAngles;
    }

    /**
     * Checks whether this polygon is a roof (all z-coordinates greater than 0)
     * @param {ol.geom.Polygon} polygon
     * @returns {boolean} whether polygon is a roof
     */
    isRoof(polygon) {
        return polygon.getCoordinates()[0].every(e => e[2] > 0);
    }


    /**
     * Distance to the polygon's centroid
     * @param {ol.geom.Polygon} polygon
     * @returns {number} distance
     */
    polygonToDistanceCentroid(polygon) {
        var centroid = centerOfMass(polygon.getCoordinates()[0]);
        var distance = euclideanDistance(centroid, this.arc.center);
        return distance;
    }

    /**
     * Checks whether a polygon is blocking, that is to say it is fully visible from the point of view
     * @param {Object} polyAngle polygon to angle
     * @param {Array.<Object>} polyAngles
     * @returns {Boolean} whether polyAngle is blocking with respect to polyAngles
     */
    isNonBlocking(polyAngle, polyAngles) {
        var poly = polyAngle.polygon;
        var angle = polyAngle.angle;
        var intersecting = [];
        var isBlocking = true;
        for (let j = 0; j < polyAngles.length; j++) {
            var polyAngle2 = polyAngles[j];
            var poly2 = polyAngle2.polygon;
            var angle2 = polyAngle2.angle;
            var intersection =  PolygonModule.intersection(angle.getCoordinates()[0], angle2.getCoordinates()[0]);

            if (intersection.length && intersection[0].length) {
                intersecting.push(polyAngle2);
            }
        }
        var minDCurrent = this.polygonToDistanceCentroid(poly);
        for (let e of intersecting) {
            var minDOther = this.polygonToDistanceCentroid(e.polygon);
            if (minDOther < minDCurrent) {
                isBlocking = false;
            }
        }
        return !isBlocking;
    }


    /**
     * Sort according to theta angle from spherical coordinates, then phi
     * @param {Array<ol.geom.Polygon>} angles spherical coordinates
     * @returns {Array<ol.geom.Polygon>} sorted angles
     */
    sortTheta(angles) {
        var tmpAngles = angles.slice();
        tmpAngles.sort(function(a, b) {
            let extentA = a.getExtent();
            let extentB = b.getExtent();
            let thetaMinA = extentA[0];
            let phiMinA = extentA[1];
            let thetaMaxA = extentA[2];
            let phiMaxA = extentA[3];
            let thetaMinB = extentB[0];
            let phiMinB = extentB[1];
            let thetaMaxB = extentB[2];
            let phiMaxB = extentB[3];
            if (phiMinA === phiMinB && thetaMaxA === thetaMaxB && thetaMinA === thetaMinB)
                return phiMaxA - phiMaxB;
            if (thetaMaxA === thetaMaxB && thetaMinA === thetaMinB)
                return phiMinA - phiMinB;
            if (thetaMinA === thetaMinB)
                return thetaMaxA - thetaMaxB;
            return thetaMinA - thetaMinB;
        });
        return tmpAngles;
    }



    /**
     * Merges consecutive spherical coordinates
     * @param {Array.<Object>} angles spherical coordinates
     * @returns {Array.<Arc>} simplified array
     */
    mergeOverlappingAngles(angles) {
        if (angles.length === 1) return angles;
        var sortedAngles = this.sortTheta(angles);
        let minX =  2 * Math.PI;
        let minY =  2 * Math.PI;
        let maxX = -2 * Math.PI;
        let maxY = -2 * Math.PI;
        var union = [];
        var trimmedArray = [];
        for (let i = 0; i < sortedAngles.length-1; i++) {
            let current = sortedAngles[i];
            let next = sortedAngles[i+1];
            let coordCurrent = current.getCoordinates()[0];
            let coordNext = next.getCoordinates()[0];
            if (i === 0) {
                union = coordCurrent;
            }
            let currentUnion = PolygonModule.union(union, coordNext);

            if (currentUnion && currentUnion.length === 1) {
                union = currentUnion[0];
            }
            else {
                trimmedArray.push(new Polygon([union]));
                union = coordNext;
            }


        }
        return trimmedArray;
    }

    /**
     * Whether a polygon is free, that is to say it is partially visible
     * @param {Object} polyAngle
     * @param {Array<Object>} blockingPolyAngles
     * @returns {boolean} whether it is partially visible
     */
    isFree(polyAngle, blockingPolyAngles) {
        var isFree = true;
        var poly = polyAngle.polygon;
        var angle = polyAngle.angle;
        var coords = angle.getCoordinates()[0];
        for (let angle2 of blockingPolyAngles) {
            var coords2 = angle2.getCoordinates()[0];
            var intersection = PolygonModule.intersection(coords, coords2);
            if (intersection && intersection.length)
                var contains = intersection[0].flat().sort().every(e => coords.flat().sort().includes(e));
            else
                contains = true;
            if (contains) {
                isFree = false;
            }
        }
        return isFree;
    }

    /**
     * Extracts all partially visible polygons, that is to say to those who are in the free vision field
     * @param {Array.<ol.geom.Polygon>} blockingPolyAngles
     * @param {Array.<ol.geom.Polygon>} polyAngles
     * @returns {Array.<ol.geom.Polygon>} partially visible polygons
     */
    freeSegments(blockingPolyAngles, polyAngles) {
        var freeSegments = [];
        var trimmedBlockingAngles = this.mergeOverlappingAngles(blockingPolyAngles.map(bAngle => bAngle.angle));
        for (let polyAngle of polyAngles) {
            var isFree = this.isFree(polyAngle, trimmedBlockingAngles);
            if (blockingPolyAngles.indexOf(polyAngle) === -1 && isFree)
                freeSegments.push(polyAngle);
        }
        return freeSegments;
    }


    /**
     * Projects a spherical polygon in 2D, onto a 3D plane in cartesian coordinates
     * @param {Object} partialPart
     * @returns {ol.geom.Polygon} the 3D polygon in cartesian coordinates
     */
    projectSphericalPolygonOn3DFace(partialPart) {
        if (partialPart.intersection.flatCoordinates.length === 0) return new Polygon([[[0,0,0]]]);
        var face = partialPart.polygon;
        var intersection = partialPart.intersection;
        var coordsFace = face.getCoordinates()[0];
        var coordsIntersection = intersection.getCoordinates()[0];
        let cartesianIntersection = [];
        for (let coord of coordsIntersection) {
            let spherical = {theta: coord[0], phi: coord[1], norm: 1};
            let cartesianCoord = sphericalToCartesian(spherical);
            cartesianIntersection.push(cartesianCoord);
        }

        var plane = planeFromThreePoints(coordsFace[0], coordsFace[1], coordsFace[2]);
        var newCoords = [];
        for (let p of cartesianIntersection) {
            var i = intersectionLinePlane(p, plane);
            if (!i)
                return new Polygon([[[0,0,0]]]);
            else
                newCoords.push(Object.values(i));

        }
        var polygon = new Polygon([newCoords]);
        var translatedPolygon = this.translatePolygon(polygon, [-this.arc.center[0],
                                                                -this.arc.center[1],
                                                                -this.arc.center[2]]);

        return translatedPolygon;
    }

    /**
     * Extracts polygon parts that are partially visible
     * @param {Array<Object>} partialParts
     * @returns {Array<ol.geom.Polygon>} array of polygons
     */
    partiallyVisiblePolygon(partialParts) {
        let arrayPolygons =  [];
        for (let partialPart of partialParts) {
            let projectionPolygon = this.projectSphericalPolygonOn3DFace(partialPart);
            arrayPolygons.push(projectionPolygon);
        }
        return arrayPolygons;
    }



    polygonSubtractIntersection(poly, poly2) {
        var factor = 1;
        var coordinates1 = poly.getCoordinates()[0].map(coord => [coord[0] * factor, coord[1] * factor]);

        var coordinates2 = poly2.getCoordinates()[0].map(coord => [coord[0] * factor, coord[1] * factor]);

        var subtract = PolygonModule.subtract(coordinates1, coordinates2);
        return new Polygon(subtract);
    }

    /**
     * Polygons that are partially visible
     * @param {Array<Object>} blockingPolyAngles
     * @returns {Array<ol.geom.Polygon>} the parts of polygons
     */
    visibleBlockingSegments(blockingPolyAngles) {
        var that  = this;
        var visibleSegments = [];
        var position = this.arc.center;


        //Computing blocking segments hidden by other segments
        blockingPolyAngles.sort(function(a,b) {
            return that.polygonToDistanceCentroid(a.polygon) - that.polygonToDistanceCentroid(b.polygon);
        });
        var visionField = [];
        for (let polyAngle of blockingPolyAngles) {
            let angleCurrent = polyAngle.angle;
            let polyCurrent = polyAngle.polygon;
            let isPartial = false;
            let coordinates = this.translatePolygon(polyCurrent, this.arc.center);
            let partialParts = [];
            for (let angleVision of visionField) {
                var intersection = PolygonModule.intersection(angleCurrent.getCoordinates()[0], angleVision.getCoordinates()[0]);
                if (intersection[0] && intersection[0].length)  {
                    isPartial = true;
                    var polySubtract = this.polygonSubtractIntersection(angleCurrent, angleVision);
                    let objIntersectionToSpherical = {intersection: polySubtract, polygon: coordinates};
                    partialParts.push(objIntersectionToSpherical);
                }
            }
            if (isPartial) {
                var arrayPolygons = this.partiallyVisiblePolygon(partialParts);
                Array.prototype.push.apply(visibleSegments, arrayPolygons);
            } else {
                visibleSegments.push(polyAngle.polygon);
            }
            visionField.push(polyAngle.angle);
            visionField = this.mergeOverlappingAngles(visionField);

        }
        return visibleSegments;
    }


    /**
     * Compute the isovists for a set of polygons
     * @param {Array<ol.geom.Polygon>} polygons
     * @returns {Array<ol.geom.Polygon>} the visible polygons
     */
    polygonsToVisiblePolygons(polygons) {
        var polyAngles = this.polygonsToAngle(polygons);

        var blockingSegments = this.blockingSegments(polyAngles);
        var freeSegments = this.freeSegments(blockingSegments, polyAngles);
        var partiallyVisible = [];
        var that = this;
        while (freeSegments.length > 0) {
            freeSegments.sort(function(a,b) {
                return that.polygonToDistanceCentroid(a.polygon) - that.polygonToDistanceCentroid(b.polygon);
            });
            blockingSegments.push(freeSegments[0]);
            freeSegments = this.freeSegments(blockingSegments, polyAngles);
        }
        var visibleSegments = this.visibleBlockingSegments(blockingSegments);
        return visibleSegments;
    }

    /**
     * Main function
     * @returns {Array.<ol.geom.Polygon>} isovist as the polygons from buildings visible from the point of view
     */
    isovist() {
        var visibleSegments = [];
        var segments = this.segmentsIntersectingFOV();
        var position = this.arc.center;

        var polygons = this.segmentsToPolygons(segments);
        var visiblePolygons = this.polygonsToVisiblePolygons(polygons);
        Array.prototype.push.apply(visibleSegments, visiblePolygons);
        return visibleSegments;
    }
}
