/**
 * Created by woodie on 4/24/15.
 */
var req = require('request');
var config = require('cloud/config.js');


exports.senzCollector = function (data){
    var user = data.user;
    delete data.user;
    console.log('\nFor the user ' + user + '\nSend the http request to Senz Collector with the content of:\n' + JSON.stringify(data, null, 4));
    console.log('------------------------------------------');
    var promise = new AV.Promise();
    req.post(
        {
            url:  config.url['local_debug_url'],
            json: data
        },
        function(err, httpResponse, body){
            console.log('Received result successfully.');
            console.log('The content of result is:\n' + JSON.stringify(body, null, 4));
            var result = new Object({'user': user, 'result': body['result']});
            promise.resolve(result);
    });
    return promise;
};




