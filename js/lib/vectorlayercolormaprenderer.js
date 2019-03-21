/**
 * @fileOverview Rendering of isovist intersection: actual computations
 * @name vectorlayercolormaprenderer.js
 * @author Florent Grélard
 * @license
 */
import CanvasImageLayerRenderer from 'ol/renderer/canvas/ImageLayer.js';
import LayerType from 'ol/LayerType.js';
import EventType from 'ol/events/EventType.js';
import {createCanvasContext2D} from 'ol/dom';
import * as transform from 'ol/transform';
import ImageStatic from 'ol/source/ImageStatic';
import * as render from 'ol/render';
import Polygon from 'ol/geom/Polygon';
import ImageCanvas from 'ol/ImageCanvas';
import Fill from 'ol/style/Fill';
import Style from 'ol/style/Style';

/**
 * Class for rendering of isovist intersection,
 * based on the opacity at pixel level
 */
export default class VectorLayerColormapRenderer extends CanvasImageLayerRenderer {

    /**
     * Constructor
     * @param {VectorLayerColorMap} imageLayer
     */
    constructor(imageLayer) {
        super(imageLayer);

        /**
         * Gradient for heatmap (default jet : blue => red)
         * @type {Uint8ClampedArray}
         */
        this.gradient = this.createGradient(imageLayer.colors);
    };


    /**
     * Allows to create gradient from set of colors
     * @param {Array<string>} colors
     * @returns {Uint8ClampedArray} the gradient
     */
    createGradient(colors) {
        var width = 1;
        var height = 256;
        var context = createCanvasContext2D(width, height);

        var gradient = context.createLinearGradient(0, 0, width, height);
        var step = 1 / (colors.length - 1);
        for (var i = 0, ii = colors.length; i < ii; ++i) {
            gradient.addColorStop(i * step, colors[i]);
        }

        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        return context.getImageData(0, 0, width, height).data;
    }


    /**
     * Scales a point according to zoom level
     * @param {Array<number>} coord the point
     * @param {number} resolution current zoom level
     * @param {Array} t transform
     * @param {Array<number>} center center of transformation
     */
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

    /**
     * Converts a polygon in cartesian coordinates to rasterized coordinates in the image canvas
     * @param {ol.geom.Polygon} polygon
     * @param {Array} t transform
     * @param {number} resolution
     * @returns {Array} the pixel coordinates in the image
     */
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


    /**
     * Adaptative opacity for increasing number of photographs
     * @param {number} maxOpacity the maximum opacity read in the image
     * @param {CanvasImmediateRenderer} renderer
     * @param {ol.style.Style} style
     */
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

    /**
     * Isovist intersection to heatmap
     * @param {CanvasImmediateRenderer} renderer
     * @param {CanvasRenderingContext2D} context
     * @param {ol.style.Style} style
     * @param {number} resolution
     * @param {number} width
     * @param {number} height
     */
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

    /**
     * Converts the context to a static image that can be displayed on the map layer ({@link VectorLayerColormap})
     * @param {CanvasRenderingContext2D} context
     * @param {Array<number>} extent image extent
     * @returns {ol.source.ImageStatic}
     */
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

    /**
     * Prepare the frame to display image when available
     * @param {Object} frameState
     * @param {Object} layerState
     * @returns {boolean} frame is ready to be displayed
     */
    prepareFrame(frameState, layerState) {
        var pixelRatio = frameState.pixelRatio;
        var width = frameState.size[0] * pixelRatio;
        var height = frameState.size[1] * pixelRatio;
        var t = frameState.coordinateToPixelTransform.slice();
        var resolution = frameState.viewState.resolution;
        var extent = frameState.extent;
        var context = createCanvasContext2D(width, height);
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

        /**
         * Image passed onto the layer
         * @type {ImageCanvas}
         */
        this.image_ = new ImageCanvas(extent, resolution, pixelRatio, context.canvas);
        this.getLayer().setImage(this.image_);
        return true;
    }

    /**
     * Whether this renderer handles a given layer
     * @param {ol.source.Layer} layer
     * @returns {boolean} whether layer is handled by this renderer
     */
    static handles(layer) {
        return layer.getType() === "VECTOR_COLORMAP";
    }

    /**
     * Creates an instance of this renderer
     * @param {Object} mapRenderer not used
     * @param {VectorLayerColormap} layer
     * @returns {VectorLayerColormapRenderer}
     */
    static create(mapRenderer, layer) {
        return new VectorLayerColormapRenderer((layer));
    }

    /**
     * Returns the limit resolution for this renderer
     * @returns {number} the limit resolution
     */
    static get LIMIT_RESOLUTION() {
        return 3;
    }
}
