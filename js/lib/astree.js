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
        this.addedPlanes = [];
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
        //Sorting minElements by max difference between omegas (central element) in ascending order
        // var diffOmegas = [];
        // for (let i = 0; i < minElements.length; i++) {
        //     var omegaCurrent = this.sectors[minElements[i]].omega;

        //     var maxDiffOmega = 0;
        //     for (let j = 0; j < minElements.length; j++) {
        //         var omegaOther = this.sectors[minElements[j]].omega;
        //         var diff = Math.abs(omegaCurrent - omegaOther);
        //         if (diff > maxDiffOmega) {
        //             maxDiffOmega = diff;
        //         }
        //     }
        //     diffOmegas.push(maxDiffOmega);
        // }
        // minElements.sort(function(a,b) {
        //     var i1 = minElements.indexOf(a);
        //     var i2 = minElements.indexOf(b);
        //     return (diffOmegas[i1] - diffOmegas[i2]);
        // });
        return minElements;
    }

    angleToVector(angle) {
        var rad = angle * Math.PI / 180;
        var x = Math.cos(rad);
        var y = Math.sin(rad);
        return [x, y];
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

    splitConnectedComponent(cc, arcs, elements, node) {
        var planes = [];
        var minSet = this.minimumIntersectingElements(elements);
        var m = -1;
        var minCpt = Number.MAX_VALUE;
        var firstPlane, secondPlane;

        for (let i = 0; i < minSet.length; i++) {
            var index = minSet[i];
            if (this.addedPlanes.indexOf(index) !== -1) continue;
            var arc = arcs[index];
            var omega = arc.omega;
            var vector = this.angleToVector(omega);

            var orthogonalVector = [vector[1], -vector[0]];
            var minusOV = [-orthogonalVector[0], -orthogonalVector[1]];
            var center2 = [arc.center[0] + minusOV[0],
                           arc.center[1] + minusOV[1]];
            var plane = new Plane(arc.center, orthogonalVector);
            var plane2 = new Plane(center2, minusOV);
            var alreadyAdded = false, alreadyAdded2 = false;
            for (let j = 0; j < arcs.length; j++) {
                var cpt = 0, cpt2 = 0;
                if (plane.isSectorAbove(arcs[j]))
                    cpt++;
                if (plane2.isSectorAbove(arcs[j]))
                    cpt2++;
                if (cpt < minCpt || cpt2 < minCpt) {
                    minCpt = (cpt < cpt2) ? cpt : cpt2 ;
                    m = index;
                    firstPlane = plane;
                    secondPlane = plane2;
                }
            }
        }

            // var parent = node;
            // while (parent) {
            //     if (parent.value.center && parent.value.normal
            //         && this.arraysEqual(parent.value.center, plane.center)
            //         && this.arraysEqual(parent.value.normal, plane.normal))
            //         alreadyAdded = true;

            //     if (parent.value.center && parent.value.normal
            //         && this.arraysEqual(parent.value.center, plane2.center)
            //         && this.arraysEqual(parent.value.normal, plane2.normal))
            //         alreadyAdded2 = true;
            //     parent = parent.parent;
            // }

        if (m !== -1){
            this.addedPlanes.push(m);
            // if (!alreadyAdded)
            planes.push({plane: firstPlane, index: m});
            // if (!alreadyAdded2)
            planes.push({plane: secondPlane, index: m});
        }
        return planes;
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
        return new Arc(position, 1, minAlpha, maxOmega);
    }



    buildTreeRecursive(sectors, node, indices) {
        var that = this;
        var leaf = indices.every(function(element) {
            return that.addedPlanes.indexOf(element) !== -1;
        });
        if (sectors.length <= this.maxNumberLeaves || leaf) {
            var nodes = [];
            for (var i  = 0; i < sectors.length; i++) {
                let child = new Node(sectors[i]);
                node.addChild(child);
            }
            return;
        }

        console.log(this.addedPlanes);
        var elements = [];
        for (let i = 0; i < sectors.length; i++) {
            let arc = sectors[i];
            let intersectingI = this.intersectingSectors(sectors, arc, i);
            elements.push(intersectingI);
        }

        var connectedComponents = [];
        for (let i = 0; i < elements.length; i++) {
            let cc = [];
            this.connectedComponents(cc, elements, i, []);
            connectedComponents.push(cc);
        }
        connectedComponents = this.removeDuplicates(connectedComponents);
        for (let i = 0; i < connectedComponents.length; i++) {
            var cc = connectedComponents[i];
            if (cc.length > this.maxNumberLeaves) {
                var splitPlanes = this.splitConnectedComponent(cc, sectors, elements, node);
                for (let j = 0; j < splitPlanes.length; j++) {
                    let splitPlane = splitPlanes[j].plane;
                    let child = new Node(splitPlane);
                    child.setParentNode(node);
                    // if (j === 0) {
                    //     let index = splitPlanes[j].index;
                    //     child.addChild(new Node(sectors[index]));
                    // }
                    let subsectors = [];
                    for (let k = 0; k < sectors.length; k++) {
                        let sector = sectors[k];
                        let isAbove = splitPlane.isSectorAbove(sector);
                        if (isAbove) {
                            subsectors.push(sector);
                        }
                    }

                    this.buildTreeRecursive(subsectors, child, cc);
                    node.addChild(child);
                }
            }
            else {
                for (let i = 0; i < cc.length; i++)  {
                    node.addChild(new Node(sectors[cc[i]]));
                }
            }
        }
        return;
    }

    searchRecursive(p, node) {
        var childLeft = node.children[0];
        var childRight = node.children[1];
        //If it is a sector, return all sectors from this node
        if (childLeft.value.alpha && childLeft.value.omega && childLeft.value.center) {
            return node.children;
        }
        if (childLeft.value.isAbove(p)) {
            console.log("left");
            return this.searchRecursive(p, childLeft);
        }
        else {
            console.log("right");
            return this.searchRecursive(p, childRight);
        }

    }

    search(p) {
        return this.searchRecursive(p, this.tree);
    }

    load() {
        var length = this.sectors.length;
        var indices = [...Array(length).keys()];
        // console.log(indices);
        this.buildTreeRecursive(this.sectors, this.tree, indices);
        console.log(this.tree);

        console.log(this.search([-10, 6]));
    }

}
