// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var method = require('cloud/method.js');
var dao    = require('cloud/dao.js');
var util   = require('cloud/util.js');

AV.Cloud.define("SenzClusterDebug", function (request, response){
    method.senzCluster();
    response.success("Senz Cluster");
});

dao.getUserRawBehavior('553e0e83e4b06b192e99bf3a', 1429588400035, 1429588400038).then(
    function (behavior_result){
        var behavior = behavior_result['behavior'];
        console.log(behavior.length);
        util.refineUserBehavior(behavior, '');
    }
);