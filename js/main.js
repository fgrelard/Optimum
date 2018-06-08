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
import GeoJSON from 'ol/format/geojson';
import loadingstrategy from 'ol/loadingstrategy';
import DragBox from 'ol/interaction/dragbox';
import condition from 'ol/events/condition';
import Overlay from 'ol/overlay';

import $ from 'jquery';
import jsTree from 'jstree';
import Muuri from 'muuri';
import interact from 'interactjs';
import rbush from 'rbush';

import {euclideanDistance} from './lib/distance';
import Arc from './lib/arc';
import Cluster from './lib/cluster';
import IsoVist from './lib/isovistsectors2d';
import Picture from './lib/picture';
import {getPosition, getOrientation} from './lib/exiftool-util';
import * as styles from './lib/styles';
import DistanceStrategy from './lib/clustering/distancestrategy';
import DendrogramStrategy from './lib/clustering/dendrogramstrategy';

var stEtienneLonLat = [4.392569444444445, 45.42289722222222];
var stEtienneLonLatConv = proj.fromLonLat(stEtienneLonLat);
stEtienneLonLatConv = [487537.9340862985, 5693250.829916254];
var lonConv = stEtienneLonLatConv[0];
var latConv = stEtienneLonLatConv[1];

var urlDB = "http://159.84.143.179:8080/";
// var urlDB2 = "http://polymnie.univ-lyon2.fr:8080/";
var controller = new AbortController();

var grid;
var thumbnails = new OLImage();
var pictures = [];
var clusters = [];
var dendrogram = [];
var featuresLine = [];
var inputFeatures = [];
var rtree = rbush();
var select = new Select();
var overlay = new Overlay({
  element: document.getElementById('none')
});

var vectorSource = new Vector(sourceFromXML());

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

var inputLineSource = new Vector({
    features : inputFeatures
});

var inputLines = new VectorLayer({
    source: inputLineSource,
    style : styles.setStyleInput
});

var dragBox = new DragBox({
    condition: condition.shiftKeyOnly
});



function sourceFromXML() {
    return {
        format: new OSMXML(),
        loader: function(extent2, resolution, projection) {
            if (resolution < 2) {
                vectorSource.clear();
                var client = getBuildingSegments(extent2, projection);
                client.addEventListener('load', function(e) {
                    var features = segmentsFromXMLRequest(client);
                    vectorSource.addFeatures(features);
                });
            }
            this.resolution = resolution;
        },
        strategy: function(extent2, resolution) {
            if(this.resolution && this.resolution != resolution){
                this.loadedExtentsRtree_.clear();
            }
            return [extent2];
        }
    };
}


function extractFileTree(json, firstString) {
    var data = [];
    data.push({ "id" : firstString, "parent": "#", "text": firstString, type: "default", state : {opened: true}});
    $.each(json, function(i, photo) {
        var year = photo.year;
        var month = photo.month;
        var ym = month.toString() + "/" + year.toString();
        var dateExists = data.find(function(existingDate) {
            return existingDate.id === ym;
        });
        if (!dateExists)
            data.push({ "id" : ym, "parent": firstString, "text": ym, type: "default"});
        data.push({ "id" : photo.filename, "parent": ym, "text": photo.filename, type: "child"});
    });
    return data;
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

function segmentsFromXMLRequest(client, position = null) {
    var features = new OSMXML().readFeatures(client.responseText, {
        featureProjection: (position) ? new View({center:position}).getProjection() : map.getView().getProjection()
     });
    var limitedFeatures = [];
    for (var i = 0; i < features.length; i++) {
        var f = features[i];
        var node = f.getProperties();
        if (node.hasOwnProperty("building") ||
            node.hasOwnProperty("amenity")  ||
            node.hasOwnProperty("natural")
           ) {
            limitedFeatures.push(f);
        }
    }
    return limitedFeatures;
}

function getBuildingSegments(extent2, projection) {
    var client = new XMLHttpRequest();
    client.open('POST', 'https://overpass-api.de/api/interpreter');

    var epsg4326Extent =
            proj.transformExtent(extent2, projection, 'EPSG:4326');
    var query = '(node(' +
            epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
            epsg4326Extent[3] + ',' + epsg4326Extent[2] +
            ');rel(bn)->.foo;way(bn);node(w)->.foo;rel(bw););out meta;';
    client.send(query);
    return client;
}

function computeIsovistForPicture(feature, signal) {
    var previousArc = feature.getProperties().arc;
    var arc = new Arc(previousArc.center, previousArc.radius, previousArc.alpha, previousArc.omega);
     var t0Image = fetch(urlDB + "isovist", {
        method: 'post',
         body: JSON.stringify({arc: arc}),
         signal
    });
    var t1Image = t0Image.then(function (response) {
        return response.json();
    });
    var t2Image = t1Image.then(function(data) {
        var arrayCoordinates = [];
        for (var i = 0; i < data.flatCoordinates.length-1; i+=2)
            arrayCoordinates.push([parseFloat(data.flatCoordinates[i]),
                                   parseFloat(data.flatCoordinates[i+1])]);
        var superArray = arrayCoordinates;
        return superArray;
    });
    return t2Image.then(function(array) {
        var polygon = new Polygon([array]);
        feature.set("isovist", polygon);
        polygon.set("feature", feature);
        return polygon;
    });

}

function getImageLayout(f, signal = null) {
    var t0Image = fetch(urlDB + "images", {
        method: 'post',
        body: JSON.stringify({str: f.getProperties().filename}),
        signal
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
    var picture = f.getProperties();
    if (picture.isovist) {
        lines.getSource().addFeature(new Feature({geometry : picture.isovist}));
    }


    // $.each(visibleSegments, function(i, segment) {
    //     featuresLine.push(new Feature(segment));
    // });

}


function filter() {
    var filterFieldValue = $('.filter-field').val();
    grid.filter(function (item) {
        var element = item.getElement();
        var isFilterMatch = !filterFieldValue ? true : (element.getAttribute('label') || filterFieldValue) === filterFieldValue;
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


generateGrid();


$('.filter-field').change(filter);
$('.layout-field').change(changeLayout);

$("#myRange").on("change", function(event) {
    var sliderValue = event.target.value;
    var filterFieldValue = $('.filter-field').val();
    grid.filter(function (item) {
        var element = item.getElement();
        var isFilterMatch = !filterFieldValue ? true : (element.getAttribute('label') || filterFieldValue) === filterFieldValue;
        var isSliderMatch = !sliderValue ? true : parseFloat(element.getAttribute('distance') || sliderValue) <= sliderValue;
        return isFilterMatch && isSliderMatch;
    });
});




map.getView().on('change:resolution', function(event)  {
    arcs.getSource().clear();
    var ext = map.getView().calculateExtent(map.getSize());
    olClusters.getSource().getSource().forEachFeature(function(feature) {
        var previousArc = feature.getProperties().arc;
        var selected = previousArc.selected;
        var arc = new Arc(previousArc.center, previousArc.radius, previousArc.alpha, previousArc.omega);

        var diameter = euclideanDistance([ext[0], ext[1]],
                                         [ext[2], ext[3]]);
        arc.radius = diameter/2;
        arc.computeGeometry();
        previousArc.geometry = arc.geometry;
        previousArc.fullGeometry = arc.fullGeometry;
        if (selected) {
            arcs.getSource().addFeature(new Feature(arc));
        }
    });
});

dragBox.on('boxend', function() {

    var images = [];
    var count = {number:0};
    var picturesVisualizing = [];

    //Clear highlighted photographies visualizing point
    map.getOverlays().clear();

    // features that intersect the box are added to the collection of
    // selected features
    var extentDrag = dragBox.getGeometry().getExtent();
    var center = [(extentDrag[0] + extentDrag[2]) /2, (extentDrag[1] + extentDrag[3]) /2];
    var client = getBuildingSegments(extentDrag, new View({center: center}).getProjection());
    client.addEventListener('load', function(e) {
        inputLines.getSource().clear();
        var buildingSegments = segmentsFromXMLRequest(client, center);
        $.each(buildingSegments, function(i, feature) {
            if (feature.getGeometry().intersectsExtent(extentDrag)) {
                var coordinates = feature.getGeometry().getFlatCoordinates();
                for (var i = 0; i < coordinates.length - 3; i++) {
                    var f = [coordinates[i], coordinates[i+1]];
                    var l = [coordinates[i+2], coordinates[i+3]];
                    var segment = new LineString([f,l]);
                    if (dragBox.getGeometry().intersectsCoordinate(f) ||
                        dragBox.getGeometry().intersectsCoordinate(l)) {
                        inputLines.getSource().addFeature(new Feature(segment));

                    }
                }
            }
        });
    });

    var request = {minX: extentDrag[0],
                   minY: extentDrag[1],
                   maxX: extentDrag[2],
                   maxY: extentDrag[3]};
    var result = rtree.search(request);

    $.each(result, function(i, intersectingIsovist) {
        var feature = intersectingIsovist.feature;
        var picture = feature.getProperties();
        var polygon = picture.isovist;
        if (polygon.intersectsExtent(extentDrag)) {
            count.number++;
            picturesVisualizing.push(feature);
            var overlay = styles.createCircleOutOverlay(picture.position);
            map.addOverlay(overlay);

        }
    });

    // $.each(pictures, function(i, feature) {
    //     var picture = feature.getProperties();
    //     var isovist = picture.isovist;
    //     if (isovist && isovist.intersectsExtent(extentDrag)) {
    //         count.number++;
    //         picturesVisualizing.push(feature);
    //         var overlay = styles.createCircleOutOverlay(picture.position);
    //         map.addOverlay(overlay);

    //     }
    // });

    $.each(picturesVisualizing, function(i, feature) {
        getImageLayout(feature).then(function(uri) {
            loadImageAndFillGrid(uri, images, {}, count, picturesVisualizing.length);
        });
    });


});

// clear selection when drawing a new box and when clicking on the map
dragBox.on('boxstart', function() {
    inputFeatures = [];
});



select.on('select', function(e) {

    //Reset
    if (!e.mapBrowserEvent.originalEvent.ctrlKey) {
        arcs.getSource().clear();
        if (thumbnails.getSource())
            thumbnails.setSource();
        olClusters.getSource().getSource().forEachFeature(function(feature) {
            feature.getProperties().arc.selected = false;
        });
    }

    lines.getSource().clear();

    e.selected.filter(function(feature) {
        var selectedFeatures = feature.get('features');
        var images = [];
        var count = {number:0};
        $.each(selectedFeatures, function(i, f) {
            var arc = f.getProperties().arc;
            arc.selected = true;
            arcs.getSource().addFeature(new Feature(arc));
            getIsovist(f);
            getThumbnail(f);
        });
    });

});




$("#fileTree").on('changed.jstree', function (e, data) {
    //Text reinitialization
    document.body.className = '';
    $("#clusterText").text("Chargement des photographies...");
    $("#loaderIsovist").addClass("loader");
    $("#isovist").text("Calcul en cours");

    controller.abort();
    controller = new AbortController();
    const signal = controller.signal;

    //Selected fields in file tree
    var i, j, r = [];
    for(i = 0, j = data.selected.length; i < j; i++) {
        r.push(data.instance.get_node(data.selected[i]).text);
    }
    //Query DB and generate objects
    getDocs(r, "fullDocs").then(function(metadataJSON) {
        pictures = [];
        for (var i = 0; i < metadataJSON.length; i++) {
            var photo = metadataJSON[i];
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
        }
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
        var promises = [];
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
            getImageLayout(feature, signal).then(function(uri) {
                loadImageAndFillGrid(uri, images, {label:label, distance:distance}, count, pictures.length);
            });
            var promise = computeIsovistForPicture(feature, signal);
            promises.push(promise);
        });

        //R-tree bulk loading
        Promise.all(promises).then(function(polygons) {
            var boundingBoxes = [];
            $.each(polygons, function(i, polygon) {
                var polygonExtent = polygon.getExtent();
                var polygonBBox = {minX: polygonExtent[0],
                                   minY: polygonExtent[1],
                                   maxX: polygonExtent[2],
                                   maxY: polygonExtent[3],
                                   feature : polygon.get("feature")};
                boundingBoxes.push(polygonBBox);
            });
            rtree = rbush();
            rtree.load(boundingBoxes);

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
    getDocs("/", "partialDocs").then(function(json) {
        $.each(json, function(i, photo) {
            var ymdString = photo.CreateDate.split(" ")[0];
            var ymdArray = ymdString.split(":");
            photo.year = parseInt(ymdArray[0]);
            photo.month = parseInt(ymdArray[1]);
            photo.day = parseInt(ymdArray[2]);

            var path = photo.SourceFile.split("/");
            photo.filename = path[path.length-1];
        });

        var data = extractFileTree(json, "Photographies de Guillaume Bonnel");
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

//map.addLayer(vector);
map.addLayer(olClusters);
map.addLayer(arcs);
map.addLayer(thumbnails);
map.addLayer(lines);
map.addLayer(inputLines);
map.addInteraction(select);
map.addInteraction(dragBox);

map.addOverlay(overlay);
