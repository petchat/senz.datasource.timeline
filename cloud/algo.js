/**
 * Created by woodie on 4/24/15.
 */
var req = require('request');

var config = {
    'test_url': 'http://httpbin.org/post',
    'local_debug_url': 'http://127.0.0.1:9009/',
    'collector_url': '',
    'analyser_url': ''
};

exports.senzCollector = function(data){
    console.log('\nSend the http request to Senz Collector with the content of:\n' + JSON.stringify(data, null, 4));
    var promise = new AV.Promise();
    req.post(
        {
            url:  config['local_debug_url'],
            json: data
        },
        function(err, httpResponse, body){
            console.log('Received result successfully.');
            console.log('The content of result is:\n' + JSON.stringify(body, null, 4));
            promise.resolve(body['result']);
    });
    return promise;
};


