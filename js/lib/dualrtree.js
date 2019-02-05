import {centerOfMass} from './geometry.js';
import {euclideanDistance} from './distance.js';
import rbush from 'rbush';

export default class DualRtree {
    constructor(duality, branchingFactor, divide = false) {
        this.divide = divide;
        this.Duality = duality;
        this.origin = [];

        this.rtree = rbush(branchingFactor);
        if (this.divide) {
            this.rtreeVertical = rbush(branchingFactor);
        }
    }


    dualRepresentation(arcs) {
        var dual = [];
        var dualVertical = [];
        for (var arc of arcs) {
            var bboxCoordinates = this.Duality.dualBoundingRectangle(arc, this.origin, false);
            var bboxCoordinatesVertical;
            if (this.divide) {
                bboxCoordinatesVertical = this.Duality.dualBoundingRectangle(arc, this.origin, true);
            }
            else {
                bboxCoordinatesVertical = bboxCoordinates;
            }
            var rectangleH = [ [bboxCoordinates.minX, bboxCoordinates.minY],
                               [bboxCoordinates.maxX, bboxCoordinates.maxY] ];
            var rectangleV = [ [bboxCoordinatesVertical.minX, bboxCoordinatesVertical.minY],
                               [bboxCoordinatesVertical.maxX, bboxCoordinatesVertical.maxY] ];

            var dH = euclideanDistance(rectangleH[0], rectangleH[1]);
            var dV = euclideanDistance(rectangleV[0], rectangleV[1]);

            if (dH <= dV) {
                dual.push(bboxCoordinates);
            }
            else {
                dualVertical.push(bboxCoordinatesVertical);
            }
        }
        return [dual, dualVertical];
    }

    load(arcs) {
        this.origin = centerOfMass(arcs.map(function(arc) {
            return arc.center;
        }));
        var dual = this.dualRepresentation(arcs);
        this.rtree.load(dual[0]);
        if (this.divide) {
            var dualY = dual[1];
            this.rtreeVertical.load(dualY);
        }
    }

    searchRecursive(hits, node, p, number = {cpt: 0}) {
        number.cpt++;
        if (node.leaf) {
            hits.push(...node.children);
            return;
        }
        for (var child of node.children) {
            var rectangle = {minX: child.minX,
                             minY: child.minY,
                             maxX: child.maxX,
                             maxY: child.maxY};
            if (this.Duality.intersectionRequestRectangle(p, rectangle)) {
                this.searchRecursive(hits, child, p, number);
            }
        }
        return;
    }

    search(p) {
        var hits = [];
        var request = [p[0] - this.origin[0],
                       p[1] - this.origin[1]];
        var number = {cpt : 0};
        this.searchRecursive(hits, this.rtree.data, request, number);
        if (this.divide) {
            request = [request[1], request[0]];
            this.searchRecursive(hits, this.rtreeVertical.data, request, number);

        }
        return {hits: hits, number: number};
    }

    dataStructure() {
        return this.rtree.data;
    }
}
