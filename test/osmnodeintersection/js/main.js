import Map from 'ol/map';
import View from 'ol/view';
import XYZ from 'ol/source/xyz';
import OSM from 'ol/source/osm';
import proj from 'ol/proj';
import Vector from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';
import Point from 'ol/geom/point';
import Cluster from 'ol/source/cluster';
import Feature from 'ol/feature';
import Style  from 'ol/style/style';
import Circle  from 'ol/style/circle';
import Stroke  from 'ol/style/stroke';
import Fill  from 'ol/style/fill';
import Text  from 'ol/style/text';
import LineString from 'ol/geom/linestring';
import Polygon from 'ol/geom/polygon';
import CSV from 'papaparse';
import transpose from 'transpose';

import control from 'ol/control';
import extent from 'ol/extent';
import Select from 'ol/interaction/select';
import OSMXML from 'ol/format/osmxml';
import loadingstrategy from 'ol/loadingstrategy';

import Arc from '../../../js/lib/arc';
import IsoVist from '../../../js/lib/isovistsectors2d';
import $ from 'jquery';
import {segmentIntersection} from '../../../js/lib/lineintersection';

var map;
var featuresArc=[];
var features=[];
var featuresLine =[];
var alpha = 270;
var omega = 360;
var radius = 150;
var position = [739885.8194006054, 5905880.253554305 ];
var arc = new Arc(position, radius, alpha, omega);
arc.computeGeometry();

// console.log(segmentIntersection(739885.8194006054, 5905880.253554305, 739885.8194006054, 5905730.253554305 , 739869.5666760689, 5905838.1341363415, 739897.5412641052, 5905829.974136281));

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


var vectorSource = new Vector({
    format: new OSMXML(),
    loader: function(extent2, resolution, projection) {
        var epsg4326Extent =
            proj.transformExtent(extent2, projection, 'EPSG:4326');
        var client = new XMLHttpRequest();
        client.open('POST', 'https://overpass-api.de/api/interpreter');
        client.addEventListener('load', function() {
            var features = new OSMXML().readFeatures(client.responseText, {
                featureProjection: map.getView().getProjection()
            });
            vectorSource.addFeatures(features);
            var isovist = new IsoVist(arc, vectorSource.getFeatures(), true);
            var visibleSegments = isovist.computeIsoVist();
            $.each(visibleSegments, function(i, segment) {
                featuresLine.push(new Feature(new LineString([segment.getFirstCoordinate(), segment.getLastCoordinate()])));
            });

            lines.getSource().clear();
            lines.getSource().addFeatures(featuresLine);
        });
        var query = '(node(' +
            epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
            epsg4326Extent[3] + ',' + epsg4326Extent[2] +
            ');rel(bn)->.foo;way(bn);node(w)->.foo;rel(bw););out meta;';
        client.send(query);
    },
    strategy: loadingstrategy.bbox
});

var vector = new VectorLayer({
    source: vectorSource,
    style: function(feature) {
        for (var key in styles) {
            var value = feature.get(key);
            if (value !== undefined) {
                for (var regexp in styles[key]) {
                    if (new RegExp(regexp).test(value)) {
                        return styles[key][regexp];
                    }
                }
            }
        }
        return null;
    }
});



map = new Map({
    layers: [vector],
    target: document.getElementById('map'),
    controls: control.defaults({
        attributionOptions: {
            collapsible: false
        }
    }),
    view: new View({
        center: [739218, 5906096],
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
        })
    })
});


map.addLayer(clusters);
map.addLayer(arcs);
map.addLayer(lines);

var select = new Select();
map.addInteraction(select);
select.on('select', function(e) {
    var selectedFeatures = select.getFeatures();
    e.selected.filter(function(feature) {
        console.log(feature);
    });


});
