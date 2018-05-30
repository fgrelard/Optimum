self.importScripts("./lib/isovistsectors2d.js");

self.addEventListener('message',function(e) {
    var arc = e.data;
//    arc.computeGeometry();
    postMessage(e.data);
}, false);
