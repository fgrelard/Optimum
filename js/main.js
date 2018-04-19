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
import extent from 'ol/extent';
import has from 'ol/has';
import Select from 'ol/interaction/select';
import $ from 'jquery';
import Image from 'ol/layer/image';
import ImageStatic from 'ol/source/imagestatic';
import Projection from 'ol/proj/projection';

import control from 'ol/control';
import OSMXML from 'ol/format/osmxml';
import loadingstrategy from 'ol/loadingstrategy';

import Arc from './lib/arc';
import IsoVist from './lib/isovistsectors2d';
import Picture from './lib/picture';

var count = 200;
var featuresArc = new Array(count);
var stEtienneLonLat = [4.392569444444445, 45.42289722222222];
var stEtienneLonLatConv = proj.fromLonLat(stEtienneLonLat);
var lonConv = stEtienneLonLatConv[0];
var latConv = stEtienneLonLatConv[1];


var url = "http://localhost:8080/";
var projection = proj.get();
var thumbnails = new Image();
var pictures = [];
var featuresLine =[];

var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
var radius = 20;

function lonLatToDecimal(deg, min, sec) {
    return deg + min / 60 + sec / 3600;
}

function loadExifToolMetadata(filename) {
    var f = fetch(filename);
    var t1 = f.then(function(response) {
        return response.text();
    });
    var t2 = t1.then(function(text) {
        var textS = text.toString();
        return CSV.parse(text.replace(/ /g, ""),
                         {delimiter: ':',
                          complete: function(results) {
                              return results;
                          },
                          dynamicTyping: true
                         });

    });
    return t2;

}


function gradient(arc, resolution) {
    var extent2 = arc.getGeometry().getExtent();

    var pixelRatio = has.DEVICE_PIXEL_RATIO;
    // Gradient starts on the left edge of each feature, and ends on the right.
    // Coordinate origin is the top-left corner of the extent of the geometry, so
    // we just divide the geometry's extent width by resolution and multiply with
    // pixelRatio to match the renderer's pixel coordinate system.

    var x1, x2, y1, y2;
    var height = extent.getHeight(extent2) / resolution * pixelRatio;
    var width = extent.getWidth(extent2) / resolution * pixelRatio;

    var angle = (arc.getProperties().alpha + arc.getProperties().omega - 180) / 2;
    var angleRad = angle * Math.PI / 180 + Math.PI / 2;
    var rotateDegrees = Math.round((Math.PI - angleRad) * 360 / (2*Math.PI));
    if (rotateDegrees < 0)
        rotateDegrees = 360 + rotateDegrees;

    if ((0 <= rotateDegrees && rotateDegrees < 45)) {
        x1 = 0;
        y1 = height / 2 * (45 - rotateDegrees) / 45;
        x2 = width;
        y2 = height - y1;
    } else if ((45 <= rotateDegrees && rotateDegrees < 135)) {
        x1 = width * (rotateDegrees - 45) / (135 - 45);
        y1 = 0;
        x2 = width - x1;
        y2 = height;
    } else if ((135 <= rotateDegrees && rotateDegrees < 225)) {
        x1 = width;
        y1 = height * (rotateDegrees - 135) / (225 - 135);
        x2 = 0;
        y2 = height - y1;
    } else if ((225 <= rotateDegrees && rotateDegrees < 315)) {
        x1 = width * (1 - (rotateDegrees - 225) / (315 - 225));
        y1 = height;
        x2 = width - x1;
        y2 = 0;
    } else if (315 <= rotateDegrees) {
        x1 = 0;
        y1 = height - height / 2 * (rotateDegrees - 315) / (360 - 315);
        x2 = width;
        y2 = height - y1;
    }
    var grad = context.createLinearGradient(x1, y1,
                                            x2, y2);

    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.9, 'orange');
    return grad;
}


function convertMetadataToJSON(metadata) {
    const transposed = transpose(metadata.data);
    const headers = transposed.shift();
    const res = transposed.map(function(row) {
        return row.reduce(function(acc, col, ind) {
            acc[headers[ind]] = col;
            return acc;
        }, {});
    })[0];
    return res;
}

function createPositionArray(positionString) {
    var patt1 = /[0-9.]/g;
    var patt2 = /[a-zA-Z]/g;
    var arrayPos = [];
    var numberString = "";
    for (var i = 0; i < positionString.length; i++) {
        var character = positionString.charAt(i);
        if (character.match(patt1)) {
            numberString += character;
        }
        else {
            if (numberString != '')
                arrayPos.push(Number(numberString));
            numberString = '';
        }
    }
    return arrayPos;
}

function getPosition(mapMetadata) {
    if (mapMetadata.hasOwnProperty('GPSPosition')) {
        var positionString = mapMetadata.GPSPosition;
        var positionSplit = positionString.split(",");
        if (positionSplit.length >= 2) {
            var firstPos = positionSplit[0];
            var secondPos = positionSplit[1];
            var fPosDMS = createPositionArray(firstPos);
            var sPosDMS = createPositionArray(secondPos);
            var fPosDec = lonLatToDecimal(fPosDMS[0], fPosDMS[1], fPosDMS[2]);
            var sPosDec = lonLatToDecimal(sPosDMS[0], sPosDMS[1], sPosDMS[2]);
            var lonLat = [sPosDec, fPosDec];
            var projLonLat = proj.fromLonLat(lonLat);
            return projLonLat;
        }
    }
    return null;
}

function computeAlphaOmegaFromDir(direction, fov) {
    var dirTrigRad = (direction + 90) % 360;
    var alpha = (dirTrigRad - fov / 2) % 360;
    var omega = (alpha + fov);
    return [alpha, omega];
}

function getOrientation(mapMetadata, position) {
    if (mapMetadata.hasOwnProperty('GPSImgDirection') &&
        mapMetadata.hasOwnProperty('Orientation') &&
        mapMetadata.hasOwnProperty('FOV')) {
        var dir = mapMetadata.GPSImgDirection;
        var orientation = mapMetadata.Orientation;
        var fov = Number(mapMetadata.FOV.match(/[0-9.]+/g));
        var angles = computeAlphaOmegaFromDir(dir, fov);
        var obj = {x: position[0],
                   y: position[1],
                   radius: 150,
                   alpha: angles[0],
                   omega: angles[1],
                   segments:100,
                   flag: true};
        var arc = new Arc([position[0], position[1]], 150, angles[0], angles[1]);
        arc.computeGeometry();
        return arc;
    }
    return null;
}



function setStyle(arc, resolution) {
    fill.setColor(gradient(arc, resolution));
    return style;
}



function createNewImage(base64String, position) {
    var uri = base64String.replace("base64:", "data:image/png;base64,");
    var imageStatic = new ImageStatic({
        url: '',
        imageLoadFunction : function(image){
            image.getImage().src = uri;
        },
        projection: projection,
        imageExtent:[position[0]-radius, position[1]-radius, position[0]+radius, position[1]+radius]
    });
    thumbnails.setSource(imageStatic);
}
// var metadata = loadExifToolMetadata("file:///home/fgrelard/Code/Optimum/0W2A0931.txt");


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


var map = new Map({
    layers: [
        new TileLayer({
            source: new OSM()
        })
    ],
    target: 'map',
    view: new View({
        center: stEtienneLonLatConv,
        zoom: 15
    })
});

var extent2 = map.getView().calculateExtent(map.getSize());

var source = new Vector();

var clusterSource = new Cluster({
    source: source
});

var vectorLayerArc = new Vector();

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
    style: setStyle
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
                    radius: radius,
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

var lineSource = new Vector({
    features: featuresLine
});

var lines = new VectorLayer({
    source: lineSource,
    style: new Style({
        stroke : new Stroke({
            color: '#FFFF00'
        })
    })
});


map.addLayer(vector);
map.addLayer(clusters);
map.addLayer(arcs);
map.addLayer(thumbnails);
map.addLayer(lines);

var select = new Select();
map.addInteraction(select);
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

            var isovist = new IsoVist(arc, vectorSource.getFeatures());
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
                createNewImage(b64String, position);
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
                    var fileName = photo.SourceFile;
                    var cone = getOrientation(photo, position);
                    var picture = new Picture(fileName, position, cone);
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
