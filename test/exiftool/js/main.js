var url = "http://localhost:8080";
fetch(url).then(function(response) {
    response.text().then(function(text) {
        console.log(text);
    });
});
