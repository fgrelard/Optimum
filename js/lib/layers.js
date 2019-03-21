/**
 * @fileOverview Layers added to the OpenLayers Map
 * @name layers.js
 * @author Florent Grélard
 * @license
 */
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import OLCluster from 'ol/source/Cluster';
import VectorLayerColormap from './vectorlayercolormap';
import Overlay from 'ol/Overlay';
import Group from 'ol/layer/Group';
import * as styles from './styles';
import OLImage from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';

/**
 * overlay
 * @type {ol.Overlay}
 */
export var overlay = new Overlay({
    element: document.getElementById('none')
});

/**
 * Overlay layer group
 * @type {ol.layer.Group}
 */
export var overlayGroup = new Group({
    title: 'Calques',
    combine: false,
    layers: []
});

/**
 * Layers displayed on click
 * @type {ol.layer.Group}
 */
export var onClickGroup = new Group({
    title: 'Au clic',
    combine: false,
    layers: []
});


/**
 * Source vector for picture clusters
 * @type {ol.source.Vector}
 */
export var source = new Vector();


/**
 * Picture clusters
 * @type {ol.layer.Cluster}
 */
export var clusterSource = new OLCluster({
    source: source
});


/**
 * Source vector for visibility cones on click (in pale orange)
 * @type {ol.source.Vector}
 */
export var vectorLayerArc = new Vector();


/**
 * Layer for visibility cones
 * @type {ol.layer.Vector}
 */
export var arcs = new VectorLayer({
    title: 'Cônes de visibilité',
    source: vectorLayerArc,
    style: styles.setStyleArcs
});


/**
 * Layer for thumbnails of pictures
 * @type {ol.layer.Image}
 */
export var thumbnails = new OLImage({
    title: 'Vignettes'
});

/**
 * Layer for picture clusters
 * @type {ol.layer.Vector}
 */
export var olClusters = new VectorLayer({
    title:'Photographies',
    source: clusterSource,
    style: styles.setStyleClusters
});


/**
 * Source vector for isovists on click (in pale green)
 * @type {ol.source.Vector}
 */
export var lineSource = new Vector();


/**
 * Layer for isovists on click (in pale green)
 * @type {ol.layer.Vector}
 */
export var lines = new VectorLayer({
    title: 'Polygones de visibilité',
    source: lineSource,
    style: styles.setStylePolygonIsovist
});


/**
 * Source vector for building segments, when selecting area (in blue)
 * @type {ol.source.Vector}
 */
export var inputLineSource = new Vector();


/**
 * Layer for building segments, when selecting area (in blue)
 * @type {ol.layer.Vector}
 */
export var inputLines = new VectorLayer({
    title: 'Cadastre',
    source: inputLineSource,
    style : styles.setStyleInput
});

/**
 * Empty image necessary for heatmap
 * @type {ol.source.ImageStatic}
 */
export var imageStatic = new ImageStatic({url:'', imageExtent:[0,0,0,0]});

/**
 * Source vector for heatmap of isovist intersection
 * @type {ol.source.Vector}
 */
export var polygonSource = new Vector();

/**
 * Layer for heatmap
 * @type {VectorLayerColormap}
 */
export var vectorLayerColormap = new VectorLayerColormap({
    title: 'Intersection des polygones',
    source: imageStatic,
    style: styles.setStylePolygonColormapIsovist,
    vectorSource: polygonSource,
    scale: false
});
