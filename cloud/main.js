// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var method = require("cloud/method.js");
var dao = require("cloud/dao.js");
var algo = require("cloud/algo.js");
var bp = require("cloud/behavior_process.js");

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
    
    var is_training = 1;
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
        function (err){
            response.error(err);
        }
    );
});

AV.Cloud.define("event", function (request, response) {
    var behavior_len = request.params.behaviorLen,
        step = request.params.step,
        scale = request.params.scale,
        user_id = request.params.userId;

    bp.behaviorProcess(behavior_len, step, scale, user_id).then(
        function (event_results){
            response.success({
                code: 0,
                result: event_results,
                message: "All events are generated correctly."
            });
        },
        function (error){
            response.success({
                code: 0,
                errorEventList: error,
                message: "Part of events are generated but user data is not integrated."
            });
        }
    );
});

AV.Cloud.define("eventTimer", function (request, response) {
    
    console.log("i'm here,eventTimer");
    var behavior_len = 3600*1000, //
        step = 5*60*1000, //
        scale = "tenMinScale",
        user_id = "555e92e6e4b06e8bb85473ce";

    bp.behaviorProcess(behavior_len, step, scale, user_id).then(
        function (event_results){
            console.log("All new events are generated.");
            response.success({
                code: 0,
                result: event_results,
                message: "All events are generated correctly."
            });

        },
        function (error){
            console.log("There are some event are vacant, but still go on.");
            response.success({
                code: 0,
                errorEventList: error,
                message: "Part of events are generated but user data is not integrated."
            });

        }
    );
});

AV.Cloud.define("malegebazi", function (request, response) {
    console.log("malegebazi!!!");
});

//bp.behaviorProcess(600000000, 100000000, "tenMinScale", "553e0e83e4b06b192e99bf3a");

