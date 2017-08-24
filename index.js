var express = require("express");
var app = express();
var port = process.env["PORT"] || 3028;
app.use("/",express.static(__dirname + "/public"));
app.listen(port, function() {
    console.log('Express server started and listening on port ' + port + '!')
});