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

var count = 200;
//var features = [];
var featuresArc = new Array(count);
var stEtienneLonLat = [4.392569444444445, 45.42289722222222];
var stEtienneLonLatConv = proj.fromLonLat(stEtienneLonLat);
var lonConv = stEtienneLonLatConv[0];
var latConv = stEtienneLonLatConv[1];


var url = "http://localhost:8080/";
var projection = proj.get();
var thumbnails = new Image();
var positions = [];
var cones = [];
//Begin openlayers display functions
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
var radius = 20;


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function lonLatToDecimal(deg, min, sec) {
    return deg + min / 60 + sec / 3600;
}

//Loading an exiftool file
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


// /**
//  * Function: objArc
//  * creates an arc (a linestring with n segments)
//  *
//  * Parameters:
//  * center   - center point
//  * radius   - radius of the arc
//  * alpha    - starting angle (in Grad)
//  * omega    - ending angle   (in Grad)
//  * segments - number of segments for drawing the arc
//  * flag     - true  : create arc feature from center to start- to endpoint to center
//  *            false : create arc feature from start- to endpoint
//  *
//  * Returns: an array with four features, if flag=true
//  *          arc feature     (from Linestring)
//  *          the startpoint  (from Point)
//  *          the endpoint    (from Point)
//  *          the chord       (from LineString)
//  */
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

function addRandomFeatures(extent, count) {
    for (var i = 0; i < count; ++i) {
        var extx = extent[2] - extent[0];
        var exty = extent[3] - extent[1];
        var middlex = extent[0]+extx/2;
        var middley = extent[1]+exty/2;
        var factorx = extx / 10;
        var factory = exty / 10;
        var coordinates = [getRandomArbitrary(middlex-factorx, middlex+factorx), getRandomArbitrary(middley-factory, middley+factory)];
        var obj = {x: coordinates[0],
                   y: coordinates[1],
                   radius: 150,
                   alpha: 10,
                   omega: 20,
                   segments:100,
                   flag: true};
        var arc = objArc([obj.x, obj.y], obj.radius, obj.alpha, obj.omega, obj.segments, obj.flag);
        featuresArc[i] = new Feature({ geometry: arc[0] });
        //    vectorLayerArc.addFeatures(arc);
        //features[i] = new Feature(new Point(coordinates));
    }

}

function gradient(feature, resolution) {
    var extent2 = feature.getGeometry().getExtent();

    var pixelRatio = has.DEVICE_PIXEL_RATIO;
    // Gradient starts on the left edge of each feature, and ends on the right.
    // Coordinate origin is the top-left corner of the extent of the geometry, so
    // we just divide the geometry's extent width by resolution and multiply with
    // pixelRatio to match the renderer's pixel coordinate system.

    var x1, x2, y1, y2;
    var height = extent.getHeight(extent2) / resolution * pixelRatio;
    var width = extent.getWidth(extent2) / resolution * pixelRatio;

    var angle = feature.get('angle');
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
    // var grad = context.createLinearGradient(0, 0,
    //                                         extent.getWidth(extent2) / resolution * pixelRatio , extent.getHeight(extent2) / resolution * pixelRatio);
    var grad = context.createLinearGradient(x1, y1,
                                            x2, y2);

    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, 'orange');
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

function displayPosition(mapMetadata) {
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
            return new Feature(new Point(projLonLat));
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

function displayOrientation(mapMetadata, position) {
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
        var arc = objArc([obj.x, obj.y], obj.radius, obj.alpha, obj.omega, obj.segments, obj.flag);
        return new Feature({ geometry: arc[0], angle: dir });
    }
    return null;
}



function setStyle(feature, resolution) {
    fill.setColor(gradient(feature, resolution));
    return style;
}



function createNewImage(base64String, position) {
    var uri = base64String.replace("base64:", "data:image/png;base64,");
    var imageStatic = new ImageStatic({
        url: '',
        imageLoadFunction : function(image){
            console.log(image.getImage().width);
            image.getImage().src = uri;
        },
        projection: projection,
        imageExtent:[position[0]-radius, position[1]-radius, position[0]+radius, position[1]+radius]
    });
    thumbnails.setSource(imageStatic);
}
// var metadata = loadExifToolMetadata("file:///home/fgrelard/Code/Optimum/0W2A0931.txt");


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
//addRandomFeatures(extent, count);

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





map.addLayer(clusters);
map.addLayer(arcs);
map.addLayer(thumbnails);

var select = new Select();
map.addInteraction(select);
select.on('select', function(e) {
    var selectedFeatures = select.getFeatures();
    arcs.getSource().clear();
    if (thumbnails.getSource())
        thumbnails.setSource();
    e.selected.filter(function(feature) {
        var selectedFeatures = feature.get('features');
        $.each(selectedFeatures, function(i, f) {
            if (f.hasOwnProperty('cone')) {
                arcs.getSource().addFeature(f.cone);

                var t0Image = fetch(url+"images", {
                    method: 'post',
                    body: JSON.stringify({str: f.fileName})
                });
                var t1Image = t0Image.then(function (response) {
                    return response.json();
                });
                t1Image.then(function(resultPost) {
                    var b64String = resultPost.data[0].ThumbnailImage;
                    var position = f.getGeometry()['flatCoordinates'];
                    createNewImage(b64String, position);
                });
            }
        });
    });
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
                var feature = displayPosition(photo);
                if (feature !== null) {
                    feature.fileName = photo.SourceFile;
                    positions.push(feature);

                    var posArray = feature.getGeometry()['flatCoordinates'];
                    var cone = displayOrientation(photo, posArray);
                    if (cone !== null)
                        feature.cone = cone;
                }
            }
        });

        clusters.getSource().getSource().clear();
        clusters.getSource().getSource().addFeatures(positions);

        arcs.getSource().clear();
    });


});
