import $ from 'jquery';
window.$ = $;
window.jQuery = $;

import HeatMap from './lib/heatmap';
import View from 'ol/View';
import Group from 'ol/layer/Group';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import {fromLonLat} from 'ol/proj';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import * as extent from 'ol/extent';
import Select from 'ol/interaction/Select';
import Projection from 'ol/proj/Projection';
import * as control from 'ol/control';
import OSMXML from 'ol/format/OSMXML';
import GeoJSON from 'ol/format/GeoJSON';
import * as loadingstrategy from 'ol/loadingstrategy';
import DragBox from 'ol/interaction/DragBox';
import {shiftKeyOnly} from 'ol/events/condition';
// import plugins from 'ol/plugins';
// import PluginType from 'ol/plugintype';
import FullScreen from 'ol/control/FullScreen';

import ControlOverlay from 'ol-ext/control/Overlay';
import Toggle from 'ol-ext/control/Toggle';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';


import jsTree from 'jstree';
import interact from 'interactjs';
import rbush from 'rbush';

import {euclideanDistance} from './lib/distance';
import Arc from './lib/arc';
import Picture from './lib/picture';
import {getPosition, getOrientation} from './lib/exiftool-util';
import * as styles from './lib/styles';
import DistanceStrategy from './lib/clustering/distancestrategy';
import DendrogramStrategy from './lib/clustering/dendrogramstrategy';
import VectorLayerColormapRenderer from './lib/vectorlayercolormaprenderer';
import * as Polls from './lib/serverpoll';
import * as Grid from './lib/grid';
import {overlay,
        overlayGroup,
        onClickGroup,
        olClusters,
        arcs,
        lines,
        inputLines,
        vectorLayerColormap} from './lib/layers';

var stEtienneLonLatConv = [487537.9340862985, 5693250.829916254];

var controller = new AbortController();
var grid = Grid.generateGrid();
var pictures = [];
var clusters = [];
var dendrogram = [];
var rtree = rbush();

var select = new Select();
var layerSwitcher = new LayerSwitcher({
    reordering: false
});


var menu = new ControlOverlay ({ closeBox : true, className: "slide-left menu", content: $("#menu").get(0) });

// A toggle control to show/hide the menu
var t = new Toggle(
	{	html: '<i class="fa fa-bars" ></i>',
		className: "menu",
		title: "Menu",
		onToggle: function() { menu.toggle(); }
	});


var dragBox = new DragBox({
    condition: shiftKeyOnly
});

var map = new HeatMap({
    layers: [
        new Group({
            title: 'Cartes',
            layers: [new TileLayer({
                title:'OSM',
                type:'base',
                source: new OSM()
            })]
        }),
        overlayGroup,
        onClickGroup
    ],
    target: 'map',
    view: new View({
        center: stEtienneLonLatConv,
        zoom: 16
    })
});

function extractFileTree(json, firstString) {
    var data = [];
    data.push({ "id" : firstString, "parent": "#", "text": firstString, type: "default", state : {opened: true}});
    $.each(json, function(i, photo) {
        var year = photo.year;
        var month = photo.month;
        var ym = month.toString() + "/" + year.toString();
        var monthArray = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai',
                          'Juin', 'Juillet', 'Août', 'Septembre',
                          'Octobre', 'Novembre', 'Décembre'];
        var monthString = monthArray[month-1] + " " + year.toString();

        var dateExists = data.find(function(existingDate) {
            return existingDate.id === ym;
        });
        if (!dateExists)
            data.push({ "id" : ym, "parent": firstString, "text": monthString, type: "default"});
        data.push({ "id" : photo.filename, "parent": ym, "text": photo.filename, type: "child"});
    });
    return data;
}

function numberOfPictures(style) {
    var color = style.getFill().getColor().toString();
    var rgba = color.split(",");
    var a = rgba[rgba.length-1].split(")")[0];
    var opacity = Number.parseFloat(a);
    return Math.abs(Math.log(100 * (1 - opacity)) / Math.log(1 - opacity));
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


function visibilityPolygon(data, center, radius) {
    var polygon = [];
    var anglesToSegments = data[0].slice();
    var freeVisionAngles = data[1].slice();
    $.each(freeVisionAngles, function(i, arc) {
//        console.log("new Arc(["+ arc.center + "]," + 100 + ", " + arc.alpha + ", " + arc.omega + "),\n");
        var angle = new Arc(arc.center, radius || arc.radius, arc.alpha, arc.omega);
        if (angle.omega - angle.alpha < 0.5) return;
        angle.computeGeometry();
        var freeSegment = new LineString([angle.fullGeometry[1].getFlatCoordinates(),
                                          angle.fullGeometry[2].getFlatCoordinates()]);
        var angleToSegment = {angle: angle, segment: freeSegment};
        anglesToSegments.push(angleToSegment);
    });

    anglesToSegments.sort(function(a,b) {
        if (a.angle.alpha === b.angle.alpha)
            return a.angle.omega - b.angle.omega;
        return a.angle.alpha - b.angle.alpha;
    });
    if (anglesToSegments.length > 0) {
        polygon.push(center);
        var firstCoords = anglesToSegments[0].segment.flatCoordinates;
        polygon.push([firstCoords[0], firstCoords[1]]);
        for (var i = 0; i < anglesToSegments.length; i++) {
            var coords = anglesToSegments[i].segment.flatCoordinates;
            var fc = [coords[0], coords[1]];
            var lc = [coords[2], coords[3]];
            polygon.push(fc);
            polygon.push(lc);
        }
        polygon.push(center);
    }
    return new Polygon([polygon]);

}

function getImage(f) {
    if (f.get('image')) {
        var image = f.get('image');
        var img = $("<img>").attr("src", image);
        img = img.attr("class", "menuImage");
	    var content = $("<div>").attr("class", "containerMenuImg").append( img );
 	    $(".data").html(content);
    }
    else {
        Polls.pollImages(f.getProperties().filename).then(function(uri) {
            f.set('image', uri);
            getImage(f);
        });
    }
}

function computeIsovistForPicture(feature, signal) {
    var previousArc = feature.getProperties().arc;
    var arc = new Arc(previousArc.center, previousArc.radius, previousArc.alpha, previousArc.omega);
    return Polls.pollIsovist(feature.getProperties().filename, signal).then(function(data) {
        if (!data[0].length && !data[1].length)
            data[1].push(feature.getProperties().arc);
        var polygon = visibilityPolygon(data, arc.center, arc.radius);
        feature.set("visibilityAngles", data);
        feature.set("isovist", polygon);
        vectorLayerColormap.getVectorSource().addFeature(new Feature({geometry : polygon}));
        var maxIntersection = numberOfPictures(vectorLayerColormap.getStyle()[0]);
        $("#maxIntersection").text(isNaN(maxIntersection) ? 0 : Math.round(maxIntersection).toString());
        return polygon;
    });
}

function getIsovist(f) {
    var picture = f.getProperties();
    if (picture.isovist) {
        lines.getSource().addFeature(new Feature({geometry : picture.isovist}));
    }
}

function arcRadiusFromZoomLevel(map) {
    var ext = map.getView().calculateExtent(map.getSize());
    var diameter = euclideanDistance([ext[0], ext[1]],
                                     [ext[2], ext[3]]);
    return diameter/2.0;
}


function onLoadedSegments(client, extentDrag, center) {
    client.addEventListener('load', function(e) {
        inputLines.getSource().clear();
        var buildingSegments = Polls.segmentsFromXMLRequest(client, map, center);
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
            var overlay = styles.createCircleOutOverlay(picture.position);
            map.addOverlay(overlay);

        }
    });

    $.each(picturesVisualizing, function(i, feature) {
        Polls.pollImages(feature.getProperties().filename).then(function(uri) {
            Grid.loadImageAndFillGrid(grid, uri, images, {}, count, picturesVisualizing.length);
        });
    });
}


function loadPictures(metadataJSON) {
    pictures = [];
    var promises = [];
    for (var i = 0; i < metadataJSON.length; i++) {
        var photo = metadataJSON[i];
        if (photo.hasOwnProperty('ImageWidth')) {
            var position = getPosition(photo);
            if (position !== null) {
                var positionProj = fromLonLat(position);
                var fileName = photo.SourceFile;
                var cone = getOrientation(photo, positionProj);
                var picture = new Picture(fileName, positionProj, cone);
                var feature = new Feature(picture);
                pictures.push(feature);
            }
        }
    }

}

function featureToThumbnails(feature, signal) {
    Polls.pollThumbnails(feature.getProperties().filename, signal).then(function(uri) {
        feature.set('thumbnail', uri);
    });
}


function completeFeatures(signal) {
     //Clustering with cursor
    // var clusteringStrategy = new DistanceStrategy(pictures);
    // clusters = clusteringStrategy.computeClusters();
    // var dendro = new DendrogramStrategy(pictures);
    // dendrogram = dendro.computeClusters();
    // computeRangeSlider(dendrogram);

    //Display grid of image clusters
    var images = [];
    var count = {number:0};
    var promises = [];
    for (var i = 0; i < pictures.length; i++) {
        var feature = pictures[i];
        var label = -1;
        var distance = -1;
        // for (var key in clusters) {
        //     if (clusters[key].hasPicture(feature.getProperties()))
        //         label = key;
        // }
        // for (var key2 in dendrogram) {
        //     if (dendrogram[key2].hasPicture(feature.getProperties())) {
        //         distance = dendrogram[key2].label;
        //     }
        // }

        featureToThumbnails(feature, signal);

        var promise = computeIsovistForPicture(feature, signal);
        promises.push(promise);
    }

    return promises;
}


function loadRTree() {
    var boundingBoxes = [];
    $.each(pictures, function(i, feature) {
        var polygon = feature.get("isovist");
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

$('.filter-field').change(function() {
    Grid.filter(grid);
});
$('.layout-field').change(function() {
    Grid.changeLayout(grid);
});

$("#questionMark").click(function(event) {
    $(".lbl-toggle").trigger('click');
});

// $("#myRange").on("change", function(event) {
//     var sliderValue = event.target.value;
//     var filterFieldValue = $('.filter-field').val();
//     grid.filter(function (item) {
//         var element = item.getElement();
//         var isFilterMatch = !filterFieldValue ? true : (element.getAttribute('label') || filterFieldValue) === filterFieldValue;
//         var isSliderMatch = !sliderValue ? true : parseFloat(element.getAttribute('distance') || sliderValue) <= sliderValue;
//         return isFilterMatch && isSliderMatch;
//     });
// });



map.getView().on('change:resolution', function(event)  {
    arcs.getSource().clear();
    lines.getSource().clear();
    olClusters.getSource().getSource().forEachFeature(function(feature) {
        var previousArc = feature.getProperties().arc;
        var selected = previousArc.selected;
        var arc = new Arc(previousArc.center, previousArc.radius, previousArc.alpha, previousArc.omega);

        arc.radius = arcRadiusFromZoomLevel(map);
        arc.computeGeometry();
        previousArc.geometry = arc.geometry;
        previousArc.fullGeometry = arc.fullGeometry;
        if (selected) {
            if (feature.get("visibilityAngles")) {
                var polygon = visibilityPolygon(feature.get("visibilityAngles"), arc.center, arc.radius);
                feature.set("isovist", polygon);
                lines.getSource().addFeature(new Feature({geometry: polygon}));
            }
            arcs.getSource().addFeature(new Feature(arc));
        }
    });
});



// clear selection when drawing a new box and when clicking on the map
dragBox.on('boxstart', function() {
    inputLines.getSource().clear();
});


dragBox.on('boxend', function() {
    //Clear highlighted photographies visualizing point
    map.getOverlays().clear();

    // features that intersect the box are added to the collection of
    // selected features
    var extentDrag = dragBox.getGeometry().getExtent();
    var center = [(extentDrag[0] + extentDrag[2]) /2, (extentDrag[1] + extentDrag[3]) /2];

    //Visualization
    var client = Polls.getBuildingSegments(extentDrag, new View({center: center}).getProjection());
    onLoadedSegments(client, extentDrag, center);

    var request = {minX: extentDrag[0],
                   minY: extentDrag[1],
                   maxX: extentDrag[2],
                   maxY: extentDrag[3]};


    updateGridOnPicturesVisualizing(request, extentDrag);
});


select.on('select', function(e) {
    //Reset
    if (!e.mapBrowserEvent.originalEvent.ctrlKey) {
        lines.getSource().clear();
        arcs.getSource().clear();
        olClusters.getSource().getSource().forEachFeature(function(feature) {
            feature.getProperties().arc.selected = false;
        });
    }

    e.selected.filter(function(feature) {
        var selectedFeatures = feature.get('features');
        var images = [];
        var count = {number:0};
        for (var i = 0; i < selectedFeatures.length; i++) {
            var f = selectedFeatures[i];
            var arc = f.getProperties().arc;
            arc.selected = true;
            arc.radius = arcRadiusFromZoomLevel(map);
            arc.computeGeometry();
            arcs.getSource().addFeature(new Feature(arc));
            getIsovist(f);
            getImage(f);
        }
    });

});

select.getFeatures().on('remove', function(e) {
    $(".data").html("");
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

    vectorLayerColormap.getVectorSource().clear();
    //Query DB and generate objects
    Polls.pollDB(r, "fullDocs").then(function(metadataJSON) {
        loadPictures(metadataJSON);

        if (pictures.length === 0) {
            grid.remove(grid.getItems(), {removeElements:true});
        }

        var promises = completeFeatures(signal);

        //r-tree bulk loading
        Promise.all(promises).then(function(polygons) {
            loadRTree();
            document.body.className = 'images-loaded';
        });

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

$(document).ready( function(event) {
    Polls.pollDB("/", "partialDocs").then(function(json) {
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
                'themes': {
                    'name': 'proton',
                    'responsive': true
                },
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
              'plugins' : ["checkbox", "types", "sort"],
              'sort': function(a, b) {
                  let a1 = this.get_node(a);
                  let b1 = this.get_node(b);
                  let ym1 = a1.id;
                  let ym2 = b1.id;
                  let t1 = ym1.split("/");
                  let t2 = ym2.split("/");
                  let m1 = parseInt(t1[0]);
                  let m2 = parseInt(t2[0]);
                  let y1 = parseInt(t1[1]);
                  let y2 = parseInt(t2[1]);
                  if (y1 == y2){
                      return (m1 > m2) ? 1 : -1;
                  } else {
                      return (y1 > y2) ? 1 : -1;
                  }
              }
            });
    });

});


//plugins.register(PluginType.LAYER_RENDERER, VectorLayerColormapRenderer);

overlayGroup.getLayers().push(olClusters);
overlayGroup.getLayers().push(vectorLayerColormap);

onClickGroup.getLayers().push(arcs);
onClickGroup.getLayers().push(lines);
onClickGroup.getLayers().push(inputLines);

map.addInteraction(select);
map.addInteraction(dragBox);

map.addOverlay(overlay);
map.addControl(layerSwitcher);
map.addControl(new FullScreen());
map.addControl(menu);
map.addControl(t);
