import Map from 'ol/Map';
import View from 'ol/View';
import Group from 'ol/layer/Group';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import * as proj from 'ol/proj';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import * as extent from 'ol/extent';
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Style  from 'ol/style/Style';
import Stroke  from 'ol/style/Stroke';
import Fill  from 'ol/style/Fill';
import {euclideanDistance} from '../../../js/lib/distance.js';
import {getRandomArbitrary, addRandomArcs, addRandomLocations} from '../../../js/lib/randomfeatures.js';
import {angleToVector, vectorToAngle, boundingBox, centerOfMass, project} from '../../../js/lib/geometry.js';
import draw from './viz.js';
import Dual from '../../../js/lib/polardual.js';
import DualEuclidean from '../../../js/lib/dual.js';
import DualRtree from '../../../js/lib/dualrtree.js';



function generateRandomSectors(n) {
    var extent = [0,0, 10, 10];
    var locations = addRandomLocations(extent, n);
    var arcs = addRandomArcs(locations);
    for (var i  = 0; i < arcs.length; i++) {
        arcs[i].radius = 10000000;
        arcs[i].computeGeometry();
        polygon.getSource().addFeature(new Feature(arcs[i]));
    }
    return arcs;
}


var polygonSource = new Vector();
var polygon = new VectorLayer({
    source: polygonSource
});


var polygonFoundSource = new Vector();
var polygonFound = new VectorLayer({
    source: polygonFoundSource,
    style:  new Style({
        stroke : new Stroke({
            color: '#FF0000'
        }),
        fill: new Fill({
            color: 'rgba(255, 0, 0, 0.5)',
        })
    })
});

var polygonSelectedSource = new Vector();
var polygonSelected = new VectorLayer({
    source: polygonSelectedSource,
    style:  new Style({
        stroke : new Stroke({
            color: '#00FF00'
        }),
        fill: new Fill({
            color: 'rgba(255, 255, 255, 0.3)',
        })
    })
});


var pointSource = new Vector();
var points = new VectorLayer({
    source: pointSource
});


var arcs = generateRandomSectors(100);
var g = centerOfMass(arcs.map(function(arc) {
    return arc.center;
}));

var map = new Map({ layers: [ new Group({ title: 'Cartes', layers:[new TileLayer({ title:'OSM', type:'base', source: new OSM() })]}) ],
                    target: 'map',
                    view: new View({ center: g,
                                     zoom: 18 }) });

points.getSource().addFeature(new Feature(new Point(g)));
points.getSource().addFeature(new Feature(new Point([0,0])));

var dualRtree = new DualRtree(Dual, 5);
dualRtree.load(arcs);

console.log(dualRtree.dataStructure());
draw(dualRtree.rtree);

map.on('click', function(event) {
    polygonFound.getSource().clear();
    var p = event.coordinate;
    var result = dualRtree.search(p);
    var hits = result.hits;
    var number = result.number;
    console.log("Number of access = " + number.cpt);
    console.log("Size of array =" + hits.length);
    for (let i = 0; i < hits.length; i++) {
        var polyFound = hits[i].feature;
        polygonFound.getSource().addFeature(new Feature(polyFound));
    }
});


points.setZIndex(1000);

map.addLayer(polygon);
map.addLayer(points);
map.addLayer(polygonFound);
map.addLayer(polygonSelected);
