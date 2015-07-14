/**
 * Created by woodie on 4/24/15.
 */
var AV = require("leanengine");
var req = require("request");
var config = require("./config.js");
var util = require("./util.js");
var _ = require("underscore");
var logger = require("./logger.js");

// For one user.
exports.middlewareLog2RawSenzes = function (data){
    var user = data.user;
    delete data.user;
    // Add request id into http headers
    var request_id = user + "_" + (new Date()).getTime();
    logger.debug(config.logEventType.r2r, "<" + request_id + "> request with user<" + user + ">'s rawdata");
    var _headers = _.extend({"X-request-Id": request_id}, config.request_info["log_rawsenzes"]["headers"]);
    console.log("log to raw's headers: " + JSON.stringify(_headers));
    // Send http request
    var promise = new AV.Promise();
    req.post(
        {
            url:  config.request_info["log_rawsenzes"]["url"],
            headers: _headers,
            json: data
        },
        function (err, httpResponse, body){
            var result = new Object({"user": user, "result": body["result"]});
            promise.resolve(result);
        }
    );
    return promise;
};

exports.middlewareRawSenzes2RefinedSenzes = function (behavior, scale, start_time, end_time){
    //console.log(JSON.stringify(behavior));
    var start_scale_value = util.calculateTimeZone(start_time, scale);
    var end_scale_value = util.calculateTimeZone(end_time, scale);
    // TODO: remove 48
    var data = {
        "scaleType": scale,
        "startScaleValue": start_scale_value,
        "endScaleValue": end_scale_value,
        "senzList": behavior
    };
    // TODO: add user into request id
    // Add request id into http headers
    var request_id = start_time + "_" + end_time + "_" + (new Date()).getTime() + _.random(0, 10000);
    logger.debug(config.logEventType.r2s, "<" + request_id + "> request raw behavior from " + start_time + " to " + end_time);
    var _headers = _.extend({"X-request-Id": request_id}, config.request_info["rawsenzes_refinedsenzes"]["headers"]);
    console.log("raw to refined's headers: " + JSON.stringify(_headers));
    // Send http request
    var promise = new AV.Promise();
    req.post(
        {
            url: config.request_info["rawsenzes_refinedsenzes"]["url"],
            headers: _headers,
            json: data
        },
        function (err, httpResponse, body){
            //console.log(err);
            promise.resolve(body["result"]);
        }
    );
    return promise;
};

exports.timeType = function (start_time, end_time){
    var promise = new AV.Promise();
    req.post(
        {
            url:  config.request_info["time_type_url"],
            json: {"start_time": start_time, "end_time": end_time}
        },
        function (err, httpResponse, body){
            //console.log("Received result successfully.");
            //console.log("The content of result is:\n" + JSON.stringify(body, null, 4));
            var result = new Object({"result": body["result"]});
            promise.resolve(result);
        }
    );
    return promise;
};

exports.middlewareProbSenzes2MultiSenzes = function (prob_senz_list, strategy){
    var data = {
        "probSenzList": prob_senz_list,
        "strategy": strategy
    };
    // Add request id into http headers
    var request_id = (new Date()).getTime() + _.random(0, 10000);
    logger.debug(config.logEventType.p2m, "<" + request_id + ">  request with behavior (probability obj)");
    var _headers = _.extend({"X-request-Id": request_id}, config.request_info["probsenzes_multisenzes"]["headers"]);
    console.log("prob to multi's headers: " + JSON.stringify(_headers));
    // Send http request
    var promise = new AV.Promise();
    req.post(
        {
            url: config.request_info["probsenzes_multisenzes"]["url"],
            headers: config.request_info["probsenzes_multisenzes"]["headers"],
            json: data
        },
        function (err, httpResponse, body) {
            var res = body;
            console.log(res);
            if (_.has(res, "code") && res["code"] == 0) {
                var result = body["result"];
                promise.resolve(result);
            }
            else if (_.has(res, "code") && res["code"] != 0){
                var error = body["message"];
                promise.reject(error);
            }
            else{
                promise.reject("The prob2multi module is crashed. " + err);
            }
        }
    );
    return promise;
};

exports.middlewareUserBehavior2Event = function (algo_type, model_tag, seq){
    var data = {
        "algoType": algo_type,
        "tag": model_tag,
        "seq": seq
    };
    // Add request id into http headers
    var request_id = (new Date()).getTime() + _.random(0, 10000);
    logger.debug(config.logEventType.anl, "<" + request_id + ">  request with users' observation");
    var _headers = _.extend({"X-request-Id": request_id}, config.request_info["userbehavior_event"]["url"]);
    console.log("userbehavior to event's body: " + JSON.stringify(data));
    // Send http request
    var promise = new AV.Promise();
    req.post(
        {
            headers: config.request_info["userbehavior_event"]["headers"],
            url: config.request_info["userbehavior_event"]["url"],
            json: data
        },
        function (err, httpResponse, body) {
            // Here LeanCloud add a result key.
            console.log("received body is:");
            console.log(JSON.stringify(body));
            var res = body;
            //var res = body["result"];
            if (_.has(res, "code") && res["code"] == 0) {
                var result = res["result"];
                //console.log(result);
                promise.resolve(result);
            }
            else if (_.has(res, "code") && res["code"] != 0){
                var error = body["message"];
                promise.reject(error);
            }
            else{
                promise.reject("The predictor is crashed. " + err);
            }
        }
    );
    return promise;
};