import CSV from 'papaparse';

fetch("file:///home/fgrelard/src/Optimum/test/csv-parser/0W2A0931.txt")
    .then(function(response) {
        return response.text();
    })
    .then(function(text) {
        CSV.parse(text,
                  {delimiter: ':',
                   complete: function(results) {
    	               console.log(results);
                   },
                   dynamicTyping: true
                  });
    });
