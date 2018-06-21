import Vector from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';
import OLCluster from 'ol/source/cluster';
import VectorLayerColormap from './vectorlayercolormap';
import Overlay from 'ol/overlay';
import Group from 'ol/layer/group';
import * as styles from './styles';
import OLImage from 'ol/layer/image';
import ImageStatic from 'ol/source/imagestatic';

export var overlay = new Overlay({
    element: document.getElementById('none')
});

export var overlayGroup = new Group({
    title: 'Calques',
    combine: false,
    layers: []
});


export var onClickGroup = new Group({
    title: 'Au clic',
    combine: false,
    layers: []
});


export var source = new Vector();

export var clusterSource = new OLCluster({
    source: source
});

export var vectorLayerArc = new Vector();

export var arcs = new VectorLayer({
    title: 'Cônes de visibilité',
    source: vectorLayerArc,
    style: styles.setStyleArcs
});

export var thumbnails = new OLImage({
    title: 'Vignettes'
});

export var olClusters = new VectorLayer({
    title:'Photographies',
    source: clusterSource,
    style: styles.setStyleClusters
});

export var lineSource = new Vector();

export var lines = new VectorLayer({
    title: 'Polygones de visibilité',
    source: lineSource,
    style: styles.setStylePolygonIsovist
});

export var inputLineSource = new Vector();

export var inputLines = new VectorLayer({
    title: 'Cadastre',
    source: inputLineSource,
    style : styles.setStyleInput
});


export var imageStatic = new ImageStatic({url:'', imageExtent:[0,0,0,0]});
export var polygonSource = new Vector();

export var vectorLayerColormap = new VectorLayerColormap({
    title: 'Intersection des polygones',
    source: imageStatic,
    style: styles.setStylePolygonColormapIsovist,
    vectorSource: polygonSource
});
