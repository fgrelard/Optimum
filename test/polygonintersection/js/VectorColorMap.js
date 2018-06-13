import dom from 'ol/dom';
import $ from 'jquery';
import render from 'ol/render';
import Polygon from 'ol/geom/polygon';
import ImageStatic from 'ol/source/imagestatic';

export default class VectorColorMap {
    constructor(vectorSource, map, style, colors = ['#00f', '#0ff', '#0f0', '#ff0', '#f00']) {
        this.vectorSource = vectorSource;
        this.map = map;
        this.style = style;
        this.gradient = this.createGradient(colors);
    }

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

    polygonToPixelCoordinates(polygon) {
        var pixelCoordinates = [];
        var coordinates = polygon.getCoordinates()[0];
        for (var j = 0; j < coordinates.length; j++) {
            var coord = coordinates[j];
            var pixelCoordinate = this.map.getPixelFromCoordinate(coord);
            pixelCoordinates.push(pixelCoordinate);
        }
        return pixelCoordinates;
    }

    rasterOpacityToContextColorMap(context, width, height) {
        var image = context.getImageData(0, 0, width, height);
        var view8 = image.data;
        var i, ii, alpha;
        for (i = 0, ii = view8.length; i < ii; i += 4) {
            alpha = view8[i + 3] * 4;
            if (alpha) {
                view8[i] = this.gradient[alpha];
                view8[i + 1] = this.gradient[alpha + 1];
                view8[i + 2] = this.gradient[alpha + 2];
            }
        }
        context.putImageData(image, 0,0);
    }

    contextToImageStatic(context) {
        var dataURL = context.canvas.toDataURL();
        var extent = this.map.getView().calculateExtent();

        var imageStatic = new ImageStatic({
            url: '',
            imageLoadFunction : function(image){
                image.getImage().src = dataURL;
            },
            imageExtent: extent
        });
        return imageStatic;
    }

    getStyleImage() {
        var width = this.map.getSize()[0];
        var height = this.map.getSize()[1];
        var context = dom.createCanvasContext2D(width, height);
        var canvas = context.canvas;
        var renderer = render.toContext(context);
        renderer.setStyle(this.style);
        var that = this;
        $.each(this.vectorSource.getFeatures(), function(i, feature) {
            var pixelCoordinates = that.polygonToPixelCoordinates(feature.getGeometry());
            renderer.drawGeometry(new Polygon([pixelCoordinates]));
        });
        this.rasterOpacityToContextColorMap(context, width, height);
        var imageStatic = this.contextToImageStatic(context);
        return imageStatic;
    }


};
