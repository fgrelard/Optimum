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
import Fill from 'ol/style/fill';
import Style from 'ol/style/style';

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

    changeOpacityScale(renderer, style) {
        var color = style.getFill().getColor().toString();
        var rgba = color.split(",");
        var a = rgba[rgba.length-1].split(")")[0];
        var anum = Number.parseFloat(a).toFixed(4);
        anum -= 0.05;
        var newColor = rgba[0] + "," + rgba[1] + "," + rgba[2] + "," + anum.toString() + ")";
        var fill = new Fill({
            color: newColor
        });
        style.setFill(fill);
        this.getLayer().setStyle([style]);
        renderer.setStyle(style);
    }

    rasterOpacityToContextColorMap(renderer, context, style, width, height) {
        var image = context.getImageData(0, 0, width, height);
        var view8 = image.data;
        var i, ii, alpha;
        var changedOpacity = false;
        for (i = 0, ii = view8.length; i < ii; i += 4) {
            var alphaChar = view8[i+3];
            if (!changedOpacity && alphaChar >= 250) {
                this.changeOpacityScale(renderer, style);
                changedOpacity = true;
            }
            alpha = alphaChar * 4;
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
        var resolution = frameState.viewState.resolution;
        var extent = frameState.extent;

        var context = dom.createCanvasContext2D(width, height);
        var canvas = context.canvas;
        var renderer = render.toContext(context);

        var style = this.getLayer().getStyle();
        var actualStyle;
        if (Array.isArray(style)) {
            actualStyle = style[0];
        }
        else {
            if (Array.isArray(style())) {
                actualStyle = style()[0];
            } else {
                actualStyle = style();
            }
        }
        actualStyle.setStroke();
        renderer.setStyle(actualStyle);
        var features = this.getLayer().getVectorSource().getFeatures();
        for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            var pixelCoordinates = this.polygonToPixelCoordinates(feature.getGeometry(), t);
            renderer.drawGeometry(new Polygon([pixelCoordinates]));
        }
        this.rasterOpacityToContextColorMap(renderer, context, actualStyle, width, height);

        this.image_ = new ImageCanvas(extent, resolution, frameState.pixelRatio, context.canvas);
        return true;

    }

}


VectorLayerColormapRenderer['handles'] =  function(type, layer) {
    return layer.getType() === "VECTOR_COLORMAP";
};

VectorLayerColormapRenderer['create'] = function(mapRenderer, layer) {
    return new VectorLayerColormapRenderer(/** @type {module:ol/layer/Vector} */ (layer));
};
