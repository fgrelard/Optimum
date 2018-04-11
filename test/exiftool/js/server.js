var exiftool = require( "node-exiftool");
var express = require( 'express');
var exifToolBin = require("dist-exiftool");
var bodyParser = require("body-parser");
var fs = require("fs");
//express.createServer();
const app = express();

function getExifToolData(file) {
    const ep = new exiftool.ExiftoolProcess(exifToolBin);
    console.log(file);
    var t0 = ep.open();
    var t1 = t0.then(() => ep.readMetadata(file, ['-File:all']));
    var t2 = t1.then(function(result){
        //return result;
        console.log(result);
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
    var txtFile = "test.cr2";
    var postReq = JSON.parse(req.body);
    var content = postReq.str;
    var str = JSON.stringify(content);
    fs.writeFile(txtFile, str);

    var promise = getExifToolData("test.cr2");
    promise.then(function(result) {
        res.send(result);
    });
});

app.get('/', function (req, res) {
    var promise = getExifToolData("/home/fgrelard/");
    promise.then(function(result) {
        res.send(result);
    });
});

app.listen(8080, function () {

});
