var APP_ENV = process.env.APP_ENV;

var _url = {
    "test": {
        "test_url": "http://httpbin.org/post",
        "senz_collector_url": "http://127.0.0.1:9009/",
        "behavior_collector_url": "http://127.0.0.1:9010/behavior_collector/",
        "time_type_url": "http://127.0.0.1:9011/time_type/",
        "prob_2_muti_url": "http://127.0.0.1:5000/senzlist/prob2muti/",
//        "prob_2_muti_url": "http://120.27.30.239:9044/senzlist/prob2muti/",
        "predict": {
            "url": "https://leancloud.cn/1.1/functions/classifySingleSeq/",
            "headers": {
                "X-AVOSCloud-Application-Id": "dkc5xdbwprsrh9809kqwopja5ckfbsrpd7dz9a30yugm9tut",
                "X-AVOSCloud-Application-Key": "3sy9w8uwlr35xl54lja3rawyf8xjrhofxtvcwzng3blg7q31",
                "Content-Type": "application/json; charset=utf-8",
                "X-AVOSCloud-Application-Production": 1
            }
        }
    },
    "prod": {
        "test_url": "http://httpbin.org/post",
        "senz_collector_url": "http://127.0.0.1:9009/",
        "behavior_collector_url": "http://127.0.0.1:9010/behavior_collector/",
        "time_type_url": "http://127.0.0.1:9011/time_type/",
        "prob_2_muti_url": "http://127.0.0.1:5000/senzlist/prob2muti/",
        "predict": {
            "url": "https://leancloud.cn/1.1/functions/classifySingleSeq/",
            "headers": {
                "X-AVOSCloud-Application-Id": "dkc5xdbwprsrh9809kqwopja5ckfbsrpd7dz9a30yugm9tut",
                "X-AVOSCloud-Application-Key": "3sy9w8uwlr35xl54lja3rawyf8xjrhofxtvcwzng3blg7q31",
                "Content-Type": "application/json; charset=utf-8",
                "X-AVOSCloud-Application-Production": 1
            }
        }
    }

};

var _logentries_token = {
    "prod": "17f926e1-b004-4c56-a606-8dd2b9aeab23",
    "test": "b9a59716-9311-4ba8-84a0-3d283fce7e93"
};

// ---- Environment Configuration ----

exports.url = _url[APP_ENV];

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
console.log("Current url info is:" + JSON.stringify(_url[APP_ENV]));