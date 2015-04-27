// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var dao    = require('cloud/dao.js');
var algo   = require('cloud/algo.js');
var config = require('cloud/config.js');
var util   = require('cloud/util.js');

var cur_senz_list;

AV.Cloud.define("hello", function (request, response){
    // Get untreated data from LeanCloud.
    dao.getUntreatedRawdata().then(
        // Request the senz collector with untreated data
        // to get the list of senz tuples.
        function (user_location_list, user_motion_list, user_sound_list){
            var users_list = util.universalUsersSet(config.user_list);
            var promises = new Array();
            for (var user in users_list){
                request_data = {
                    "user": users_list[user],
                    "filter": 1,
                    "timelines": {
                        'location': user_location_list[users_list[user]],
                        'motion': user_motion_list[users_list[user]],
                        'sound': user_sound_list[users_list[user]]
                    },
                    "primary_key": config.collector_primary_key
                };
                promises.push(algo.senzCollector(request_data));
            }
            return AV.Promise.all(promises);
        }
    ).then(
        // Save the list of senz tuples to local and LeanCloud.
        function (senz_list){
            cur_senz_list = senz_list;
            var promises = new Array();
            for (var user_result in senz_list){
                promises.push(dao.addSenz(senz_list[user_result].user, senz_list[user_result].result));
            }
            return AV.Promise.all(promises);
        }
    ).then(
        // Label the rawdata in LeanCloud.
        function (senz_id_list){
            sound_id_list    = util.extractRawdataIdFromSenzList('sound_id', senz_id_list);
            motion_id_list   = util.extractRawdataIdFromSenzList('motion_id', senz_id_list);
            location_id_list = util.extractRawdataIdFromSenzList('location_id', senz_id_list);
            return dao.labelRawdataSenzed(location_id_list, motion_id_list, sound_id_list);
        }
    ).then(
        function (){
            var date = new Date();
            console.log('\nEvery work has been done at ' + date);
        }
    );
    response.success("Hello world!");
});


/* Debug dao module
dao.labelRawdataSenzed(
    ['5538b907e4b0df9cbc4ca89c'],
    ['5538bf73e4b0df9cbc4dfb42'],
    ['5538bf87e4b0df9cbc4dfde4']
).then(
    function (){
        console.log('OK!');
    }
);

dao._addSenz('5538f6cbe4b019188f009326', '5538f6cbe4b019188f009325', '5538f6cbe4b019188f009327');
*/

/* Debug algo module
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
*/

//dao._getUntreatedData('UserLocation');


//dao.getUntreatedRawdata().then(
//    // Request the senz collector with untreated data
//    // to get the list of senz tuples.
//    function (user_location_list, user_motion_list, user_sound_list){
//        var users_list = util.universalUsersSet(config.user_list);
//        var promises = new Array();
//        console.log(users_list);
//        for (var user in users_list){
//            request_data = {
//                "user": users_list[user],
//                "filter": 1,
//                "timelines": {
//                    'location': user_location_list[users_list[user]],
//                    'motion': user_motion_list[users_list[user]],
//                    'sound': user_sound_list[users_list[user]]
//                },
//                "primary_key": config.collector_primary_key
//            };
//            promises.push(algo.senzCollector(request_data));
//        }
//        return AV.Promise.all(promises);
//    }
//).then(
//    // Save the list of senz tuples to local and LeanCloud.
//    function (senz_list){
//        cur_senz_list = senz_list;
//        console.log(senz_list);
//        var promises = new Array();
//        for (var user_result in senz_list){
//            promises.push(dao.addSenz(senz_list[user_result].user, senz_list[user_result].result));
//        }
//        return AV.Promise.all(promises);
//    }
//).then(
//    // Label the rawdata in LeanCloud.
//    function (senz_id_list){
//        sound_id_list    = util.extractRawdataIdFromSenzList('sound_id', senz_id_list);
//        motion_id_list   = util.extractRawdataIdFromSenzList('motion_id', senz_id_list);
//        location_id_list = util.extractRawdataIdFromSenzList('location_id', senz_id_list);
//        return dao.labelRawdataSenzed(location_id_list, motion_id_list, sound_id_list);
//    }
//);

//dao._addSenz('553e0e83e4b06b192e99bf3a', '5538f6cbe4b019188f009326', '5538f6cbe4b019188f009325', '5538f6cbe4b019188f009327', 12341235134);