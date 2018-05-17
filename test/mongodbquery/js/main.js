import $ from 'jquery';
import jsTree from 'jstree';

var url = "http://159.84.143.179:8080/";


function extractFileTreeRecursive(data, object, parent) {
    if (object.hasOwnProperty('path')) return false;
    $.each(object, function(i, obj) {
        var folder = extractFileTreeRecursive(data, obj, i);
        data.push({ "id" : i, "parent": parent, "text":i, type: (folder) ? "default" : "child" });
    });
    return true;
}

function getDocs(path, url2) {
    var t0Image = fetch(url + url2, {
        method: 'post',
        body: JSON.stringify(path)
    });
    var t1Image = t0Image.then(function (response) {
        return response.json();
    });
    t1Image.then(function(resultPost) {
        console.log(resultPost);
    });
}

var t0Image = fetch(url, {
        method: 'post'
    });
var t1Image = t0Image.then(function (response) {
    return response.json();
});


t1Image.then(function(resultPost) {
    var data = [];
    extractFileTreeRecursive(data, resultPost, "#");
    $("#fileTree").jstree(
        { 'core' : {
            'data' : data
        },
          'types' : {
              "child" : {
                  "icon" : "glyphicon glyphicon-file"
              },
              "default" : {
                  "icon" : "glyphicon glyphicon-folder-open"
              }
          },
          'plugins' : ["checkbox", "types"]});

});

$("#fileTree").on('changed.jstree', function (e, data) {
    var i, j, r = [];
    for(i = 0, j = data.selected.length; i < j; i++) {
        r.push(data.instance.get_node(data.selected[i]).text);
    }
    getDocs(r, "partialDocs");
});
