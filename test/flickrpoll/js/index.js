var apiKey = '5d366d4aff4b6e9b8927d21156a83a31';
var flickr = new Flickr(apiKey);
var cpt = 0;

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var stringifiedArray = [];
    for (let o of content) {
        var s = JSON.stringify(o);
        stringifiedArray.push(s);
    }
    var file = new Blob(stringifiedArray, {type: contentType});
    console.log(content);
    a.href = window.URL.createObjectURL(file);
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    console.log(a);
    a.click();
}

var textFile = null,
  makeTextFile = function (text) {
    var data = new Blob([text], {type: 'text/plain'});

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }

    textFile = window.URL.createObjectURL(data);

    // returns a URL you can use as a href
    return textFile;
  };

function flickRecursive(i) {
    console.log(i);
    if (i > 1500) {
        console.log(allPhotos);
        download(allPhotos, 'json.txt', 'text/plain');
        return;
    }
    flickr.photos.search({
        lat: '41.881832',
        lon: '-87.623177' ,
        // radius: 5,
        page: i
    }).then(function(response) {
        console.log(response.body.photos);
        var length = response.body.photos.photo.length;
        var array = [];
        var ind = 0;
        for (let photo of response.body.photos.photo) {
            var T1 = flickr.photos.getExif({
                 photo_id: photo.id
            }).then(function(response) {
                if (!response.body.photo) return;
                var exif = response.body.photo.exif;
                for (let e of exif) {
                    if (e.tag === "GPSImgDirection") {
                        allPhotos.push(exif.reduce(function(result, item, index, array) {
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
            flickRecursive(i+1);
        }).catch(reason => { flickRecursive(i+1); });
    }).catch(function(err)  {
        setTimeout(function(after) {
            flickRecursive(i+1);
        }, 600000);
    });
}

var allPhotos = [];
flickRecursive(1);
