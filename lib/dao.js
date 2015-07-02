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
var UserLocation       = AV.Object.extend("UserLocation");
var UserMotion         = AV.Object.extend("UserMotion");
var UserSound          = AV.Object.extend("UserSound");
var AvRawdataExtendObj = {
    "UserLocation": AV.Object.extend("UserLocation"),
    "UserMotion": AV.Object.extend("UserMotion"),
    "UserSound": AV.Object.extend("UserSound")
};

var QueryAll = function (){
        
};

var _getUnbindData = function (UserRawdata, is_training) {
    var promise = new AV.Promise();
    var user_rawdata = AvRawdataExtendObj[UserRawdata];
    var query = new AV.Query(user_rawdata);
    query.ascending("timestamp");
    query.equalTo("processStatus", "untreated");
    query.limit(1000);
    query.find().then(
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

var _completeRawdataBinding = function (UserRawdata, rawdata_id) {
    if (rawdata_id == config.counterfeitObjectId){
        return AV.Promise.as(rawdata_id);
    }
    else {
        var user_rawdata = AV.Object.extend(UserRawdata);
        var query = new AV.Query(user_rawdata);
        query.get(rawdata_id, {
            success: function (userRawdata) {
                var date = new Date();
                userRawdata.set("processStatus", "untreated");
//                userRawdata.set("processStatus", "senzed");
                userRawdata.set("senzedAt", date);
                userRawdata.save().then(
                    function (obj) {
                        return AV.Promise.as(obj.id);
                    },
                    function (error_info) {
                        return AV.Promise.error(error_info)
                    }
                );
            },
            error: function (error_info) {
                // TODO promise.reject, convert to .then .then
                console.log("Error occurs! " + error_info);
                return AV.Promise.error(error_info)
            }
        });
    }
};

var _addSenz = function (user_id, location_obj_id, motion_obj_id, sound_obj_id, timestamp, is_training) {
    var promise = new AV.Promise();
    //var Senz = AV.Object.extend("UserSenz");
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
//    senz.set("isTrainingSample", is_training);
    // Set the senz"s time zone.
    senz.set("tenMinScale", util.calculateTimeZone(timestamp, "tenMinScale"));
    senz.set("halfHourScale", util.calculateTimeZone(timestamp, "halfHourScale"));
    senz.set("perHourScale", util.calculateTimeZone(timestamp, "perHourScale"));
    senz.save().then(
        function (senz) {
            console.log("oh!yes!");
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
//    console.log("\nRetrieving untreated data...");
//    console.log("------------------------------------------");
    return AV.Promise.when(
        _getUnbindData("UserLocation", is_training),
        _getUnbindData("UserMotion", is_training),
        _getUnbindData("UserSound", is_training)
    );
};

exports.completeRawdataBinding = function (location_id_list, motion_id_list, sound_id_list) {
//    console.log("\nMake the corresponding rawdata treated...");
//    console.log("------------------------------------------");
    //console.log("The location id list: \n"+ location_id_list + "\nThe motion id list: \n" + motion_id_list + "\nThe sound id list: \n" + sound_id_list);
    var promises = [];
    location_id_list.forEach(function (id) {
        promises.push(_completeRawdataBinding("UserLocation", id));
    });
    motion_id_list.forEach(function (id) {
        promises.push(_completeRawdataBinding("UserMotion", id));
    });
    sound_id_list.forEach(function (id) {
        promises.push(_completeRawdataBinding("UserSound", id));
    });
    return AV.Promise.all(promises);
};

exports.addSenz = function (user, senz_list, is_training) {
//    console.log("\nAdding new generated senzes to database...");
//    console.log("------------------------------------------");
    var promises = [];
    var user_id = user;
    console.log("NUM OF SENZ IS " + senz_list.length);
    senz_list.forEach(function (senz_tuple) {
        var location_id = senz_tuple["location"]["objectId"],
            motion_id   = senz_tuple["motion"]["objectId"],
            sound_id    = senz_tuple["sound"]["objectId"],
            timestamp   = senz_tuple[config.collector_primary_key]["timestamp"];
        promises.push(_addSenz(user_id, location_id, motion_id, sound_id, timestamp, is_training));
    });
    return AV.Promise.all(promises);
};

exports.getUserRawBehavior = function (user_id, start_time, end_time) {
    var promise = new AV.Promise();
    var user = AV.Object.createWithoutData("_User", user_id);
    var query = new AV.Query(Senz);
    query.equalTo("user", user);
    query.greaterThan("timestamp", start_time);
    query.lessThan("timestamp", end_time);
    query.limit(500);
    query.include("userSound");
    query.include("userLocation");
    query.include("userMotion");
    query.ascending("timestamp");
    query.find().then(
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
            //console.log("  The result is:\n" + JSON.stringify(user_behavior, null, 4));
            promise.resolve(user_behavior);
        },
        function (error_info) {
//            console.log("  Error occurs! " + error_info.code + " " + error_info.message);
            promise.reject(error_info);
        }
    );
    return promise;
};

exports.addBehavior = function (user_id, behavior_data, day_type, senz_id_list, start_time, end_time) {
    var behavior = new Behavior();
    var related_senzes = [];
    senz_id_list.forEach(function (senz_id) {
        related_senzes.push(AV.Object.createWithoutData("UserSenz", senz_id));
    });
    var user_pointer = AV.Object.createWithoutData("_User", user_id);
    var relation = behavior.relation("relatedSenzes");
    //var timestamp = new Date();
    if (behavior_data.length >= 1){
        behavior.set("behaviorData", behavior_data);
        behavior.set("user", user_pointer);
        behavior.set("startTime", start_time);
        behavior.set("endTime", end_time);
        behavior.set("dayType", day_type);
        relation.add(related_senzes);
        return behavior.save();
    }
    else{
        return AV.Promise.error("the behavior is undefine");
    }
};

exports.getUserBehaviorLastUpdateTime = function (user_id, behavior_len) {
    //var promise = new AV.Promise();
    var user = AV.Object.createWithoutData("_User", user_id);
    var query = new AV.Query(UserStatus);
    query.equalTo("user", user);
    query.ascending("behaviorLastUpdatedAt");
    return query.first().then(
        function (result) {
            var timestamp = result.get("behaviorLastUpdatedAt");
            // If you delete the timestamp in db, the query result will be null,
            if (timestamp === null){
//                console.log("The user's last update time is lost!");
                return AV.Promise.error("The user's last update time is lost");
            }
            // Others the result will be undefined, if a new user created.
            else if (timestamp === undefined){
//                console.log("There is a new user created!");
                timestamp = new Date();
            }
            // Tips: null == undefined, but not null === undefined.
//            console.log("The user's last update time is");
            console.log(new Date(timestamp));
            return AV.Promise.as(timestamp);
        },
        function (error) {
            //promise.reject(error_info);
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
//            console.log("New time is:");
//            console.log(new_timestamp);
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
    query.find().then(
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


// DAO for Status API

var getUserSenzStatistics = function (user_id){
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
    var promises = [];
    jobs_list.forEach(function (job){
        var query = new AV.Query(Senz);
        query.equalTo("user", user);
        job.forEach(function (user_status){
            query.exists(user_status);
        });
        promises.push(query.count());
    });
    return AV.Promise.when(promises).then(
        function (s0, s1, s2, s3, s4, s5, s6){
            var result = {
                "integrity": s0,
                "twoFragmentation": s1+s2+s3,
                "oneFragmentation": s4+s5+s6
            };
            return AV.Promise.as(result);
        },
        function (error){
            return AV.Promise.error(error);
        }
    );
};

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

// DAO for Events API

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
    }

    console.log("There is user: " + user_id);

    return query.find().then(
        function (results){
            var latest_events_list = [];
            results.forEach(function (result){
                // Get current user's prediction.
                var prediction = result.get("prediction");
                var probability = {};
                // TODO if prediction is undefine.
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
        job.limit(1000);
        job.find().then(
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
        function(result){// In fact, it is fail function.
            console.log("work is done!");
            return AV.Promise.as(result);
        }
    );
};

