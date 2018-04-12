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
import Style  from 'ol/style/style';
import Circle  from 'ol/style/circle';
import Stroke  from 'ol/style/stroke';
import Fill  from 'ol/style/fill';
import Text  from 'ol/style/text';
import LineString from 'ol/geom/linestring';
import Polygon from 'ol/geom/polygon';
import CSV from 'papaparse';
import transpose from 'transpose';

import Tile from 'ol/layer/tile';
import BingMaps from 'ol/source/bingmaps';
import control from 'ol/control';
import extent from 'ol/extent';
import has from 'ol/has';
import Select from 'ol/interaction/select';
import OSMXML from 'ol/format/osmxml';
import loadingstrategy from 'ol/loadingstrategy';

import $ from 'jquery';


var map;

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

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function objArc(center, radius, alpha, omega, segments, flag)
{
    var pointList=[];
    if(flag)
        pointList.push([center[0], center[1]]);

    var dAngle= segments+1;
    for(var i=0;i<dAngle;i++)
    {
        var Angle = alpha - (alpha-omega)*i/(dAngle-1);
        var x = center[0] + radius*Math.cos(Angle*Math.PI/180);
        var y = center[1] + radius*Math.sin(Angle*Math.PI/180);

        var point = [x, y];
        pointList.push(point);
    }
    if(flag)
        pointList.push([center[0], center[1]]);

    var ftArc    = new Polygon([pointList]);
    if(flag)
    {
        var ftArcPt0 = new Vector(pointList[1]);
        var ftArcPt1 = new Vector(pointList[pointList.length-2]);
        var ftArcSehne = new Vector(new LineString([pointList[1], pointList[pointList.length-2]]));
        var arrArc = [ftArc, ftArcPt0, ftArcPt1, ftArcSehne];
    }
    else
        var arrArc = [ftArc];
    return(arrArc);
}

var featuresArc=[];
var features=[];

function addRandomFeatures(extent, count) {
    for (var i = 0; i < count; ++i) {
        var extx = extent[2] - extent[0];
        var exty = extent[3] - extent[1];
        var middlex = extent[0]+extx/2;
        var middley = extent[1]+exty/2;
        var factorx = extx / 10;
        var factory = exty / 10;
        var coordinates = [getRandomArbitrary(middlex-factorx, middlex+factorx), getRandomArbitrary(middley-factory, middley+factory)];
        var alpha = getRandomArbitrary(0, 360);
        var omega = alpha+getRandomArbitrary(10, 40);
        var obj = {x: coordinates[0],
                   y: coordinates[1],
                   radius: 150,
                   alpha: alpha,
                   omega: omega,
                   segments:100,
                   flag: true};
        var arc = objArc([obj.x, obj.y], obj.radius, obj.alpha, obj.omega, obj.segments, obj.flag);
        featuresArc[i] = new Feature({ geometry: arc[0] });
        //    vectorLayerArc.addFeatures(arc);
        features[i] = new Feature(new Point(coordinates));
    }

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


            $.each(featuresArc, function(i, arc) {
                var extentArc = arc.getGeometry().getExtent();
                $.each(features, function(i, f) {
                    var geometryFeature = f.getGeometry();
                    if (geometryFeature.intersectsExtent(extentArc)) {
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
                        f.setStyle(style);
                    }
                });

            });
//            extent.getIntersection(exBuilding,
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

addRandomFeatures(extent2, 2);

var source = new Vector({
    features : features
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


map.addLayer(clusters);
map.addLayer(arcs);
