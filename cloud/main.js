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
            request_data = {
                "filter": 1,
                "timelines": {
                    'location': user_location_list,
                    'motion': user_motion_list,
                    'sound': user_sound_list
                },
                "primary_key": config.collector_primary_key
            };
            return algo.senzCollector(request_data);
        }
    ).then(
        // Save the list of senz tuples to local and LeanCloud.
        function (senz_list){
            cur_senz_list = senz_list;
            return dao.addSenz(senz_list);
        }
    ).then(
        // Label the rawdata in LeanCloud.
        function (senz_id_list){
            if (senz_id_list.length != cur_senz_list.length){
                console.log('There some errors occured when adding senz to LeanCloud.');
                console.log('* There are ' + cur_senz_list.length + ' senzes generated.');
                console.log('* But ' + senz_id_list.length + 'senzes added to LeanCloud.');
            }
            sound_id_list    = util.extractRawdataIdFromSenzList('sound', cur_senz_list);
            motion_id_list   = util.extractRawdataIdFromSenzList('motion', cur_senz_list);
            location_id_list = util.extractRawdataIdFromSenzList('location', cur_senz_list);
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

//dao.labelRawdataSenzed(
//    ['5538b907e4b0df9cbc4ca89c'],
//    ['5538bf73e4b0df9cbc4dfb42'],
//    ['5538bf87e4b0df9cbc4dfde4']
//).then(
//    function (){
//        console.log('OK!');
//    }
//);

//data = {
//    "filter": 1,
//    "timelines": {
//        "location": [{"timestamp": 2}, {"timestamp": 4}, {"timestamp": 6}, {"timestamp": 9}],
//        "motion": [{"timestamp": 3}, {"timestamp": 4}, {"timestamp": 7}, {"timestamp": 9}],
//        "sound": [{"timestamp": 1}, {"timestamp": 3}, {"timestamp": 6}]
//    },
//    "primary_key": "location"
//};
//
//algo.senzCollector(data);

//dao._addSenz('5538f6cbe4b019188f009326', '5538f6cbe4b019188f009325', '5538f6cbe4b019188f009327');