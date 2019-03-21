/**
 * @fileOverview Heatmap for polygon intersection
 * @name heatmap.js
 * @author Florent Grélard
 * @license
 */
import PluggableMap from 'ol/PluggableMap.js';
import {defaults as defaultControls} from 'ol/control/util.js';
import {defaults as defaultInteractions} from 'ol/interaction.js';
import {assign} from 'ol/obj.js';
import CanvasImageLayerRenderer from 'ol/renderer/canvas/ImageLayer.js';
import CanvasMapRenderer from 'ol/renderer/canvas/Map.js';
import CanvasTileLayerRenderer from 'ol/renderer/canvas/TileLayer.js';
import CanvasVectorLayerRenderer from 'ol/renderer/canvas/VectorLayer.js';
import CanvasVectorTileLayerRenderer from 'ol/renderer/canvas/VectorTileLayer.js';
import CanvasVectorLayerColormapRenderer from './vectorlayercolormaprenderer.js';

/**
 Heatmap for polygon intersection
 */
export default class HeatMap extends PluggableMap {
    /**
     * Constructor
     * @param {Object} options
     */
    constructor(options) {
        options = assign({}, options);
        if (!options.controls) {
            options.controls = defaultControls();
        }
        if (!options.interactions) {
            options.interactions = defaultInteractions();
        }
        super(options);
    }


    /**
     * Create renderer: registers custom CanvasVectorLayerColormapRenderer for isovist intersection
     * @returns {ol.CanvasMapRenderer}
     */
    createRenderer() {
        var renderer = new CanvasMapRenderer(this);
        renderer.registerLayerRenderers([
            CanvasImageLayerRenderer,
            CanvasTileLayerRenderer,
            CanvasVectorLayerRenderer,
            CanvasVectorTileLayerRenderer,
            CanvasVectorLayerColormapRenderer
        ]);
        return renderer;
    }
}
