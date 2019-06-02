import Map from 'ol/Map';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM';
import {transformExtent, fromLonLat} from 'ol/proj';
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';
import Point from 'ol/geom/Point';
import Cluster from 'ol/source/Cluster';
import Feature from 'ol/Feature';
import Style  from 'ol/style/Style';
import Circle  from 'ol/style/Circle';
import Stroke  from 'ol/style/Stroke';
import Fill  from 'ol/style/Fill';
import Text  from 'ol/style/Text';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import GeoJSON from 'ol/format/GeoJSON';
import $ from 'jquery';
import {defaults} from 'ol/control';
import Select from 'ol/interaction/Select';
import {bbox} from 'ol/loadingstrategy';
import * as ExifToolUtil from '../../../js/lib/exiftool-util.js';
import Arc from '../../../js/lib/arc';
import IsoVist from '../../../js/lib/isovistsectors2d';
import {segmentIntersection} from '../../../js/lib/lineintersection';

var map;
var featuresArc=[];
var features=[];
var featuresLine =[];
var alpha = 190;
var omega = 240;
var radius = 300;
var position = [739885.8194006054, 5905880.253554305 ];
position = [739800.8194006054, 5906000.253554305];
position = [ 489298.32814487105, 5688013.78184738 ];
var lonlat = [-87.65005, 41.854];
position = fromLonLat(lonlat);
var arc = new Arc(position, radius, alpha, omega);
arc.computeGeometry();

var geoFormat = new GeoJSON();
var buildingSegments = [];

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    console.log(content);
    a.href = window.URL.createObjectURL(file);
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    console.log(a);
    a.click();
}


$.getJSON("data/chicago_small.geojson", function(json) {
    buildingSegments = geoFormat.readFeatures(json, {
        featureProjection : map.getView().getProjection()
    });
    vector.getSource().clear();
    vector.getSource().addFeatures(buildingSegments);
    $.getJSON("data/chicago_flickr.geojson", function(json) {
        clusterSource.getSource().clear();
        var content = '';
        for (var myDoc of json.features) {
            if (i===0) content = '{"arcs":[';
            var pos = ExifToolUtil.getPosition(myDoc);
            if (pos) {

                var positionProj = fromLonLat(pos);
                clusterSource.getSource().addFeature(new Feature(new Point(positionProj)));

                var dir = ExifToolUtil.getOrientation(myDoc, positionProj);
                var arc = new Arc(dir.center, 400, dir.alpha,
                                  dir.omega);
                arc.computeGeometry();
                var isovistComputer = new IsoVist(arc, buildingSegments);

                var isovist = isovistComputer.isovist();
                if (isovist.length && isovist[0].length && isovist[1].length) {
                    var freeVisionAngles = isovist[1].slice();
                    for (let freeArc of freeVisionAngles) {
                        content += "new Arc(["+ freeArc.center + "]," + 100 + ", " + freeArc.alpha + ", " + freeArc.omega + "),";
                    }
                }
            }
        }
        content += ']}';
        download(content, "freeAngles.json", "text/plain");
    });
});




var vectorSource = new Vector();


var styles = {
    'amenity': {
        'parking': new Style({
            stroke: new Stroke({
                color: 'rgba(170, 170, 170, 1.0)',
                width: 1
            }),
            fill: new Fill({
                color: 'rgba(170, 170, 170, 0.3)'
            })
        })
    },
    'building': {
        '.*': new Style({
            zIndex: 100,
            stroke: new Stroke({
                color: 'rgba(246, 99, 79, 1.0)',
                width: 1
            }),
            fill: new Fill({
                color: 'rgba(246, 99, 79, 0.3)'
            })
        })
    },
    'highway': {
        'service': new Style({
            stroke: new Stroke({
                color: 'rgba(255, 255, 255, 1.0)',
                width: 2
            })
        }),
        '.*': new Style({
            stroke: new Stroke({
                color: 'rgba(255, 255, 255, 1.0)',
                width: 3
            })
        })
    },
    'landuse': {
        'forest|grass|allotments': new Style({
            stroke: new Stroke({
                color: 'rgba(140, 208, 95, 1.0)',
                width: 1
            }),
            fill: new Fill({
                color: 'rgba(140, 208, 95, 0.3)'
            })
        })
    },
    'natural': {
        'tree': new Style({
            image: new Circle({
                radius: 2,
                fill: new Fill({
                    color: 'rgba(140, 208, 95, 1.0)'
                }),
                stroke: null
            })
        })
    }
};



function getStyleVisible() {
    var style = new Style({
        zIndex: 100,
        stroke: new Stroke({
            color: 'rgba(30, 30, 200, 1.0)',
            width: 1
        }),
        fill: new Fill({
            color: 'rgba(180, 180, 30, 0.3)'
        })
    });
    return style;
}


// var vectorSource = new Vector({
//     format: new OSMXML(),
//     loader: function(extent2, resolution, projection) {
//         var epsg4326Extent =
//             transformExtent(extent2, projection, 'EPSG:4326');
//         var client = new XMLHttpRequest();
//         client.open('POST', 'https://overpass-api.de/api/interpreter');
//         client.addEventListener('load', function() {
//             var features = new OSMXML().readFeatures(client.responseText, {
//                 featureProjection: map.getView().getProjection()
//             });
//             var limitedFeatures = [];
//             for (var i = 0; i < features.length; i++) {
//                 var f = features[i];
//                 var node = f.getProperties();
//                 if (node.hasOwnProperty("building") ||
//                     node.hasOwnProperty("amenity")  ||
//                     node.hasOwnProperty("natural")
//                    ) {
//                     limitedFeatures.push(f);
//                 }
//             }
//             vectorSource.addFeatures(limitedFeatures);

//             var isovist = new IsoVist(arc, vectorSource.getFeatures(), true);
//             var visibleSegments = isovist.isovist();

//             featuresLine.push(new Feature({geometry : visibleSegments}));
//             // console.log(visibleSegments);
//             // $.each(visibleSegments, function(i, segment) {
//             //     featuresLine.push(new Feature(new LineString([segment.getFirstCoordinate(), segment.getLastCoordinate()])));
//             // });

//             lines.getSource().clear();
//             lines.getSource().addFeatures(featuresLine);
//         });
//         var query = '(node(' +
//             epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
//             epsg4326Extent[3] + ',' + epsg4326Extent[2] +
//             ');rel(bn)->.foo;way(bn);node(w)->.foo;rel(bw););out meta;';
//         client.send(query);
//     },
//     strategy: bbox
// });

var vector = new VectorLayer({
    source: vectorSource,
    style: function(feature) {
        return styles['building']['.*'];
        // for (var key in styles) {
        //     var value = feature.get(key);
        //     console.log(feature);
        //     if (value !== undefined) {
        //         for (var regexp in styles[key]) {
        //             if (new RegExp(regexp).test(value)) {
        //                 return styles[key][regexp];
        //             }
        //         }
        //     }
        // }
        // return null;
    }
});



map = new Map({
    layers: [
        new TileLayer({
        source: new OSM()
    }),
             vector],
    target: document.getElementById('map'),
    // controls: defaults({
    //     attributionOptions: {
    //         collapsible: false
    //     }
    // }),
    view: new View({
        center: position,
        maxZoom: 19,
        zoom: 17
    })
});

var extent2 = map.getView().calculateExtent(map.getSize());

var featureArc = new Feature({geometry: arc.geometry});
featureArc.position = position;
featuresArc.push(featureArc);

features.push(new Feature(new Point(position)));

var source = new Vector({
    features : features
});

var lineSource = new Vector({
    features: featuresLine
});

var clusterSource = new Cluster({
    source: source
});

var vectorLayerArc = new Vector({
    features: featuresArc
});

var styleCache = {};
var fill = new Fill();
var style = new Style({
    stroke: new Stroke({
        color: '#ff9933'
    }),
    fill: fill
});



var arcs = new VectorLayer({
    source: vectorLayerArc,
});

var styleCache2 = {};
var clusters = new VectorLayer({
    source: clusterSource,
    style: function(feature) {
        var size = feature.get('features').length;
        var style = styleCache2[size];
        if (!style) {
            style = new Style({
                image: new Circle({
                    radius: 20,
                    stroke: new Stroke({
                        color: '#fff'
                    }),
                    fill: new Fill({
                        color: '#3399CC'
                    })
                }),
                text: new Text({
                    text: size.toString(),
                    fill: new Fill({
                        color: '#fff'
                    })
                })
            });
            styleCache2[size] = style;
        }
        return style;
    }
});

var lines = new VectorLayer({
    source: lineSource,
    style: new Style({
        stroke : new Stroke({
            color: '#FFFF00'
        })// ,
        // fill : new Fill({
        //     color: "#33CC9977"
        // })
    })
});


map.addLayer(clusters);
//map.addLayer(arcs);
map.addLayer(lines);

var select = new Select();
map.addInteraction(select);
select.on('select', function(e) {
    var selectedFeatures = select.getFeatures();
    e.selected.filter(function(feature) {
        console.log(feature);
    });


});
