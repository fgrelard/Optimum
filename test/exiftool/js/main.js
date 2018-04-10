var exiftool = require( "node-exiftool");
var ht = require( 'http');
var cp = require( 'child_process');
ht.createServer(function (request, response){
    response.writeHead(200);

    response.end('Salut tout le monde !');
    const ep = new exiftool.ExiftoolProcess();
    // const options = {
    //     recursive: true
    // };
    ep.open()
  // read directory
        .then(() => ep.readMetadata('/home/fgrelard/data/raw/', ['-File:all', 'r']))
        .then(console.log, console.error)
        .then(() => ep.close())
        .catch(console.error)

}).listen(8080);
