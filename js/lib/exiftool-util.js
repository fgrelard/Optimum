import CSV from 'papaparse';
import transpose from 'transpose';
import Arc from './arc';

export function lonLatToDecimal(deg, min, sec) {
    return deg + min / 60 + sec / 3600;
}

export function loadExifToolMetadata(filename) {
    var f = fetch(filename);
    var t1 = f.then(function(response) {
        return response.text();
    });
    var t2 = t1.then(function(text) {
        var textS = text.toString();
        return CSV.parse(text.replace(/ /g, ""),
                         {delimiter: ':',
                          complete: function(results) {
                              return results;
                          },
                          dynamicTyping: true
                         });

    });
    return t2;

}

export function convertMetadataToJSON(metadata) {
    const transposed = transpose(metadata.data);
    const headers = transposed.shift();
    const res = transposed.map(function(row) {
        return row.reduce(function(acc, col, ind) {
            acc[headers[ind]] = col;
            return acc;
        }, {});
    })[0];
    return res;
}

export function createPositionArray(positionString) {
    var patt1 = /[0-9.]/g;
    var patt2 = /[a-zA-Z]/g;
    var arrayPos = [];
    var numberString = "";
    for (var i = 0; i < positionString.length; i++) {
        var character = positionString.charAt(i);
        if (character.match(patt1)) {
            numberString += character;
        }
        else {
            if (numberString != '')
                arrayPos.push(Number(numberString));
            numberString = '';
        }
    }
    return arrayPos;
}

export function getPosition(mapMetadata) {
    if (mapMetadata.hasOwnProperty('GPSPosition')) {
        var positionString = mapMetadata.GPSPosition;
        var positionSplit = positionString.split(",");
        if (positionSplit.length >= 2) {
            var firstPos = positionSplit[0];
            var secondPos = positionSplit[1];
            var fPosDMS = createPositionArray(firstPos);
            var sPosDMS = createPositionArray(secondPos);
            var fPosDec = lonLatToDecimal(fPosDMS[0], fPosDMS[1], fPosDMS[2]);
            var sPosDec = lonLatToDecimal(sPosDMS[0], sPosDMS[1], sPosDMS[2]);
            var lonLat = [sPosDec, fPosDec];
            return lonLat;
        }
    }
    return null;
}

export function computeAlphaOmegaFromDir(direction, fov) {
    var dirTrigRad = (360 - direction + 90) % 360;
    var alpha = (dirTrigRad - fov / 2) % 360;
    var omega = (alpha + fov);
    return [alpha, omega];
}

export function getOrientation(mapMetadata, position) {
    if (mapMetadata.hasOwnProperty('GPSImgDirection') &&
        mapMetadata.hasOwnProperty('Orientation') &&
        mapMetadata.hasOwnProperty('FOV')) {
        var dir = mapMetadata.GPSImgDirection;
        var orientation = mapMetadata.Orientation;
        var fov = Number(mapMetadata.FOV.match(/[0-9.]+/g));
        var angles = computeAlphaOmegaFromDir(dir, fov);
        var radius = 150;
        var arc = new Arc([position[0], position[1]], 300, angles[0], angles[1]);
        arc.computeGeometry();
        return arc;
    }
    return null;
}
