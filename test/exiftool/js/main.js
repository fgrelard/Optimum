import $ from 'jquery';

var url = "http://localhost:8080/";

$("#buttonDir").on("click", function(event) {
    var files = [];
    var dir = $("#dirMetadata").val();
    console.log(dir);
    fetch(url, {
        method: 'post',
        body: JSON.stringify({str: dir})
    }).then(function (response) {
        return response.json();
    }).then(function(data) {
        console.log(data);
    })
        .catch(function(error) {
            console.log("went bad");
            console.log(error);
        });
});
