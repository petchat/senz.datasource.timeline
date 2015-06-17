/**
 * Created by MeoWoodie on 4/27/15.
 */
var dao = require("./dao.js");
var algo = require("./algo.js");
var config = require("./config.js");
var util = require("./util.js");
var logger = require("./logger.js");
var AV = require('leanengine');

exports.senzGenerator = function (is_training) {
    //console.log("Senz Generating...\n============");
    // Get untreated data from LeanCloud.
    logger.info(config.logEventType.sta, "generating senzes");
    logger.info(config.logEventType.ret, "every user's rawdata");
    return dao.getUnbindRawdata(is_training).then(
        // Request the senz collector with untreated data
        // to get the list of senz tuples.
        function (user_location_list, user_motion_list, user_sound_list) {
            logger.info(config.logEventType.ret, "every user's rawdata results is got");
            // TODO: user set need to improve.
            var users_list = util.uniqueUsersSet(config.user_list);
            var promises = [];
            users_list.forEach(function (user) {
                var location_list = user_location_list[user],
                    motion_list = user_motion_list[user],
                    sound_list = user_sound_list[user];
                if (location_list == undefined) {
                    location_list = [];
                    logger.warn(config.logEventType.ret, "user<" + user + ">'s location raw data is vacant");
                }
                if (motion_list == undefined) {
                    motion_list = [];
                    logger.warn(config.logEventType.ret, "user<" + user + ">'s motion raw data is vacant");
                }
                if (sound_list == undefined) {
                    sound_list = [];
                    logger.warn(config.logEventType.ret, "user<" + user + ">'s sound raw data is vacant");
                }
                // TODO: need to promoted here.
                if (location_list.length >= 1) {
                    var request_data = {
                        "user": user,
                        "filter": 1000 * 120,
                        "timelines": {
                            "location": location_list,
                            "motion": motion_list,
                            "sound": sound_list
                        },
                        "primary_key": config.collector_primary_key
                    };
                    logger.info(config.logEventType.r2s, "request with user<" + user + ">'s rawdata");
                    promises.push(algo.senzCollector(request_data));
                }
            });
            return AV.Promise.all(promises);
        }
    ).then(
        // Save the list of senz tuples to LeanCloud.
        function (senz_list) {
            logger.info(config.logEventType.r2s, "receive all users' processed results");
            if (senz_list == undefined || senz_list.length < 1) {
                logger.error(config.logEventType.r2s, "after processing, There is no senz left");
                return AV.Promise.error("After log2rawsenz middleware, There is no senz left.");
            }
            var promises = [];
            senz_list.forEach(function (user_result) {
                logger.info(config.logEventType.sav, "user<" + user_result.user + ">'s senz");
                promises.push(dao.addSenz(user_result.user, user_result.result, is_training));
            });
            return AV.Promise.all(promises);
        },
        function (error) {
            logger.error(config.logEventType.r2s, "receive all users' processed results failed, error msg:" + error);
            return AV.Promise.error(error);
        }
    ).then(
        // Label the rawdata in LeanCloud.
        function (senz_id_list) {
            logger.info(config.logEventType.sav, "all users' senz is saved");
            var sound_id_list = util.bindRawdataIdFromSenzList("sound_id", senz_id_list);
            var motion_id_list = util.bindRawdataIdFromSenzList("motion_id", senz_id_list);
            var location_id_list = util.bindRawdataIdFromSenzList("location_id", senz_id_list);
            logger.info(config.logEventType.upd, "complete rawdata binding to a senz");
            return dao.completeRawdataBinding(location_id_list, motion_id_list, sound_id_list);
        },
        function (error) {
            logger.error(config.logEventType.sav, "all users' senz is unsaved, error msg:" + error);
            return AV.Promise.error(error);
        }
    );
};


exports.behaviorGenerator = function (user_id, start_time, end_time, scale, is_stored) {
    //console.log("Behavior Generating...\n============");
    var senz_id_list = [];
    var start_t = new Date(start_time);
    var end_t = new Date(end_time);
    //var promise = new AV.Promise();
    logger.info(config.logEventType.ret, "user<" + user_id + ">'s raw behavior from " + start_t + " to " + end_t);
    return dao.getUserRawBehavior(user_id, start_time, end_time).then(
        function (behavior_result) {
            logger.info(config.logEventType.ret, "user<" + user_id + ">'s raw behavior from " + start_t + " to " + end_t);
            var behavior = behavior_result["behavior"];
            behavior.forEach(function (senz) {
                senz_id_list.push(senz["senzId"]);
            });
            //console.log(behavior.length);
            //console.log(behavior);
            logger.info(config.logEventType.r2r, "request with user<" + user_id + ">'s raw behavior from " + start_t + " to " + end_t);
            return algo.behaviorCollector(behavior, scale);
        }
    ).then(
        function (behavior_refined) {
            //console.log("The generated refined behavior is");
            console.log(behavior_refined);
            //console.log(senz_id_list.length);
            logger.info(config.logEventType.r2r, "receive user<" + user_id + ">'s refined behavior from " + start_t + " to " + end_t);
            if (is_stored == true && behavior_refined != undefined && behavior_refined.length >= 1) {
                //console.log("The result will be stored in LeanCloud.");
                logger.info(config.logEventType.sav, "user<" + user_id + ">'s behavior");
                return dao.addBehavior(user_id, behavior_refined, "normal", senz_id_list, start_time, end_time);
            }
            else if (is_stored == false && behavior_refined != undefined && behavior_refined.length >= 1) {
                console.log("The result will be return.");
                logger.info(config.logEventType.sav, "user<" + user_id + ">'s behavior");
                return AV.Promise.as(behavior_refined);
            }
            else {
                //var promise = new AV.Promise();
                //promise.reject("the behavior"s count is 0");
                //return promise;
                logger.error(config.logEventType.r2r, "receive user<" + user_id + ">'s refined behavior's len is 0 from " + start_t + " to " + end_t);
                return AV.Promise.error("the behaviors len is 0");
            }
            //dao.addBehavior(user_id, behavior_refined, "normal", senz_id_list);
        }
    );
};


