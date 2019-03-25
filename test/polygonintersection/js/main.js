import Style  from 'ol/style/Style';
import Stroke  from 'ol/style/Stroke';
import Fill  from 'ol/style/Fill';
import Text  from 'ol/style/Text';
import Circle  from 'ol/style/Circle';
import MultiPoint from 'ol/geom/MultiPoint';
import View from 'ol/View';
import LayerVector from 'ol/layer/Vector';
import SourceVector from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Crop from 'ol-ext/filter/Crop';
import $ from 'jquery';
import * as dom from 'ol/dom';
import * as transform from 'ol/transform';
import * as proj from 'ol/proj';
import Projection from 'ol/proj/Projection';
import Group from 'ol/layer/Group';
import VectorLayerColormapRenderer from '../../../js/lib/vectorlayercolormaprenderer';
import VectorLayerColormap from '../../../js/lib/vectorlayercolormap';
import Heatmap from '../../../js/lib/heatmap';
import LayerImage from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';
import EventType from 'ol/events/EventType';
import Overlay from 'ol/Overlay';
import * as render from 'ol/render';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LinearRing from 'ol/geom/LinearRing';

var styles = [
    /* We are using two different styles for the polygons:
     *  - The first style is for the polygons themselves.
     *  - The second style is to draw the vertices of the polygons.
     *    In a custom `geometry` function the vertices of a polygon are
     *    returned as `MultiPoint` geometry, which will be used to render
     *    the style.
     */
    new Style({
        stroke: new Stroke({
            color: 'rgba(0,0,255,0.2)',
            width: 3
        }),
        fill: new Fill({
            color: 'rgba(120,120,120,0.9)'
        })
    }),
    new Style({
        image: new Circle({
            radius: 5,
            fill: new Fill({
                color: 'orange'
            })
        }),
        geometry: function(feature) {
            // return the coordinates of the first ring of the polygon
            var coordinates = feature.getGeometry().getCoordinates()[0];
            return new MultiPoint(coordinates);
        }
    })
];



function createGradient(colors) {
    var width = 1;
    var height = 256;
    var context = dom.createCanvasContext2D(width, height);

    var gradient = context.createLinearGradient(0, 0, width, height);
    var step = 1 / (colors.length - 1);
    for (var i = 0, ii = colors.length; i < ii; ++i) {
        gradient.addColorStop(i * step, colors[i]);
    }

    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    return context.getImageData(0, 0, width, height).data;
}

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
            'type': 'Polygon',
            'coordinates': [[[-5e2, 6e2], [-5e2, 8e2], [-3e2, 8e2],
                             [-3e2, 6e2], [-5e2, 6e2]]]
        }
    }, {
        'type': 'Feature',
        'geometry': {
            'type': 'Polygon',
            'coordinates': [[[-4e2, 6e2], [-4e2, 8e2], [0, 8e2],
                             [0, 6e2], [-4e2, 6e2]]]
        }
    }, {
        'type': 'Feature',
        'geometry': {
            'type': 'Polygon',
            'coordinates': [[[-3.5e2, 6e2], [-3.5e2, 8e2], [-2.5e2, 8e2],
                             [-2.5e2, 6e2], [-3.5e2, 6e2]]]
        }
    }, {
        'type': 'Feature',
        'geometry': {
            'type': 'Polygon',
            'coordinates': [[[-2e2, -1e2], [-1e2, 1e2],
                             [0, -1e2], [-2e2, -1e2]]]
        }
    }]
};

var features = (new GeoJSON()).readFeatures(geojsonObject);
for (let f of features) {
    var coords = f.getGeometry().getCoordinates()[0];
    var c =  [coords[0][0] + 50, coords[0][1] + 50];

    var newCoords = [];
    newCoords.push(c);
    for (var i = 1; i < coords.length; i++) {
        newCoords.push(coords[i]);
    }
    if (f.getGeometry().getType() === 'Polygon')
        f.getGeometry().appendLinearRing(new LinearRing(newCoords));

    console.log(f.getGeometry().getLinearRing(0));
    console.log(f.getGeometry().getLinearRing(1));
}

console.log(features);

var source = new SourceVector({
    features: features
});

var layer = new LayerVector({
    source: source,
    style: styles
});

var imageLayer = new LayerImage();




var colors = ['#00f', '#0ff', '#0f0', '#ff0', '#f00'];
var gradient = createGradient(colors);


var osm = new TileLayer({
    title:'OSM',
    type:'base',
    source: new OSM()
});

var imageStatic = new ImageStatic({url:'', imageExtent:[0,0,0,0]});

var vectorLayerColormap = new VectorLayerColormap({
    source: imageStatic,
    style: styles,
    vectorSource: source
});

var coordinates = [];
$.each(source.getFeatures(), function(i, feature) {
    var newPoint = new Feature(new Point(feature.getGeometry().getFirstCoordinate()));
    newPoint.set('weight', 0.9);
    coordinates.push(newPoint);
});

var firstCoordinates = new SourceVector({
    features: coordinates
});


var map = new Heatmap({
    layers: [osm, imageLayer, vectorLayerColormap],
    target: 'map',
    view: new View({
        center: [0, 0],
        zoom: 16
    })
});
