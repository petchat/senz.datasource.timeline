/**
 * Created by woodie on 4/26/15.
 */

exports.collector_primary_key = 'location';
// The users who has generated relevent sensor data for past few time
exports.user_list = {
    'UserMotion':   new Array(),
    'UserLocation': new Array(),
    'UserSound':    new Array()
};
// The request url
exports.url = {
    'test_url': 'http://httpbin.org/post',
    //'local_debug_url': 'http://127.0.0.1:9009/collector/',
    'senz_collector_url': 'http://120.27.30.239:9123/',
    //'behavior_collector_url': 'http://120.27.30.239:9122/behavior_collector/',
    'behavior_collector_url': 'http://127.0.0.1:9010/behavior_collector/',
    'time_type_url': 'http://127.0.0.1:9011/time_type/',
    'analyser_url': ''
};