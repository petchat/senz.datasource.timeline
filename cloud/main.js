// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var dao = require('cloud/dao.js');

AV.Cloud.define("hello", function(request, response) {
    // Get the all untreated raw data.
    dao.getUntreatedData(function(user_location, user_motion, user_sound){
        var date = new Date();
        dao.addSenz(user_location[0]['objectId'], user_motion[0]['objectId'], user_sound[0]['objectId'], date, function(senz_id){
//            console.log(senz_id);
        });
    });

    response.success("Hello world!");
});



