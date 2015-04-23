// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var dao = require('cloud/dao.js');

AV.Cloud.define("hello", function(request, response) {
    // Get the all untreated raw data.
    dao.getUntreatedData(function(untreated_data){
        var location = untreated_data['UserLocation'];
        var motion   = untreated_data['UserMotion'];
        var sound    = untreated_data['UserSound'];
        console.log(location.length);
        var date = new Date();
        dao.addSenz(location, motion, sound, date, function(senz_id){
            console.log(senz_id);
        });
    });

    response.success("Hello world!");
});



