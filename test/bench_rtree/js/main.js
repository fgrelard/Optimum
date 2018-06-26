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
import Select from 'ol/interaction/select';
import Projection from 'ol/proj/projection';
import control from 'ol/control';
import OSMXML from 'ol/format/osmxml';
import GeoJSON from 'ol/format/geojson';
import loadingstrategy from 'ol/loadingstrategy';
import DragBox from 'ol/interaction/dragbox';
import condition from 'ol/events/condition';
import Vector from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';

import $ from 'jquery';
import rbush from 'rbush';
import {getRandomArbitrary, addRandomArcs, addRandomLocations} from '../../../js/lib/randomfeatures.js';

var stEtienneLonLatConv = [487537.9340862985, 5693250.829916254];
var rtree;
var polygonSource = new Vector();
var polygon = new VectorLayer({
    source: polygonSource
});

var map = new Map({
    layers: [
        new Group({
            title: 'Cartes',
            layers: [new TileLayer({
                title:'OSM',
                type:'base',
                source: new OSM()
            })]
        })
    ],
    target: 'map',
    view: new View({
        center: stEtienneLonLatConv,
        zoom: 12
    })
});


function generateRandomPolygons(extent, number = 100) {
    var locations = addRandomLocations(extent, number);
    var arcs = addRandomArcs(locations);
    for (var i = 0; i < number; i++) {
        polygon.getSource().addFeature(new Feature({geometry : arcs[i].geometry}));
    }
}


function updateGridOnPicturesVisualizing(request, extent) {
    var result = rtree.search(request);
    var picturesVisualizing = [];

    var images = [];
    var count = {number:0};

    $.each(result, function(i, intersectingIsovist) {
        var feature = intersectingIsovist.feature;
        var picture = feature.getProperties();
        var polygon = picture.isovist;
        if (polygon.intersectsExtent(extent)) {
            count.number++;
           picturesVisualizing.push(feature);

        }
    });
}



function loadRTree(pictures) {
    var boundingBoxes = [];
    $.each(pictures, function(i, feature) {
        var polygon = feature.getGeometry();
        if (polygon) {
            var polygonExtent = polygon.getExtent();
            var polygonBBox = {minX: polygonExtent[0],
                               minY: polygonExtent[1],
                               maxX: polygonExtent[2],
                               maxY: polygonExtent[3],
                               feature : feature};

            boundingBoxes.push(polygonBBox);
        }
    });
    rtree = rbush();
    rtree.load(boundingBoxes);
}

function requestsOnRtree(locations, number) {
    var count = 0;
    for (var i =0; i < number; i++) {
        var coordinates = locations[i];
        var searchBox = {
            minX: coordinates[0],
            minY: coordinates[1],
            maxX: coordinates[0],
            maxY: coordinates[1],
        };
        var result = rtree.search(searchBox);
        $.each(result, function(i, intersectingIsovist) {
            var feature = intersectingIsovist.feature;
            var picture = feature.getGeometry();
            if (picture.intersectsCoordinate(coordinates)) {
                count++;
            }
        });
    }
    console.log(count);
}

function requestsLinear(locations, number) {
    var polygons = polygon.getSource().getFeatures();
    var count = 0;
    for (var i =0; i < number; i++) {
        var coordinates = locations[i];
        $.each(polygons, function(i, feature) {
            var polygeom = feature.getGeometry();
            if (polygeom.intersectsCoordinate(coordinates))
                count++;
        });
    }
    console.log(count);
}



var extent2 = map.getView().calculateExtent();
generateRandomPolygons(extent2, 5000);
console.log(polygon.getSource().getFeatures());
var t0 = performance.now();
loadRTree(polygon.getSource().getFeatures());
var t1 = performance.now();
console.log("Call to BUILD RTREE took " + (t1 - t0) + " milliseconds.");

 var numberRequest = 1;
 var locations = addRandomLocations(extent2, numberRequest);

t0 = performance.now();
requestsOnRtree(locations, numberRequest);
t1 = performance.now();
console.log("Call to RTREE took " + (t1 - t0) + " milliseconds.");


t0 = performance.now();
requestsLinear(locations, numberRequest);
t1 = performance.now();
console.log("Call to LINEAR took " + (t1 - t0) + " milliseconds.");

//map.addLayer(polygon);
