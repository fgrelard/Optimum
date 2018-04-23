import Map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import XYZ from 'ol/source/xyz';
import OSM from 'ol/source/osm';
import proj from 'ol/proj';
import Vector from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';
import Point from 'ol/geom/point';
import Cluster from 'ol/source/cluster';
import Feature from 'ol/feature';
import LineString from 'ol/geom/linestring';
import Polygon from 'ol/geom/polygon';

import extent from 'ol/extent';
import Select from 'ol/interaction/select';
import $ from 'jquery';
import Image from 'ol/layer/image';
import Projection from 'ol/proj/projection';

import control from 'ol/control';
import OSMXML from 'ol/format/osmxml';
import loadingstrategy from 'ol/loadingstrategy';

import Arc from './lib/arc';
import IsoVist from './lib/isovistsectors2d';
import Picture from './lib/picture';
import {getPosition, getOrientation} from './lib/exiftool-util';
import * as styles from './lib/styles';

var count = 200;
var featuresArc = new Array(count);
var stEtienneLonLat = [4.392569444444445, 45.42289722222222];
var stEtienneLonLatConv = proj.fromLonLat(stEtienneLonLat);
stEtienneLonLatConv = [487537.9340862985, 5693250.829916254];
var lonConv = stEtienneLonLatConv[0];
var latConv = stEtienneLonLatConv[1];


var url = "http://localhost:8080/";

var thumbnails = new Image();
var pictures = [];
var featuresLine = [];

var select = new Select();
select.on('select', function(e) {
    var selectedFeatures = select.getFeatures();

    arcs.getSource().clear();
    if (thumbnails.getSource())
        thumbnails.setSource();
    featuresLine = [];

    e.selected.filter(function(feature) {
        console.log(feature.getProperties());
        var selectedFeatures = feature.get('features');
        $.each(selectedFeatures, function(i, f) {
            var arc = f.getProperties().arc;
            arc.computeGeometry();
            arcs.getSource().addFeature(new Feature(arc));

            var isovist = new IsoVist(arc, vectorSource.getFeatures(), true);
            var visibleSegments = isovist.computeIsoVist();
            $.each(visibleSegments, function(i, segment) {
                featuresLine.push(new Feature(segment));
            });


            var t0Image = fetch(url+"images", {
                method: 'post',
                body: JSON.stringify({str: f.getProperties().filename})
            });
            var t1Image = t0Image.then(function (response) {
                return response.json();
            });
            t1Image.then(function(resultPost) {
                var b64String = resultPost.data[0].ThumbnailImage;
                var position = f.getGeometry()['flatCoordinates'];
                var imageStatic = styles.createNewImage(b64String, position, proj.get());
                thumbnails.setSource(imageStatic);
            });
        });
    });
    lines.getSource().clear();
    lines.getSource().addFeatures(featuresLine);
});


$("#buttonDir").on("click", function(event) {
    var files = [];
    var dir = $("#dirMetadata").val();
    var t0 = fetch(url, {
        method: 'post',
        body: JSON.stringify({str: dir})
    });
    var t1 = t0.then(function (response) {
        return response.json();
    });


    t1.then(function(resultPost) {

        var metadataJSON = resultPost.data;

        $.each(metadataJSON, function(i, photo) {
            if (photo.hasOwnProperty('ImageWidth')) {
                var position = getPosition(photo);
                if (position !== null) {
                    var positionProj = proj.fromLonLat(position);
                    var fileName = photo.SourceFile;
                    var cone = getOrientation(photo, positionProj);
                    var picture = new Picture(fileName, positionProj, cone);
                    var feature = new Feature(picture);
                    pictures.push(feature);
                }
            }
        });

        clusters.getSource().getSource().clear();
        clusters.getSource().getSource().addFeatures(pictures);

        arcs.getSource().clear();
    });


});



var vectorSource = new Vector({
    format: new OSMXML(),
    loader: function(extent2, resolution, projection) {
        if (resolution < 2) {
            var epsg4326Extent =
                    proj.transformExtent(extent2, projection, 'EPSG:4326');
            var client = new XMLHttpRequest();
            client.open('POST', 'https://overpass-api.de/api/interpreter');
            client.addEventListener('load', function() {
                var features = new OSMXML().readFeatures(client.responseText, {
                    featureProjection: map.getView().getProjection()
                });
                var limitedFeatures = [];
                $.each(features, function(i, f) {
                    var node = f.getProperties();
                    if (node.hasOwnProperty("building") ||
                        node.hasOwnProperty("amenity")  ||
                        node.hasOwnProperty("natural")
                       ) {
                        limitedFeatures.push(f);
                    }
                });
                features = [];
                vectorSource.addFeatures(limitedFeatures);
            });
            var query = '(node(' +
                    epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
                    epsg4326Extent[3] + ',' + epsg4326Extent[2] +
                    ');rel(bn)->.foo;way(bn);node(w)->.foo;rel(bw););out meta;';
            client.send(query);
        }
        this.resolution = resolution;
    },
    strategy: function(extent, resolution) {
        if(this.resolution && this.resolution != resolution){
            this.loadedExtentsRtree_.clear();
        }
        return [extent];
    }
});

var vector = new VectorLayer({
    source: vectorSource,
    style: styles.setStyleTopo
});


var map = new Map({
    layers: [
        new TileLayer({
            source: new OSM()
        })
    ],
    target: 'map',
    view: new View({
        center: stEtienneLonLatConv,
        zoom: 16
    })
});

var extent2 = map.getView().calculateExtent(map.getSize());

var source = new Vector();

var clusterSource = new Cluster({
    source: source
});

var vectorLayerArc = new Vector();

var arcs = new VectorLayer({
    source: vectorLayerArc,
    style: styles.setStyleArcs
});


var styleCache2 = {};
var clusters = new VectorLayer({
    source: clusterSource,
    style: styles.setStyleClusters
});

var lineSource = new Vector({
    features: featuresLine
});

var lines = new VectorLayer({
    source: lineSource,
    style: styles.setStyleLinesIsovist
});


map.addLayer(vector);
map.addLayer(clusters);
map.addLayer(arcs);
map.addLayer(thumbnails);
map.addLayer(lines);

map.addInteraction(select);
