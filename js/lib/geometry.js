export function  angleToVector(angle) {
    var rad = angle * Math.PI / 180;
    var x = Math.cos(rad);
    var y = Math.sin(rad);
    return [x, y];
}


export function boundingBox(positions) {
    var low = [Number.MAX_VALUE, Number.MAX_VALUE];
    var up = [-Number.MAX_VALUE, -Number.MAX_VALUE];
    for (var i = 0; i < positions.length; i++) {
        var position = positions[i];
        for (let j = 0; j < 2; j++) {
            low[j] = (position[j] < low[j]) ? position[j] : low[j];
            up[j] = (position[j] > up[j]) ? position[j] : up[j];
        }
    }
    return [low, up];
}
