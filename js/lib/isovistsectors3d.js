/**
 * @fileOverview Isovist computation inspired from Suleiman et al, A New Algorithm for 3D Isovists.
 * Space is delimited by a set of segments, and visibility can be determined by circular sectors associated with these segments
 * @name isovistsectors3d.js
 * @author Florent Grelard
 * @license
 */

import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import * as Intersection from './lineintersection';
import {euclideanDistance} from './distance';
import {boundingExtent, containsExtent, intersects, getIntersection, getArea} from 'ol/extent';
import Arc from './arc';
import IsoVist2D from './isovistsectors2d.js';
import {toLonLat} from 'ol/proj';
import {cartesianToSpherical, sphericalToCartesian} from './geometry';

class PolygonToAngle {
    constructor(polygon, angle) {
        this.polygon = polygon;
        this.angle = angle;
    }
}


class AngleToSegment {
    constructor(angle, segment) {
        this.angle = angle;
        this.segment = segment;
    }
}

export default class IsoVist3D extends IsoVist2D {

    constructor(arc, segments, isDisplayPartial = true, isDisplayPolygon = true, epsilon = 0.0001) {
        super(arc, segments, isDisplayPartial, isDisplayPolygon, epsilon);
        this.arc = arc;
        this.segments = segments;
        this.isDisplayPartial = isDisplayPartial;
        this.isDisplayPolygon = isDisplayPolygon;
        this.epsilon = epsilon;
    }



    isInsideArc(segment) {
        for (let i = 0; i < 1; i+=0.1) {
            if (this.arc.geometry.intersectsCoordinate(segment.getCoordinateAt(i))) {
                return true;
            }
        }
        return false;
    }


    segmentsFromPolygon(polygon, arc) {
        var segments = [];
        var polygonVertices = polygon.getCoordinates()[0];
        for (let i = 0; i < polygonVertices.length-1; i++) {
            var p1 = polygonVertices[i];
            var p2 = polygonVertices[i+1];
            var segment = new LineString([p1, p2]);
            segments.push(segment);
        }
        return segments;
    }


    segmentsIntersectingFOV() {
        var segments = [];
        var geometryArc = this.arc.geometry;
        var extentArc = geometryArc.getExtent();
        var that = this;
        for (let f of this.segments) {
            var geometryFeature = f.getGeometry();
            if (euclideanDistance(geometryFeature.getFirstCoordinate(), that.arc.center) > 2 * that.arc.radius) continue;
            if (geometryArc.intersectsExtent(geometryFeature.getExtent()) &&
                geometryFeature.intersectsExtent(extentArc)) {
                if (geometryFeature.getType() === "Polygon") {
                    var segmentsPolygon = that.segmentsFromPolygon(geometryFeature, geometryArc);
                    Array.prototype.push.apply(segments, segmentsPolygon);
                }
            }
        }
        return segments;
    }

    segmentTo3DPolygon(segment) {
        var p1 = segment.getFirstCoordinate();
        var p2 = segment.getLastCoordinate();
        var p3 = [p2[0], p2[1], 0];
        var p4 = [p1[0], p1[1], 0];
        return new Polygon([[p1, p2, p3, p4]]);
    }

    segmentsToPolygons(segments) {
        var polygons = [];
        for (let segment of segments) {
            var p = this.segmentTo3DPolygon(segment);
            polygons.push(p);
        }
        return polygons;
    }

    polygonToSphericalCoordinates(polygon) {
        var sphericals = [];

        for (let coord of polygon.getCoordinates()[0]) {
            var coordTranslated = [coord[0] - this.arc.center[0],
                                   coord[1] - this.arc.center[1],
                                   coord[2]];
            var sphericalNorm = cartesianToSpherical(coordTranslated);
            var c = sphericalToCartesian(sphericalNorm);
            sphericals.push(sphericalNorm);
        }
        return sphericals;
    }

    sphericalCoordinatesToShape(sphericals) {
        var coords = [];
        for (let s of sphericals) {
            var p = [s.theta, s.phi];
            coords.push(p);
        }
        return new Polygon([coords]);
    }

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

    polygonToMinDistance(polygon) {
        var distance = Number.MAX_VALUE;
        for (let coord of polygon.getCoordinates()[0]) {
            let norm = euclideanDistance(coord, this.arc.center);
            if (distance > norm) {
                distance = norm;
            }
        }
        return distance;
    }


    isNonBlocking(polyAngle, polyAngles) {
        var poly = polyAngle.polygon;
        var angle = polyAngle.angle;
        var extent = angle.getExtent();
        var intersecting = [];
        var isBlocking = true;
        for (let j = 0; j < polyAngles.length; j++) {
            var polyAngle2 = polyAngles[j];
            var poly2 = polyAngle2.polygon;
            var angle2 = polyAngle2.angle;
            var extent2 = angle2.getExtent();

            if (angle.intersectsExtent(extent2) &&
                angle2.intersectsExtent(extent) &&
                getArea(getIntersection(extent, extent2)) > 0) {
                intersecting.push(polyAngle2);
            }
        }
        var minDCurrent = this.polygonToMinDistance(poly);
        for (let e of intersecting) {
            var minDOther = this.polygonToMinDistance(e.polygon);
            if (minDOther < minDCurrent) {
                isBlocking = false;
            }
        }
        return !isBlocking;
    }


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


    minMaxAngle(angles, theta = false) {
        var minX = Number.MAX_VALUE;
        var maxX = -Number.MAX_VALUE;
        for (let angle of angles) {
            var extent = angle.getExtent();
            var angleMin, angleMax;
            if (theta) {
                angleMin = extent[0];
                angleMax = extent[2];
            } else {
                angleMin = extent[1];
                angleMax = extent[3];
            }

            if (angleMin < minX) {
                minX = angleMin;
            }
            if (angleMax > maxX) {
                maxX = angleMax;
            }
        }
        return [minX, maxX];
    }


    polygonFromExtent(extent) {
        var minX = extent[0];
        var minY = extent[1];
        var maxX = extent[2];
        var maxY = extent[3];
        var p1 = [minX, minY];
        var p2 = [minX, maxY];
        var p3 = [maxX, maxY];
        var p4 = [maxX, minY];

        return new Polygon([[ p1, p2, p3, p4 ]]);
    }

    mergeOverlappingAngles(angles) {
        var sortedAngles = this.sortTheta(angles);
        let minX =  2 * Math.PI;
        let minY =  2 * Math.PI;
        let maxX = -2 * Math.PI;
        let maxY = -2 * Math.PI;
        var locallyIntersecting = [];
        var trimmedArray = [];
        for (let i= 0; i < sortedAngles.length - 1; i++) {
            let current = sortedAngles[i];
            let next = sortedAngles[i+1];

            let extentCurrent = current.getExtent();
            let extentNext = next.getExtent();
            let thetaMinCurrent = extentCurrent[0];
            let phiMinCurrent = extentCurrent[1];
            let thetaMaxCurrent = extentCurrent[2];
            let phiMaxCurrent = extentCurrent[3];

            let thetaMinNext = extentNext[0];
            let phiMinNext = extentNext[1];
            let thetaMaxNext = extentNext[2];
            let phiMaxNext = extentNext[3];
            if (i === 0) {
                minX = thetaMinCurrent;
                minY = phiMinCurrent;
            }
            if (minY > phiMinCurrent) {
                minY = phiMinCurrent;
            }
            if (thetaMaxCurrent > maxX) {
                maxX = thetaMaxCurrent;
            }
            if (phiMaxCurrent > maxY) {
                maxY = phiMaxCurrent;
            }
            if (maxX < thetaMinNext ||
                maxY < phiMinNext) {
                let newExtent = boundingExtent([[minX, minY], [maxX, maxY]]);
                let newPolygon = this.polygonFromExtent(newExtent);
                trimmedArray.push(newPolygon);
                minX = thetaMinNext;
                minY = phiMinNext;
                locallyIntersecting = [];
            }
            if (i === sortedAngles.length - 2) {
                if (maxX < thetaMaxNext) {
                    maxX = thetaMaxNext;
                }
                if (maxY < phiMaxNext) {
                    maxY = phiMaxNext;
                }
                if (minY > phiMinNext) {
                    minY = phiMinNext;
                }
                let newExtent = boundingExtent([[minX, minY], [maxX, maxY]]);
                let newPolygon = this.polygonFromExtent(newExtent);
                trimmedArray.push(newPolygon);
            }
        }
        return trimmedArray;
    }

    isFree(polyAngle, blockingPolyAngles) {
        var isFree = true;
        var poly = polyAngle.polygon;
        var angle = polyAngle.angle;
        var extent = angle.getExtent();
        for (let angle2 of blockingPolyAngles) {
            var extent2 = angle2.getExtent();
            if (Intersection.rectangleContains(extent2,extent)) {
                isFree = false;
            }
        }
        return isFree;
    }

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


    partiallyVisiblePolygon(partialParts) {
        for (let partialPart of partialParts) {
//            sphericalToCartesian(partialP);
        }
    }

    visibleBlockingSegments(blockingPolyAngles) {
        var that  = this;
        var visibleSegments = [];
        var position = this.arc.center;

        //Computing blocking segments hidden by other segments
        blockingPolyAngles.sort(function(a,b) {
            return that.polygonToMinDistance(a.polygon) - that.polygonToMinDistance(b.polygon);
        });
        var visionField = [];
        for (let polyAngle of blockingPolyAngles) {
            let angleCurrent = polyAngle.angle;
            let extentCurrent = angleCurrent.getExtent();
            let polyCurrent = polyAngle.polygon;
            let isPartial = false;

            let partialParts = [];
            for (let angleVision in visionField) {
                let extentVision = angleVision.getExtent();
                let intersection = getIntersection(extentCurrent, extentVision);
                if (angleCurrent.intersectsExtent(extentVision) &&
                    angleVision.intersectsExtent(extentCurrent) &&
                    getArea(intersection) > 0)  {
                    isPartial = true;
                    partialParts.push(intersection);
                }
            }
            if (isPartial) {
                this.partiallyVisiblePolygon(partialParts);
            } else {
                visibleSegments.push(polyAngle.polygon);
            }
            visionField.push(polyAngle.angle);
            visionField = this.mergeOverlappingAngles(visionField);

        }
        return visibleSegments;
    }

    visibilityPolygon(blockingSegments) {
        var polygon = [];
        var that = this;
        var anglesToSegments = [];
        var blockingAngles = [];

        for (let segment of blockingSegments) {
            var blockingAngle = that.visionBlockingArc(segment);
            let fc = segment.getFirstCoordinate();
            let lc = segment.getLastCoordinate();
            var angleFC = that.angleFromCoordinates(fc);
            var angleLC = that.angleFromCoordinates(lc);
            angleFC = (angleFC < that.arc.alpha - 1) ? angleFC+360 : angleFC;
            angleLC = (angleLC < that.arc.alpha - 1) ? angleLC+360 : angleLC;
            var first = (angleFC < angleLC) ? fc : lc;
            var last = (angleFC < angleLC) ? lc : fc;
            var orientedSegment = new LineString([first, last]);
            let angleToSegment = new AngleToSegment(blockingAngle, orientedSegment);
            blockingAngles.push(blockingAngle);
            anglesToSegments.push(angleToSegment);
        }
        var trimmedBlockingAngles = this.mergeOverlappingAngles(blockingAngles);
        var freeVisionAngles = this.freeAngles(trimmedBlockingAngles);
        for (let angle of freeVisionAngles) {
            if (angle.omega - angle.alpha < 0.5) continue;
            angle.computeGeometry();
            var freeSegment = new LineString([angle.fullGeometry[1].getFlatCoordinates(),
                                              angle.fullGeometry[2].getFlatCoordinates()]);
            let angleToSegment = new AngleToSegment(angle, freeSegment);
            anglesToSegments.push(angleToSegment);
        }

        anglesToSegments.sort(function(a,b) {
            if (a.angle.alpha === b.angle.alpha)
                return a.angle.omega - b.angle.omega;
            return a.angle.alpha - b.angle.alpha;
        });
        if (anglesToSegments.length > 0) {
            polygon.push(this.arc.center);
            polygon.push(anglesToSegments[0].segment.getFirstCoordinate());
            for (let i = 0; i < anglesToSegments.length; i++) {
                let fc = anglesToSegments[i].segment.getFirstCoordinate();
                let lc = anglesToSegments[i].segment.getLastCoordinate();
                polygon.push(fc);
                polygon.push(lc);
            }
            polygon.push(this.arc.center);
        }
        return new Polygon([polygon]);
    }


    isovist() {
        var visibleSegments = [];
        var segments = this.segmentsIntersectingFOV();
        var position = this.arc.center;

        var polygons = this.segmentsToPolygons(segments);
        var polyAngles = this.polygonsToAngle(polygons);
        var blockingSegments = this.blockingSegments(polyAngles);
        //var trimmed = this.mergeOverlappingAngles(toMerge);
        var freeSegments = this.freeSegments(blockingSegments, polyAngles);
        var partiallyVisible = [];
        var that = this;
        while (freeSegments.length > 0) {
            freeSegments.sort(function(a,b) {
                return that.polygonToMinDistance(a.polygon) - that.polygonToMinDistance(b.polygon);
            });
            blockingSegments.push(freeSegments[0]);
            freeSegments = this.freeSegments(blockingSegments, polyAngles);
        }

        var onlyPoly = blockingSegments.map(elem => elem.polygon);
        //var onlyPoly = trimmed;
        //onlyPoly = blockingPoly.map(elem => elem.polygon);
        //onlyPoly = polyAngles.map(elem => elem.angle);
        console.log(onlyPoly.map(elem => elem.flatCoordinates));
        return onlyPoly;


        var position = this.arc.center;
        var blockingSegments = this.blockingSegments(segments);

        if (this.isDisplayPartial) {
            var visibleBlockingSegments = this.visibleBlockingSegments(blockingSegments);
            Array.prototype.push.apply(visibleSegments, visibleBlockingSegments);
        }
        var freeSegments = this.freeSegments(blockingSegments, segments);

        var partiallyVisible = [];
        while (freeSegments.length > 0) {
            freeSegments.sort(function(a,b) {
                return euclideanDistance(position, a[0].getClosestPoint(position)) - euclideanDistance(position, b[0].getClosestPoint(position));
            });
            blockingSegments.push(freeSegments[0][0]);
            partiallyVisible.push(freeSegments[0][1]);
            freeSegments = this.freeSegments(blockingSegments, segments);
        }

        if (this.isDisplayPartial) {
            for (let segments of partiallyVisible) {
                Array.prototype.push.apply(visibleSegments, segments);
            }
        } else {
            Array.prototype.push.apply(visibleSegments, blockingSegments);
        }
        if (this.isDisplayPolygon) {
            var polygon = this.visibilityPolygon(visibleSegments);

            return polygon;
        }
        return visibleSegments;
    }
}
