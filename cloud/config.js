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
    'local_debug_url': 'http://127.0.0.1:9009/',
    'collector_url': '',
    'analyser_url': ''
};