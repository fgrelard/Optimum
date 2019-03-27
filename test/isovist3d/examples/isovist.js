const exports = {};

import OLCesium from 'olcs/OLCesium.js';
import FeatureConverterExtrude from 'olcs/FeatureConverterExtrude';
import VectorSynchronizer from 'olcs/VectorSynchronizer';
import OverlaySynchronizer from 'olcs/OverlaySynchronizer';
import RasterSynchronizer from 'olcs/RasterSynchronizer';

import Map from 'ol/Map';

import View from 'ol/View';
import OSM from 'ol/source/OSM';
import {transformExtent} from 'ol/proj';
import {transform} from 'ol/proj.js';
import {toLonLat} from 'ol/proj';
import {getCenter} from 'ol/extent';

import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
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
import Tile from 'ol/layer/Tile.js';
import {getRandomArbitrary} from '../../../js/lib/randomfeatures';
import {defaults} from 'ol/control';
import Select from 'ol/interaction/Select';
import GeoJSON from 'ol/format/GeoJSON';
import {bbox} from 'ol/loadingstrategy';
import Arc from '../../../js/lib/arc';
import $ from 'jquery';
import {segmentIntersection} from '../../../js/lib/lineintersection';
import IsoVist from '../../../js/lib/isovistsectors3d';

var geojson;



function readTextFile(file, map, vector)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                geojson = (new GeoJSON()).readFeatures(JSON.parse(allText), {
                    featureProjection :  new View({center:[0,0]}).getProjection()
                });
                var geojsonNew = [];
                for (let feature of geojson) {
                    let coords = feature.getGeometry().flatCoordinates;
                    var array = [];
                    var height = getRandomArbitrary(10,30);
                    height = 20;
                    for (let index = 0; index < coords.length; index+=2) {
                        array.push([coords[index], coords[index+1], height]);
                    }
                    geojsonNew.push(new Feature(new Polygon([array])));
                }
                vector.getSource().addFeatures(geojsonNew);
                var arc = new Arc(position, radius, alpha, omega);
                arc.computeGeometry();
                var isovist = new IsoVist(arc, vectorSource.getFeatures(), true);

                var visibleSegments = isovist.isovist();
                for (var i = 0; i < visibleSegments.length
                     ; i++) {
                    var poly = visibleSegments[i];
                    var coords = poly.getCoordinates()[0];
                    // coords.push(position);
                    // var newPoly = new Polygon([coords]);
                    featuresLine.push(new Feature({geometry : poly}));
                }
                lines.getSource().clear();
                lines.getSource().addFeatures(featuresLine);
            }
        }
    };
    rawFile.send(null);
}


Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0MzAyNzUyYi0zY2QxLTQxZDItODRkOS1hNTA3MDU3ZTBiMDUiLCJpZCI6MjU0MSwiaWF0IjoxNTMzNjI1MTYwfQ.oHn1SUWJa12esu7XUUtEoc1BbEbuZpRocLetw6M6_AA';

var map;
var featuresArc=[];
var features=[];
var featuresLine =[];
var alpha = 0;
var omega = 90;
var radius = 300;
var position = [ 489298.32814487105, 5688023.78184738, 15];
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

var image = new Circle({
        radius: 5,
        fill: null,
        stroke: new Stroke({color: 'red', width: 1})
      });

var styles = {
    'Point': new Style({
        image: image
    }),
    'LineString': new Style({
        stroke: new Stroke({
            color: 'green',
            width: 1
        })
    }),
    'MultiLineString': new Style({
        stroke: new Stroke({
            color: 'green',
            width: 1
        })
    }),
    'MultiPoint': new Style({
        image: image
    }),
    'MultiPolygon': new Style({
        stroke: new Stroke({
            color: 'yellow',
            width: 1
        }),
        fill: new Fill({
            color: 'rgba(255, 255, 0, 0.1)'
        })
    }),
    'Polygon': new Style({
        stroke: new Stroke({
            color: 'blue',
            lineDash: [4],
            width: 2
        }),
        fill: new Fill({
            color: 'rgba(0, 0, 255, 0.05)'
        })
    }),
    'GeometryCollection': new Style({
        stroke: new Stroke({
            color: 'magenta',
            width: 2
        }),
        fill: new Fill({
            color: 'magenta'
        }),
        image: new Circle({
            radius: 10,
            fill: null,
            stroke: new Stroke({
                color: 'magenta'
            })
        })
    }),
    'Circle': new Style({
        stroke: new Stroke({
            color: 'red',
            width: 2
        }),
        fill: new Fill({
            color: 'rgba(255,0,0,0.2)'
        })
    })
};

var styleFunction = function(feature) {
    return styles[feature.getGeometry().getType()];
};


var vectorSource = new Vector();



var vector = new VectorLayer({
    source: vectorSource,
    style: styleFunction
});
//vector.set('altitudeMode', 'clampToGround');



map = new Map({
    layers: [
        // new Tile({
        //     source: new OSM()
        // })
    ],
    target: 'map',
    view: new View({
        center: position,
        maxZoom: 19,
        zoom: 16
    })
});

var extent2 = map.getView().calculateExtent(map.getSize());
var polygon = new Polygon([[[position[0], position[1], 600], [position[0]+100, position[1], 700], [position[0], position[1]+100, 800]]]);

var featureArc = new Feature(arc);
featuresArc.push(featureArc);

features.push(new Feature(new Point([position[0], position[1], position[2]])));

var source = new Vector({
    features : features
});


var lineSource = new Vector({
    features: featuresLine
});

var clusterSource = new Cluster({
    source: source
});
clusterSource.set('altitudeMode', 'clampToGround');


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
    style: styleFunction

});

var styleCache2 = {};
var clusters = new VectorLayer({
    source: clusterSource ,
    style: function(feature) {
        var size = 1;// feature.get('features').length;
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
//clusters.set('altitudeMode', 'clampToGround');


var lines = new VectorLayer({
    source: lineSource,
    style: new Style({
        stroke : new Stroke({
            color: 'rgba(255,0,0,0.4)',
            width: 3
        })// ,
        // fill : new Fill({
        //     color: "rgba(255,0,0,0.1)"
        // })
    })
});


map.addLayer(clusters);
map.addLayer(arcs);
map.addLayer(lines);
map.addLayer(vector);

readTextFile("http://localhost:3000/test.geojson", map, vector);

function createSynchronizers(map,scene) {
    return [new RasterSynchronizer(map, scene),
            new VectorSynchronizer(map, scene, new FeatureConverterExtrude(scene)),
            new OverlaySynchronizer(map, scene)];
}

const timeElt = document.getElementById('time');
const ol3d = new OLCesium({
    map: map,
    createSynchronizers: createSynchronizers,
    time() {
        const val = timeElt.value;
        if (ol3d.getCesiumScene().globe.enableLighting && val) {
            const d = new Date();
            d.setUTCHours(val);
            return Cesium.JulianDate.fromDate(d);
        }
        return Cesium.JulianDate.now();
    }
});
const scene = ol3d.getCesiumScene();

var c = getCenter(vector.getSource().getExtent());

const deg = toLonLat(c);
var cartesianCoords = Cesium.Cartesian3.fromDegrees(4.398765999999985, 45.422752600000024, 0);
var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(4.398765999999985, 45.422752600000024, 0)
);

var spherical = Cesium.Spherical.fromCartesian3(cartesianCoords);


// var model = scene.primitives.add(Cesium.Model.fromGltf({
//     url : 'data/test_rotated.glb',
//     modelMatrix : modelMatrix
// }));



ol3d.setEnabled(true);
//scene.terrainProvider = Cesium.createWorldTerrain();
scene.globe.depthTestAgainstTerrain = true;
timeElt.style.display = 'none';

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
window['toggleTime'] = function() {
    scene.globe.enableLighting = !scene.globe.enableLighting;
    if (timeElt.style.display == 'none') {
        timeElt.style.display = 'inline-block';
    } else {
        timeElt.style.display = 'none';
    }
};
var select = new Select();
map.addInteraction(select);
select.on('select', function(e) {
    var selectedFeatures = select.getFeatures();
    e.selected.filter(function(feature) {
        console.log(feature);
    });
});

export default exports;
