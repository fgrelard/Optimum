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
var featuresLine =[];

function addRandomFeatures(extent, count) {
    for (var i = 0; i < count; ++i) {
        var extx = extent[2] - extent[0];
        var exty = extent[3] - extent[1];
        var middlex = extent[0]+extx/2;
        var middley = extent[1]+exty/2;
        var factorx = extx / 3;
        var factory = exty / 3;
        var coordinates = [getRandomArbitrary(middlex-factorx, middlex+factorx), getRandomArbitrary(middley-factory, middley+factory)];
        coordinates = [739885.8194006054, 5905880.253554305 ]
        var alpha = getRandomArbitrary(0, 360);
        var omega = alpha+getRandomArbitrary(10, 40);
        alpha = 270;
        omega = 360;
        var obj = {x: coordinates[0],
                   y: coordinates[1],
                   radius: 150,
                   alpha: alpha,
                   omega: omega,
                   segments:100,
                   flag: true};
        var arc = objArc([obj.x, obj.y], obj.radius, obj.alpha, obj.omega, obj.segments, obj.flag);
        var featureArc = new Feature({ geometry: arc[0] });
        featureArc.position = coordinates;
        featuresArc.push(featureArc);
        //    vectorLayerArc.addFeatures(arc);
        features.push(new Feature(new Point(coordinates)));
    }

}


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

function segmentsIntersect(s1, s2) {
    var pS1F = s1.getFirstCoordinate();
    var pS1L = s1.getLastCoordinate();
    var pS2F = s2.getFirstCoordinate();
    var pS2L = s2.getLastCoordinate();
    var intersection = segment_intersection(pS1F[0], pS1F[1],
                                            pS1L[0], pS1L[1],
                                            pS2F[0], pS2F[1],
                                            pS2L[0], pS2L[1]);
    return intersection;

}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

var eps = 0.0000001;
function between(a, b, c) {
    return a-eps <= b && b <= c+eps;
}
function segment_intersection(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!between(x2, x, x1)) {return false;}
        } else {
            if (!between(x1, x, x2)) {return false;}
        }
        if (y1>=y2) {
            if (!between(y2, y, y1)) {return false;}
        } else {
            if (!between(y1, y, y2)) {return false;}
        }
        if (x3>=x4) {
            if (!between(x4, x, x3)) {return false;}
        } else {
            if (!between(x3, x, x4)) {return false;}
        }
        if (y3>=y4) {
            if (!between(y4, y, y3)) {return false;}
        } else {
            if (!between(y3, y, y4)) {return false;}
        }
    }
    return {x: x, y: y};
}

function isNonBlocking(segment, position, segments) {
    var p1 = segment.getFirstCoordinate();
    var p2 = segment.getLastCoordinate();

    // var poly = new Polygon([[position, s1,
    //                          s1, s2,
    //                          s2, position]]);
    var s1 = new LineString([position, p1]);
    var s2 = new LineString([position, p2]);
    var toPush = false;
    $.each(segments, function(i, s) {
        var ps1 = s.getFirstCoordinate();
        var ps2 = s.getLastCoordinate();
        if (s === segment)
            return true;
        var i1 = segmentsIntersect(s1, s);
        var i2 = segmentsIntersect(s2, s);

        if (i1 || i2) {
            toPush = true;
        }
    });
    return toPush;
}

function visionBlockingArc(segment, position) {
    var radius = 150;

    var p1 = segment.getFirstCoordinate();
    var p2 = segment.getLastCoordinate();

    var v1 = [p1[0] - position[0],
              p1[1] - position[1]];
    var v2 = [p2[0] - position[0],
              p2[1] - position[1]];

    var dot1 = v1[0] * radius;
    var dot2 = v2[0] * radius;

    var norm1 = Math.sqrt(Math.pow(v1[0], 2) + Math.pow(v1[1], 2));
    var norm2 = Math.sqrt(Math.pow(v2[0], 2) + Math.pow(v2[1], 2));

    var alpha = Math.acos(dot1  / (norm1 * radius)) * 180 / Math.PI;
    if (v1[1] < 0) alpha = 360-alpha;
    var omega = Math.acos(dot2 / (norm2 * radius)) * 180 / Math.PI;

    if (v2[1] < 0) omega = 360-omega ;
    if (omega < alpha) {
        var tmp = alpha;
        alpha = omega;
        omega = tmp;
    }
    var diffOA = omega - alpha;
    var diffOA360 = 360+alpha-omega;
    if (diffOA360 < diffOA)
        alpha = alpha + 360;

    var obj = {x: position[0],
               y: position[1],
               radius: radius,
               alpha: alpha,
               omega: omega,
               segments:100,
               flag: true};
    var arc = objArc([obj.x, obj.y], obj.radius, obj.alpha, obj.omega, obj.segments, obj.flag);
    featuresArc.push(new Feature({geometry : arc[0]}));
    arcs.getSource().clear();
    arcs.getSource().addFeatures(featuresArc);
}

function isoVist(featuresArc, features) {

    $.each(featuresArc, function(a, arc) {
        var extentArc = arc.getGeometry().getExtent();
        var position = arc.position;
        var segments = [];
        var blockingSegments = [];
        $.each(features, function(b, f) {
            f.segments = [];
            var geometryFeature = f.getGeometry();
            if (arc.getGeometry().intersectsExtent(geometryFeature.getExtent()) &&
                geometryFeature.intersectsExtent(extentArc)) {
                var style = getStyleVisible();
                f.setStyle(style);
                if (geometryFeature.getType() === "Polygon") {
                    var polygonVertices = geometryFeature.getCoordinates()[0];
                    for (var i = 0; i < polygonVertices.length-1; i++) {
                        var segment = new LineString([polygonVertices[i], polygonVertices[i+1]]);
                        segments.push(segment);
                        f.segments.push(segment);
                    }
                }
            }
        });

        $.each(features, function(i, f) {
            $.each(f.segments, function(j, segment) {
                var nonBlocking = isNonBlocking(segment, position,
                                                segments);
                if (!nonBlocking) {
                    blockingSegments.push(segment);
                }
            });
        });
        $.each(blockingSegments, function(j, segment) {
            featuresLine.push(new Feature(segment));
            visionBlockingArc(segment, position);
        });

    });
    lines.getSource().clear();
    lines.getSource().addFeatures(featuresLine);
    // arcs.getSource().clear();
    // $.each( polys, function(i, poly) {
    //     featuresArc.push(new Feature({geometry:poly}));
    // });
    // arcs.getSource().addFeatures(featuresArc);
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
            isoVist(featuresArc, features);
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

addRandomFeatures(extent2, 1);

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
            color: '#FF0000'
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
