import ol from 'ol';
import VectorLayer from 'ol/layer/vector.js';
import obj from 'ol/obj.js';
import Style from 'ol/style/style';

var LayerType = {
    VectorHeatmap : 'VECTOR_COLORMAP'
};

export default class VectorLayerColormap extends VectorLayer {
    constructor(opt_options) {
        const options = opt_options ?
                  opt_options : /** @type {module:ol/layer/Vector~Options} */ ({});

        const baseOptions = obj.assign({}, options);

        delete baseOptions.style;
        delete baseOptions.renderBuffer;
        delete baseOptions.updateWhileAnimating;
        delete baseOptions.updateWhileInteracting;

        super(baseOptions);
        this.style = options.style || Style.defaultFunction;
        this.vectorSource = options.vectorSource;
        this.colors = options.colors || ['#00f', '#0ff', '#0f0', '#ff0', '#f00'];
        this.type = LayerType.VectorHeatmap;
        this.image = null;
        this.scale = options.scale || true;
    }

    getVectorSource() {
        return this.vectorSource;
    }

    setVectorSource(vectorSource) {
        this.vectorSource = vectorSource;
    }

    getColors() {
        return this.colors;
    }

    setColors(colors) {
        this.colors = colors;
    }

    getStyle() {
        return this.style;
    }

    setStyle(style) {
        this.style = style || Style.defaultFunction;
    }

    getImage() {
        return this.image;
    }

    setImage(image) {
        this.image = image;
    }

    isScale() {
        return this.scale;
    }

    setScale(scale) {
        this.scale = scale;
    }
};
