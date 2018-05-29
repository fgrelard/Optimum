import Style  from 'ol/style/style';
import Stroke  from 'ol/style/stroke';
import Fill  from 'ol/style/fill';
import Text  from 'ol/style/text';
import Circle  from 'ol/style/circle';
import has from 'ol/has';
import extent from 'ol/extent';
import ImageStatic from 'ol/source/imagestatic';

export var pointRadius = 20;

export var stylesTopo = {
    'amenity': {
        'parking': new Style({
            stroke: new Stroke({
                color: 'rgba(170, 170, 170, 1.0)',
                width: 1
            }),
            fill: new Fill({
                color: 'rgba(170, 170, 170, 0.3)'
            })
        })
    },
    'building': {
        '.*': new Style({
            zIndex: 100,
            stroke: new Stroke({
                color: 'rgba(246, 99, 79, 1.0)',
                width: 1
            }),
            fill: new Fill({
                color: 'rgba(246, 99, 79, 0.3)'
            })
        })
    },
    'highway': {
        'service': new Style({
            stroke: new Stroke({
                color: 'rgba(255, 255, 255, 1.0)',
                width: 2
            })
        }),
        '.*': new Style({
            stroke: new Stroke({
                color: 'rgba(255, 255, 255, 1.0)',
                width: 3
            })
        })
    },
    'landuse': {
        'forest|grass|allotments': new Style({
            stroke: new Stroke({
                color: 'rgba(140, 208, 95, 1.0)',
                width: 1
            }),
            fill: new Fill({
                color: 'rgba(140, 208, 95, 0.3)'
            })
        })
    },
    'natural': {
        'tree': new Style({
            image: new Circle({
                radius: 2,
                fill: new Fill({
                    color: 'rgba(140, 208, 95, 1.0)'
                }),
                stroke: null
            })
        })
    }
};

export function setStyleTopo(feature) {
    for (var key in stylesTopo) {
        var value = feature.get(key);
        if (value !== undefined) {
            for (var regexp in stylesTopo[key]) {
                if (new RegExp(regexp).test(value)) {
                    return stylesTopo[key][regexp];
                }
            }
        }
    }
    return null;
}

export function setStyleLinesIsovist() {
    return new Style({
        stroke : new Stroke({
            color: '#FFFF00'
        }),
        fill: new Fill({
            color: 'rgba(140, 208, 95, 1.0)'
        }),
    });
}

export function setStyleClusters(feature) {
    var styleCache = {};
    var size = feature.get('features').length;
    var style = styleCache[size];
    if (!style) {
        style = new Style({
            image: new Circle({
                radius: pointRadius,
                stroke: new Stroke({
                    color: '#fff'
                }),
                fill: new Fill({
                    color: '#3399CC'
                })
            }),
            text: new Text({
                text: size.toString(),
                fill: new Fill({
                    color: '#fff'
                })
            })
        });
        styleCache[size] = style;
    }
    return style;
}

export function setStyleArcs(arc, resolution) {
    var fill = new Fill();
    var style = new Style({
        stroke: new Stroke({
        color: '#ff9933'
    }),
        fill: fill
    });
    fill.setColor(gradient(arc, resolution));
    return style;
}


export function gradient(arc, resolution) {
    var extent2 = arc.getGeometry().getExtent();
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var pixelRatio = has.DEVICE_PIXEL_RATIO;
    // Gradient starts on the left edge of each feature, and ends on the right.
    // Coordinate origin is the top-left corner of the extent of the geometry, so
    // we just divide the geometry's extent width by resolution and multiply with
    // pixelRatio to match the renderer's pixel coordinate system.

    var x1, x2, y1, y2;
    var height = extent.getHeight(extent2) / resolution * pixelRatio;
    var width = extent.getWidth(extent2) / resolution * pixelRatio;

    var angle = (arc.getProperties().alpha + arc.getProperties().omega - 180) / 2;
    var angleRad = angle * Math.PI / 180 + Math.PI / 2;
    var rotateDegrees = Math.round((Math.PI - angleRad) * 360 / (2*Math.PI));
    if (rotateDegrees < 0)
        rotateDegrees = 360 + rotateDegrees;

    if ((0 <= rotateDegrees && rotateDegrees < 45)) {
        x1 = 0;
        y1 = height / 2 * (45 - rotateDegrees) / 45;
        x2 = width;
        y2 = height - y1;
    } else if ((45 <= rotateDegrees && rotateDegrees < 135)) {
        x1 = width * (rotateDegrees - 45) / (135 - 45);
        y1 = 0;
        x2 = width - x1;
        y2 = height;
    } else if ((135 <= rotateDegrees && rotateDegrees < 225)) {
        x1 = width;
        y1 = height * (rotateDegrees - 135) / (225 - 135);
        x2 = 0;
        y2 = height - y1;
    } else if ((225 <= rotateDegrees && rotateDegrees < 315)) {
        x1 = width * (1 - (rotateDegrees - 225) / (315 - 225));
        y1 = height;
        x2 = width - x1;
        y2 = 0;
    } else if (315 <= rotateDegrees) {
        x1 = 0;
        y1 = height - height / 2 * (rotateDegrees - 315) / (360 - 315);
        x2 = width;
        y2 = height - y1;
    }
    var grad = context.createLinearGradient(x1, y1,
                                            x2, y2);

    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.9, '#ffaa0077');
    return grad;
}





export function createNewImage(url, position, projection) {
    var imageStatic = new ImageStatic({
        url: '',
        imageLoadFunction : function(image){
            image.getImage().src = url;
        },
        projection: projection,
        imageExtent:[position[0]-pointRadius, position[1]-pointRadius, position[0]+pointRadius, position[1]+pointRadius]
    });
    return imageStatic;
}

