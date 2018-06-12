import Style  from 'ol/style/style';
import Stroke  from 'ol/style/stroke';
import Fill  from 'ol/style/fill';
import Text  from 'ol/style/text';
import Circle  from 'ol/style/circle';
import Map from 'ol/map';
import MultiPoint from 'ol/geom/multipoint';
import View from 'ol/view';
import LayerVector from 'ol/layer/vector';
import SourceVector from 'ol/source/vector';
import GeoJSON from 'ol/format/geojson';
import TileLayer from 'ol/layer/tile';
import OSM from 'ol/source/osm';
import Crop from 'ol-ext/filter/Crop';
import $ from 'jquery';
import dom from 'ol/dom';
import transform from 'ol/transform';

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
            color: 'blue',
            width: 3
        }),
        fill: new Fill({
            color: 'rgba(120,120,0,0.4)'
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
        'weight': 0.1,
        'geometry': {
            'type': 'Polygon',
            'coordinates': [[[-5e6, 6e6], [-5e6, 8e6], [-3e6, 8e6],
                             [-3e6, 6e6], [-5e6, 6e6]]]
        }
    }, {
        'type': 'Feature',
        'weight': 0.1,

        'geometry': {
            'type': 'Polygon',
            'coordinates': [[[-4e6, 6e6], [-4e6, 8e6], [0, 8e6],
                             [0, 6e6], [-4e6, 6e6]]]
        }
    }, {
        'type': 'Feature',
        'weight': 0.1,

        'geometry': {
            'type': 'Polygon',
            'coordinates': [[[-3.5e6, 6e6], [-3.5e6, 8e6], [-2.5e6, 8e6],
                             [-2.5e6, 6e6], [-3.5e6, 6e6]]]
        }
    }, {
        'type': 'Feature',
        'weight': 0.1,

        'geometry': {
            'type': 'Polygon',
            'coordinates': [[[-2e6, -1e6], [-1e6, 1e6],
                             [0, -1e6], [-2e6, -1e6]]]
        }
    }]
};

var source = new SourceVector({
    features: (new GeoJSON()).readFeatures(geojsonObject)
});

var layer = new LayerVector({
    source: source,
    style: styles
});


// layer.on('precompose', function(event) {

//     var context = event.context;
//     var canvas = context.canvas;
//     event.context.globalCompositeOperation = "difference";
// });

var context = dom.createCanvasContext2D(1000,1000);


layer.on('postcompose', function(event) {
    var context = event.context;
    var canvas = context.canvas;
    var t  = event.vectorContext.transform_;

    var image = context.getImageData(0, 0, canvas.width, canvas.height);
    var view8 = image.data;
    var i, ii, alpha;
    for (i = 0, ii = view8.length; i < ii; i += 4) {
        alpha = view8[i + 3] * 4;
        if (alpha) {
            view8[i] = gradient[alpha];
            view8[i + 1] = gradient[alpha + 1];
            view8[i + 2] = gradient[alpha + 2];
        }

    }
    var contextImage = dom.createCanvasContext2D(canvas.width, canvas.height);
    contextImage.putImageData(image, 0,0);
    $.each(source.getFeatures(), function(i, feature) {
            context.save();

        var coordinates = feature.getGeometry().getCoordinates()[0];
        var firstCoordinateMap = coordinates[0].slice();
        var firstCoordinate = transform.apply(t, firstCoordinateMap);

        context.beginPath();
        context.moveTo(firstCoordinate[0], firstCoordinate[1]);
        for (var j = 1; j < coordinates.length; j++) {
            var coord = coordinates[j].slice();
            var pixelCoordinate = transform.apply(t, coord);
            context.lineTo(pixelCoordinate[0], pixelCoordinate[1]);
        }
        context.clip();
        context.drawImage(contextImage.canvas, 0, 0);
        context.restore();

    });
});

layer.setRenderOrder(null);

var colors = ['#00f', '#0ff', '#0f0', '#ff0', '#f00'];
var gradient = createGradient(colors);


var osm = new TileLayer({
                title:'OSM',
                type:'base',
                source: new OSM()
});


var map = new Map({
    layers: [osm,layer],
    target: 'map',
    view: new View({
        center: [0, 3000000],
        zoom: 2
    })
});


$.each(source.getFeatures(), function(i, feature) {
    var crop = new Crop({feature: feature, inner: true});
    crop.set('active', true);
    osm.addFilter(crop);
});
