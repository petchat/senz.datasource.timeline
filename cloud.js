// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var method = require("./lib/method.js");
var dao = require("./lib/dao.js");
//var algo = require("./algo.js");
var bp = require("./lib/behavior_process.js");
var serialize_task = require("./lib/serialize_task.js");
var AV = require("leanengine");

AV.Cloud.define("senz", function (request, response) {
    var is_training = request.params.isTraining;

    method.senzGenerator(is_training).then(
        function (bindedSenzes) {
            //response.success("rawsenz generated," + bindedSenzes.length);
            response.success({
                code: 0,
                result: bindedSenzes,
                message: "rawsenz generated."
            })
        },
        function (err) {
            response.error(err);
        });
});

AV.Cloud.define("senzTimer", function (request, response) {

    var is_training = 0;
    console.log("i'm here");
    method.senzGenerator(is_training).then(
        function (bindedSenzes) {
            console.log("fuck i'm done");
            response.success({
                code: 0,
                result: bindedSenzes,
                message: "rawsenz generated."
            });
        },
        function (err) {
            console.log("i've had enough of you!");
            response.error(err);
        });
});

AV.Cloud.define("behavior", function (request, response) {
    var user = request.params.userId,
        start_time = request.params.startTime,
        end_time = request.params.endTime,
        scale = request.params.timeScale,
        is_store = request.params.isStore;

    //method.behaviorGenerator("s", 1429588400035, 1429588400038, "tenMinScale");
    method.behaviorGenerator(user, start_time, end_time, scale, is_store).then(
        function (behavior_refined) {
            response.success({
                code: 0,
                result: behavior_refined,
                message: "behavior generated."
            });
        },
        function (err) {
            response.error(err);
        }
    );
});

AV.Cloud.define("event", function (request, response) {
    var behavior_len = request.params.behaviorLen,
        step = request.params.step,
        scale = request.params.scale,
        user_id = request.params.userId,
        algo_type = request.params.algoType,
        tag = request.params.tag,
        counter_setting = request.params.counterSetting;

    bp.behaviorProcess(behavior_len, step, scale, user_id, algo_type, tag, counter_setting).then(
        function (event_results) {
            response.success({
                code: 0,
                result: event_results,
                message: "All events are generated correctly."
            });
        },
        function (error) {
            response.success({
                code: 0,
                errorEventList: error,
                message: "Part of events are generated but user data is not integrated."
            });
        }
    );
});

//AV.Cloud.define("eventTimerTest", function (request, response) {
//
//    console.log("i"m here,eventTimer");
//    var behavior_len = 30 * 60 * 1000, //
//        step = 5 * 60 * 1000,
//        scale = "tenMinScale",
//        user_id = "555e92e6e4b06e8bb85473ce",
//        algo_type = "GMMHMM",
//        tag = "for_testing",
//        counter_setting = 500;
//
//    bp.behaviorProcess(behavior_len, step, scale, user_id, algo_type, tag, counter_setting).then(
//        function (event_results) {
//            console.log("All new events are generated.");
//            response.success({
//                code: 0,
//                result: event_results,
//                message: "All events are generated correctly."
//            });
//        },
//        function (error) {
//            console.log("There are some event are vacant, but still go on.");
//            response.success({
//                code: 0,
//                errorEventList: error,
//                message: "Part of events are generated but user data is not integrated."
//            });
//
//        }
//    );
//});

//bp.behaviorProcess(600000000, 100000000, "tenMinScale", "553e0e83e4b06b192e99bf3a");

AV.Cloud.define("eventTimer", function (request, response) {

    console.log("i'm here,eventTimerProduction");
    var behavior_len = 30 * 60 * 1000, //
        step = 5 * 60 * 1000,
        scale = "tenMinScale",
        algo_type = "GMMHMM",
        tag = "for_testing",
        counter_setting = 500;

    var work = new serialize_task.SerializeTask();

    var worker = function (user_id, resolve, reject) {
        bp.behaviorProcess(behavior_len, step, scale, user_id, algo_type, tag, counter_setting).then(
            function (event_results) {
                console.log("All new events are generated.");
                resolve(event_results);
            },
            function (error) {
                console.log("There are some event are vacant, but still go on.");
                reject(error);
            }
        );
    };

    dao.getAllUsers().then(
        function (user_id_list){
            console.log("The user list is :");
            console.log(user_id_list);
            user_id_list.forEach(function (user_id){
                work.addTask(user_id);
            });
            work.setWorker(worker);
            return work.begin();
        },
        function (error){
            return AV.Promise.error(error);
        }
    ).then(
        function (task){
            //console.log(task);
            console.log("All work done!");
            response.success({
                code: 0,
                userIdList: task,
                message: "Every users' events are generated correctly."
            });
        },
        function (error){
            response.success({
                code: 0,
                errorEventList: error,
                message: "There is some error occur."
            });
        }
    );
});


var UserLocation = AV.Object.extend("UserLocation");
var UserMotion = AV.Object.extend("UserMotion");
var UserSound = AV.Object.extend("UserSound");

var query_location = new AV.Query(UserLocation);
var query_motion = new AV.Query(UserMotion);
var query_sound = new AV.Query(UserSound);
AV.Cloud.define("clearFlag", function (request, response) {
    query_location.ascending("timestamp");
    query_motion.ascending("timestamp");
    query_sound.ascending("timestamp");

    query_location.find().then(
        function (rawdatas) {
            console.log("Query Location:");
            var timestamp_location = [];
            var promises = [];
            rawdatas.forEach(function (rawdata) {
                var timestamp = rawdata.get("timestamp");
                rawdata.set("processStatus", "untreated");
                timestamp_location.push(timestamp);
                promises.push(rawdata.save());
            });
            console.log("timestamp list:\n" + timestamp_location);
            return AV.Promise.all(promises);
        },
        function (error) {
            return AV.Promise.error(error);
        }
    ).then(
        function () {
            return query_motion.find();
        },
        function (error) {
            return AV.Promise.error(error);
        }
    ).then(
        function (rawdatas) {
            console.log("Query Motion:");
            var timestamp_motion = [];
            var promises = [];
            rawdatas.forEach(function (rawdata) {
                var timestamp = rawdata.get("timestamp");
                rawdata.set("processStatus", "untreated");
                timestamp_location.push(timestamp);
                promises.push(rawdata.save());
            });
            console.log("timestamp list:\n" + timestamp_motion);
            return AV.Promise.all(promises);
        },
        function (error) {
            return AV.Promise.error(error);
        }
    ).then(
        function () {
            return query_sound.find();
        },
        function (error) {
            return AV.Promise.error(error);
        }
    ).then(
        function (rawdatas) {
            console.log("Query Sound:");
            var timestamp_sound = [];
            var promises = [];
            rawdatas.forEach(function (rawdata) {
                var timestamp = rawdata.get("timestamp");
                rawdata.set("processStatus", "untreated");
                timestamp_location.push(timestamp);
                promises.push(rawdata.save());
            });
            console.log("timestamp list:\n" + timestamp_sound);
            return AV.Promise.all(promises);
        },
        function (error) {
            return AV.Promise.error(error);
        }
    );
});
module.exports = AV.Cloud;