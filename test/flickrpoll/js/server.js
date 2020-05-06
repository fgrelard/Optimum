const express = require( 'express');

var Flickr = require("flickrapi"),
    flickrOptions = {
      api_key: "5d366d4aff4b6e9b8927d21156a83a31",
      secret: "b927371861859135"
    };


var fs = require('fs');

var obj = {
   table: []
};

function flickRecursive(i, flickr) {
    console.log(i);
    if (i > 1500) {
        var json = JSON.stringify(obj);
        fs.writeFile('myjsonfile.json', json, 'utf8');
        return;
    }
    flickr.photos.search({
        lat: '41.881832',
        lon: '-87.623177' ,
        // radius: 5,
        page: i
    }, function(err, response) {
        if (!response) {flickRecursive(i+1, flickr);return;}
        var length = response.photos.photo.length;
        var array = [];
        var ind = 0;
        for (let photo of response.photos.photo) {
            var T1 = flickr.photos.getExif({
                 photo_id: photo.id
            }, function(err, response) {
                if (!response) return;
                if (!response.photo) return;
                var exif = response.photo.exif;
                for (let e of exif) {
                    if (e.tag === "GPSImgDirection") {
                        obj.table.push(exif.reduce(function(result, item, index, array) {
                            var key = item["tag"]; //first property: a, b, c
                            result[key] = item["raw"]["_content"];
                            return result;
                        }, {}));
                    }
                }
            });
            array.push(T1);
        }
        Promise.all(array).then(function(values) {
            flickRecursive(i+1, flickr);
        }).catch(reason => { console.log(reason); flickRecursive(i+1, flickr); });
    });
}


Flickr.tokenOnly(flickrOptions, function(error, flickr) {
    flickRecursive(1, flickr);
});
// const app = express();
// var app_port = process.env.app_port || 8080;
// app.listen(8080);
