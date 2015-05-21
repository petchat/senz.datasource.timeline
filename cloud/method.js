/**
 * Created by MeoWoodie on 4/27/15.
 */
var dao = require('cloud/dao.js');
var algo = require('cloud/algo.js');
var config = require('cloud/config.js');
var util = require('cloud/util.js');

exports.senzGenerator = function (is_training) {
    console.log('Senz Generating...\n============');
    // Get untreated data from LeanCloud.
    return dao.getUnbindRawdata(is_training).then(
        // Request the senz collector with untreated data
        // to get the list of senz tuples.
        function (user_location_list, user_motion_list, user_sound_list) {
            var users_list = util.uniqueUsersSet(config.user_list);
            var promises = [];
            users_list.forEach(function (user) {
                var request_data = {
                    "user": user,
                    "filter": 1000 * 120,
                    "timelines": {
                        "location": user_location_list[user],
                        "motion": user_motion_list[user],
                        "sound": user_sound_list[user]
                    },
                    "primary_key": config.collector_primary_key
                };
                promises.push(algo.senzCollector(request_data));
            });
            return AV.Promise.all(promises);
        }
    ).then(
        // Save the list of senz tuples to LeanCloud.
        function (senz_list) {
            var promises = [];
            senz_list.forEach(function (user_result) {
                promises.push(dao.addSenz(user_result.user, user_result.result, is_training));
            });
            return AV.Promise.all(promises);
        }
    ).then(
        // Label the rawdata in LeanCloud.
        function (senz_id_list) {
            var sound_id_list = util.bindRawdataIdFromSenzList('sound_id', senz_id_list);
            var motion_id_list = util.bindRawdataIdFromSenzList('motion_id', senz_id_list);
            var location_id_list = util.bindRawdataIdFromSenzList('location_id', senz_id_list);
            return dao.completeRawdataBinding(location_id_list, motion_id_list, sound_id_list);
        }
    );
};


exports.behaviorGenerator = function (user_id, start_time, end_time, scale, is_stored) {
    console.log('Behavior Generating...\n============');
    var senz_id_list = [];
    var promise = new AV.Promise();
    return dao.getUserRawBehavior(user_id, start_time, end_time).then(
        function (behavior_result) {
            var behavior = behavior_result['behavior'];
            behavior.forEach(function (senz) {
                senz_id_list.push(senz['senzId']);
            });
            //console.log(behavior.length);
            return algo.behaviorCollector(behavior, scale);
        }
    ).then(
        function (behavior_refined) {
            console.log('The generated refined behavior is');
            console.log(behavior_refined);
            //console.log(senz_id_list.length);
            if (is_stored == true) {
                console.log('The result will be stored in LeanCloud.');
                return dao.addBehavior(user_id, behavior_refined, 'normal', senz_id_list);
            }
            else {
                console.log('The result will be return.');
                return AV.Promise.as(behavior_refined);
            }
            //dao.addBehavior(user_id, behavior_refined, 'normal', senz_id_list);
        }
    );
};


