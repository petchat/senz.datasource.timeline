// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var method = require('cloud/method.js');
var dao = require('cloud/dao.js');
var algo = require('cloud/algo.js');
var bp = require("cloud/behavior_process.js");

AV.Cloud.define('senz', function (request, response) {
    var is_training = request.params.isTraining;

    method.senzGenerator(is_training).then(
        function (bindedSenzes) {
            //response.success('rawsenz generated,' + bindedSenzes.length);
            response.success({
                code: 0,
                result: bindedSenzes,
                message: 'rawsenz generated.'
            })
        },
        function (err) {
            response.error(err);
        });
});

AV.Cloud.define('behavior', function (request, response) {
    var user = request.params.userId,
        start_time = request.params.startTime,
        end_time = request.params.endTime,
        scale = request.params.timeScale,
        is_store = request.params.isStore;

    //method.behaviorGenerator('s', 1429588400035, 1429588400038, 'tenMinScale');
    method.behaviorGenerator(user, start_time, end_time, scale, is_store).then(
        function (behavior_refined) {
            response.success({
                code: 0,
                result: behavior_refined,
                message: 'behavior generated.'
            });
        },
        function (err){
            response.error(err);
        }
    );
});

//'553e0e83e4b06b192e99bf3a', 1429588400035, 1429588400038
//dao.getUserBehaviorLastUpdateTime("553e0e83e4b06b192e99bf3a");

//var date = new Date();
//dao.updateUserBehaviorLastUpdatedTime("553e0e83e4b06b192e99bf3a", date);
//bp.behaviorProcess(600000000, 100000000, "tenMinScale", "553e0e83e4b06b192e99bf3a");
var senz_list = [{"prob":-9.143328097411052,"location":"scenic_spot","motion":"driving","sound":"kitchen"},{"prob":-9.143328097411052,"location":"residence","motion":"sitting","sound":"kitchen"}];
algo.predict("GMMHMM", "random_generated_base_model", senz_list).then(function (res){
    console.log(res);
});