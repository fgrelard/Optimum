var express = require( 'express');
var exiftool = require( "node-exiftool");
var exifToolBin = require("dist-exiftool");
var bodyParser = require("body-parser");
var fs = require("fs");
const app = express();

function getExifToolData(file) {
    const ep = new exiftool.ExiftoolProcess(exifToolBin);
    var t0 = ep.open();
    var t1 = t0.then(() => ep.readMetadata(file, ['-File:all', 'r']));
    var t2 = t1.then(function(result){
        return result;
    }, console.error);
    var t3 = t2.then(() => ep.close());

    return t2;
}

app.use(bodyParser.json());
app.use(bodyParser.text());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/', function (req, res) {
    var postReq = JSON.parse(req.body);
    var content = postReq.str;
    var promise = getExifToolData(content);
    promise.then(function(result) {
        res.send(result);
    });
});

app.get('/', function (req, res) {
    res.send("ExifToolData");
});

app.listen(8080);
