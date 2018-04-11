var url = "http://localhost:8080";
var inputFile = document.getElementById("dirMetadata");
import $ from 'jquery';

$("#dirMetadata").on("change", function(event) {
    var files = [];
    var thefiles = event.target.files;
    $.each(thefiles, function(i, item) {
        // .then(function(res) {
        //     res.json();
        // })
        //     .then(function(res) {
        //         console.log(res);
        //     });

        var thefile = item;
        var reader = new FileReader();
        reader.onload = function() {
            fetch(url, {
                method: 'post',
                body: JSON.stringify({str: reader.result})
            });
        };
        reader.readAsText(thefile);
    });
    // fetch(url).then(function(response) {
        //     response.text().then(function(text) {
        //         console.log(text);
        //     });
        // });

});
