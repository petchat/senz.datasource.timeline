// TODO: Read config to configurate the prob info.
var config         = require("./config.js");
var util           = require("./util.js");
var AV             = require("leanengine");
var serialize_task = require("./serialize_task.js");
var _              = require("underscore");

var User               = AV.Object.extend("_User");
var UserStatus         = AV.Object.extend("UserStatus");
var Behavior           = AV.Object.extend("UserBehavior");
var Senz               = AV.Object.extend("UserSenz");
var Event              = AV.Object.extend("UserEvent");
var UserLocation       = AV.Object.extend("UserLocation");
var UserMotion         = AV.Object.extend("UserMotion");
var UserSound          = AV.Object.extend("UserSound");

var AvRawdataExtendObj = {
    "UserLocation": AV.Object.extend("UserLocation"),
    "UserMotion": AV.Object.extend("UserMotion"),
    "UserSound": AV.Object.extend("UserSound")
};

var _findAll = function (query){
    return query.count().then(
        function (count){
            var promises = [];
            var pages    = Math.ceil(count/1000);
            for (var i = 0; i <= pages; i ++){
                var _query = _.clone(query);
                _query.limit(1000);
                _query.skip(i*1000);
                promises.push(_query.find());
            }
            return AV.Promise.all(promises);
        },
        function (error){
            return AV.Promise.error(error);
        }
    ).then(
        function (results){
            var rebuid_result = [];
            results.forEach(function (result_list){
                result_list.forEach(function (list_item){
                    rebuid_result.push(list_item);
                });
            });
            return AV.Promise.as(rebuid_result);
        },
        function (error){
            return AV.Promise.error(error);
        }
    );
};

var _getLatestUserLocation = function (user_id, start_time, end_time){
    var query = new AV.Query(UserLocation);
    var user = AV.Object.createWithoutData("_User", user_id);
    query.equalTo("user", user);
    query.greaterThan("timestamp", start_time);
    query.lessThan("timestamp", end_time);
    query.descending("timestamp");
    return first(query).then(
        function (result){
            var res = {
                timestamp: result.get("timestamp"),
                poiProbLv1: result.get("poiProbLv1"),
                poiProbLv2: result.get("poiProbLv2")
            };
            return AV.Promise.as(res);
        },
        function (error){
            return AV.Promise.error(error);
        }
    );
};

var _getLatestUserMotion = function (user_id, start_time, end_time){
    var query = new AV.Query(UserMotion);
    var user = AV.Object.createWithoutData("_User", user_id);
    query.equalTo("user", user);
    query.greaterThan("timestamp", start_time);
    query.lessThan("timestamp", end_time);
    query.descending("timestamp");
    return first(query).then(
        function (result){
            var res = {
                timestamp: result.get("timestamp"),
                motionProb: result.get("motionProb")
            };
            return AV.Promise.as(res);
        },
        function (error){
            return AV.Promise.error(error);
        }
    );
};

var _getUserSound = function (user_id, start_time, end_time){
    var query = new AV.Query(UserSound);
    var user = AV.Object.createWithoutData("_User", user_id);
    query.equalTo("user", user);
    query.greaterThan("timestamp", start_time);
    query.lessThan("timestamp", end_time);
    query.descending("timestamp");
    return first(query).then(
        function (result){
            var res = {
                timestamp: result.get("timestamp"),
                soundProb: result.get("soundProb")
            };
            return AV.Promise.as(res);
        },
        function (error){
            return AV.Promise.error(error);
        }
    );
};

var _getUnbindData = function (UserRawdata, is_training) {
    var promise = new AV.Promise();
    var user_rawdata = AvRawdataExtendObj[UserRawdata];
    var query = new AV.Query(user_rawdata);
    query.ascending("timestamp");
    query.equalTo("processStatus", "untreated");
    query.limit(1000);
    _findAll(query).then(
        function (results) {
            var untreatedData = {};
            results.forEach(function (result) {
                var user = result.get("user").id;
                if (!(user in untreatedData)) {
                    // Add the new user to the global user id list
                    config.user_list[UserRawdata].push(user);
                    untreatedData[user] = [];
                }
                var data = {
                    "objectId": result.id,
                    "rawdataId": result.get("userRawdataId"),
                    "timestamp": result.get("timestamp")
                };
                untreatedData[user].push(data);
            });
            promise.resolve(untreatedData);
        },
        function (error_info) {
            console.log("  Error occurs! " + error_info.code + " " + error_info.message);
            promise.reject(error_info);
        }
    );
    return promise;
};

// DAO for senz processing.

var _completeRawdataBinding = function (UserRawdata, rawdata_id) {
    if (rawdata_id == config.counterfeitObjectId){
        return AV.Promise.as(rawdata_id);
    }
    else {
        var user_rawdata = AV.Object.extend(UserRawdata);
        var query = new AV.Query(user_rawdata);
        return query.get(rawdata_id).then(
            function (userRawdata) {
                var date = new Date();
                userRawdata.set("processStatus", "senzed");
                userRawdata.set("senzedAt", date);
                return userRawdata.save().then(
                    function (obj) {
                        return AV.Promise.as(obj.id);
                    },
                    function (error_info) {
                        return AV.Promise.error(error_info)
                    }
                );
            },
            function (error_info) {
                console.log("Error occurs! " + error_info);
                return AV.Promise.error(error_info)
            }
        );
    }
};

var _addSenz = function (user_id, location_obj_id, motion_obj_id, sound_obj_id, timestamp, is_training) {
    var promise = new AV.Promise();
    var senz = new Senz();
    if (motion_obj_id != config.counterfeitObjectId){
        var motion_pointer = AV.Object.createWithoutData("UserMotion", motion_obj_id);
        senz.set("userMotion", motion_pointer);
    }
    if (sound_obj_id != config.counterfeitObjectId){
        var sound_pointer = AV.Object.createWithoutData("UserSound", sound_obj_id);
        senz.set("userSound", sound_pointer);
    }
    if (location_obj_id != config.counterfeitObjectId){
        var location_pointer = AV.Object.createWithoutData("UserLocation", location_obj_id);
        senz.set("userLocation", location_pointer);
    }
    var user_pointer = AV.Object.createWithoutData("_User", user_id);
    senz.set("user", user_pointer);
    senz.set("timestamp", timestamp);
    // Set the senz"s time zone.
    senz.set("perMinScale", util.calculateTimeZone(timestamp, "perMinScale"));
    senz.set("tenMinScale", util.calculateTimeZone(timestamp, "tenMinScale"));
    senz.set("halfHourScale", util.calculateTimeZone(timestamp, "halfHourScale"));
    senz.set("perHourScale", util.calculateTimeZone(timestamp, "perHourScale"));
    senz.save().then(
        function (senz) {
            var result = {
                "user_id": user_id,
                "senz_id": senz.id,
                "location_id": location_obj_id,
                "motion_id": motion_obj_id,
                "sound_id": sound_obj_id
            };
            promise.resolve(result);
        },
        function (error_info) {
            promise.reject(error_info);
        }
    );
    return promise;
};

exports.getUnbindRawdata = function (is_training) {
    return AV.Promise.when(
        _getUnbindData("UserLocation", is_training),
        _getUnbindData("UserMotion", is_training),
        _getUnbindData("UserSound", is_training)
    );
};

exports.completeRawdataBinding = function (location_id_list, motion_id_list, sound_id_list) {
    var promises   = [];
    var location_id_error_list = [];
    var motion_id_error_list = [];
    var sound_id_error_list = [];

    var location_id_jobs_list = location_id_list;
    var motion_id_jobs_list   = motion_id_list;
    var sound_id_jobs_list    = sound_id_list;

    var location_id_work = new serialize_task.SerializeTask();
    var motion_id_work   = new serialize_task.SerializeTask();
    var sound_id_work    = new serialize_task.SerializeTask();

    var location_id_worker = function (job, resolve, reject) {
        _completeRawdataBinding("UserLocation", job).then(
            function (){
                resolve();
            },
            function (error){
                location_id_error_list.push(error);
                reject();
            }
        );
    };
    var motion_id_worker = function (job, resolve, reject) {
        _completeRawdataBinding("UserMotion", job).then(
            function (){
                resolve();
            },
            function (error){
                motion_id_error_list.push(error);
                reject();
            }
        );
    };
    var sound_id_worker = function (job, resolve, reject) {
        _completeRawdataBinding("UserSound", job).then(
            function (){
                resolve();
            },
            function (error){
                sound_id_error_list.push(error);
                reject();
            }
        );
    };

    location_id_jobs_list.forEach(function (job){
        location_id_work.addTask(job);
    });
    motion_id_jobs_list.forEach(function (job){
        motion_id_work.addTask(job);
    });
    sound_id_jobs_list.forEach(function (job){
        sound_id_work.addTask(job);
    });

    location_id_work.setWorker(location_id_worker);
    motion_id_work.setWorker(motion_id_worker);
    sound_id_work.setWorker(sound_id_worker);
    // Start to work!
    promises.push(location_id_work.begin());
    promises.push(motion_id_work.begin());
    promises.push(sound_id_work.begin());
    return AV.Promise.all(promises).then(
        function (){
            return AV.Promise.as("All raw data have been bind.");
        },
        function (){
            return AV.Promise.error("When binding raw data, there some error occurred, " +
                                    "location error list is: " + location_id_error_list +
                                    "motion error list is: "   + motion_id_error_list +
                                    "sound error list is "     + sound_id_error_list);
        }
    );
};

exports.addSenz = function (user, senz_list, is_training) {
    var user_id = user;
    var senz_id_list = [];
    var error_list   = [];
    var jobs_list    = senz_list;

    var work = new serialize_task.SerializeTask();

    var worker = function (job, resolve, reject) {
        var location_id = job["location"]["objectId"],
            motion_id   = job["motion"]["objectId"],
            sound_id    = job["sound"]["objectId"],
            timestamp   = job[config.collector_primary_key]["timestamp"];
        _addSenz(user_id, location_id, motion_id, sound_id, timestamp, is_training).then(
            function (result){
                senz_id_list.push(result);
                resolve();
            },
            function (error){
                error_list.push(error);
                reject();
            }
        );
    };

    jobs_list.forEach(function (job){
        work.addTask(job);
    });

    work.setWorker(worker);
    // Start to work!
    return work.begin().then(
        // There is a result return.
        function(){
            console.log("There has been processed " + senz_id_list.length + "senzes.");
            return AV.Promise.as(senz_id_list);
        }
    );

};

// DAO for behavior processing.

exports.getUserRawBehavior = function (user_id, start_time, end_time) {
    var promise = new AV.Promise();
    var user = AV.Object.createWithoutData("_User", user_id);
    var query = new AV.Query(Senz);
    query.equalTo("user", user);
    query.greaterThan("timestamp", start_time);
    query.lessThan("timestamp", end_time);
    query.include("userSound");
    query.include("userLocation");
    query.include("userMotion");
    query.ascending("timestamp");
    _findAll(query).then(
        function (results) {
            var behavior = [];
            results.forEach(function (result) {
                var data = {
                    "senzId": result.id,
                    "tenMinScale": result.get("tenMinScale"),
                    "halfHourScale": result.get("halfHourScale"),
                    "perHourScale": result.get("perHourScale"),
                    "timestamp": result.get("timestamp")
                };
                // counterfeit motion prob
                if (result.get("userMotion") != undefined){
                    data["motionProb"] = result.get("userMotion")["attributes"]["motionProb"];
                }
                else {
                    data["motionProb"] = config.counterfeitProb["motion"];
                }
                // counterfeit location prob
                if (result.get("userLocation") != undefined){
                    data["poiProbLv1"] = result.get("userLocation")["attributes"]["poiProbLv1"];
                    data["poiProbLv2"] = result.get("userLocation")["attributes"]["poiProbLv2"];
                }
                else {
                    data["poiProbLv1"] = config.counterfeitProb["location"];
                    data["poiProbLv2"] = config.counterfeitProb["location"];
                }
                // counterfeit sound prob
                if (result.get("userSound") != undefined){
                    data["soundProb"] = result.get("userSound")["attributes"]["soundProb"];
                }
                else {
                    data["soundProb"] = config.counterfeitProb["sound"];
                }
                behavior.push(data);
            });
            var user_behavior = new Object({"user": user_id, "behavior": behavior});
            promise.resolve(user_behavior);
        },
        function (error_info) {
            promise.reject(error_info);
        }
    );
    return promise;
};

exports.addBehavior = function (user_id, behavior_data, day_type, senz_id_list, start_time, end_time, scale) {
    var behavior = new Behavior();
    var related_senzes = [];
    senz_id_list.forEach(function (senz_id) {
        related_senzes.push(AV.Object.createWithoutData("UserSenz", senz_id));
    });
    var user_pointer = AV.Object.createWithoutData("_User", user_id);
    var relation = behavior.relation("relatedSenzes");
    //var timestamp = new Date();
    if (behavior_data.length >= 1){
        behavior.set("scaleType", scale);
        behavior.set("behaviorData", behavior_data);
        behavior.set("user", user_pointer);
        behavior.set("startTime", start_time);
        behavior.set("endTime", end_time);
        behavior.set("dayType", day_type);
        relation.add(related_senzes);
        return behavior.save();
    }
    else{
        return AV.Promise.error("The behavior is undefine");
    }
};

exports.getAllUsersStatus = function (){
    var query = new AV.Query(UserStatus);
    return _findAll(query).then(
        function (results){
            var res = [];
            results.forEach(function (user_status){
                var obj = {};
                obj["userId"] = user_status.get("user").id;
                if (user_status.get("behaviorLastUpdatedAt") != undefined){
                    obj["behaviorLastUpdatedAt"] = user_status.get("behaviorLastUpdatedAt");
                }
                if (user_status.get("resultLastNotifiedAt") != undefined){
                    obj["resultLastNotifiedAt"] = user_status.get("resultLastNotifiedAt");
                }
                if (user_status.get("configLastModifiedAt") != undefined){
                    obj["configLastModifiedAt"] = user_status.get("configLastModifiedAt");
                }
                res.push(obj);
            });
            return AV.Promise.as(res);
        },
        function (error){
            return AV.Promise.error(error);
        }
    );
};

exports.getUserBehaviorLastUpdateTime = function (user_id, behavior_len) {
    console.log("The user " + user_id);
    var user = AV.Object.createWithoutData("_User", user_id);
    var query = new AV.Query(UserStatus);
    query.equalTo("user", user);
    query.ascending("behaviorLastUpdatedAt");
    return query.first().then(
        function (result) {
            // If the user did not register in UserStatus
            if (result == undefined){
                return AV.Promise.error("The user did not register in UserStatus.");
            }
            var timestamp = result.get("behaviorLastUpdatedAt");
            // If you delete the timestamp in db, the query result will be null,
            if (timestamp === null){
                return AV.Promise.error("The user's last update time is lost");
            }
            // Others the result will be undefined, if a new user created.
            else if (timestamp === undefined){
                timestamp = new Date();
            }
            // Tips: null == undefined, but not null === undefined.
            console.log(new Date(timestamp));
            return AV.Promise.as(timestamp);
        },
        function (error) {
            return AV.Promise.error(error);
        }
    ).then(
        function (timestamp){
            return _searchLatestSenzTime(user_id, timestamp.getTime(), behavior_len)
        },
        function (error){
            return AV.Promise.error(error);
        }
    );
};

exports.updateUserBehaviorLastUpdatedTime = function (user_id, unix_timestamp) {
    var new_timestamp = new Date(unix_timestamp);
    var user = AV.Object.createWithoutData("_User", user_id);
    var query = new AV.Query(UserStatus);
    query.equalTo("user", user);
    query.ascending("timestamp");
    return query.first().then(
        function (result) {
            return query.get(result.id);
        }
    ).then(
        function (user){
            user.set("behaviorLastUpdatedAt", new_timestamp);
            return user.save();
        }
    );
};

exports.updateUserBehaviorPrediction = function (behavior_id, prediction){
    var query = new AV.Query(Behavior);
    return query.get(behavior_id).then(
        function (behavior){
            behavior.set("prediction", prediction);
            return behavior.save();
        },
        function (error){
            AV.Promise.error(error);
        }
    );
};

exports.getAllUsers = function (){
    var promise = new AV.Promise();
    var query = new AV.Query(User);
    _findAll(query).then(
        function (users){
            var user_id_list = [];
            users.forEach(function (user){
                user_id_list.push(user.id);
            });
            promise.resolve(user_id_list);
        },
        function (error){
            promise.reject(error);
        }
    );
    return promise;
};

var _searchLatestSenzTime = function (user_id, last_update_time, behavior_len){
    var promise = new AV.Promise();
    var user = AV.Object.createWithoutData("_User", user_id);
    var query = new AV.Query(Senz);
    query.equalTo("user", user);
    query.greaterThan("timestamp", last_update_time);
    query.ascending("timestamp");
    query.first().then(
        function (result){
            if (result == undefined){
                var date = new Date();
                console.log("the user has no senz recently.");
                promise.resolve(date);
            }
            else {
                var latest_timestamp = result.get("timestamp");
                if (latest_timestamp < (last_update_time + behavior_len)) {
                    console.log("the user has a while leaving.");
                    promise.resolve(new Date(last_update_time));
                }
                else {
                    promise.resolve(new Date(latest_timestamp));
                }
            }
        },
        function (error){
            var date = new Date();
            console.log("the user has no senz recently.");
            promise.resolve(date);
        }
    );
    return promise;
};

// DAO for event processing.

exports.getTimeline = function (user_id, start_time, end_time){
    var query = new AV.Query(Event);
    var user  = AV.Object.createWithoutData("_User", user_id);
    query.lessThan("endTime", end_time);
    query.greaterThan("startTime", start_time);
    query.equalTo("user", user);
    query.ascending("startTime");
    return _findAll(query).then(
        function (results){
            if (results == undefined){
                return AV.Promise.error("There is no event for user " + user_id);
            }
            var events_obj = {},
                i = 0;
            results.forEach(function (result){
                var index = "event_" + i;
                events_obj[index] = {
                    eventType:   result.get("eventType"),
                    startTime:   result.get("startTime"),
                    endTime:     result.get("endTime"),
                    probability: result.get("prob")
                };
                i ++;
            });
            return AV.Promise.as(events_obj);
        },
        function (error){
            return AV.Promise.error(error);
        }
    );
};

exports.removeEvents = function (user_id, start_time, end_time){
    var query = new AV.Query(Event);
    var user  = AV.Object.createWithoutData("_User", user_id);
    query.equalTo("user", user);
    query.greaterThan("startTime", start_time);
    query.lessThan("endTime", end_time);
    return _findAll(query).then(
        function (results){
            return AV.Object.destroyAll(results);
        },
        function (error){
            return AV.Promise.error(error);
        }
    );
};

exports.getUserRawEvent = function (user_id, start_time, end_time){
    var query = new AV.Query(Behavior);
    var user  = AV.Object.createWithoutData("_User", user_id);
    query.equalTo("user", user);
    query.greaterThan("startTime", start_time);
    query.lessThan("endTime", end_time);
    query.ascending("startTime");
    return _findAll(query).then(
        function (behaviors){
            var raw_events = [];
            // The result of query is not empty.
            if (behaviors != undefined && behaviors.length > 0){
                behaviors.forEach(function (behavior){
                    // The prediction of a behavior is not empty.
                    if (behavior != undefined && behavior.get("prediction") != undefined){
                        var raw_event = {
                            eventType:  _.map(behavior.get("prediction"), function (behavior_res){
                                return {
                                    types: behavior_res["prediction"],
                                    probability: behavior_res["behavior"]["prob"]
                                }
                            }),
                            behaviorId: behavior.id,
                            startTime:  behavior.get("startTime"),
                            endTime:    behavior.get("endTime")
                        };
                        raw_events.push(raw_event);
                    }
                });
                if (raw_events.length > 0){
                    return AV.Promise.as(raw_events);
                }
                else{
                    return AV.Promise.error("There are no correct behaviors for user " + user_id +
                                            " from " + new Date(start_time) + " to " + new Date(end_time));
                }
            }
            else{
                return AV.Promise.error("There is no behavior for user " + user_id +
                                        " from " + new Date(start_time) + " to " + new Date(end_time));
            }
        },
        function (error){
            return AV.Promise.error(error);
        }
    );
};

exports.addEvent = function (user_id, event_type, prob, start_time, end_time, behavior_id_list){
    var event = new Event();
    var user  = AV.Object.createWithoutData("_User", user_id);
    var relation     = event.relation("relatedBehaviors");
    var related_behaviors = [];
    behavior_id_list.forEach(function (behavior_id) {
        related_behaviors.push(AV.Object.createWithoutData("UserBehavior", behavior_id));
    });
    event.set("user", user);
    event.set("from", new Date(start_time));
    event.set("to", new Date(end_time));
    event.set("prob", prob);
    event.set("eventType", event_type);
    event.set("startTime", start_time);
    event.set("endTime", end_time);
    relation.add(related_behaviors);
    return event.save();
};

// This function is for portal.
// And portal is a temporary viewer.

exports.getLatestIntegratedSenz = function (user_id){
    var user = AV.Object.createWithoutData("_User", user_id);
    console.log("There is user: " + user_id);

    // Define the job list (According to the priority)
    var jobs_list = [
        ["userLocation", "userSound", "userMotion"],
        ["userLocation", "userMotion"],
        ["userLocation", "userSound"],
        ["userSound", "userMotion"],
        ["userLocation"],
        ["userMotion"],
        ["userSound"]
    ];
    // Create a new serial work
    var work = new serialize_task.SerializeTaskWithInterruption();
    // Define worker
    var worker = function (job, resolve, reject) {
        console.log("Start to query about user's " + job);
        var query = new AV.Query(Senz);
        query.equalTo("user", user);
        query.descending("timestamp");
        job.forEach(function (user_status){
            query.exists(user_status);
            query.include(user_status);
        });
        query.first().then(
            function (result){
                if (result === undefined || result == null){
                    console.log("There is no result exists, error: result is undefined");
                    console.log("Keep finding next possible combination");
                    resolve("Keep finding next possible combination");
                }
                else {
                    console.log("The query result is : " + JSON.stringify(result, null, 4));
                    var latest_status = {};
                    job.forEach(function (status){
                        latest_status[status] = {};
                        config.statusInfoObj[status].forEach(function (prob_name){
                            latest_status[status][prob_name] = result.get(status)["attributes"][prob_name];
                        });
                        latest_status[status]["updatedAt"] = new Date(result.get(status)["attributes"]["timestamp"]);
                    });
                    latest_status["updatedAt"] = new Date(result.get("timestamp"));
                    reject(latest_status);
                }
            },
            function (error){
                console.log("There is no result exists, error: " + error);
                console.log("Keep finding next possible combination");
                resolve(job);
            }
        )
    };
    // Allocation of jobs
    jobs_list.forEach(function (job){
        work.addTask(job);
    });
    work.setWorker(worker);
    // Start to work!
    return work.begin().then(
        // Serialize task is work done,
        // There is no result exists.
        function (error){ // In fact, it is success function.
            console.log("work is failed!");
            return AV.Promise.error("There is no status data for this user.");
        },
        // Serialize task is interrupted,
        // There is a result return.
        function(result){// In fact, it is fail function.
            console.log("work is done!");
            return AV.Promise.as(result);
        }
    );
};

exports.getEvents = function (user_id, limit, start_time, end_time){
    var query = new AV.Query(Behavior);
    var user  = AV.Object.createWithoutData("_User", user_id);
    query.equalTo("user", user);
    query.descending("endTime");

    if (limit != undefined){
        query.limit(limit);
    }
    else{
        query.greaterThan("startTime", start_time);
        query.lessThan("startTime", end_time);
        query.limit(500);
    }

    console.log("There is user: " + user_id);

    return query.find().then(
        function (results){
            var latest_events_list = [];
            results.forEach(function (result){
                // Get current user's prediction.
                var prediction = result.get("prediction");
                var probability = {};
                if (prediction == undefined){
                    return AV.Promise.error("Prediction is Undefined.");
                }
                prediction.forEach(function (behavior){
                    var b_prob = behavior["behavior"]["prob"];
                    var p_prob = behavior["prediction"];
                    var events = _.keys(p_prob);
                    events.forEach(function (event){
                        if (!_.has(probability, event)){
                            probability[event] = 0;
                        }
                        else {
                            probability[event] += Math.exp(p_prob[event]) * Math.exp(b_prob);
                        }
                    });
                });
                // Normalization of Events' probabilities.
                var events = _.keys(probability);
                var sum    = 0;
                events.forEach(function (event){
                    sum += probability[event];
                });
                events.forEach(function (event){
                    probability[event] = probability[event]/sum;
                });
                // Get current time when the prediction updated.
                var updated_at = result.updatedAt;
                // The latest event obj is a combination of probability and updated timestamp.
                var latest_event = {"event": probability, "updatedAt": updated_at};
                latest_events_list.push(latest_event);
            });
            console.log("The query result is \n" + JSON.stringify(latest_events_list, null, 4));
            return AV.Promise.as(latest_events_list);
        },
        function (error){
            return AV.Promise.error(error);
        }
    );
};

// DAO for utils

exports.clearFlag = function (start_time, end_time) {
    var query_location = new AV.Query(UserLocation);
    var query_motion = new AV.Query(UserMotion);
    var query_sound = new AV.Query(UserSound);

    var jobs_list = [query_location, query_motion, query_sound];

    var work = new serialize_task.SerializeTask();

    var worker = function (job, resolve, reject) {
        if (start_time != undefined && end_time != undefined){
            console.log("There is a constraint!");
            job.greaterThan("timestamp", start_time);
            job.lessThan("timestamp", end_time);
        }
        job.equalTo("processStatus", "senzed");
        job.ascending("timestamp");
        _findAll(job).then(
            function (results) {
                var timestamps = [];
                console.log("There is " + results.length + " items");

                var _jobs_list = results;

                var _work = new serialize_task.SerializeTask();

                var worker = function (job, resolve, reject) {
                    var timestamp = job.get("timestamp");
                    job.set("processStatus", "untreated");
                    timestamps.push(timestamp);
                    job.save().then(
                        function (){
                            resolve();
                        },
                        function (){
                            reject();
                        }
                    );
                };

                _jobs_list.forEach(function (job){
                    _work.addTask(job);
                });

                _work.setWorker(worker);
                // Start to work!
                return _work.begin().then(
                    // There is a result return.
                    function(result){// In fact, it is fail function.
                        console.log("work is done!");
                        console.log("timestamp list:\n" + timestamps);
                        return AV.Promise.as(result);
                    }
                );
            },
            function (error) {
                return AV.Promise.error(error);
            }
        ).then(
            function (){
                resolve();
            },
            function (){
                reject();
            }
        );
    };

    jobs_list.forEach(function (job){
        work.addTask(job);
    });

    work.setWorker(worker);
    // Start to work!
    return work.begin().then(
        // There is a result return.
        function(result){
            console.log("work is done!");
            return AV.Promise.as(result);
        }
    );
};

