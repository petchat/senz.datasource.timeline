// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var method = require('cloud/method.js');
var dao    = require('cloud/dao.js');
var algo   = require('cloud/algo.js');

AV.Cloud.define('SenzGeneratorDebug', function (request, response){
    method.senzGenerator(0);
    response.success('Senz Generator');
});

AV.Cloud.define('BehaviorGenerator', function (request, response){
    user       = request.params.user_id;
    start_time = request.params.start_time;
    end_time   = request.params.end_time;
    scale      = request.params.time_scale;
    console.log(user);
    console.log(start_time);
    console.log(end_time);
    console.log(scale);
    //method.behaviorGenerator('s', 1429588400035, 1429588400038, 'tenMinScale');
    method.behaviorGenerator(user, start_time, end_time, scale, false).then(
        function (behavior_refined){
            response.success(behavior_refined);
        }
    );
    //response.success('Behavior Generator');
});

//'553e0e83e4b06b192e99bf3a', 1429588400035, 1429588400038
