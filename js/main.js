import Map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import OSM from 'ol/source/osm';
import proj from 'ol/proj';
import Vector from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';
import Point from 'ol/geom/point';
import OLCluster from 'ol/source/cluster';
import Feature from 'ol/feature';
import LineString from 'ol/geom/linestring';
import Polygon from 'ol/geom/polygon';
import extent from 'ol/extent';
import Select from 'ol/interaction/select';
import OLImage from 'ol/layer/image';
import Projection from 'ol/proj/projection';
import control from 'ol/control';
import OSMXML from 'ol/format/osmxml';
import loadingstrategy from 'ol/loadingstrategy';

import $ from 'jquery';
import jsTree from 'jstree';
import Muuri from 'muuri';
import interact from 'interactjs';

import {euclideanDistance} from './lib/distance';
import Arc from './lib/arc';
import Cluster from './lib/cluster';
import IsoVist from './lib/isovistsectors2d';
import Picture from './lib/picture';
import {getPosition, getOrientation} from './lib/exiftool-util';
import * as styles from './lib/styles';
import DistanceStrategy from './lib/clustering/distancestrategy';
import DendrogramStrategy from './lib/clustering/dendrogramstrategy';

var count = 200;
var featuresArc = new Array(count);
var stEtienneLonLat = [4.392569444444445, 45.42289722222222];
var stEtienneLonLatConv = proj.fromLonLat(stEtienneLonLat);
stEtienneLonLatConv = [487537.9340862985, 5693250.829916254];
var lonConv = stEtienneLonLatConv[0];
var latConv = stEtienneLonLatConv[1];

var urlDB = "http://159.84.143.179:8080/";

var grid;
var thumbnails = new OLImage();
var pictures = [];
var clusters = [];
var dendrogram = [];
var featuresLine = [];
var select = new Select();

interact('.muuri-item')
    .resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        snapSize: {
            targets: [
                { width: 50, height: 50, range: 25 },
            ]
        },
        restrictEdges: {
            outer: 'parent',
            endOnly: true,
        },
        restrictSize: {
            min: { width: 100, height: 50 },
        },
        inertia: true
    })
    .on('resizemove', function (event) {
        var target = event.target;
        target.style.width  = event.rect.width + 'px';
        target.style.height = event.rect.height + 'px';
    })
    .on('resizeend', function(event) {
        grid.refreshItems().layout();
        var target = event.target;
        var divItem = $(event.currentTarget).children().children();
        target.style.width  = divItem.width() + 2*7 + 'px';
        target.style.height = divItem.height() + 2*7 + 'px';
        grid.refreshItems().layout();
    })
;

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

var clusterSource = new OLCluster({
    source: source
});

var vectorLayerArc = new Vector();

var arcs = new VectorLayer({
    source: vectorLayerArc,
    style: styles.setStyleArcs
});


var styleCache2 = {};
var olClusters = new VectorLayer({
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


function extractFileTreeRecursive(data, object, parent) {
    if (object.hasOwnProperty('path')) return false;
    $.each(object, function(i, obj) {
        var folder = extractFileTreeRecursive(data, obj, i);
        data.push({ "id" : i, "parent": parent, "text":i, type: (folder) ? "default" : "child" });
    });
    return true;
}

function computeRangeSlider(clusters) {
    var min = Number.MAX_VALUE;
    var max = 0;
    for (var i = 0; i < clusters.length; i++) {
        var cluster = clusters[i];
        var distance = cluster.label;
        if (distance < min) {
            min = distance;
        }
        if (distance > max) {
            max = distance;
        }
    }
    document.getElementById("myRange").min = min;
    document.getElementById("myRange").max = max+1;
}

function getDocs(path, url2) {
    var t0Image = fetch(urlDB + url2, {
        method: 'post',
        body: JSON.stringify(path)
    });
    var t1Image = t0Image.then(function (response) {
        return response.json();
    });
    t1Image.then(function(resultPost) {
        return resultPost;
    });
    return t1Image;
}


function getThumbnail(f) {
   getImageLayout(f).then(function(url) {
        var position = f.getGeometry()['flatCoordinates'];
        var imageStatic = styles.createNewImage(url, position, proj.get());
        thumbnails.setSource(imageStatic);
    });
}

function getImageLayout(f) {
    var t0Image = fetch(urlDB + "images", {
        method: 'post',
        body: JSON.stringify({str: f.getProperties().filename})
    });
    var t1Image = t0Image.then(function (response) {
        return response.blob();
    });
    var t2Image = t1Image.then(function(resultPost) {
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(resultPost);
        return imageUrl;
    });
    return t2Image;
}

function getIsovist(f) {
    var arc = f.getProperties().arc;
    // arc.computeGeometry();

    var isovist = new IsoVist(arc, vectorSource.getFeatures(), true);
    var visibleSegments = isovist.isovist();
    featuresLine.push(new Feature({geometry : visibleSegments}));

    // $.each(visibleSegments, function(i, segment) {
    //     featuresLine.push(new Feature(segment));
    // });
}



function filter() {
    var filterFieldValue = $('.filter-field').val();
    grid.filter(function (item) {
        var element = item.getElement();
        var isFilterMatch = !filterFieldValue ? true : (element.getAttribute('label') || '') === filterFieldValue;
        return isFilterMatch;
    });
}

function changeLayout() {
    var layoutFieldValue = $('.layout-field').val();
    var elements = grid.getItems();
    $.each(elements, function(i, item) {
        item.getElement().className = "item" + layoutFieldValue + " muuri-item";
    });
    grid.refreshItems().layout();
}

function generateGrid() {
    grid = new Muuri('.grid', {
        items: '.item',
        layout: {
            fillGaps: true
        },
        dragEnabled: true,
        dragStartPredicate: function(item, event) {
            var elemWidth = $(item.getElement()).width();
            var elemHeight = $(item.getElement()).height();
            if (event.srcEvent.layerX < 10 ||
                event.srcEvent.layerY < 10 ||
                event.srcEvent.layerX > elemWidth ||
                event.srcEvent.layerY > elemHeight)
                return false;
            return Muuri.ItemDrag.defaultStartPredicate(item, event);
        }
    });
}

function loadImageAndFillGrid(url, images, label, count, length) {
    var i = new Image();
    i.addEventListener('dragstart', function (e) {
        e.preventDefault();
    }, false);
    i.onload = function(event) {
        fillGrid(i, images, label, count, length);
    };
    i.src = url;

}

function fillGrid(image, images, label, count, length) {
    var divItem = $("<div/>", {
        class: "item" + $('.layout-field').val(),
        "label": label.label,
        "distance": label.distance
    });
    var divItemContent = $("<div/>", {
        class:"item-content"
    });

    divItemContent.append(image);
    divItem.append(divItemContent);
    images.push(divItem.get(0));
    count.number++;
    if (count.number >= length) {
        grid.remove(grid.getItems(), {removeElements: true});
        grid.add(images, {layout:true});
        grid.refreshItems().layout();
        document.body.className = 'images-loaded';
    }
}


generateGrid();


$('.filter-field').change(filter);
$('.layout-field').change(changeLayout);

$("#myRange").on("change", function(event) {
    var sliderValue = event.target.value;
    var filterFieldValue = $('.filter-field').val();
    grid.filter(function (item) {
        var element = item.getElement();
        var isFilterMatch = !filterFieldValue ? true : (element.getAttribute('label') || '') === filterFieldValue;
        var isSliderMatch = !sliderValue ? true : parseFloat(element.getAttribute('distance') || '') <= sliderValue;
        return isFilterMatch && isSliderMatch;
    });
});

map.getView().on('change:resolution', function(event)  {
    arcs.getSource().clear();
    var ext = map.getView().calculateExtent(map.getSize());
    olClusters.getSource().getSource().forEachFeature(function(feature) {
        var arc = feature.getProperties().arc;

        var diameter = euclideanDistance([ext[0], ext[1]],
                                         [ext[2], ext[3]]);
        arc.radius = diameter/2;
        arc.computeGeometry();
        if (arc.selected) {
            arcs.getSource().addFeature(new Feature(arc));
        }
    });
});



select.on('select', function(e) {
    var selectedFeatures = select.getFeatures();

    //Reset
    if (!e.mapBrowserEvent.originalEvent.ctrlKey) {
        arcs.getSource().clear();
        if (thumbnails.getSource())
            thumbnails.setSource();
        olClusters.getSource().getSource().forEachFeature(function(feature) {
            feature.getProperties().arc.selected = false;
        });
    }

    featuresLine = [];

    e.selected.filter(function(feature) {
        console.log(feature.getProperties());
        var selectedFeatures = feature.get('features');
        var images = [];


        var count = {number:0};
        $.each(selectedFeatures, function(i, f) {
            var arc = f.getProperties().arc;
            console.log(arc);
            arc.selected = true;
            arcs.getSource().addFeature(new Feature(arc));
            if (arc.radius < 1000)
                getIsovist(f);
            getThumbnail(f);
        });
    });

    lines.getSource().clear();
    lines.getSource().addFeatures(featuresLine);
});


$("#fileTree").on('changed.jstree', function (e, data) {
    //Text reinitialization
    document.body.className = '';
    $("#clusterText").text("Chargement des photographies...");

    //Selected fields in file tree
    var i, j, r = [];
    for(i = 0, j = data.selected.length; i < j; i++) {
        r.push(data.instance.get_node(data.selected[i]).text);
    }
    //Query DB and generate objects
    getDocs(r, "fullDocs").then(function(metadataJSON) {
        pictures = [];
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
        if (pictures.length === 0) {
            grid.remove(grid.getItems(), {removeElements:true});
            document.body.className = 'images-loaded';
        }

        //Clustering with cursor
        var clusteringStrategy = new DistanceStrategy(pictures);
        clusters = clusteringStrategy.computeClusters();
        var dendro = new DendrogramStrategy(pictures);
        dendrogram = dendro.computeClusters();
        computeRangeSlider(dendrogram);

        //Display grid of image clusters
        var images = [];
        var count = {number:0};
        $.each(pictures, function(i, feature) {
            var label = -1;
            var distance = -1;
            for (var key in clusters) {
                if (clusters[key].hasPicture(feature.getProperties()))
                    label = key;
            }
            for (var key2 in dendrogram) {
                if (dendrogram[key2].hasPicture(feature.getProperties())) {
                    distance = dendrogram[key2].label;
                }
            }
            getImageLayout(feature).then(function(uri) {
                loadImageAndFillGrid(uri, images, {label:label, distance:distance}, count, pictures.length);
            });
        });

        //Put values into select fields
        for (var i = 0; i < clusters.length; i++) {
            $('#selectPosition').append($('<option>', {
                value: i,
                text: clusters[i].label
            }));
        }

        //Display clusters on map
        olClusters.getSource().getSource().clear();
        olClusters.getSource().getSource().addFeatures(pictures);

        arcs.getSource().clear();
    });
});

$("#buttonDir").on("click", function(event) {

    var t0Image = fetch(urlDB, {
        method: 'post'
    });
    var t1Image = t0Image.then(function (response) {
        return response.json();
    });

    t1Image.then(function(resultPost) {
        var data = [];
        extractFileTreeRecursive(data, resultPost, "#");
        $("#fileTree").jstree(
            { 'core' : {
                'data' : data
            },
              'types' : {
                  "child" : {
                      "icon" : "glyphicon glyphicon-file"
                  },
                  "default" : {
                      "icon" : "glyphicon glyphicon-folder-open"
                  }
              },
              'plugins' : ["checkbox", "types", "sort"]});

    });
});

map.addLayer(vector);
map.addLayer(olClusters);
map.addLayer(arcs);
map.addLayer(thumbnails);
map.addLayer(lines);
map.addInteraction(select);
