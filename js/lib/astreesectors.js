import Arc from './arc.js';
import {halfLineIntersection, segmentIntersection} from './lineintersection.js';
import {euclideanDistance} from './distance.js';
import Plane from './plane.js';
import Sector from './sector.js';

class Node {
    constructor(value)  {
        this.value = value;
        this.children = [];
        this.parent = null;
    }

    setParentNode(node) {
        this.parent = node;
    }

    getParentNode() {
        return this.parent;
    }

    addChild(node) {
        if (!this.hasChild(node)) {
            node.setParentNode(this);
            this.children[this.children.length] = node;
        }
    }

    getChildren() {
        return this.children;
    }

    removeChildren () {
        this.children = [];
    }

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

export default class ASTreeSectors {

    constructor(sectors, n = 2) {
        this.tree = new Node(new Sector([0,0], [0,0], [0,0]));
        this.sectors = sectors;
        this.maxNumberLeaves = n;
        this.addedSectors = [];
    }

    convertArcToHalfPlanes(sector) {
        var plane1 = this.angleToPlane(sector.alpha, sector.center, true);
        var plane2 = this.angleToPlane(sector.omega, sector.center);
        var sectorAsPlanes = new Sector(sector.center, plane1.normal, plane2.normal);

        return sectorAsPlanes;
    }

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

    removeDuplicates(cc) {
        var that = this;
        var unique = cc.filter(function(elem, index, self) {
            return index === cc.findIndex(function(elem2) {
                return that.arraysEqual(elem, elem2);
            });
        });
        return unique;
    }


    angleToVector(angle) {
        var rad = angle * Math.PI / 180;
        var x = Math.cos(rad);
        var y = Math.sin(rad);
        return [x, y];
    }

    angleToPlane(angle, center, isAlpha = false) {
        var vector = this.angleToVector(angle);

        var orthogonalVector = [vector[1], -vector[0]];
        if (isAlpha)
            orthogonalVector = [-orthogonalVector[0], -orthogonalVector[1]];
        var plane = new Plane(center, orthogonalVector);
        return plane;
    }

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


    traversedNodes(node) {
        var parent = node;
        var parentNodes = [];
        while (parent) {
            parentNodes.push(parent.value);
            parent = parent.parent;
        }
        return parentNodes;
    }

    sectorsFromIndices(elements) {
        var sectors = [];
        for (let i = 0; i < elements.length; i++) {
            var sector = this.sectors[elements[i]];
            sectors.push(sector);
        }
        return sectors;
    }

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
            // found = parents.findIndex(function(op) {
            //     return sectorPlane.equals(op);
            // });
            var condition = (isMinDifference) ? number > difference : number < difference;
            if (condition && found === -1) {
                difference = number;
                bestSector = sectorPlane;
            }

        }
        if (bestSector)
            this.addedSectors.push(bestSector);
        return bestSector;
    }

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

            //            this.separateIntersectingSectors(currentSectors, node, ccIndices);
            console.log(indices);
            for (let i = 0; i < indices.length; i++) {
                node.addChild(new Node(ccSectors[indices[i]]));
            }
            return;
        }
        node.addChild(firstChild);
        node.addChild(secondChild);

        var secondIndices = indices.slice(1,indices.length);
        this.buildTreeRecursive(ccSectors, firstChild, cc,  [indices[0]]);
        this.buildTreeRecursive(ccSectors, secondChild, cc, secondIndices);
    }


    separateIntersectingSectors(sectors, node, cc) {
        var that = this;
        var isLeaf = cc.every(function(element) {
            return that.addedSectors.indexOf(element) !== -1;
        });
        var bestSeparation = this.separatingPlane(sectors, node, false);
        if (sectors.length <= this.maxNumberLeaves // - node.children.length
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

    numberIntersection(sector, sectors) {
        var nb = 0;
        for (let sector2 of sectors) {
            if (this.sectorsIntersect(sector, sector2)) {
                nb++;
            }
        }
        return nb;
    }

    sortByNumberIntersection(sectors) {
        var that = this;
        sectors.sort(function(a,b) {
            return that.numberIntersection(a, sectors) - that.numberIntersection(b, sectors);
        });
    }

    intersections(sector) {
        var inters = [];
        inters.push(sector);
        for (let sector2 of this.sectors) {
            if (this.sectorsIntersect(sector, sector2)) {
                inters.push(sector2);
            }
        }
        return inters;
    }


    buildTreeIntersection(node) {
        if (this.sectors.length === 0) return;
        var sector = this.sectors.shift();
        var inters = this.intersections(sector);
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
        this.buildTreeIntersection(child2);
    }


    load(useHeuristic = false) {
        this.sortByNumberIntersection(this.sectors);
        var index = 0;
        this.buildTreeIntersection(this.tree, index);
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
        console.log(this.tree);
    }

    searchRecursive(p, hits, node) {
        console.log(node);
        var hasChildren = node.children;
        if (!hasChildren) return;
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
            this.searchRecursive(p, hits, childLeft);
        }
        else {
            this.searchRecursive(p, hits, childRight);
        }

    }

    search(p) {
        console.log("search");
        var hits = [];
        this.searchRecursive(p, hits, this.tree);
        return hits;
    }
}
