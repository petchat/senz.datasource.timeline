/**
 * Created by MeoWoodie on 4/27/15.
 */
var dao    = require('cloud/dao.js');
var algo   = require('cloud/algo.js');
var config = require('cloud/config.js');
var util   = require('cloud/util.js');


exports.senzCluster = function (){
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
        // Save the list of senz tuples to LeanCloud.
        function (senz_list){
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
};

exports.