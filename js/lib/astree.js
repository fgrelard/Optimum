/**
 * @fileOverview Data structure based on separating planes for angular sectors
 * @name astree.js
 * @author
 * @license
 */
import Arc from './arc.js';
import {halfLineIntersection, halfLineAndLineIntersection, segmentIntersection} from './lineintersection.js';
import {euclideanDistance} from './distance.js';
import Plane from './plane.js';

/**
 * Class representing a node inside the tree
 * @deprecated use {@link DualRtree}
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

/** Data structure used for angular sectors,
 * based on the lines delimiting each angular sector
 * the delineation is done according to the line which separates
 * the angular sectors into two balanced groups
 * @deprecated use {@link DualRtree}
 */
export default class ASTree {

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
        this.tree = new Node(new Plane([0,0], [0,0]));

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

        /**
         * counter
         * @type {number}
         */
        this.cpt = 0;
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
     * Complementary plane : plane with normal with reversed direction
     * @param {Plane} plane
     * @returns {Plane} complementary
     */
    complementaryPlane(plane) {
        var normal = plane.normal;
        var minusNormal = [-normal[0], -normal[1]];
        var center = [plane.center[0] + minusNormal[0],
                      plane.center[1] + minusNormal[1]];
        return new Plane(center, minusNormal);
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
     * Computes the best separating plane
     * @param {Array<Arc>} sectors
     * @param {Node} node
     * @param {Boolean=} isMinDifference strategy used
     * @returns {Plane} best plane
     */
    separatingPlane(sectors, node, isMinDifference = false) {
        var absDiff = ((a,b) => Math.abs(a-b));
        var absDiffPositive = ((a,b) => (a === 0 || b === 0) ? 0 : Math.abs(a-b));
        var func = (isMinDifference) ? absDiffPositive : absDiff;
        var difference = (isMinDifference) ? -1 : Number.MAX_VALUE;

        var arrayDiff = [];
        var bestPlane;
        var bestSector;
        for (let i = 0; i < sectors.length; i++) {
            if (!isMinDifference && difference === 0) break;
            var sector = sectors[i];
            for (var property in sector) {
                if (property === "alpha" || property === "omega") {
                    var plane = this.angleToPlane(sector[property], sector.center, property === "alpha");
                    var number = this.differenceAboveBelowPlane(plane, sectors, func);
                    var found = this.addedSectors.findIndex(function(op) {
                        return sector.equals(op);
                    });
                    found = this.findPlaneInParents(node, plane);
                    if (!found) {
                        arrayDiff.push(number);
                    }
                    var condition = (isMinDifference) ? number > difference : number < difference;
                    if (condition && !found) {
                        difference = number;
                        bestPlane = plane;
                        bestSector = sector;
                    }
                }
            }
        }
        arrayDiff.sort(function(a,b) {
            var diff = func(a.l, a.r) - func(b.l, b.r);
            return diff;
        });
        arrayDiff.sort(function(a,b) {
            var diff = func(a.l, a.r) - func(b.l, b.r);
            var diffI = func(a.i, b.i);
            return (diff === 0) ? diffI : 0;
        });
        if (arrayDiff.length > 0) {
            bestPlane = arrayDiff[0].p;
        }
        return {plane: bestPlane};
    }

    /**
     * Number of sectors above/below the plane
     * @param {Plane} plane
     * @param {Array<Arc>} sectors
     * @param {Function} func function to use
     * @returns {Object} number of planes above/below plane
     */
    differenceAboveBelowPlane(plane, sectors, func) {
        var numberLeft = 0;
        var numberRight = 0;
        var numberIntersection = 0;
        var left = false, right = false;
        var plane2 = this.complementaryPlane(plane);
        for (let i = 0; i < sectors.length; i++) {
            var sector = sectors[i];
            if (plane.isAbove(sector.center)) {
                numberLeft++;
                left = true;
            }
            else if (plane2.isAbove(sector.center)) {
                // if (!left)
                numberRight++;
            }
            if (plane.isSectorAbove(sector) &&
                plane2.isSectorAbove(sector, true)){
                numberIntersection++;
            }

        }
        // return func(numberLeft, numberRight);
        return {p: plane,
                l: numberLeft,
                r: numberRight,
                i: numberIntersection};
    }


    /**
     * Converts a connected component to an angular sector
     * @param {Object} cc
     * @returns {Arc} angular sector
     */
    connectedComponentToAngularSector(cc) {
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
        var min = -1;
        for (let index in sectors) {
            var sector = sectors[index];
            var nb = 0;
            for (let index2 in sectors) {
                var otherSector = sectors[index2];
                if (this.sectorsIntersect(sector, otherSector)) {
                    nb++;
                }
            }
            if (nb > min) {
                min = nb;
            }
        }
        return Math.min(min, sectors.length);
    }

    /**
     * Number of intersection
     * @param {Arc} sector
     * @param {Array<Arc>} sectors
     * @returns {number} the number of intersection
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
     * Sorting by number of intersection
     * @param {Array<Arc>} sectors
     * @returns {Array<Arc>} sorted
     */
    sortByNumberIntersection(sectors) {
        var that = this;
        sectors.sort(function(a,b) {
            return that.numberIntersection(a, sectors) - that.numberIntersection(b, sectors);
        });
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
        return max+1;
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
        var firstPlane = this.separatingPlane(currentCCSectors, node).plane;
        var addedBoth = false;
        if (indices.length === 1 || !firstPlane || addedBoth) {
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

        var secondPlane = this.complementaryPlane(firstPlane);
        var firstChild = new Node(firstPlane);
        var secondChild = new Node(secondPlane);
        var firstSectors = [], secondSectors = [];
        var addedBoth = false;
        for (let i = 0; i < indices.length; i++) {
            let index = indices[i];
            let cc = ccSectors[index];
            let cptBoth = 0;
            if (firstPlane.isSectorAbove(cc)) {
                firstSectors.push(index);
                cptBoth++;
            }
            if (secondPlane.isSectorAbove(cc, true)) {
                cptBoth++;
                secondSectors.push(index);
            }
            addedBoth = (cptBoth === 2);
        }



        if (firstSectors.length > 0 && secondSectors.length > 0) {
            node.addChild(firstChild);
            node.addChild(secondChild);
        } else { //Plane does not allow separation of angular sectors
            firstChild = node;
            secondChild = node;
        }

        this.buildTreeRecursive(ccSectors, firstChild, cc, firstSectors);
        this.buildTreeRecursive(ccSectors, secondChild, cc, secondSectors);
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
     * Checks whether a plane is already existing in a parent
     * @param {Node} node
     * @param {Plane} plane
     * @returns {boolean} found
     */
    findPlaneInParents(node, plane) {
        var parent = node;
        var plane2 = this.complementaryPlane(plane);
        var found = false;
        while (parent && !found) {
            if (parent.value.equals(plane) || parent.value.equals(plane2))
                found = true;
            parent = parent.parent;
        }
        return found;
    }

    /**
     * Separate sectors which intersect (no proper delineating plane)
     * @param {Array<Arc>} sectors
     * @param {Node} node modified node
     * @param {Array<number>} cc
     * @returns {void} nothing
     */
    separateIntersectingSectors(sectors, node, cc) {
        // if (this.cpt > 1000) return;
        // this.cpt++;
        var that = this;
        var isLeaf = cc.every(function(element) {
            return that.addedSectors.indexOf(element) !== -1;
        });

        if (sectors.length <= this.maxNumberLeaves
            // || isLeaf
           ) {
               var nodes = [];
               for (var i  = 0; i < sectors.length; i++) {
                   let child = new Node(sectors[i]);
                   node.addChild(child);
               }
               return;
           }
        var bestSeparation = this.separatingPlane(sectors, node, false);
        var plane = bestSeparation.plane;
        if (!plane) return;
        var plane2 = this.complementaryPlane(plane);
        var splitPlanes = [plane, plane2];
        for (let j = 0; j < splitPlanes.length; j++) {
            let splitPlane = splitPlanes[j];
            let child = new Node(splitPlane);
            child.setParentNode(node);
            let subsectors = [];

            for (let k = 0; k < sectors.length; k++) {
                let sector = sectors[k];
                let isAbove = splitPlane.isSectorAbove(sector, j === 1);
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
     * Whether two sectors intersect
     * @param {Arc} sector
     * @param {Arc} otherSector
     * @param {boolean=} first
     * @returns {boolean|Object} the intersection
     */
    positionSectorsIntersect(sector, otherSector, first = true) {
        var f = sector.center;
        var la = sector.fullGeometry[1].getFlatCoordinates();
        var lo = sector.fullGeometry[2].getFlatCoordinates();
        var s = (first) ? la : lo;
        var fOther = otherSector.center;
        var laOther = otherSector.fullGeometry[1].getFlatCoordinates();
        var loOther = otherSector.fullGeometry[2].getFlatCoordinates();
        var i1 = halfLineIntersection(f[0], f[1],
                                      s[0], s[1],
                                      fOther[0], fOther[1],
                                      laOther[0], laOther[1]);
        var i2 = halfLineIntersection(f[0], f[1],
                                      s[0], s[1],
                                      fOther[0], fOther[1],
                                      loOther[0], loOther[1]);

        var i3 = halfLineAndLineIntersection(f[0], f[1],
                                             s[0], s[1],
                                             fOther[0], fOther[1],
                                             loOther[0], loOther[1]
                                            );


        var p1 = (i1) ? [i1.x, i1.y] : f;
        var p2 = (i2) ? [i2.x, i2.y] : [Number.MAX_VALUE, Number.MAX_VALUE];
        if (euclideanDistance(p1, f) > euclideanDistance(p2, f)) {
            var tmp = p1;
            p1 = p2;
            p2 = tmp;
        }

        // if (!i2 && i3) {
        //     p2 = f.slice();
        // }
        return {i1: p1,
                i2: p2,
                f: f};
    }

    /**
     * Intersections between sectors
     * @param {Array<Arc>} sectors
     * @param {Boolean=} first
     * @returns {Array<Object>} intersections
     */
    intersections(sectors, first = true) {
        var intersections = [];
        for (var sector of sectors) {
            var positions = [];
            for (var otherSector of sectors) {
                var p = this.positionSectorsIntersect(sector, otherSector, first);
                positions.push(p);
            }
            positions.sort(function(a,b) {
                return (a[0] !== sector.center[0] && a[1] !== sector.center[1]) ?
                    (euclideanDistance(a.i1, sector.center) - euclideanDistance(b.i1, sector.center)) :
                    (euclideanDistance(a.i1, a.i2) - euclideanDistance(b.i1, b.i2));
            });
            intersections.push(positions);
        }
        return intersections;
    }

    /**
     * Locally checks for intersections
     * @param {Array} intersection
     * @param {Array<number>} f point
     * @returns {number}
     */
    numberIntersectionLocal(intersection, f) {
        var max = 0;
        var shown = false;
        console.log("numberIntersectionLocal");
        var indexI = 0;
        for (var i of intersection) {
            var indexJ = 0;
            if (this.arraysEqual(i.i1, f)){
                indexI++;
                continue;
            }
            var nb = 1;
            var lowerBound = {i1: i.i1.slice(),
                              i2: i.i2.slice()};

            for (var j of intersection) {
                if (indexJ <= indexI) {
                    indexJ++;
                    continue;
                }
                if (this.arraysEqual(j.i1, f)) continue;
                if (euclideanDistance(lowerBound.i1, f) <= euclideanDistance(j.i1, f) && euclideanDistance(lowerBound.i2, f) > euclideanDistance(j.i1, f)) {
                    nb++;
                    if (nb > max) {
                        max = nb;
                    }
                } else {
                    nb = 1;
                    lowerBound.i2 = j.i2.slice();
                }
                if (j.i2[0] < lowerBound.i2[0]) {
                    lowerBound.i2 = j.i2.slice();
                }

                lowerBound.i1 = j.i1.slice();
            }
        }

        return max;
    }

    /**
     * Max number local intersection
     * @param {Array} intersections
     * @returns {number} max
     */
    maxNumberIntersectionLocal(intersections) {
        var max = 0;
        var iMax = 0;
        for (var index in intersections) {
            var inters = intersections[index].slice();
            var f = inters[0].f.slice();
            var nb = this.numberIntersectionLocal(inters, f);
            if (nb > max) {
                max = nb;
                iMax = index;
            }
        }
        return max+1;
    }

    /**
     * Loading the data structure
     * @param {boolean} useHeuristic heuristic for number of leaves
     */
    load(useHeuristic = false) {
        var elements = [];
        for (let i = 0; i < this.sectors.length; i++) {
            let arc = this.sectors[i];
            let intersectingI = this.intersectionIndices(this.sectors, arc, i);
            elements.push(intersectingI);
        }
        var connectedComponents = [];
        for (let i = 0; i < elements.length; i++) {
            let cc = [];
            this.connectedComponents(cc, elements, i, []);
            connectedComponents.push(cc);
        }
        connectedComponents = this.removeDuplicates(connectedComponents);
        var inters = this.intersections(this.sectors);
        var inters2 = this.intersections(this.sectors, false);
        if (useHeuristic) {
            this.maxNumberLeaves = Math.max(this.maxNumberIntersectionLocal(inters), this.maxNumberIntersectionLocal(inters2));
            this.maxNumberLeaves = this.maxNumberSelfIntersections(elements);
            console.log(this.maxNumberLeaves);
        }

        var connectedSectors = [];
        for (let i = 0; i < connectedComponents.length; i++) {
            var connectedSector = this.connectedComponentToAngularSector(connectedComponents[i]);
            connectedSectors.push(connectedSector);
        }
        var length = connectedSectors.length;
        var indices = [...Array(length).keys()];
        this.buildTreeRecursive(connectedSectors, this.tree, connectedComponents, indices);
        console.log(this.tree);
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
        number.cpt++;
        var hasChildren = node.children;
        if (!hasChildren) {return;}
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
            return;
        }
        var childLeft = node.children[index];
        var childRight = node.children[index + 1];
        if (childLeft.value.isAbove(p)) {
            this.searchRecursive(p, hits, childLeft, number);
        }
        else {
            this.searchRecursive(p, hits, childRight, number);
        }

    }

    /**
     * Search function
     * @param {Array<number>} p
     * @param {Object} number of hits
     * @returns {Array<Node>} the hits
     */
    search(p, number = {cpt : 0}) {
        var hits = [];
        this.searchRecursive(p, hits, this.tree, number);
        return hits;
    }
}
