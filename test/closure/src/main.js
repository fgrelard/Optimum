goog.provide('app');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('arc');

goog.scope(function(){
    var Map = ol.Map;
    /**
     * @type {ol.PluggableMap}
     */
    app.map = new Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ],
        view: new ol.View({
            center: [0, 0],
            zoom: 4
        })
    });
});
