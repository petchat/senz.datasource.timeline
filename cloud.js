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

//AV.Cloud.define("behavior", function (request, response) {
//    var user = request.params.userId,
//        start_time = request.params.startTime,
//        end_time = request.params.endTime,
//        scale = request.params.timeScale,
//        is_store = request.params.isStore;
//
//    method.behaviorGenerator(user, start_time, end_time, scale, is_store).then(
//        function (behavior_refined) {
//            response.success({
//                code: 0,
//                result: behavior_refined,
//                message: "behavior generated."
//            });
//        },
//        function (err) {
//            response.error(err);
//        }
//    );
//});

AV.Cloud.define("behavior", function (request, response){
    var user_id    = request.params.userId,
        start_time = request.params.startTime,
        end_time   = request.params.endTime,
        scale      = request.params.timeScale;

    bp.behaviorExtract(user_id, start_time, end_time, scale).then(
        function (behavior){
            response.success({
                code: 0,
                result: behavior
            });
        },
        function (error){
            response.error({
                code: 1,
                message: error
            });
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

AV.Cloud.define("eventTimer", function (request, response) {
    var behavior_len = 30 * 60 * 1000, //
        step = 10 * 60 * 1000,
        scale = "tenMinScale",
        algo_type = "GMMHMM",
        tag = "randomTrain",
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
            console.log("All work done!");
            response.success({
                code: 0,
                userIdList: task,
                message: "Every users' events are generated correctly."
            });
        },
        function (error){
            response.error({
                code: 1,
                errorEventList: error,
                message: "There is some error occur."
            });
        }
    );
});

AV.Cloud.define("clearFlag", function (request, response) {
    var start_time = request.params.startTime;
    var end_time   = request.params.endTime;

    dao.clearFlag(start_time, end_time).then(
        function (){
            response.success({
                code: 0,
                message: "set flag from SENZED to UNTREATED."
            });
        },
        function (error){
            response.error(error);
        }
    );
});

module.exports = AV.Cloud;