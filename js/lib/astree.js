import Arc from './arc.js';
import {halfLineIntersection, segmentIntersection} from './lineintersection.js';
import {euclideanDistance} from './distance.js';

export default class ASTree {
    constructor(sectors) {
        this.tree = [ [ new Arc([0,0],5, 0, 360) ] ];
        this.sectors = sectors;
    }


    intersectingSectors(sector, index) {
        var f = sector.center;
        var la = sector.fullGeometry[1].getFlatCoordinates();
        var lo = sector.fullGeometry[2].getFlatCoordinates();
        var length = this.sectors.length;
        var cpt = 0;
        var intersectionIndexes = [];
        for (var i = 0; i < length; i++) {
            if (i === index) continue;
            var sectorOther = this.sectors[i];
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

    intersectionWithOtherSectors(index, sectors, alpha) {
        var sector = sectors[index];
        var f = sector.center;
        var la;
        if (alpha)
            la = sector.fullGeometry[1].getFlatCoordinates();
        else
            la = sector.fullGeometry[2].getFlatCoordinates();
        var length = this.sectors.length;
        var intersections = [];
        for (var i = 0; i < length; i++) {
            if (i === index) continue;
            var sectorOther = this.sectors[i];
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
            if (i1) {
                intersections.push({p: fOther, i: [i1.x, i1.y]});
            }
            else if (i2) {
                intersections.push({p: fOther, i: [i2.x, i2.y]});
            }

        }
        return intersections;
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

        a.sort();
        b.sort();
        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
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

    maximumIntersectingElements(elements) {
        var maxElements = [];
        var maxLength = 0;
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].length > maxLength)
                maxLength = elements[i].length;
        }
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].length === maxLength)
                maxElements.push(i);
        }
        return maxElements;
    }


    minimumIntersectingElements(elements) {
        var minElements = [];
        var minLength = Number.MAX_VALUE;
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].length < minLength)
                minLength = elements[i].length;
        }
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].length === minLength)
                minElements.push(i);
        }
        return minElements;
    }



    addNode(element, parentNode) {
        parentNode.push([element]);
    }

    addLeaf(element, parentNode) {
        parentNode.push(element);
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

    splitConnectedComponent(cc, arcs, elements) {
        var minSet = this.minimumIntersectingElements(elements);
        console.log(minSet);
        console.log(elements);
        for (var i = 0; i < minSet.length; i++) {
            var m = minSet[i];
            var arc = arcs[m];
            var intersectionsAlpha = this.intersectionWithOtherSectors(m, arcs, true);
            var intersectionsOmega = this.intersectionWithOtherSectors(m, arcs, false);
            var maxDAlpha = (intersectionsAlpha.length) ?
                    Math.max(...intersectionsAlpha.map(function(o){
                        return euclideanDistance(o.p, o.i);
                    }))
                : 0;
            var maxDOmega = (intersectionsOmega.length) ?
                    Math.max(...intersectionsOmega.map(function(o){
                        return euclideanDistance(o.p, o.i);
                    }))
                : 0;

            console.log(maxDAlpha + " "+ maxDOmega);

            var omega = 0;
            var alpha = Math.min(...arcs.map(function(a) {
                return a.alpha;
            }));
            if (maxDAlpha > maxDOmega)
                omega = arc.alpha;
            else
                omega = arc.omega;

            var newArc = new Arc(arc.center, 10, alpha, omega);
            console.log(newArc);
        }
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

    buildTreeRecursive(indices, node, cpt) {
        if (indices.length === 0 || cpt > 50) return;

        cpt++;
        var children = [];
        var elements = [];

        for (let i = 0; i < indices.length; i++) {
            var intersectingI = this.intersectingSectors(this.sectors[indices[i]], i);
            elements.push(intersectingI);
        }

        this.splitConnectedComponent(children, this.sectors, elements);

        var connectedComponents = [];
        for (let i = 0; i < elements.length; i++) {
            let cc = [];
            this.connectedComponents(cc, elements, i, []);
            connectedComponents.push(cc);
        }
        connectedComponents = this.removeDuplicates(connectedComponents);
        var indexesToRemove = [];
        for (let i = 0; i < connectedComponents.length; i++) {
            let cc = connectedComponents[i];
            if (cc.length === 1) {
                var indexCC = cc[0];
                indexesToRemove.push(indexCC);
            } else {
                var sector = this.connectedComponentToAngularSector(cc);
                this.addNode(sector, children);
            }
        }
        var maxIntersectArray = this.maximumIntersectingElements(elements);
        Array.prototype.push.apply(indexesToRemove, maxIntersectArray);
        indexesToRemove.sort();
        for (let i = indexesToRemove.length -1; i >= 0; i--) {
            let ind = indexesToRemove[i];
            this.addLeaf(this.sectors[ind], children);
            indices.splice(ind,1);
        }
        node.push(children);
        //this.buildTreeRecursive(indices, children, cpt);
    }

    load() {
        var length = this.sectors.length;
        var indices = [...Array(length).keys()];
        var cpt = 0;
        this.buildTreeRecursive(indices, this.tree[0], cpt);
        console.log(this.tree);
    }

}
