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

import {defaults} from 'ol/control';
import Select from 'ol/interaction/Select';
import GeoJSON from 'ol/format/GeoJSON';
import {bbox} from 'ol/loadingstrategy';
import Arc from '../js/lib/arc';
//import IsoVist from '../../Optimum/js/lib/isovistsectors2d';
import $ from 'jquery';
import {segmentIntersection} from '../js/lib/lineintersection';

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
                    for (let index = 0; index < coords.length; index+=2) {
                        array.push([coords[index], coords[index+1], 20]);
                    }
                    geojsonNew.push(new Feature(new Polygon([array])));
                }
                vector.getSource().addFeatures(geojsonNew);
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
var alpha = 190;
var omega = 229.6;
var radius = 300;
var position = [739885.8194006054, 5905880.253554305 ];
position = [739800.8194006054, 5906000.253554305];
position = [ 489298.32814487105, 5688013.78184738, 0];
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
            color: 'rgba(255, 255, 0, 0.5)'
        })
    }),
    'Polygon': new Style({
        stroke: new Stroke({
            color: 'blue',
            lineDash: [4],
            width: 3
        }),
        fill: new Fill({
            color: 'rgba(0, 0, 255, 0.1)'
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

 var geojsonObject = {
        'type': 'FeatureCollection',
        'crs': {
          'type': 'name',
          'properties': {
            'name': 'EPSG:3857'
          }
        },
        'features': [{
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [0, 0]
          }
        }, {
          'type': 'Feature',
          'geometry': {
            'type': 'LineString',
            'coordinates': [[4e6, -2e6], [8e6, 2e6]]
          }
        }, {
          'type': 'Feature',
          'geometry': {
            'type': 'LineString',
            'coordinates': [[4e6, 2e6], [8e6, -2e6]]
          }
        }, {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [[[-5e6, -1e6], [-4e6, 1e6], [-3e6, -1e6]]]
          }
        }, {
          'type': 'Feature',
          'geometry': {
            'type': 'MultiLineString',
            'coordinates': [
              [[-1e6, -7.5e5], [-1e6, 7.5e5]],
              [[1e6, -7.5e5], [1e6, 7.5e5]],
              [[-7.5e5, -1e6], [7.5e5, -1e6]],
              [[-7.5e5, 1e6], [7.5e5, 1e6]]
            ]
          }
        }, {
          'type': 'Feature',
          'geometry': {
            'type': 'MultiPolygon',
            'coordinates': [
              [[[-5e6, 6e6], [-5e6, 8e6], [-3e6, 8e6], [-3e6, 6e6]]],
              [[[-2e6, 6e6], [-2e6, 8e6], [0, 8e6], [0, 6e6]]],
              [[[1e6, 6e6], [1e6, 8e6], [3e6, 8e6], [3e6, 6e6]]]
            ]
          }
        }, {
          'type': 'Feature',
          'geometry': {
            'type': 'GeometryCollection',
            'geometries': [{
              'type': 'LineString',
              'coordinates': [[-5e6, -5e6], [0, -5e6]]
            }, {
              'type': 'Point',
              'coordinates': [4e6, -5e6]
            }, {
              'type': 'Polygon',
              'coordinates': [[[1e6, -6e6], [2e6, -4e6], [3e6, -6e6]]]
            }],
          }
        }]
      };

var fs = (new GeoJSON()).readFeatures(geojsonObject);

var vectorSource = new Vector({
    features: fs
});



// var vectorSource = new Vector({
//     features: geojson
// });

var vector = new VectorLayer({
    source: vectorSource,
    style: styleFunction// function(feature) {
    //     for (var key in styles) {
    //         var value = feature.get(key);
    //         if (value || value !== undefined) {
    //             for (var regexp in styles[key]) {
    //                 if (new RegExp(regexp).test(value)) {
    //                     return styles[key][regexp];
    //                 }
    //             }
    //         }
    //     }
    //     return null;
    // }
});
//vector.set('altitudeMode', 'clampToGround');



map = new Map({
    layers: [
        new Tile({
            source: new OSM()
        })
    ],
    target: 'map',
    // controls: defaults({
    //     attributionOptions: {
    //         collapsible: false
    //     }
    // }),
    view: new View({
        center: position,
        maxZoom: 19,
        zoom: 16
    })
});

var extent2 = map.getView().calculateExtent(map.getSize());
var polygon = new Polygon([[[position[0], position[1], 600], [position[0]+100, position[1], 700], [position[0], position[1]+100, 800]]]);
console.log(polygon);
console.log(arc.geometry);
//var featureArc = new Feature(arc);
var featureArc = new Feature(arc);
//featureArc.position = position;
featuresArc.push(featureArc);

features.push(new Feature(new Point([position[0], position[1], 0])));

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
            color: '#FFFF00'
        })// ,
        // fill : new Fill({
        //     color: "#33CC9977"
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
console.log(Cesium.Spherical.normalize(spherical));


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


var pointOfInterest = Cesium.Cartographic.fromDegrees(deg[0], deg[1], 0);

// Sample the terrain (async) and write the answer to the console.
Cesium.sampleTerrainMostDetailed(scene.terrainProvider, [ pointOfInterest ])
    .then(function(samples) {
        for (let s of samples) {
            var cartesianPositions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(samples);
            console.log('Height in meters is: ' + s.height);
        }
});

export default exports;
