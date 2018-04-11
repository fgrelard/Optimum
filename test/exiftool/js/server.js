var exiftool = require( "node-exiftool");
var express = require( 'express');
var exifToolBin = require("dist-exiftool");

//express.createServer();
const app = express();

function getExifToolData() {
    const ep = new exiftool.ExiftoolProcess(exifToolBin);

    var t0 = ep.open();
    var t1 = t0.then(() => ep.readMetadata('/home/fgrelard/data/raw/', ['-File:all', 'r']));
    var t2 = t1.then(function(result){
        return result;
    }, console.error);
    var t3 = t2.then(() => ep.close());

    return t2;
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
    var promise = getExifToolData();
    promise.then(function(result) {
        res.send(result);
    });
});

app.listen(8080, function () {

});
