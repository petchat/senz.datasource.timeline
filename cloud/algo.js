/**
 * Created by woodie on 4/24/15.
 */
var req = require('request');
var config = require('cloud/config.js');

// Input is a list of senz with the same scale value.
// And it will return a single senz tuple,
// which timestamp is the average of the list of senz, and sensor result is the result of analysing in some strategy.
var refineSenz = function (data){
    var promise = new AV.Promise();
    req.post(
        {
            url: config.url['behavior_collector_url'],
            json: data
        },
        function (err, httpResponse, body){
            console.log('  Received result successfully.');
            //console.log('The content of result is:\n' + JSON.stringify(body, null, 4));
            //var result = body['result'];
            promise.resolve(body['result']);
        }
    );
    return promise;
};

// For one user.
exports.senzCollector = function (data){
    var user = data.user;
    delete data.user;
    console.log('\nFor the user ' + user + '\nSend the http request to Senz Collector with the content of:\n' + JSON.stringify(data, null, 4));
    console.log('------------------------------------------');
    var promise = new AV.Promise();
    req.post(
        {
            url:  config.url['senz_collector_url'],
            json: data
        },
        function (err, httpResponse, body){
            console.log('Received result successfully.');
            console.log('The content of result is:\n' + JSON.stringify(body, null, 4));
            var result = new Object({'user': user, 'result': body['result']});
            promise.resolve(result);
        }
    );
    return promise;
};

// Input is a user's behavior(a list of senz) which every scale is redundant.
// And it will return a new behavior(a list of senz less than the former) which every scale is not more than 1.
exports.behaviorCollector = function (behavior, scale){
    var promises     = new Array();
    //var senz_id_list = new Array();
    var scale_bucket;
    // Initiation of Scale Bucket.
    if (scale == 'tenMinScale'){
        scale_bucket = new Array(24*6);
    }
    else if (scale == 'halfHourScale'){
        scale_bucket = new Array(24*2);
    }
    else if (scale == 'perHourScale'){
        scale_bucket = new Array(24);
    }
    // Initiation of the senz list in any bucket.
    for (var i=0; i<scale_bucket.length; i++){
        scale_bucket[i] = new Array();
    }
    // Push the corresponding senz to the scale_bucket.
    behavior.forEach (function (senz){
        scale_bucket[senz[scale]].push(senz);
        //senz_id_list.push(senz['senzId']);
    });
    //console.log('The following is the scale bucket:');
    //console.log(scale_bucket);
    // Get every new senz tuple at each bucket.
    for (var i in scale_bucket){
        if (scale_bucket[i].length != 0){
            var data = {"scale_type": scale, "scale_value": i, "senz_list": scale_bucket[i]};
            console.log(data);
            promises.push(refineSenz(data));
        }
    }

    return AV.Promise.all(promises);
};

exports.timeType = function (start_time, end_time){
    var promise = new AV.Promise();
    req.post(
        {
            url:  config.url['time_type_url'],
            json: {"start_time": start_time, "end_time": end_time}
        },
        function (err, httpResponse, body){
            console.log('Received result successfully.');
            //console.log('The content of result is:\n' + JSON.stringify(body, null, 4));
            var result = new Object({'result': body['result']});
            promise.resolve(result);
        }
    );
    return promise;
};