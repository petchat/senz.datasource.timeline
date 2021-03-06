var config = require("./config.js");
//var dao    = require("./dao.js");
var AV     = require("leanengine");
var req    = require("request");
var _      = require("underscore");

// The basic function.
var __notify = function (type, data){
    var promise = new AV.Promise();
//    console.log(config.request_info);
    req.post(
        {
            url: config.request_info["notification"]["url"] + type,
            headers: config.request_info["notification"]["headers"],
            json: data
        },
        function (err, httpResponse, body){
            if (_.has(body, "code") && body["code"] == 1){
                console.log("There is an error occurred.");
                console.log("error message: " + JSON.stringify(body["error"]));
                promise.reject(body["error"]);
            }
            else if (_.has(body, "result")) {
                console.log("Notification was sent successfully: " + JSON.stringify(body["result"]));
                promise.resolve(body["result"]);
            }
            else {
                console.log("There some unknown error occurred. The notification service was crashed.");
                promise.reject("There some unknown error occurred. The notification service was crashed.");
            }
        }
    );
    return promise;
};

// wrapped function for notification.
var _modifyUserConfig = function (user_id, config){
    var type = "notify_new_config",
        data = {
            userId: user_id,
            config: config
        };
    return __notify(type, data);
};

var _modifyUserBatch = function (user_ids, configs){
    var type = "notify_new_config_batch",
        data = {
            userIds: user_ids,
            configs: configs
        };
    return __notify(type, data);
};

var _modifyUserAll = function (configs){
    var type = "notify_all_user_same_config",
        data = {
            configs: configs
        };
    return __notify(type, data);
};

var _notifyUserEvents = function (user_id, result){
    var type = "notify_new_output",
        data = {
            userId: user_id,
            output: result
        };
    return __notify(type, data);
};

exports.notifyUserEvents = function (user_id, result){
    return _notifyUserEvents(user_id, result);
};
