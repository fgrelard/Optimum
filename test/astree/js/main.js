import $ from 'jquery';
import {getRandomArbitrary, addRandomArcs, addRandomLocations} from '../../../js/lib/randomfeatures.js';
import Arc from '../../../js/lib/arc.js';
import ASTree from '../../../js/lib/astree.js';

var stEtienneLonLatConv = [487537.9340862985, 5693250.829916254];

function generateRandomSectors(n) {
    var extent = [0,0, 10, 10];
    var locations = addRandomLocations(extent, n);
    var arcs = addRandomArcs(locations);
    return arcs;
}

function generateSectors() {
    var extent = [0,0, 10, 10];

    var arcs = [new Arc([5,5], 100, 0, 40),
                new Arc([2,2], 100, 190, 230),
                new Arc([3,3], 100, 215, 260),
                new Arc([2,7], 100, 100, 140)];

    for (var i  = 0; i < arcs.length; i++) {
        arcs[i].computeGeometry();
    }

    return arcs;
}

var arcs = generateSectors();
var astree = new ASTree(arcs);
astree.load();
