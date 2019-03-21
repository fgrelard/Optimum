/**
 * @fileOverview Dual R-tree, using the R-bush library
 * @name dualrtree.js
 * @author Florent Grélard
 * @license
 */
import {centerOfMass} from './geometry.js';
import {euclideanDistance} from './distance.js';
import rbush from 'rbush';

/** Dual R-tree constructed from different types of dualities
 * {@link PolarDual} and {@link Dual}
 */
export default class DualRtree {
    /**
     * Constructor
     * @param {Duality} duality type of duality
     * @param {number} branchingFactor
     * @param {boolean=} divide creates two data structures if true (for vertical lines)
     */
    constructor(duality, branchingFactor, divide = false) {
        /**
         * Whether to create two data structures or not
         * @type {boolean}
         */
        this.divide = divide;

        /**
         * Type of duality : polar or affine
         * @type {Duality}
         */
        this.Duality = duality;

        /**
         * Origin (barycenter)
         * @type {Array<number>}
         */
        this.origin = [];

        /**
         * Data structure
         * @type {rbush}
         */
        this.rtree = rbush(branchingFactor);
        if (this.divide) {
            /**
             * Data structure for vertical lines
             * @type {rbush}
             */
            this.rtreeVertical = rbush(branchingFactor);
        }
    }


    /**
     * Dual representation of angular sectors
     * @param {Arc} arcs
     * @returns {Array<Object>} dual representation
     */
    dualRepresentation(arcs) {
        var dual = [];
        var dualVertical = [];
        for (var arc of arcs) {
            var bboxCoordinates = this.Duality.dualBoundingRectangle(arc, this.origin, false);
            if (this.divide) {
                var bboxCoordinatesVertical = this.Duality.dualBoundingRectangle(arc, this.origin, true);
                var bboxH = bboxCoordinates[0];
                var bboxV = bboxCoordinates[1];
                var rectangleH = [ [bboxH.minX, bboxH.minY],
                                   [bboxH.maxX, bboxH.maxY] ];
                var rectangleV = [ [bboxV.minX, bboxV.minY],
                                   [bboxV.maxX, bboxV.maxY] ];

                var dH = euclideanDistance(rectangleH[0], rectangleH[1]);
                var dV = euclideanDistance(rectangleV[0], rectangleV[1]);

                if (dH <= dV) {
                    dual.push(bboxCoordinates);
                }
                else {
                    dualVertical.push(bboxCoordinatesVertical);
                }
            }
            else {
                for (let rect of bboxCoordinates) {
                    dual.push(rect);
                }
            }


        }
        return [dual, dualVertical];
    }

    /**
     * Inserts angular sectors into the data structure as their duals
     * @param {Arc} arcs
     * @returns {rbush} constructed dual R-tree
     */
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

    /**
     * Search recursive in the dual R-tree
     * @param {Array} hits
     * @param {Node} node
     * @param {Array} p current point
     * @param {Object} number number of hits
     */
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

    /**
     * Search function
     * @param {Array<number>} p point to search for
     * @returns {Object} hits and number of hits
     */
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

    /**
     * Getter for the data structure
     * @returns {Array} the data structure
     */
    dataStructure() {
        return this.rtree.data;
    }
}
