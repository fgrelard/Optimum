import Style  from 'ol/style/Style';
import Stroke  from 'ol/style/Stroke';
import Fill  from 'ol/style/Fill';
import Text  from 'ol/style/Text';
import Circle  from 'ol/style/Circle';
import {DEVICE_PIXEL_RATIO} from 'ol/has';
import {getHeight, getWidth} from 'ol/extent';
import ImageStatic from 'ol/source/ImageStatic';
import Overlay from 'ol/Overlay';
import Icon from 'ol/style/Icon';
import * as Polls from './serverpoll';
import Photo from 'ol-ext/style/Photo';
import RegularShape from 'ol/style/RegularShape';

export var pointRadius = 20;
var styleCache = {};

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

export function setStylePolygonIsovist() {
    return new Style({
        stroke : new Stroke({
            color: '#FFFF00'
        }),
        fill: new Fill({
            color: 'rgba(140, 208, 95, 0.5)',
        })
    });
}

export function setStylePolygonColormapIsovist() {
    return new Style({
        fill: new Fill({
            color: 'rgba(255, 255, 255, 1.0)',
        })
    });
}

export function setStyleInput() {
    return new Style({
         stroke : new Stroke({
             color: '#0000FF',
             width: 5
        })
    });
}


export function setStyleClusters(feature, resolution) {
    var f = feature.get("features")[0];
	var nb = feature.get("features").length;
    var th = f.get("thumbnail");
    var k = th ? th+(nb>1?"_0":"_1") : "default";
    var style = styleCache[k];
    var photoSize = 25;
   	var count = new Style(
		{	image: new RegularShape(
			{	points: 12,
				radius: 13,
				fill: new Fill({
					color: '#004499'
				})
			}),
			text: new Text(
				{	text: nb.toString(),
					font: 'bold 12px helvetica,sans-serif',
					offsetX: photoSize,
					offsetY: -photoSize,
                    fill: new Fill({
                        color: '#fff'
                    })
				})
		});
	var p = count.getImage().getAnchor();
	p[0]-=photoSize;
	p[1]+=photoSize;
    if (th) {
	    if (!style)
	    {	styleCache[k] = style = new Style
		    ({	image: new Photo (
			    {	src: th,
				    radius: photoSize,
				    crop: true,
				    kind: (nb>1) ? "folio":"square",
				    shadow: true ,
				    // onload: function() { vector.changed(); },
				    stroke: new Stroke(
					    {	width:  3,
						    color:'#fff'
					    })
			    })
		     });
	    }
        return [ style, count ];
    }
    else if (style)
        return [style, count];
	else return [count];
}


    // var styleCache = {};
    // var features = feature.get('features');
    // var size = features.length;
    // var style = styleCache[size];
    // var image = new Image();
    // var icon = new Icon({
    //     img: features[0].get('image') || image,
    //     imgSize: [100, 100]
    // });
    // if (!features[0].get('image') && features.length > 0) {
    //     Polls.pollImages(features[0].getProperties().filename, 100).then(function(url) {
    //         image.src = url;
    //         features[0].set('image', image);
    //     });
    // }
    // if (!style) {
    //     style = new Style({
    //         image: icon,
    //         stroke: new Stroke({
    //             color: '#fff'
    //         }),
    //         text: new Text({
    //             text: size.toString(),
    //             fill: new Fill({
    //                 color: '#fff'
    //             }),
    //             backgroundFill: new Fill({
    //                 color: '#cc9933'
    //             }),
    //             backgroundStroke: new Stroke({
    //                 color: '#fff'
    //             }),
    //             padding: [10,10,10,10],
    //             textBaseline: 'top',
    //             textAlign: 'right'
    //         })
    //     });
    //     styleCache[size] = style;
    // }
    // return style;
//}

export function  createCircleOutOverlay(position) {
    var elem = document.createElement('div');
    elem.setAttribute('class', 'circleOut');

    return new Overlay({
        element: elem,
        position: position,
        positioning: 'center-center'
    });
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
    var pixelRatio = DEVICE_PIXEL_RATIO;
    // Gradient starts on the left edge of each feature, and ends on the right.
    // Coordinate origin is the top-left corner of the extent of the geometry, so
    // we just divide the geometry's extent width by resolution and multiply with
    // pixelRatio to match the renderer's pixel coordinate system.

    var x1, x2, y1, y2;
    var height = getHeight(extent2) / resolution * pixelRatio;
    var width = getWidth(extent2) / resolution * pixelRatio;

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

