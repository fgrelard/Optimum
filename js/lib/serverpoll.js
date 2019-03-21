/**
 * @fileOverview Allows to poll a Webserver for images
 * isovists and metadata
 * @name serverpoll.js
 * @author Florent Grélard
 * @license
 */


import Arc from './arc';
import {transformExtent} from 'ol/proj';
import OSMXML from 'ol/format/OSMXML';
import View from 'ol/View';

/**
 * WebServer URL to poll
 * @type {string}
 */
var urlDB = "http://159.84.143.100:8080/";

/**
 * Converts a POST response to a blob for image display in the browser
 * @param {json} json the post request
 * @returns {Blob} blob
 */
function jsonToBlob(json) {
    var sliceSize = sliceSize || 512;

    var byteCharacters = atob(json);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }
    var blob = new Blob(byteArrays, {type: "image/jpeg"});
    return blob;
}

/**
 * Generic function to poll the DB
 * @param {string} path local path used in the post request
 * @param {string} url2 the POST path
 * @returns {json} json post result
 */
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


/**
 * Polls for images
 * @param {string} path the full path to the image
 * @param {AbortController} signal the controller allowing to manage request (null by default)
 * @returns {URL} the blob image url
 */
export function pollImages(path, signal = null) {
    var t0Image = fetch(urlDB + "images", {
        method: 'post',
        body: JSON.stringify({str: path}),
        signal
    });
    var t1Image = t0Image.then(function (response) {
        return response.json();
    });
    var t2Image = t1Image.then(function(resultPost) {
        var blob = jsonToBlob(resultPost);
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(blob);
        return imageUrl;
    });
    return t2Image;
}


/**
 * Polls for thumbnails
 * @param {string} path the full path to the image
 * @param {AbortController} signal the controller allowing to manage request (null by default)
 * @returns {URL} the blob image url
 */
export function pollThumbnails(path, signal = null) {
    var t0Image = fetch(urlDB + "thumbnails", {
        method: 'post',
        body: JSON.stringify({str: path}),
        signal
    });
    var t1Image = t0Image.then(function (response) {
        return response.json();
    });
    var t2Image = t1Image.then(function(resultPost) {
        var blob = jsonToBlob(resultPost);
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(blob);
        return imageUrl;
    });
    return t2Image;
}

/**
 * Polls for isovists
 * @param {string} path the full path to the image
 * @param {AbortController} signal the controller allowing to manage request (null by default)
 * @returns {ol.geom.Polygon} the isovist
 */
export function pollIsovist(path, signal) {

    var t0Image = fetch(urlDB + "isovist", {
        method: 'post',
        body: JSON.stringify({str: path}),
        signal
    });
    var t1Image = t0Image.then(function (response) {
        return response.json();
    });
    return t1Image.then(function(json) {
        return json[0].Isovist;
    });
}


/**
 * @deprecated
 * Client request for building segments
 * @param {ol.extent.Extent} extent2 extent in which to search for building segments
 * @param {ol.Projection} projection world projection
 * @returns {XMLHttpRequest} client request
 */
export function getBuildingSegments(extent2, projection) {
    var client = new XMLHttpRequest();
    client.open('POST', 'https://overpass-api.de/api/interpreter');

    var epsg4326Extent =
            transformExtent(extent2, projection, 'EPSG:4326');
    var query = '(node(' +
            epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
            epsg4326Extent[3] + ',' + epsg4326Extent[2] +
            ');rel(bn)->.foo;way(bn);node(w)->.foo;rel(bw););out meta;';
    client.send(query);
    return client;
}


/**
 * @deprecated
 * Response to client request for building segments
 * @param {XMLHttpRequest} client
 * @param {ol.Map} map
 * @param {Array<number>=} position
 * @returns {Array.<ol.Feature>} segments
 */
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
