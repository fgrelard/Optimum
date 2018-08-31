import Arc from './arc.js';
import {halfLineIntersection, segmentIntersection} from './lineintersection.js';
import {euclideanDistance} from './distance.js';
import Plane from './plane.js';

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

export default class ASTree {

    constructor(sectors, n = 2) {
        this.tree = new Node(new Plane([0,0], [0,0]));
        this.sectors = sectors;
        this.maxNumberLeaves = n;
        this.addedSectors = [];
    }


    intersectingSectors(sectors, sector, index) {
        var f = sector.center;
        var la = sector.fullGeometry[1].getFlatCoordinates();
        var lo = sector.fullGeometry[2].getFlatCoordinates();
        var length = sectors.length;
        var cpt = 0;
        var intersectionIndexes = [];
        for (var i = 0; i < length; i++) {
            if (i === index) continue;
            var sectorOther = sectors[i];
            var fOther = sectorOther.center;
            var laOther = sectorOther.fullGeometry[1].getFlatCoordinates();
            var loOther = sectorOther.fullGeometry[2].getFlatCoordinates();
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
            if (i1 || i2 || i3 || i4) {
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

    complementaryPlane(plane) {
        var normal = plane.normal;
        var minusNormal = [-normal[0], -normal[1]];
        var center = [plane.center[0] + minusNormal[0],
                      plane.center[1] + minusNormal[1]];
        return new Plane(center, minusNormal);
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

    separatingPlane(sectors, isMinDifference = false) {
        var absDiff = ((a,b) => Math.abs(a-b));
        var absDiffPositive = ((a,b) => (a === 0 || b === 0) ? 0 : Math.abs(a-b));
        var func = (isMinDifference) ? absDiffPositive : absDiff;
        var difference = (isMinDifference) ? -1 : Number.MAX_VALUE;
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
                    var condition = (isMinDifference) ? number > difference : number < difference;
                    if (condition && found === -1) {
                        difference = number;
                        bestPlane = plane;
                        bestSector = sector;
                    }
                }
            }
        }
        if (bestPlane)
            this.addedSectors.push(bestSector);
        return {plane: bestPlane, sector: bestSector};
    }

    differenceAboveBelowPlane(plane, sectors, func = Math.abs) {
        var numberLeft = 0;
        var numberRight = 0;
        var plane2 = this.complementaryPlane(plane);
        for (let i = 0; i < sectors.length; i++) {
            var sector = sectors[i];
            if (plane.isSectorAbove(sector)) {
                numberLeft++;
            }
            if (plane2.isSectorAbove(sector)) {
                numberRight++;
            }
        }
        return func(numberLeft, numberRight);
    }


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

    buildTreeRecursive(ccSectors, node, cc, indices) {

        if (indices.length === 0) return;
        var currentCCSectors = [];
        for (let i = 0; i < indices.length; i++) {
            let cs = ccSectors[indices[i]];
            currentCCSectors.push(cs);
        }
        var firstPlane = this.separatingPlane(currentCCSectors).plane;
        if (indices.length === 1 || !firstPlane) {
            let currentSectors = [];
            let ccIndices = [];
            for (let index of indices) {
                //console.log(cc[index]);
                ccIndices = cc[index];
                for (let ccIndex of ccIndices) {
                    currentSectors.push(this.sectors[ccIndex]);
                }
            }
            if (!firstPlane) {
                console.log(indices);
            }
            this.separateIntersectingSectors(currentSectors, node, ccIndices);
            return;
        }


        var secondPlane = this.complementaryPlane(firstPlane);
        var firstChild = new Node(firstPlane);
        var secondChild = new Node(secondPlane);
        var firstSectors = [], secondSectors = [];
        for (let i = 0; i < indices.length; i++) {
            let index = indices[i];
            let cc = ccSectors[index];
            if (firstPlane.isSectorAbove(cc))
                firstSectors.push(index);
            if (secondPlane.isSectorAbove(cc))
                secondSectors.push(index);
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

    separateIntersectingSectors(sectors, node, cc) {
        var that = this;
        var isLeaf = cc.every(function(element) {
            return that.addedSectors.indexOf(element) !== -1;
        });
        if (sectors.length <= this.maxNumberLeaves - node.children.length || isLeaf) {
            var nodes = [];
            for (var i  = 0; i < sectors.length; i++) {
                let child = new Node(sectors[i]);
                node.addChild(child);
            }
            return;
        }
        var bestSeparation = this.separatingPlane(sectors, true);
        var plane = bestSeparation.plane;
        if (!plane) return;
        var plane2 = this.complementaryPlane(plane);
        var associatedSector = bestSeparation.sector;
        var splitPlanes = [plane, plane2];
        for (let j = 0; j < splitPlanes.length; j++) {
            let splitPlane = splitPlanes[j];
            let child = new Node(splitPlane);
            child.setParentNode(node);
            // Left child
            if (j === 0) {
                child.addChild(new Node(associatedSector));
            }
            let subsectors = [];
            for (let k = 0; k < sectors.length; k++) {
                let sector = sectors[k];
                let isAbove = splitPlane.isSectorAbove(sector);
                let isAddedSector = (sector.equals(associatedSector));
                if (isAbove && !isAddedSector) {
                    subsectors.push(sector);
                }
            }

            this.separateIntersectingSectors(subsectors, child, cc);
            node.addChild(child);
        }

        return;
    }

    load() {
        var elements = [];
        for (let i = 0; i < this.sectors.length; i++) {
            let arc = this.sectors[i];
            let intersectingI = this.intersectingSectors(this.sectors, arc, i);
            elements.push(intersectingI);
        }

        var connectedComponents = [];
        for (let i = 0; i < elements.length; i++) {
            let cc = [];
            this.connectedComponents(cc, elements, i, []);
            connectedComponents.push(cc);
        }
        connectedComponents = this.removeDuplicates(connectedComponents);

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

    searchRecursive(p, hits, node) {
        var hasChildren = node.children;
        if (!hasChildren) return;
        console.log(node);
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
    }}
