import Arc from './arc.js';
import {halfLineIntersection, segmentIntersection} from './lineintersection.js';

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
        console.log("Elem length "+elements.length);
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

    addNode(elements, parentNode) {

    }

    addLeaf(element, parentNode) {
        parentNode.push(element);
    }

    buildTreeRecursive(indices, node, cpt) {
        if (indices.length === 0 || cpt > 50) return;
        console.log(indices);

        cpt++;
        var children = [];
        var elements = [];


        for (let i = 0; i < indices.length; i++) {
            var intersectingI = this.intersectingSectors(this.sectors[indices[i]], i);
            elements.push(intersectingI);
        }

        var connectedComponents = [];
        for (let i = 0; i < elements.length; i++) {
            let cc = [];
            this.connectedComponents(cc, elements, i, []);
            connectedComponents.push(cc);
        }
        connectedComponents = this.removeDuplicates(connectedComponents);
        var indexesToRemove = [];
        for (var i = 0; i < connectedComponents.length; i++) {
            let cc = connectedComponents[i];
            if (cc.length === 1) {
                var indexCC = cc[0];
                indexesToRemove.push(indexCC);
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
        this.buildTreeRecursive(indices, children, cpt);
    }

    load() {
        var length = this.sectors.length;
        var indices = [...Array(length).keys()];
        var cpt = 0;
        this.buildTreeRecursive(indices, this.tree[0], cpt);
        console.log(this.tree);

        /*
        var elements = [];
        for (var i = 0; i < length; i++) {
            var indexes = this.intersectingSectors(this.sectors[i], i);
            elements.push(indexes);
        }


        elements = [];
        elements.push([3]);
        elements.push([2]);
        elements.push([1, 3]);
        elements.push([0, 2]);

        var connectedComponents = [];
        for (var i = 0; i < elements.length; i++) {
            var cc = [];
            this.connectedComponents(cc, elements, i, []);
            connectedComponents.push(cc);
        }
        connectedComponents = this.removeDuplicates(connectedComponents);
        //leaves = isolated nodes

        //recursively subdivide the connected component until all elements are isolated
        var maxElements = this.maximumIntersectingElements(elements);

        console.log(maxElements);

        //console.log(connectedComponents);*/
    }

}
