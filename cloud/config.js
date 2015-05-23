/**
 * Created by woodie on 4/26/15.
 */
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
// The request url
exports.url = {
    "test_url": "http://httpbin.org/post",
    "senz_collector_url": "http://120.27.30.239:9046/",
    //"senz_collector_url": "http://127.0.0.1:9009/",
    "behavior_collector_url": "http://120.27.30.239:9045/behavior_collector/",
    //"behavior_collector_url": "http://127.0.0.1:9010/behavior_collector/",
    "time_type_url": "http://127.0.0.1:9011/time_type/",
    "analyser_url": "",
    "prob_2_muti_url" : "http://120.27.30.239:9044/senzlist/prob2muti/",
    "predict": {
        "url": "https://leancloud.cn/1.1/functions/classifySingleSeq/",
        "header": {
            "X-AVOSCloud-Application-Id"  : "dkc5xdbwprsrh9809kqwopja5ckfbsrpd7dz9a30yugm9tut",
            "X-AVOSCloud-Application-Key" : "3sy9w8uwlr35xl54lja3rawyf8xjrhofxtvcwzng3blg7q31",
            "Content-Type": "application/json; charset=utf-8",
            "X-AVOSCloud-Application-Production": 1
        }
    }
};