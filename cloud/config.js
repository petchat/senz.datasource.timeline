/**
 * Created by woodie on 4/26/15.
 */
exports.counterfeitProb = {
    'motion': {'unknown': 1.0},
    'sound': {'unknown': 1.0},
    'location': {'unknown': 1.0}
};

exports.counterfeitObjectId = "counterfeitObjectId";

exports.collector_primary_key = 'location';
// The users who has generated relevent sensor data for past few time
exports.user_list = {
    'UserMotion':   [],
    'UserLocation': [],
    'UserSound':    []
};
// The request url
exports.url = {
    'test_url': 'http://httpbin.org/post',
    'senz_collector_url': 'http://120.27.30.239:9046/',
    //'senz_collector_url': 'http://127.0.0.1:9009/',
    'behavior_collector_url': 'http://120.27.30.239:9045/behavior_collector/',
    //'behavior_collector_url': 'http://127.0.0.1:9010/behavior_collector/',
    'time_type_url': 'http://127.0.0.1:9011/time_type/',
    'analyser_url': ''
};