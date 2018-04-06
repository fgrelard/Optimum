var count = 200;
var features = new Array(count);
var lon = 4.39366;
var lat = 45.44174;
var stEtienneLonLat = [lon, lat];
var stEtienneLonLatConv = ol.proj.fromLonLat(stEtienneLonLat);
var lonConv = stEtienneLonLatConv[0];
var latConv = stEtienneLonLatConv[1];


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}


var map = new ol.Map({
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    target: 'map',
    view: new ol.View({
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
    features[i] = new ol.Feature(new ol.geom.Point(coordinates));
}

var source = new ol.source.Vector({
    features: features
});

var clusterSource = new ol.source.Cluster({
    source: source
});


var styleCache = {};
var clusters = new ol.layer.Vector({
    source: clusterSource,
    style: function(feature) {
        var size = feature.get('features').length;
        var style = styleCache[size];
        if (!style) {
            style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 10,
                    stroke: new ol.style.Stroke({
                        color: '#fff'
                    }),
                    fill: new ol.style.Fill({
                        color: '#3399CC'
                    })
                }),
                text: new ol.style.Text({
                    text: size.toString(),
                    fill: new ol.style.Fill({
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
