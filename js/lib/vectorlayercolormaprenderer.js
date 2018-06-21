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


    scaleCoordinate(coord, resolution, t, center) {
        var tCopy = t.slice();
        var tmp = transform.create();

        transform.translate(tmp, -center[0], -center[1]);
        transform.apply(tmp, coord);

        transform.reset(tmp);
        var scale = (resolution > VectorLayerColormapRenderer.LIMIT_RESOLUTION) ? resolution / 2.0 : 1.0;
        transform.scale(tmp, scale, scale);
        transform.apply(tmp, coord);

        transform.reset(tmp);
        transform.translate(tmp, center[0], center[1]);
        transform.apply(tmp, coord);
    }

    polygonToPixelCoordinates(polygon, t, resolution) {
        var pixelCoordinates = [];
        var coordinates = polygon.getCoordinates()[0];
        for (var j = 0; j < coordinates.length; j++) {
            var coord = coordinates[j].slice();
            if (this.getLayer().isScale())
                this.scaleCoordinate(coord, resolution, t, polygon.getFirstCoordinate());
            var pixelCoordinate = transform.apply(t, coord);
            pixelCoordinates.push(pixelCoordinate);
        }
        return pixelCoordinates;
    }

    changeOpacityScale(maxOpacity, renderer, style) {
        var color = style.getFill().getColor().toString();
        var rgba = color.split(",");
        var a = rgba[rgba.length-1].split(")")[0];
        var anum = Number.parseFloat(a);
        if (maxOpacity < 200) {
            anum += (anum + 0.05 < 1) ? 0.05 : 0;
        } else if (maxOpacity >= 250) {
            anum -= (anum - 0.05 > 0) ? 0.05 : 0;
        }
        var newColor = rgba[0] + "," + rgba[1] + "," + rgba[2] + "," + anum.toString() + ")";
        var fill = new Fill({
            color: newColor
        });
        style.setFill(fill);
        this.getLayer().setStyle([style]);
        renderer.setStyle(style);
    }

    rasterOpacityToContextColorMap(renderer, context, style, resolution, width, height) {
        var image = context.getImageData(0, 0, width, height);
        var view8 = image.data;
        var i, length, alpha;
        var maxOpacity = 0;
        for (i = 0, length = view8.length; i < length; i += 4) {
            var alphaChar = view8[i+3];
            if (alphaChar > maxOpacity) {
                maxOpacity = alphaChar;
            }
            alpha = alphaChar * 4;
            if (alpha) {
                for (var j = 0; j < 3; j++)
                    view8[i+j] = this.gradient[alpha + j];
            }
        }
        this.changeOpacityScale(maxOpacity, renderer, style);
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
        var t = frameState.coordinateToPixelTransform.slice();
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
            var pixelCoordinates = this.polygonToPixelCoordinates(feature.getGeometry(), t, resolution);
            renderer.drawGeometry(new Polygon([pixelCoordinates]));
        }
        this.rasterOpacityToContextColorMap(renderer, context, actualStyle, resolution, width, height);

        this.image_ = new ImageCanvas(extent, resolution, frameState.pixelRatio, context.canvas);
        this.getLayer().setImage(this.image_);
        return true;
    }
}

VectorLayerColormapRenderer.LIMIT_RESOLUTION = 3;

VectorLayerColormapRenderer['handles'] =  function(type, layer) {
    return layer.getType() === "VECTOR_COLORMAP";
};

VectorLayerColormapRenderer['create'] = function(mapRenderer, layer) {
    return new VectorLayerColormapRenderer(/** @type {module:ol/layer/Vector} */ (layer));
};
