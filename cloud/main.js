// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var method = require('cloud/method.js');

AV.Cloud.define("SenzClusterDebug", function (request, response){
    method.senzCluster();
    response.success("Senz Cluster");
});

