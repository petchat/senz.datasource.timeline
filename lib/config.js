var APP_ENV = process.env.APP_ENV;

var _request_info = {
    "test": {
        "test_url": "http://httpbin.org/post",
        "time_type_url": "http://127.0.0.1:9011/time_type/",
        // Middleware from log to raw senzes.
        "log_rawsenzes": {
            "url": "http://api.trysenz.com/test/middleware/log_rawsenz/",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b000001fbaca010e5a8436d7355e09be7a2d436"
            }
        },
        // Middleware from raw senzes to refined senzes.
        "rawsenzes_refinedsenzes": {
            "url": "http://api.trysenz.com/test/middleware/rawsenz_refinedsenzes/",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b0000010025f1061a8a4a93601be2c05f83d70c"
            }
        },
        // Middleware from prob senzes to multiple senzes.
        "probsenzes_multisenzes": {
            "url": "",
            "headers": {

            }
        },
        // Middleware from userbehavior to event.
        "userbehavior_event": {
            "url": "http://api.trysenz.com/test/users/behavior/classifySingleSeq",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b000001c57cf032454541314bfb83d334fb5579",
                "Content-Type": "application/json; charset=utf-8"
            }
        }
        //"userbehavior_event": {
        //    "url": "https://leancloud.cn/1.1/functions/classifySingleSeq/",
        //    "headers": {
        //        "X-AVOSCloud-Application-Id": "dkc5xdbwprsrh9809kqwopja5ckfbsrpd7dz9a30yugm9tut",
        //        "X-AVOSCloud-Application-Key": "3sy9w8uwlr35xl54lja3rawyf8xjrhofxtvcwzng3blg7q31",
        //        "Content-Type": "application/json; charset=utf-8",
        //        "X-AVOSCloud-Application-Production": 1
        //    }
        //}
    },
    "prod": {
        "test_url": "http://httpbin.org/post",
        "time_type_url": "http://127.0.0.1:9011/time_type/",
        // Middleware from log to raw senzes.
        "log_rawsenzes": {
            "url": "http://api.trysenz.com/middleware/log_rawsenz/",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b000001fbaca010e5a8436d7355e09be7a2d436"
            }
        },
        // Middleware from raw senzes to refined senzes.
        "rawsenzes_refinedsenzes": {
            "url": "http://api.trysenz.com/middleware/rawsenz_refinedsenzes/",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b0000010025f1061a8a4a93601be2c05f83d70c"
            }
        },
        // Middleware from prob senzes to multiple senzes.
        "probsenzes_multisenzes": {
            "url": "",
            "headers": {

            }
        },
        // Middleware from userbehavior to event.
        "userbehavior_event": {
            "url": "http://api.trysenz.com/users/behavior/classifySingleSeq",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b000001828b01282cd1488552efbf7da267cf2f",
                "Content-Type": "application/json; charset=utf-8"
            }
        }
        //"userbehavior_event": {
        //    "url": "https://leancloud.cn/1.1/functions/classifySingleSeq/",
        //    "headers": {
        //        "X-AVOSCloud-Application-Id": "dkc5xdbwprsrh9809kqwopja5ckfbsrpd7dz9a30yugm9tut",
        //        "X-AVOSCloud-Application-Key": "3sy9w8uwlr35xl54lja3rawyf8xjrhofxtvcwzng3blg7q31",
        //        "Content-Type": "application/json; charset=utf-8",
        //        "X-AVOSCloud-Application-Production": 1
        //    }
        //}
    }

};

var _logentries_token = {
    "prod": "17f926e1-b004-4c56-a606-8dd2b9aeab23",
    "test": "b9a59716-9311-4ba8-84a0-3d283fce7e93"
};

// ---- Environment Configuration ----

exports.request_info = _request_info[APP_ENV];

exports.logentries_token = _logentries_token[APP_ENV];

// ---- Basic Configuration ----

exports.counterfeitProb = {
    "motion": {"unknown": 1.0},
    "sound": {"unknown": 1.0},
    "location": {"unknown": 1.0}
};

exports.counterfeitObjectId = "counterfeitObjectId";

exports.collector_primary_key = "location";

// The users who has generated relevent sensor data for past few time
exports.user_list = {
    "UserMotion":   [],
    "UserLocation": [],
    "UserSound":    []
};

exports.logEventType = {
    "sta": "Start",
    "ret": "Retrieving",
    "sav": "Saving",
    "upd": "Updating",
    "r2s": "Middleware.Log.RawSenz",
    "r2r": "Middleware.RawSenz.RefinedSenz",
    "p2m": "Middleware.ProbSenz.MultiSenz",
    "anl": "Analyser.User.Event"
};

console.log("Current APP_ENV is:" + APP_ENV);
console.log("Current Logentries token is:" + _logentries_token[APP_ENV]);
console.log("Current url info is:" + JSON.stringify(_request_info[APP_ENV]));