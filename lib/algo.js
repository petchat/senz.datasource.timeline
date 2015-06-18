/**
 * Created by woodie on 4/24/15.
 */
var AV = require('leanengine');
var req = require('request');
var config = require('./config.js');
var util = require("./util.js");
var _ = require("underscore");
// Input is a list of senz with the same scale value.
// And it will return a single senz tuple,
// which timestamp is the average of the list of senz, and sensor result is the result of analysing in some strategy.

//var refineSenz = function (data){
//    var promise = new AV.Promise();
//    req.post(
//        {
//            url: config.url['behavior_collector_url'],
//            json: data
//        },
//        function (err, httpResponse, body){
//            //console.log('  Received result successfully.');
//            //console.log('The content of result is:\n' + JSON.stringify(body, null, 4));
//            //var result = body['result'];
//            promise.resolve(body['result']);
//        }
//    );
//    return promise;
//};

// For one user.
exports.senzCollector = function (data){
    var user = data.user;
    delete data.user;
    //console.log('\nFor the user ' + user + '\nSend the http request to Senz Collector with the content of:\n' + JSON.stringify(data, null, 4));
    //console.log('------------------------------------------');
    var promise = new AV.Promise();
    req.post(
        {
            url:  config.url['senz_collector_url'],
            json: data
        },
        function (err, httpResponse, body){
            //console.log('Received result successfully.');
            console.log('The content of result is:\n' + JSON.stringify(body, null, 4));
            var result = new Object({'user': user, 'result': body['result']});
            promise.resolve(result);
        }
    );
    return promise;
};

// Input is a user's behavior(a list of senz) which every scale is redundant.
// And it will return a new behavior(a list of senz less than the former) which every scale is not more than 1.
//exports.behaviorCollector = function (behavior, scale){
//    var promises     = [];
//    //var senz_id_list = [];
//    var scale_bucket;
//    // Initiation of Scale Bucket.
//    if (scale == 'tenMinScale'){
//        scale_bucket = new Array(24*6);
//    }
//    else if (scale == 'halfHourScale'){
//        scale_bucket = new Array(24*2);
//    }
//    else if (scale == 'perHourScale'){
//        scale_bucket = new Array(24);
//    }
//    // Initiation of the senz list in any bucket.
//    for (var i=0; i<scale_bucket.length; i++){
//        scale_bucket[i] = [];
//    }
//    // Push the corresponding senz to the scale_bucket.
//    behavior.forEach (function (senz){
//        scale_bucket[senz[scale]].push(senz);
//        //senz_id_list.push(senz['senzId']);
//    });
//    //console.log('The following is the scale bucket:');
//    //console.log(scale_bucket);
//    // Get every new senz tuple at each bucket.
//    for (var i in scale_bucket){
//        if (scale_bucket[i].length != 0){
//            var data = {"scale_type": scale, "scale_value": i, "senz_list": scale_bucket[i]};
//            //console.log(data);
//            promises.push(refineSenz(data));
//        }
//    }
//
//    return AV.Promise.all(promises);
//};
exports.behaviorCollector = function (behavior, scale, start_time, end_time){
    console.log(JSON.stringify(behavior, null, 4));
    var start_scale_value = util.calculateTimeZone(start_time, scale);
    var end_scale_value = util.calculateTimeZone(end_time, scale);
    // todo: remove 48
    var data = {
        "scaleType": scale,
        "startScaleValue": start_scale_value - 48,
        "endScaleValue": end_scale_value - 48,
        "senzList": behavior
    };
    var promise = new AV.Promise();
    req.post(
        {
            url: config.url['behavior_collector_url'],
            json: data
        },
        function (err, httpResponse, body){
            //console.log('  Received result successfully.');
            //console.log('The content of result is:\n' + JSON.stringify(body, null, 4));
            //var result = body['result'];
            console.log(body["result"]);
            promise.resolve(body['result']);
        }
    );
    return promise;
};

exports.timeType = function (start_time, end_time){
    var promise = new AV.Promise();
    req.post(
        {
            url:  config.url['time_type_url'],
            json: {"start_time": start_time, "end_time": end_time}
        },
        function (err, httpResponse, body){
            //console.log('Received result successfully.');
            //console.log('The content of result is:\n' + JSON.stringify(body, null, 4));
            var result = new Object({'result': body['result']});
            promise.resolve(result);
        }
    );
    return promise;
};

exports.prob2muti = function (prob_senz_list, strategy){
    var data = {
        "probSenzList": prob_senz_list,
        "strategy": strategy
    };
    var promise = new AV.Promise();
    req.post(
        {
            url: config.url["prob_2_muti_url"],
            json: data
        },
        function (err, httpResponse, body) {
            var res = body;
            console.log(res);
            if (_.has(res, "code") && res["code"] == 0) {
                var result = body['result'];
                promise.resolve(result);
            }
            else if (_.has(res, "code") && res["code"] != 0){
                var error = body["message"];
                promise.reject(error);
            }
            else{
                promise.reject("The prob2multi module is crashed.");
            }
        }
    );
    return promise;
};

exports.predict = function (algo_type, model_tag, seq){
    var data = {
        "algoType": algo_type,
        "tag": model_tag,
        "seq": seq
    };
    var promise = new AV.Promise();
    req.post(
        {
            headers: config.url["predict"]["headers"],
            url: config.url["predict"]["url"],
            json: data
        },
        function (err, httpResponse, body) {
            // Here LeanCloud add a result key.
            var res = body["result"];
            if (_.has(res, "code") && res["code"] == 0) {
                var result = body['result'];
                //console.log(result);
                promise.resolve(result);
            }
            else if (_.has(res, "code") && res["code"] != 0){
                var error = body["message"];
                promise.reject(error);
            }
            else{
                promise.reject("The predictor is crashed.");
            }
        }
    );
    return promise;
};