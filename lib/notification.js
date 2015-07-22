var config = require("./lib/config.js");
var dao    = require("./lib/dao.js");
var AV     = require("leanengine");
var req    = require("request");
var _      = require("underscore");

// The basic function.
var __notify = function (type, data){
    var promise = new AV.Promise();
    req.post(
        {
            url: config.request_info["notification"]["url"] + type,
            headers: config.request_info["notification"]["headers"],
            json: data
        },
        function (err, httpResponse, body){
            //console.log(err);
            promise.resolve(body["result"]);
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

var _nofityUserResult = function (user_id, result){
    var type = "notify_new_output",
        data = {
            userId: user_id,
            output: result
        };
    return __notify(type, data);
};

