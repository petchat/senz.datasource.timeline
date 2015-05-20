// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var method = require('cloud/method.js');
var dao = require('cloud/dao.js');
var algo = require('cloud/algo.js');

AV.Cloud.define('senzGeneratorDebug', function (request, response) {
    method.senzGenerator(1)
        .then(function (bindedSenzes) {
            //response.success('rawsenz generated,' + bindedSenzes.length);
            response.success({
                code: 0,
                result: bindedSenzes,
                message: 'rawsenz generated.'
            })
        }, function (err) {
            response.error(err);
        });
});

AV.Cloud.define('timeline', function (request, response) {
    var user = request.params.userId,
        start_time = request.params.startTime,
        end_time = request.params.endTime,
        scale = request.params.timeScale;

    console.log(user);
    console.log(start_time);
    console.log(end_time);
    console.log(scale);
    //method.behaviorGenerator('s', 1429588400035, 1429588400038, 'tenMinScale');
    method.behaviorGenerator(user, start_time, end_time, scale, true).then(
        function (behavior_refined) {
            response.success({
                code: 0,
                result: behavior_refined,
                message: 'behavior generated.'
            });
        }
        // TODO error handler
    );
});

//'553e0e83e4b06b192e99bf3a', 1429588400035, 1429588400038
