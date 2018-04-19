/**
 * @fileOverview Isovist computation from Suleiman et al, A New Algorithm for 3D Isovists.
 * Space is delimited by a set of segments, and visibility can be determined by circular sectors associated with these segements
 * @name isovistsectors2d.js
 * @author Florent Grelard
 * @license
 */

import LineString from 'ol/geom/linestring';
import {segmentsIntersect} from './lineintersection';
import {euclideanDistance} from './distance';
import Arc from './arc';
import $ from 'jquery';


export default class IsoVist {
    /**
     * Constructor
     * @param {Arc} arc the field of view
     * @param {Array.<ol.Feature>} segments segments in map
     */
    constructor(arc, segments) {
        this.arc = arc;
        this.segments = segments;
    }

    /**
     * Extracts all segments constituting a polygon
     * @param {ol.geom.Polygon} polygon
     * @returns {Array} segments
     */
    extractSegmentsFromPolygon(polygon) {
        var segments = [];
        var polygonVertices = polygon.getCoordinates()[0];
        for (var i = 0; i < polygonVertices.length-1; i++) {
            var p1 = polygonVertices[i];
            var p2 = polygonVertices[i+1];
            var segment = new LineString([p1, p2]);
            var partiallyVisible = this.partiallyVisibleSegments([this.arc], segment);
            if (partiallyVisible) {
                Array.prototype.push.apply(segments, partiallyVisible[1]);
            } else if (this.arc.geometry.intersectsCoordinate(p1) ||
                       this.arc.geometry.intersectsCoordinate(p2))
            {
                segments.push(segment);
            }
        }
        return segments;
    }

    /**
     * From all the segments in the building, extract only those visible in field of view
     * @returns {} array of visible segments
     */
    segmentsIntersectingFOV() {
        var segments = [];
        var geometryArc = this.arc.geometry;
        var extentArc = geometryArc.getExtent();
        var that = this;
        $.each(this.segments, function(b, f) {
            var geometryFeature = f.getGeometry();
            if (geometryArc.intersectsExtent(geometryFeature.getExtent()) &&
                geometryFeature.intersectsExtent(extentArc)) {
                if (geometryFeature.getType() === "Polygon") {
                    var segmentsPolygon = that.extractSegmentsFromPolygon(geometryFeature);
                    Array.prototype.push.apply(segments, segmentsPolygon);
                }
            }
        });
        return segments;
    }

    /**
     * Checks whether a segment is blocking, that is to say it is fully visible from the point of view
     * @param {ol.geom.LineString} segment
     * @param {Array.<ol.geom.LineString>} segments all the segments
     * @returns {Boolean} whether segment is blocking with respect to segments
     */
    isNonBlocking(segment, segments) {
        var position = this.arc.center;
        var p1 = segment.getFirstCoordinate();
        var p2 = segment.getLastCoordinate();

        var s1 = new LineString([position, p1]);
        var s2 = new LineString([position, p2]);
        var toPush = false;
        $.each(segments, function(i, s) {
            var ps1 = s.getFirstCoordinate();
            var ps2 = s.getLastCoordinate();
            if (s === segment)
                return true;
            var i1 = segmentsIntersect(s1, s);
            var i2 = segmentsIntersect(s2, s);
            if (i1 || i2) {
                toPush = true;
            }
        });
        return toPush;
    }

    /**
     * Computes the angle that is blocked by a segment
     * @param {ol.geom.LineString} segment
     * @returns {Arc} the arc corresponding to segment
     */
    visionBlockingArc(segment) {
        var radius = this.arc.radius;
        var position = this.arc.center;
        var p1 = segment.getFirstCoordinate();
        var p2 = segment.getLastCoordinate();

        var v1 = [p1[0] - position[0],
                  p1[1] - position[1]];
        var v2 = [p2[0] - position[0],
                  p2[1] - position[1]];

        var dot1 = v1[0] * radius;
        var dot2 = v2[0] * radius;

        var norm1 = Math.sqrt(Math.pow(v1[0], 2) + Math.pow(v1[1], 2));
        var norm2 = Math.sqrt(Math.pow(v2[0], 2) + Math.pow(v2[1], 2));

        var alpha = Math.acos(dot1  / (norm1 * radius)) * 180 / Math.PI;
        if (v1[1] < 0) alpha = 360-alpha;
        var omega = Math.acos(dot2 / (norm2 * radius)) * 180 / Math.PI;

        if (v2[1] < 0) omega = 360-omega ;
        if (omega < alpha) {
            var tmp = alpha;
            alpha = omega;
            omega = tmp;
        }
        var diffOA = omega - alpha;
        var diffOA360 = 360+alpha-omega;
        if (diffOA360 < diffOA) {
            var tmp = alpha;
            alpha = omega;
            omega = tmp + 360;
        }

        return new Arc(position, radius, alpha, omega);
    }

    /**
     * Merges consecutive arcs which have overlapping angles
     * @param {Array.<Arc>} array
     * @returns {Array.<Arc>} simplified array
     */
    mergeOverlappingAngles(array) {
        var trimmedArray = [];
        array.sort(function(a,b) {
            return a.alpha > b.alpha;
        });
        var alpha = 0;
        var omega = 0;
        for (var i = 0; i < array.length - 1; i++) {
            var current = array[i];
            var next = array[i+1];
            if (i === 0) {
                alpha = current.alpha;
            }
            if (current.omega > omega) {
                omega = current.omega;
            }
            if (omega < next.alpha) {
                trimmedArray.push(new Arc(this.arc.center, this.arc.radius, alpha, omega));
                alpha = next.alpha;
            }
            if (i === array.length - 2) {
                trimmedArray.push(new Arc(this.arc.center, this.arc.radius, alpha, next.omega));
            }
        }
        return trimmedArray;
    }

    /**
     * Returns the complementary of blocked angles in the field of view
     * @param {Array.<Arc>} blockedAngles
     * @returns {Array.<Arc>} free angles
     */
    freeAngles(blockedAngles) {
        var freeAngles = [];
        var start = this.arc.alpha;
        var end = this.arc.omega;
        var index = 0;
        while (index < blockedAngles.length) {
            var currentBlocked = blockedAngles[index];
            if (start < currentBlocked.alpha) {
                freeAngles.push(new Arc(this.arc.center, this.arc.radius, start, currentBlocked.alpha));
            } else if (index === blockedAngles.length - 1 && currentBlocked.omega < end) {
                freeAngles.push(new Arc(this.arc.center, this.arc.radius, currentBlocked.omega, end));
            }
            start = currentBlocked.omega;
            index++;
        }
        return freeAngles;
    }

    /**
     * For partially visible segments, extract the part that is visible from the point of view
     * @param {Array} intersection start point of visible segment
     * @param {ol.geom.LineString} segment full segment
     * @param {Arc} arc
     * @returns {ol.geom.LineString} visible segment
     */
    segmentPartVisible(intersection, segment, arc) {
        var segStart = segment.getFirstCoordinate();
        var segEnd = segment.getLastCoordinate();

        var norm = euclideanDistance(segStart, [intersection.x, intersection.y]);
        var middle = [(intersection.x + (segStart[0] - intersection.x) / norm), (intersection.y + (segStart[1] - intersection.y) / norm) ];
        var p;
        if (arc.geometry.intersectsCoordinate(middle))
            p = segStart;
        else
            p = segEnd;
        var visibleSegment = new LineString([[intersection.x, intersection.y], p]);
        return visibleSegment;
    }

    /**
     * Computes partially visible segment(s) from a segment
     * @param {Array.<Arc>} angles free angles
     * @param {ol.geom.LineString} segment
     * @returns {Array.<ol.geom.LineString, Array.<ol.geom.LineString> >} if it is partially visible : first argument = full segment, second argument = array of visible segments ; else null
     */
    partiallyVisibleSegments(angles, segment) {
        var visibleSegment = null;
        var position = this.arc.center;
        var visibleSegments = [];
        var that = this;
        $.each(angles, function(i, angle) {
            var arc = new Arc(that.arc.center, that.arc.radius, angle.alpha, angle.omega);
            arc.computeGeometry();
            var p1 = arc.fullGeometry[1].getFlatCoordinates();
            var p2 = arc.fullGeometry[2].getFlatCoordinates();
            var s1 = new LineString([position, p1]);
            var s2 = new LineString([position, p2]);
            var i1 = segmentsIntersect(segment, s1);
            var i2 = segmentsIntersect(segment, s2);
            if (i1 || i2) {
                if (i1 && i2) {
                    visibleSegment = new LineString([[i1.x, i1.y],
                                                     [i2.x, i2.y]]);
                }
                else if (i1) {
                    visibleSegment = that.segmentPartVisible(i1, segment, arc);
                }
                else if (i2) {
                    visibleSegment = that.segmentPartVisible(i2, segment, arc);
                }
                visibleSegments.push(visibleSegment);
            }
        });
        return (visibleSegments.length > 0) ? [segment, visibleSegments] : null;
    }


    /**
     * Extract all fully visible segments
     * @param {Array.<ol.geom.LineString>} segments all segments from buildings
     * @returns {} fully visible segments
     */
    computeBlockingSegments(segments) {
        var blockingSegments = [];
        var that = this;
        $.each(segments, function(i, segment) {
            var nonBlocking = that.isNonBlocking(segment,
                                            segments);
            if (!nonBlocking) {
                blockingSegments.push(segment);
            }
        });
        return  blockingSegments;
    }

    /**
     * Extracts all partially visible segments, that is to say to those who are in the free vision field
     * @param {} blockingSegments
     * @param {} segments
     * @returns {} partially visible segments
     */
    computeFreeSegments(blockingSegments, segments) {
        var blockingAngles = [];
        var freeSegments = [];
        var that = this;
        $.each(blockingSegments, function(j, segment) {
            var blockingAngle = that.visionBlockingArc(segment);
            blockingAngles.push(blockingAngle);
        });
        var trimmedBlockingAngles = this.mergeOverlappingAngles(blockingAngles);
        var freeVisionAngles = this.freeAngles(trimmedBlockingAngles);
        $.each(segments, function(j, segment) {
            if (blockingSegments.indexOf(segment) === -1) {
                var visibleSegment = that.partiallyVisibleSegments(freeVisionAngles, segment);
                if (visibleSegment)
                    freeSegments.push(visibleSegment);
            }
        });
        return freeSegments;
    }


    /**
     * Main function
     * @returns {} isovist as the segments from buildings visible from the point of view
     */
    computeIsoVist() {
        var visibleSegments = [];
        var segments = this.segmentsIntersectingFOV();
        var position = this.arc.center;
        var blockingSegments = this.computeBlockingSegments(segments);

        Array.prototype.push.apply(visibleSegments, blockingSegments);

        var freeSegments = this.computeFreeSegments(blockingSegments, segments);
        var partiallyVisible = [];
        var previous = freeSegments.length+1;
        while (freeSegments.length > 0) {
            previous = freeSegments.length;
            freeSegments.sort(function(a,b) {
                return euclideanDistance(position, a[0].getClosestPoint(position)) > euclideanDistance(position, b[0].getClosestPoint(position));
            });
            blockingSegments.push(freeSegments[0][0]);
            partiallyVisible.push(freeSegments[0][1]);
            freeSegments = this.computeFreeSegments(blockingSegments, segments);
        }
        $.each(partiallyVisible, function(i, segments) {
            Array.prototype.push.apply(visibleSegments, segments);
        });

        return visibleSegments;
    }
}




