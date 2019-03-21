import transpose from 'transpose';
import Arc from './arc';

/**
 * Converts lon lat to decimal values
 * @param {number} deg
 * @param {number} min
 * @param {number} sec
 * @returns {number} decimal
 */
export function lonLatToDecimal(deg, min, sec) {
    return deg + min / 60 + sec / 3600;
}


/**
 * Converts raw exif to json
 * @param {string} metadata
 * @returns {json} converted json
 */
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

/**
 * Array of coordinates from a given string
 * @param {string} positionString
 * @returns {Array<number>} coordinates
 */
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

/**
 * Get position from metadata
 * @param {json} mapMetadata metadata
 * @returns {Array<number>}  position
 */
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

/**
 * Computes the starting and ending angle of the visibility cone (=angular sector), corresponding to the field of view and the direction of the picture
 * @param {number} direction angle in degrees
 * @param {number} fov angle of aperture in degrees
 * @returns {Array<number>} angles of the visibility cone
 */
export function computeAlphaOmegaFromDir(direction, fov) {
    var dirTrigRad = (360 - direction + 90) % 360;
    var alpha = (dirTrigRad - fov / 2) % 360;
    if (alpha < 0) {
        alpha += 360;
    }
    var omega = (alpha + fov);
    return [alpha, omega];
}

/**
 * Orientation of a picture
 * @param {json} mapMetadata
 * @param {Array} position
 * @returns {Arc} angular sector corresponding to the visibility cone
 */
export function getOrientation(mapMetadata, position) {
    if (mapMetadata.hasOwnProperty('GPSImgDirection') &&
        mapMetadata.hasOwnProperty('Orientation') &&
        mapMetadata.hasOwnProperty('FOV')) {
        var dir = mapMetadata.GPSImgDirection;
        var orientation = mapMetadata.Orientation;
        var fov = Number(mapMetadata.FOV.match(/[0-9.]+/g));
        var angles = computeAlphaOmegaFromDir(dir, fov);
        var radius = 300;
        var arc = new Arc([position[0], position[1]], radius, angles[0], angles[1]);
        arc.computeGeometry();
        return arc;
    }
    return null;
}
