import Arc from './arc';
import proj from 'ol/proj';
import OSMXML from 'ol/format/osmxml';
import View from 'ol/view';

var urlDB = "http://159.84.143.100:8080/";

export function pollDB(path, url2) {
    var t0Image = fetch(urlDB + url2, {
        method: 'post',
        body: JSON.stringify(path)
    });
    var t1Image = t0Image.then(function (response) {
        return response.json();
    });
    t1Image.then(function(resultPost) {
        return resultPost;
    });
    return t1Image;
}


export function pollImages(path, size = 800, signal = null) {
    var t0Image = fetch(urlDB + "images", {
        method: 'post',
        body: JSON.stringify({str: path, size:size}),
        signal
    });
    var t1Image = t0Image.then(function (response) {
        return response.blob();
    });
    var t2Image = t1Image.then(function(resultPost) {
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(resultPost);
        return imageUrl;
    });
    return t2Image;
}

export function pollIsovist(angle, signal) {
    var previousArc = angle;
    var arc = new Arc(previousArc.center, previousArc.radius, previousArc.alpha, previousArc.omega);
    var t0Image = fetch(urlDB + "isovist", {
        method: 'post',
        body: JSON.stringify({arc: arc}),
        signal
    });
    return t0Image.then(function (response) {
        return response.json();
    });
}


export function getBuildingSegments(extent2, projection) {
    var client = new XMLHttpRequest();
    client.open('POST', 'https://overpass-api.de/api/interpreter');

    var epsg4326Extent =
            proj.transformExtent(extent2, projection, 'EPSG:4326');
    var query = '(node(' +
            epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
            epsg4326Extent[3] + ',' + epsg4326Extent[2] +
            ');rel(bn)->.foo;way(bn);node(w)->.foo;rel(bw););out meta;';
    client.send(query);
    return client;
}


export function segmentsFromXMLRequest(client, map, position = null) {
    var features = new OSMXML().readFeatures(client.responseText, {
        featureProjection: (position) ? new View({center:position}).getProjection() : map.getView().getProjection()
    });
    var limitedFeatures = [];
    for (var i = 0; i < features.length; i++) {
        var f = features[i];
        var node = f.getProperties();
        if (node.hasOwnProperty("building") ||
            node.hasOwnProperty("amenity")  ||
            node.hasOwnProperty("natural")
           ) {
            limitedFeatures.push(f);
        }
    }
    return limitedFeatures;
}
