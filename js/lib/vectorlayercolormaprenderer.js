import ol from 'ol';
import CanvasImageLayerRenderer from 'ol/renderer/canvas/imagelayer.js';
import LayerType from 'ol/layertype.js';
import EventType from 'ol/events/eventtype.js';
import renderCanvas from 'ol/render/canvas.js';
import events from 'ol/events.js';
import dom from 'ol/dom';
import transform from 'ol/transform';
import ImageStatic from 'ol/source/imagestatic';
import render from 'ol/render';
import Polygon from 'ol/geom/polygon';
import ImageCanvas from 'ol/imagecanvas';

/**
 * @constructor
 * @extends {module:ol/renderer/canvas/Layer}
 * @param {module:ol/layer/Vector} vectorLayer Vector layer.
 * @api
 */
export default class VectorLayerColormapRenderer extends CanvasImageLayerRenderer {
    constructor(imageLayer) {
        super(imageLayer);

        this.gradient = this.createGradient(imageLayer.colors);
    };


    createGradient(colors) {
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

    polygonToPixelCoordinates(polygon, t) {
        var pixelCoordinates = [];
        var coordinates = polygon.getCoordinates()[0];
        for (var j = 0; j < coordinates.length; j++) {
            var coord = coordinates[j];
            var pixelCoordinate = transform.apply(t, coord);
            pixelCoordinates.push(pixelCoordinate);
        }
        return pixelCoordinates;
    }

    rasterOpacityToContextColorMap(context, width, height) {
        var image = context.getImageData(0, 0, width, height);
        var view8 = image.data;
        var i, ii, alpha;
        for (i = 0, ii = view8.length; i < ii; i += 4) {
            alpha = view8[i + 3] * 4;
            if (alpha) {
                view8[i] = this.gradient[alpha];
                view8[i + 1] = this.gradient[alpha + 1];
                view8[i + 2] = this.gradient[alpha + 2];
            }
        }
        context.putImageData(image, 0,0);
    }

    contextToImageStatic(context, extent) {
        var dataURL = context.canvas.toDataURL();

        var imageStatic = new ImageStatic({
            url: '',
            imageLoadFunction : function(image){
                image.getImage().src = dataURL;
            },
            imageExtent: extent
        });
        return imageStatic;
    }

    prepareFrame(frameState, layerState) {
        var width = frameState.size[0];
        var height = frameState.size[1];
        var t = frameState.coordinateToPixelTransform;
        var extent = frameState.extent;
        var context = dom.createCanvasContext2D(width, height);
        var canvas = context.canvas;
        var renderer = render.toContext(context);

        var style = this.getLayer().getStyle();
        if (Array.isArray(style))
            renderer.setStyle(style[0]);
        else
            renderer.setStyle(style());
        var features = this.getLayer().getVectorSource().getFeatures();
        for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            var pixelCoordinates = this.polygonToPixelCoordinates(feature.getGeometry(), t);
            renderer.drawGeometry(new Polygon([pixelCoordinates]));
        }
        this.rasterOpacityToContextColorMap(context, width, height);

        this.image_ = new ImageCanvas(extent, frameState.viewState.resolution, frameState.pixelRatio, context.canvas);
        return true;

    }

}


VectorLayerColormapRenderer['handles'] =  function(type, layer) {
    return layer.getType() === "VECTOR_COLORMAP";
};

VectorLayerColormapRenderer['create'] = function(mapRenderer, layer) {
    return new VectorLayerColormapRenderer(/** @type {module:ol/layer/Vector} */ (layer));
};
