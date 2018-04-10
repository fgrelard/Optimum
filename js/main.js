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
import CSV from 'papaparse';
import transpose from 'transpose';

var count = 200;
//var features = [];
var featuresArc = new Array(count);
var stEtienneLonLat = [4.392569444444445, 45.42289722222222];
var stEtienneLonLatConv = proj.fromLonLat(stEtienneLonLat);
var lonConv = stEtienneLonLatConv[0];
var latConv = stEtienneLonLatConv[1];

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

    var ftArc    = new LineString(pointList);
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
}

function computeAlphaOmegaFromDir(direction, fov) {
    var dirTrigRad = (direction + 90) % 360;
    var alpha = (dirTrigRad - fov / 2) % 360;
    var omega = (alpha + fov) % 360;
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
        return new Feature({ geometry: arc[0] });
    }
}

//Begin openlayers display functions

var metadata = loadExifToolMetadata("file:///home/fgrelard/src/Optimum/data/0W2A0931.txt");


metadata.then(function(results){
    var positions = [];
    var cones = [];

    var metadataJSON = convertMetadataToJSON(results);

    var feature = displayPosition(metadataJSON);
    positions.push(feature);

    var posArray = feature.getGeometry()['flatCoordinates'];
    var cone = displayOrientation(metadataJSON, posArray);
    cones.push(cone);
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
    var extent = map.getView().calculateExtent(map.getSize());
    //addRandomFeatures(extent, count);

    var source = new Vector({
        features: positions
    });

    var clusterSource = new Cluster({
        source: source
    });

    var vectorLayerArc = new Vector({
        features: cones
    });

    var styleCache = {};
    var arcs = new VectorLayer({
        source: vectorLayerArc
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
                        radius: 10,
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
});




// var select = new ol.interaction.Select();
// map.addInteraction(select);
// var selectedFeatures = select.getFeatures();
// selectedFeatures.on(['add', 'remove'], function() {
//     var names = selectedFeatures.getArray().map(function(feature) {
//         var style =  new ol.style.Style({
//                 image: new ol.style.Circle({
//                     radius: 10,
//                     stroke: new ol.style.Stroke({
//                         color: '#fff'
//                     }),
//                     fill: new ol.style.Fill({
//                         color: '#FF0000'
//                     })
//                 })

//             });
//         feature.setStyle(style);
//     });

// });
