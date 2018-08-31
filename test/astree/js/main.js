import Map from 'ol/map';
import View from 'ol/view';
import Group from 'ol/layer/group';
import OSM from 'ol/source/osm';
import TileLayer from 'ol/layer/tile';
import proj from 'ol/proj';
import Point from 'ol/geom/point';
import Feature from 'ol/feature';
import LineString from 'ol/geom/linestring';
import Polygon from 'ol/geom/polygon';
import extent from 'ol/extent';
import Vector from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';

import $ from 'jquery';
import {getRandomArbitrary, addRandomArcs, addRandomLocations} from '../../../js/lib/randomfeatures.js';
import Arc from '../../../js/lib/arc.js';
import ASTree from '../../../js/lib/astree.js';
// import vis from "vis";

var stEtienneLonLatConv = [0, 0];

var polygonSource = new Vector();
var polygon = new VectorLayer({
    source: polygonSource
});

var pointSource = new Vector();
var points = new VectorLayer({
    source: pointSource
});

var map = new Map({ layers: [ new Group({ title: 'Cartes', layers:
                                          [new TileLayer({ title:'OSM', type:'base', source: new OSM() })]
                                        }) ], target: 'map', view: new View({ center: stEtienneLonLatConv,
                                                                              zoom: 18 }) });

function generateRandomSectors(n) {
    var extent = [0,0, 10, 10];
    var locations = addRandomLocations(extent, n);
    var arcs = addRandomArcs(locations);
    return arcs;
}

function generateSectors() {
    var extent = [0,0, 10, 10];

    var arcs = [new Arc([5,5], 100, 200, 250),
                new Arc([2,2], 100, 190, 230),
                new Arc([3,3], 100, 215, 260),
                new Arc([2,7], 100, 180, 200),
                new Arc([6,6], 100, 0, 45),
                new Arc([6,4], 100, 290, 330),
                new Arc([7,8], 100, 130, 180),
                new Arc([10,0], 100, 270, 310),
                new Arc([-20,20], 100, 250, 290)
               ];

    for (var i  = 0; i < arcs.length; i++) {
        arcs[i].computeGeometry();
        polygon.getSource().addFeature(new Feature(arcs[i]));
    }

    return arcs;
}

var p = [-45, 40];
points.getSource().addFeature(new Feature(new Point(p)));

var arcs = generateSectors();
var astree = new ASTree(arcs, 3);

astree.load();
console.log(astree.search(p));

// create an array with nodes
var dataNodes = [];
var dataEdges = [];
var index = 1;
var fifo = [astree.tree];
while (fifo.length > 0) {
    var node = fifo.shift();
    var label = node.value.center[0].toFixed(2).toString() + " " + node.value.center[1].toFixed(2).toString();
    if (node.value.alpha) {
        dataNodes.push({id: index++, label: node.value.alpha + " " + node.value.omega, color: 'rgb(255,168,7)'});
    } else {
        dataNodes.push({id: index++, label: label});
    }
    if (node.parentIndex)
        dataEdges.push({from: node.parentIndex, to: index-1, arrows:"to"});
    for (let i = 0; i < node.children.length; i++) {
        var nodeChild = node.children[i];
        nodeChild.parentIndex = index-1;
        fifo.push(nodeChild);
    }
}

var nodes = new vis.DataSet(dataNodes);

// create an array with edges
var edges = new vis.DataSet(dataEdges);

// create a network
var container = document.getElementById('mynetwork');
var data = {
    nodes: nodes,
    edges: edges
};

var options = {
        layout: {
          hierarchical: {
            sortMethod: "directed"
          }
        },
        edges: {
          smooth: true,
          arrows: {to : true }
        }
      };
var network = new vis.Network(container, data, options);


map.addLayer(polygon);
map.addLayer(points);
