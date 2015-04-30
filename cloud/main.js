// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var method = require('cloud/method.js');
var dao    = require('cloud/dao.js');
var algo   = require('cloud/algo.js');

AV.Cloud.define('SenzGeneratorDebug', function (request, response){
    method.senzGenerator(0);
    response.success('Senz Generator');
});

AV.Cloud.define('BehaviorGeneratorDebug', function (request, response){
    method.behaviorGenerator('553e0e83e4b06b192e99bf3a', 1429588400035, 1429588400038, 'tenMinScale');
    response.success('Behavior Generator');
});

//'553e0e83e4b06b192e99bf3a', 1429588400035, 1429588400038