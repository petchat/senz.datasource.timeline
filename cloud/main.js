// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var dao  = require('cloud/dao.js');
var algo = require('cloud/algo.js');

AV.Cloud.define("hello", function (request, response){
    // Get untreated data from LeanCloud.
    dao.getUntreatedRawdata().then(
        // Request the senz collector with untreated data
        // to get the list of senz tuples.
        function (user_location_list, user_motion_list, user_sound_list){
            request_data = {
                'location': user_location_list,
                'motion': user_motion_list,
                'sound': user_sound_list
            };
            return algo.senzCollector(request_data);
        }
    ).then(
        // Save the list of senz tuples to LeanCloud.
        function (senz_list){
//            var date = new Date();
//            return dao.addSenz(location_id, motion_id, sound_id, date);
        }
    ).then(
        // When everything is done.
        function (){
            var date = new Date();
            console.log('\nEvery work has been done at ' + date);
        }
    );
    response.success("Hello world!");
});

//dao.labelRawdataSenzed(
//    ['5538b907e4b0df9cbc4ca89c'],
//    ['5538bf73e4b0df9cbc4dfb42'],
//    ['5538bf87e4b0df9cbc4dfde4']
//).then(
//    function (){
//        console.log('OK!');
//    }
//);
data = {
    "filter": 1,
    "timelines": {
        "location": [{"timestamp": 2}, {"timestamp": 4}, {"timestamp": 6}, {"timestamp": 9}],
        "motion": [{"timestamp": 3}, {"timestamp": 4}, {"timestamp": 7}, {"timestamp": 9}],
        "sound": [{"timestamp": 1}, {"timestamp": 3}, {"timestamp": 6}]
    },
    "primary_key": "location"
};

algo.senzCollector(data);