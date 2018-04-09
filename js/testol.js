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

var count = 200;
var features = new Array(count);
var featuresArc = new Array(count);
var lon = 4.39366;
var lat = 45.44174;
var stEtienneLonLat = [lon, lat];
var stEtienneLonLatConv = proj.fromLonLat(stEtienneLonLat);
var lonConv = stEtienneLonLatConv[0];
var latConv = stEtienneLonLatConv[1];

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function lonLatToDecimal(deg, min, sec) {
    return deg + min / 60 + sec / 3600;
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
// function objArc(center, radius, alpha, omega, segments, flag)
// {
//     var pointList=[];
//     if(flag)
//         pointList.push(new ol.geom.Point(center.x, center.y));

//     var dAngle= segments+1;
//     for(var i=0;i<dAngle;i++)
//     {
//         var Angle = alpha - (alpha-omega)*i/(dAngle-1);
//         var x = center.x + radius*Math.cos(Angle*Math.PI/180);
//         var y = center.y + radius*Math.sin(Angle*Math.PI/180);

//         var point = new ol.geom.Point(x, y);
//         pointList.push(point);
//     }
//     if(flag)
//         pointList.push(new ol.geom.Point(center.x, center.y));

//     var ftArc    = new ol.source.Vector(new ol.geom.LineString(pointList));
//     if(flag)
//     {
//         var ftArcPt0 = new ol.source.Vector(pointList[1]);
//         var ftArcPt1 = new ol.source.Vector(pointList[pointList.length-2]);
//         var ftArcSehne = new ol.source.Vector(new ol.geom.LineString([pointList[1], pointList[pointList.length-2]]));
//         var arrArc = [ftArc, ftArcPt0, ftArcPt1, ftArcSehne];
//     }
//     else
//         var arrArc = [ftArc];

//     return(arrArc);
// }


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
               radius: 25000000,
               alpha: 0,
               omega: 180,
               segments:100,
               flag: true};
    //    var arc = objArc([obj.x, obj.y], obj.radius, obj.alpha, obj.omega, obj.segments, obj.flag);
    //    featuresArc[i] = new ol.Feature(arc[2]);
    //vectorLayerArc.addFeatures(arc);
    features[i] = new Feature(new Point(coordinates));

}


var source = new Vector({
    features: features
});

var clusterSource = new Cluster({
    source: source
});

// var vectorLayerArc = new ol.source.Vector({
//     features: featuresArc
// });

// var styleCache = {};
// var arcs = new ol.layer.Vector({
//     source: vectorLayerArc,
//     style: function(feature) {
//         var size = feature.get('features').length;
//         var style = styleCache[size];
//         if (!style) {
//             style = new ol.style.Style({
//                 pointRadius: 2,
//                 strokeWidth:3,
//                 strokeColor:'#FF0000'
//             });
//         }
//         return style;
//     }
// });


var styleCache = {};
var clusters = new VectorLayer({
    source: clusterSource,
    style: function(feature) {
        var size = feature.get('features').length;
        var style = styleCache[size];
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
            styleCache[size] = style;
        }
        return style;
    }
});

map.addLayer(clusters);
//map.addLayer(arcs);

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
