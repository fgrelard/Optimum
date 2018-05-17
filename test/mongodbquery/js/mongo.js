var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://user-read:pwd@dionysos.univ-lyon2.fr:27017/optimum";
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("optimum");
    var pictures  = dbo.collection("pictures");
    pictures.find().forEach(function(document) {
        console.log(document.GPSPosition);
    }, function(err) {
        db.close();
    });
});
