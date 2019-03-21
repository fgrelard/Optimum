/**
 * @fileOverview Data structure based on separating sectors for angular sectors
 * @name astreesectors.js
 * @author Florent Grélard
 * @license
 */
import Arc from './arc.js';
import {halfLineIntersection, segmentIntersection} from './lineintersection.js';
import {euclideanDistance} from './distance.js';
import Plane from './plane.js';
import Sector from './sector.js';

/**
 * Class representing a node inside the tree
 *  @deprecated use {@link DualRtree}
 */
class Node {
    /**
     * Constructor
     * @param {Object} value the node value
     */
    constructor(value)  {
        /**
         * value
         * @type {Object}
         */
        this.value = value;

        /**
         * Children nodes
         * @type {Array<Node>}
         */
        this.children = [];

        /**
         * Parent node
         * @type {Node}
         */
        this.parent = null;
    }

    /**
     * Sets the parent node
     * @param {Node} node
     */
    setParentNode(node) {
        this.parent = node;
    }

    /**
     * Gets the parent node
     * @returns {Node} node
     */
    getParentNode() {
        return this.parent;
    }

    /**
     * Adds a child to the current node
     * @param {Node} node
     */
    addChild(node) {
        if (!this.hasChild(node)) {
            node.setParentNode(this);
            this.children[this.children.length] = node;
        }
    }

    /**
     * Gets the children associated with this node
     * @returns {Array<Node>} the children
     */
    getChildren() {
        return this.children;
    }

    /**
     * Removes children
     */
    removeChildren () {
        this.children = [];
    }

    /**
     * Checks whether this node has a given child
     * @param {Node} child child to test
     * @returns {Boolean} whether this node has this child
     */
    hasChild(child) {
        var childV = child.value;
        for (let i = 0; i < this.children.length; i++) {
            var currentChildV = this.children[i].value;
            if (currentChildV.alpha && currentChildV.alpha === childV.alpha &&
                currentChildV.omega && currentChildV.omega === childV.omega &&
                currentChildV.center && currentChildV.center[0] === childV.center[0] && currentChildV.center[1] === childV.center[1])
                return true;
        }
        return false;
    }

    /**
     * Utility function used to display the node
     * @returns {string} string representing the node
     */
    toString() {
        var str = this.value.toString();
        var children = this.children;

        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            str += child.toString() + "\n";
        }
        str += "\n\n";

        return str;
    }
}

/**
 * Data structure used for angular sectors,
 * based on the sectors delimiting each angular sector
 * the delineation is done according to the sector which separate
 * the angular sectors into two balanced groups
 * @deprecated use {@link DualRtree}
 */
export default class ASTreeSectors {
    /**
     * Constructor
     * @param {Array<Arc>} sectors the angular sectors
     * @param {number=} n maximum number of leaves
     */
    constructor(sectors, n = 2) {
        /**
         * data structure
         * @type {Node}
         */
        this.tree = new Node(new Sector([0,0], [0,0], [0,0]));

        /**
         * angular sectors
         * @type {Array<Arc>}
         */
        this.sectors = sectors;

        /**
         * maximum number of leaves
         * @type {number}
         */
        this.maxNumberLeaves = n;

        /**
         *  processed sectors
         * @type {Array<Arc>}
         */
        this.addedSectors = [];

    }


    /**
     * Converts sectors to half planes
     * @param {Arc} sector
     * @returns {Plane} half planes
     */
    convertArcToHalfPlanes(sector) {
        var plane1 = this.angleToPlane(sector.alpha, sector.center, true);
        var plane2 = this.angleToPlane(sector.omega, sector.center);
        var sectorAsPlanes = new Sector(sector.center, plane1.normal, plane2.normal);

        return sectorAsPlanes;
    }


    /**
     * Whether two sectors intersect
     * @param {Arc} sector
     * @param {Arc} otherSector
     * @returns {boolean}
     */
    sectorsIntersect(sector, otherSector) {
        var f = sector.center;
        var la = sector.fullGeometry[1].getFlatCoordinates();
        var lo = sector.fullGeometry[2].getFlatCoordinates();
        var fOther = otherSector.center;
        var laOther = otherSector.fullGeometry[1].getFlatCoordinates();
        var loOther = otherSector.fullGeometry[2].getFlatCoordinates();
        var i1 = halfLineIntersection(f[0], f[1],
                                      la[0], la[1],
                                      fOther[0], fOther[1],
                                      laOther[0], laOther[1]);
        var i2 = halfLineIntersection(f[0], f[1],
                                      la[0], la[1],
                                      fOther[0], fOther[1],
                                      loOther[0], loOther[1]);
        var i3 = halfLineIntersection(f[0], f[1],
                                      lo[0], lo[1],
                                      fOther[0], fOther[1],
                                      laOther[0], laOther[1]);
        var i4 = halfLineIntersection(f[0], f[1],
                                      lo[0], lo[1],
                                      fOther[0], fOther[1],
                                      loOther[0], loOther[1]);

        return (i1 || i2 || i3 || i4);
    }


    /**
     * Intersection indices in the array of sectors
     * @param {Array<Arc<} sectors
     * @param {Arc} sector
     * @param {number} index
     * @returns {Array<number>} indices
     */
    intersectionIndices(sectors, sector, index) {
        var length = sectors.length;
        var cpt = 0;
        var intersectionIndexes = [];
        for (var i = 0; i < length; i++) {
            if (i === index) continue;
            var otherSector = sectors[i];
            if (this.sectorsIntersect(sector, otherSector)) {
                intersectionIndexes.push(i);
            }
        }
        return intersectionIndexes;
    }

    /**
     * Connected components of intersecting sectors
     * @param {Array<number>} cc the returned connected component
     * @param {Array<Arc>} elements the sectors
     * @param {number} index current index
     * @param {Array<number>} knownIndices
     */
    connectedComponents(cc, elements, index, knownIndices) {
        if (knownIndices.indexOf(index) >= 0 || index >= elements.length) return;
        knownIndices.push(index);
        cc.push(index);
        var indices = elements[index];
        for (var i = 0; i < indices.length; i++) {
            var newIndex = indices[i];
            this.connectedComponents(cc, elements, newIndex, knownIndices);
        }
    }

    /**
     * Whether two arrays are equal
     * @param {Array} a
     * @param {Array} b
     * @returns {Boolean}
     */
    arraysEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;

        var copyA = a.slice();
        copyA.sort();
        var copyB = b.slice();
        copyB.sort();
        for (var i = 0; i < copyA.length; ++i) {
            if (copyA[i] !== copyB[i]) return false;
        }
        return true;
    }


    /**
     * Removes the duplicates in an array
     * @param {Array} cc
     * @returns {Array} array without duplicates
     */
    removeDuplicates(cc) {
        var that = this;
        var unique = cc.filter(function(elem, index, self) {
            return index === cc.findIndex(function(elem2) {
                return that.arraysEqual(elem, elem2);
            });
        });
        return unique;
    }

    /**
     * Converts an angle in degrees to a 2D vector
     * @param {number} angle
     * @returns {Array<number>} 2D vector
     */
    angleToVector(angle) {
        var rad = angle * Math.PI / 180;
        var x = Math.cos(rad);
        var y = Math.sin(rad);
        return [x, y];
    }

    /**
     * Converts an angle to a 2D plane
     * @param {number} angle
     * @param {Array<number>} center
     * @param {Boolean=} isAlpha starting or ending angle of the sector
     * @returns {Plane}
     */
    angleToPlane(angle, center, isAlpha = false) {
        var vector = this.angleToVector(angle);

        var orthogonalVector = [vector[1], -vector[0]];
        if (isAlpha)
            orthogonalVector = [-orthogonalVector[0], -orthogonalVector[1]];
        var plane = new Plane(center, orthogonalVector);
        return plane;
    }

    /**
     * Complementary sector : sector with normal with reversed direction
     * @param {Sector} sector
     * @returns {Sector} complementary sector
     */
    complementarySector(sector) {
        var center = sector.firstPlane.center;
        var normal1 = sector.firstPlane.normal;
        var normal2 = sector.secondPlane.normal;
        var ort1 = [normal1[1], -normal1[0]];
        var ort2 = [-normal2[1], normal2[0]];

        var dirVector = [(ort1[0] + ort2[0]) / 2, (ort1[1] + ort2[1]) / 2];
        var minusNormal1 = [-normal1[0], -normal1[1]];
        var minusNormal2 = [-normal2[0], -normal2[1]];
        var newCenter = [center[0] - dirVector[0],
                         center[1] - dirVector[1]];
        var compSector = new Sector(newCenter, minusNormal1, minusNormal2);
        return compSector;
    }


    /**
     * Bounding box of sectors
     * @param {Array<Arc>} cones
     * @returns {Array<Array<number>>} the bounding box
     */
    boundingBox(cones) {
        var low = [Number.MAX_VALUE, Number.MAX_VALUE];
        var up = [Number.MIN_VALUE, Number.MIN_VALUE];
        for (var i = 0; i < cones.length; i++) {
            var cone = cones[i];
            var position = cone.position;
            for (let j = 0; j < 2; j++) {
                low[j] = (position[j] < low[j]) ? position[j] : low[j];
                up[j] = (position[j] > up[j]) ? position[j] : up[j];
            }
        }
        return [low, up];
    }


    /**
     * Position from direction
     * @param {Array<Array<number>>} boundingBox
     * @param {Object} cones
     * @returns {Array<number>} position
     */
    positionFromDirection(boundingBox, cones) {
        var meanVector = [0,0];
        for (let i = 0; i < cones.length; i++) {
            var vector = cones[i].vector;
            for (let j = 0; j < meanVector.length; j++)
                meanVector[j] += vector[j];
        }
        var norm = euclideanDistance([0,0], meanVector);
        for (let i = 0; i < meanVector.length; i++) {
            meanVector[i] /= -norm;
        }

        var position = boundingBox[0];
        if (meanVector[0] > 0) {
            position[0] = boundingBox[1][0];
        }
        if (meanVector[1] > 0) {
            position[1] = boundingBox[1][1];
        }
        return position;
    }


    /**
     * Returns the connected component with minimum intersecting elements
     * @param {Array<Array<Object>>} elements
     * @returns {Array<Object>} elements with min intersection
     */
    minimumIntersectingElements(elements) {
        var minElements = [];
        var minLength = Number.MAX_VALUE;
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].length < minLength)
                minLength = elements[i].length;
        }
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].length === minLength) {
                minElements.push(i);
            }
        }
        return minElements;
    }

    /**
     * List of parent nodes until root
     * @param {Node} node
     * @returns {Array<Node>}
     */
    traversedNodes(node) {
        var parent = node;
        var parentNodes = [];
        while (parent) {
            parentNodes.push(parent.value);
            parent = parent.parent;
        }
        return parentNodes;
    }

    /**
     * Sectors from indices
     * @param {Array<number>} elements
     * @returns {Array<Arc>} sectors
     */
    sectorsFromIndices(elements) {
        var sectors = [];
        for (let i = 0; i < elements.length; i++) {
            var sector = this.sectors[elements[i]];
            sectors.push(sector);
        }
        return sectors;
    }

    /**
     * Function returning the maximum number of intersection for the given sectors
     * @param {Array<Arc>} sectors
     * @returns {number} max number of intersection
     */
    maxNumberIntersection(sectors) {
        var nb = 0;
        for (let index in sectors) {
            var sector = sectors[index];
            for (let index2 in sectors) {
                if (index2 <= index) continue;
                var otherSector = sectors[index2];
                if (this.sectorsIntersect(sector, otherSector)) {
                    nb++;
                }
            }
        }
        return nb;
    }

    /**
     * Computes the max number of self intersections
     * @param {Array} elements
     * @returns {number}
     */
    maxNumberSelfIntersections(elements) {
        var max = -1;
        for (let indices of elements) {
            var sectors = this.sectorsFromIndices(indices);
            var nb = this.maxNumberIntersection(sectors);
            if (nb > max) {
                max = nb;
            }
        }
        return max;
    }

    /**
     * Checks whether a sector is already existing in a parent
     * @param {Node} node
     * @param {Arc} sector
     * @returns {boolean} found
     */
    findSectorInParents(node, sector) {
        var parent = node;
        var plane2 = this.complementarySector(sector);
        var found = false;
        while (parent && !found) {
            if (parent.value.equals(sector) || parent.value.equals(plane2))
                found = true;
            parent = parent.parent;
        }
        return found;
    }

    /**
     * Computes the best separating sector
     * @param {Array<Arc>} sectors
     * @param {Node} node
     * @param {Boolean=} isMinDifference strategy used
     * @returns {Arc} best sector
     */
    separatingPlane(sectors, node, isMinDifference = false) {
        var absDiff = ((a,b) => Math.abs(a-b));
        var absDiffPositive = ((a,b) => (a === 0 || b === 0) ? 0 : Math.abs(a-b));
        var func = (isMinDifference) ? absDiffPositive : absDiff;
        var difference = (isMinDifference) ? -1 : Number.MAX_VALUE;

        var parents = this.traversedNodes(node);

        var bestSector;
        for (let i = 0; i < sectors.length; i++) {
            if (!isMinDifference && difference === 0) break;
            var sector = sectors[i];
            var sectorPlane = this.convertArcToHalfPlanes(sector);
            var number = this.differenceAboveBelowPlane(sectorPlane, sectors, func);
            var found = this.addedSectors.findIndex(function(op) {
                return sectorPlane.equals(op);
            });
            found = this.findSectorInParents(node, sectorPlane);
            var condition = (isMinDifference) ? number > difference : number < difference;
            if (condition && !found) {
                difference = number;
                bestSector = sectorPlane;
            }

        }
        console.log(node.value);
        console.log(difference);
        if (bestSector)
            this.addedSectors.push(bestSector);
        return bestSector;
    }

    /**
     * Number of sectors above/below the sector
     * @param {Arc} sector
     * @param {Array<Arc>} sectors
     * @param {Function} func function to use
     * @returns {Object} number of planes above/below sector
     */
    differenceAboveBelowPlane(sector, sectors, func = Math.abs) {
        var numberLeft = 0;
        var numberRight = 0;
        var compSector = this.complementarySector(sector);
        for (let i = 0; i < sectors.length; i++) {
            var otherSector = sectors[i];
            var left = false, right = false;
            if (sector.isSectorAbove(otherSector)) {
                left = true;
            }
            if (compSector.isSectorAboveComplementary(otherSector)) {
                right = true;
            }
            if (left  // && !right
               )
                numberLeft++;
            if (right  // && !left
               )
                numberRight++;
        }
        return func(numberLeft, numberRight);
    }

    /**
     * Converts a connected component to an angular sector
     * @param {Object} cc
     * @returns {Arc} angular sector
     */
    connectedComponentToSector(cc) {
        var cones = [];
        var minAlpha = 360;
        var maxOmega = 0;
        for (var i = 0; i < cc.length; i++) {
            var arc = this.sectors[cc[i]];
            var alpha = arc.alpha;
            var omega = arc.omega;

            if (alpha < minAlpha) {
                minAlpha = alpha;
            }

            if (omega > maxOmega) {
                maxOmega = omega;
            }

            var vector = this.angleToVector((alpha + omega) / 2);
            cones.push({position: arc.center, vector: vector});
        }
        var bb = this.boundingBox(cones);
        var position = this.positionFromDirection(bb, cones);
        return new Arc(position, 100, minAlpha, maxOmega);
    }

    /**
     * Computes the data structure
     * @param {Array} ccSectors
     * @param {Node} node
     * @param {Array} cc
     * @param {number} indices
     */
    buildTreeRecursive(ccSectors, node, cc, indices) {
        if (indices.length === 0) return;
        var currentCCSectors = [];
        for (let i = 0; i < indices.length; i++) {
            let cs = ccSectors[indices[i]];
            currentCCSectors.push(cs);
        }
        var sector = ccSectors[indices[0]];
        var sectorHalfPlanes = this.convertArcToHalfPlanes(sector);
        var secondSector = this.complementarySector(sectorHalfPlanes);
        var firstChild = new Node(sectorHalfPlanes);
        var secondChild = new Node(secondSector);

        if (indices.length === 1 || !sector) {
            let currentSectors = [];
            let ccIndices = [];
            for (let index of indices) {
                ccIndices = cc[index];
                for (let ccIndex of ccIndices) {
                    currentSectors.push(this.sectors[ccIndex]);
                }
            }

            this.separateIntersectingSectors(currentSectors, node, ccIndices);
            return;
        }
        node.addChild(firstChild);
        node.addChild(secondChild);

        var secondIndices = indices.slice(1,indices.length);
        this.buildTreeRecursive(ccSectors, firstChild, cc,  [indices[0]]);
        this.buildTreeRecursive(ccSectors, secondChild, cc, secondIndices);
    }


    /**
     * Depth of a node
     * @param {Node} node
     * @returns {number} depth
     */
    depth(node) {
        var parent = node;
        var nb = 0;
        while (parent) {
            parent = parent.parent;
            nb++;
        }
        return nb;
    }

    /**
     * Separate sectors which intersect (no proper delineating sector)
     * @param {Array<Arc>} sectors
     * @param {Node} node modified node
     * @param {Array<number>} cc
     * @returns {void} nothing
     */
    separateIntersectingSectors(sectors, node, cc) {
        var that = this;
        var isLeaf = cc.every(function(element) {
            return that.addedSectors.indexOf(element) !== -1;
        });
        var currentSector = node.value;
        var bestSeparation = this.separatingPlane(sectors, node, false);
        if (currentSector.firstPlane.normal[0] !== 0 && currentSector.firstPlane.normal[1] !== 0 && this.maxNumberLeaves <= this.depth(node) // - node.children.length
            || !bestSeparation) {
            var nodes = [];
            for (var i  = 0; i < sectors.length; i++) {
                let child = new Node(sectors[i]);
                node.addChild(child);
            }
            return;
        }

        var compBestSeparation = this.complementarySector(bestSeparation);
        var splitPlanes = [bestSeparation, compBestSeparation];
        for (let j = 0; j < splitPlanes.length; j++) {
            let splitPlane = splitPlanes[j];
            let child = new Node(splitPlane);
            child.setParentNode(node);
            // Left child
            // if (j === 0) {
            //     child.addChild(new Node(associatedSector));
            // }
            let subsectors = [];
            for (let k = 0; k < sectors.length; k++) {
                let sector = sectors[k];
                var isAbove;
                if (j === 0)
                    isAbove = splitPlane.isSectorAbove(sector);
                else
                    isAbove = splitPlane.isSectorAboveComplementary(sector);
                // let isAddedSector = (sector.equals(bestSeparation));
                if (isAbove //&& !isAddedSector
                   ) {
                       subsectors.push(sector);
                   }
            }

            this.separateIntersectingSectors(subsectors, child, cc);
            node.addChild(child);
        }

        return;
    }

    /**
     * Number of intersections with half planes
     * @param {Arc} sector
     * @param {Array<Arc>} sectors
     * @returns {number} number of intersections
     */
    numberIntersectionHalfPlanes(sector, sectors) {
        var nb = 0;
        for (let sector2 of sectors) {
            if (sector.isSectorAbove(sector2)) {
                nb++;
            }
        }
        return nb;

    }

    /**
     * Number intersection
     * @param {Arc} sector
     * @param {Array<Arc>} sectors
     * @returns {number} nb
     */
    numberIntersection(sector, sectors) {
        var nb = 0;
        for (let sector2 of sectors) {
            if (this.sectorsIntersect(sector, sector2)) {
                nb++;
            }
        }
        return nb;
    }

    /**
     * Sorting by number intersecting
     * @param {Array<Arc>} sectors
     * @returns {void} sorted sectors
     */
    sortByNumberInTersection(sectors) {
        var that = this;
        sectors.sort(function(a,b) {
            return that.numberIntersection(a, sectors) - that.numberIntersection(b, sectors);
        });
    }

    /**
     * Intersections between sectors
     * @param {Arc} sector
     * @param {Array<Arc>} sectors
     * @returns {Array<Object>} intersections
     */
    intersections(sector, sectors) {
        var inters = [];
        inters.push(sector);
        for (let sector2 of sectors) {
            if (this.sectorsIntersect(sector, sector2)) {
                inters.push(sector2);
            }
        }
        return inters;
    }


    /**
     * Build tree main function
     * @param {Node} node
     * @param {Array<Arc>} sectors
     */
    buildTreeIntersection(node, sectors) {
        if (sectors.length === 0) return;
        var sector = sectors.shift();
        var inters = this.intersections(sector, sectors);
        var converted = this.convertArcToHalfPlanes(sector);
        var convertedComp = this.complementarySector(converted);
        var child = new Node(converted);
        child.setParentNode(node);
        for (let s of inters) {
            child.addChild(new Node(s));
        }
        var child2 = new Node(convertedComp);
        node.addChild(child);
        node.addChild(child2);
        this.buildTreeIntersection(child2, sectors);
    }

    /**
     * Loading the data structure
     * @param {boolean} useHeuristic heuristic for number of leaves
     */
    load(useHeuristic = false) {
        this.sortByNumberIntersection(this.sectors);
        var index = 0;
        this.buildTreeIntersection(this.tree, this.sectors);
        // var elements = [];
        // for (let i = 0; i < this.sectors.length; i++) {
        //     let arc = this.sectors[i];
        //     let intersectingI = this.intersectionIndices(this.sectors, arc, i);
        //     elements.push(intersectingI);
        // }
        // if (useHeuristic) {
        //     var nb = this.maxNumberSelfIntersections(elements);
        //     this.nb = nb;
        // }

        // var connectedComponents = [];
        // for (let i = 0; i < elements.length; i++) {
        //     let cc = [];
        //     this.connectedComponents(cc, elements, i, []);
        //     connectedComponents.push(cc);
        // }
        // connectedComponents = this.removeDuplicates(connectedComponents);

        // connectedComponents.sort(function(a,b) {
        //     return (a.length - b.length);
        // });

        // var connectedSectors = [];
        // for (let i = 0; i < connectedComponents.length; i++) {
        //     var connectedSector = this.connectedComponentToSector(connectedComponents[i]);
        //     connectedSectors.push(connectedSector);
        // }

        // var length = connectedSectors.length;
        // var indices = [...Array(length).keys()];
        // this.buildTreeRecursive(connectedSectors, this.tree, connectedComponents, indices);
        // console.log(this.tree);
    }

    /**
     * Search function recursive
     * @param {Array<number>} p point
     * @param {Array<Node>} hits
     * @param {Node} node current node
     * @param {Object} number of hits
     * @returns {void} nothing
     */
    searchRecursive(p, hits, node, number) {
        number++;
        var hasChildren = node.children;
        if (!hasChildren) return number;
        var nbChildren = node.children.length;
        var index = 0;
        //If it is a sector, return all sectors from this node
        while (index < nbChildren && node.children[index].value.radius) {
            var currentChild = node.children[index].value;
            var found = hits.findIndex(function(a) {
                return a.center[0] === currentChild.center[0] &&
                    a.center[1] === currentChild.center[1] &&
                    a.alpha === currentChild.alpha &&
                    a.omega === currentChild.omega;
            });
            if (found === -1)
                hits.push(currentChild);
            index++;
        }

        if (index >= nbChildren) { // a leaf was reached
            return number;
        }
        var childLeft = node.children[index];
        var childRight = node.children[index + 1];
        if (childLeft.value.isAbove(p)) {
            number = this.searchRecursive(p, hits, childLeft, number);
        }
        else {
            number = this.searchRecursive(p, hits, childRight, number);
        }
        return number;
    }

    /**
     * Search function
     * @param {Array<number>} p
     * @returns {Array<Node>} the hits
     */
    search(p) {
        console.log("search");
        var hits = [];
        var number = 0;
        number = this.searchRecursive(p, hits, this.tree, number);
        console.log(number);
        return hits;
    }
}
