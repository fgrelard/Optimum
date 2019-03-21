/**
 * @fileOverview Layer vector for heatmap of isovist intersection
 * @name vectorlayercolormap.js
 * @author Florent Grélard
 * @license
 */
import VectorLayer from 'ol/layer/Vector.js';
import * as obj from 'ol/obj.js';
import Style from 'ol/style/Style';

/**
 * Layer type string identifier
 * @type {string}
 */
var LayerType = {
    VectorHeatmap : 'VECTOR_COLORMAP'
};

/**
 * Layer vector class for heatmap of isovist intersection
 */
export default class VectorLayerColormap extends VectorLayer {


    /**
     * Constructor see {@link ol.layer.Vector}
     * @param {Object} opt_options
     */
    constructor(opt_options) {
        const options = opt_options ?
                  opt_options : /** @type {module:ol/layer/Vector~Options} */ ({});

        const baseOptions = obj.assign({}, options);

        delete baseOptions.style;
        delete baseOptions.renderBuffer;
        delete baseOptions.updateWhileAnimating;
        delete baseOptions.updateWhileInteracting;

        super(baseOptions);

        /**
         * Style
         * @type {ol.style.Style}
         */
        this.style = options.style || Style.defaultFunction;

        /**
         * Vector source (polygon isovists)
         * @type {ol.source.Vector}
         */
        this.vectorSource = options.vectorSource;

        /**
         * Colors for heatmap
         * @type {Array<string>}
         */
        this.colors = options.colors || ['#00f', '#0ff', '#0f0', '#ff0', '#f00'];

        /**
         * Whether to scale the polygons as a function of zoom level
         * @type {boolean}
         */
        this.scale = options.scale !== false;

        /**
         * Layer type
         * @type {string}
         */
        this.type = LayerType.VectorHeatmap;

        /**
         * Image filled by the renderer and containing the polygon intersection
         * @type {ImageCanvas}
         */
        this.image = null;
    }

    /**
     * Getter for vector source
     * @returns {ol.source.Vector}
     */
    getVectorSource() {
        return this.vectorSource;
    }

    /**
     * Setter for vector source
     * @param {ol.source.Vector} vectorSource
     */
    setVectorSource(vectorSource) {
        this.vectorSource = vectorSource;
    }

    /**
     * Getter for colors
     * @returns {Array<string>}
     */
    getColors() {
        return this.colors;
    }

    /**
     * Setter for colors
     * @param {Array<string>} colors
     */
    setColors(colors) {
        this.colors = colors;
    }

    /**
     * Getter for style
     * @returns {ol.style.Style}
     */
    getStyle() {
        return this.style;
    }

    /**
     * Setter for style
     * @param {ol.style.Style} style
     */
    setStyle(style) {
        this.style = style || Style.defaultFunction;
    }

    /**
     * Getter for image
     * @returns {ImageCanvas}
     */
    getImage() {
        return this.image;
    }

    /**
     * Setter for image
     * @param {ImageCanvas} image
     */
    setImage(image) {
        this.image = image;
    }

    /**
     * Getter for whether to scale the polygons depending on zoom level
     * @returns {boolean}
     */
    isScale() {
        return this.scale;
    }

    /**
     * Setter for whether to scale the polygons depending on zoom level
     * @param {boolean} scale
     */
    setScale(scale) {
        this.scale = scale;
    }
};
