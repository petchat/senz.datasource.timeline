//var sp             = require("./lib/senz_process.js");
//var dao            = require("./lib/dao.js");
//var bp             = require("./lib/behavior_process.js");
//var serialize_task = require("./lib/serialize_task.js");
var notification   = require("./lib/notification.js");
//var ep             = require("./lib/event_process.js");
var AV             = require("leanengine");
var logger         = require("./lib/logger.js");
var config         = require("./lib/config.js");
var strategy       = require("./lib/strategy.js");
var _              = require("underscore");

//AV.Cloud.define("senz", function (request, response) {
//    var is_training = request.params.isTraining;
//
//    sp.senzGenerator(is_training).then(
//        function (bindedSenzes) {
//            //response.success("rawsenz generated," + bindedSenzes.length);
//            response.success({
//                code: 0,
//                result: bindedSenzes,
//                message: "rawsenz generated."
//            });
//        },
//        function (err) {
//            response.error(err);
//        });
//});

//AV.Cloud.define("senzTimer", function (request, response) {
//
//    var is_training = 0;
//    console.log("i'm here");
//    sp.senzGenerator(is_training).then(
//        function (bindedSenzes) {
//            console.log("fuck i'm done");
//            response.success({
//                code: 0,
//                result: bindedSenzes,
//                message: "rawsenz generated."
//            });
//        },
//        function (err) {
//            console.log("i've had enough of you!");
//            response.error(err);
//        });
//});

//AV.Cloud.define("behavior", function (request, response){
//    var user_id    = request.params.userId,
//        start_time = request.params.startTime,
//        end_time   = request.params.endTime,
//        scale      = request.params.timeScale;
//
//    bp.behaviorExtract(user_id, start_time, end_time, scale).then(
//        function (behavior){
//            response.success({
//                code: 0,
//                result: behavior
//            });
//        },
//        function (error){
//            response.error({
//                code: 1,
//                message: error
//            });
//        }
//    );
//});

//AV.Cloud.define("event", function (request, response) {
//    var behavior_len = request.params.behaviorLen,
//        step = request.params.step,
//        scale = request.params.scale,
//        user_id = request.params.userId,
//        algo_type = request.params.algoType,
//        tag = request.params.tag,
//        counter_setting = request.params.counterSetting;
//
//    bp.behaviorProcess(behavior_len, step, scale, user_id, algo_type, tag, counter_setting).then(
//        function (event_results) {
//            response.success({
//                code: 0,
//                result: event_results,
//                message: "All events are generated correctly."
//            });
//        },
//        function (error) {
//            response.success({
//                code: 0,
//                errorEventList: error,
//                message: "Part of events are generated but user data is not integrated."
//            });
//        }
//    );
//});

//AV.Cloud.define("behaviorTimer", function (request, response) {
////    var behavior_len = 90 * 60 * 1000,
////        step = 10 * 60 * 1000,
////        scale = "tenMinScale",
////        algo_type = "GMMHMM",
////        tag = "randomTrain",
////        counter_setting = 500;
//    var behavior_len = request.params.behaviorLen,
//        step         = request.params.step,
//        scale        = request.params.scale,
//        algo_type    = request.params.algoType,
//        tag          = request.params.tag,
//        counter_setting = 500;
//
//    var work = new serialize_task.SerializeTask();
//
//    var worker = function (user_id, resolve, reject) {
//        bp.behaviorProcess(behavior_len, step, scale, user_id, algo_type, tag, counter_setting).then(
//            function (event_results) {
//                console.log("All new events are generated.");
//                resolve(event_results);
//            },
//            function (error) {
//                console.log("There are some event are vacant, but still go on.");
//                reject(error);
//            }
//        );
//    };
//
//    dao.getAllUsers().then(
//        function (user_id_list){
//            console.log("The user list is :");
//            console.log(user_id_list);
//            user_id_list.forEach(function (user_id){
//                work.addTask(user_id);
//            });
//            work.setWorker(worker);
//            return work.begin();
//        },
//        function (error){
//            return AV.Promise.error(error);
//        }
//    ).then(
//        function (task){
//            console.log("All work done!");
//            response.success({
//                code: 0,
//                userIdList: task,
//                message: "Every users' events are generated correctly."
//            });
//        },
//        function (error){
//            response.error({
//                code: 1,
//                errorEventList: error,
//                message: "There is some error occur."
//            });
//        }
//    );
//});
//
//AV.Cloud.define("eventTimer", function (request, response){
//    var start_time = request.params.startTime;
//    var end_time   = request.params.endTime;
//
//    var work = new serialize_task.SerializeTask();
//
//    var worker = function (user_id, resolve, reject) {
//        console.log("Start processing user: " + user_id);
//        // Every time compute user's events from start_time to end_time.
//        // It would remove the events during this interval time in db first.
//        dao.removeEvents(user_id, start_time, end_time).then(
//            function (){
//                return ep.eventProcess(user_id, start_time, end_time);
//            },
//            function (error){
//                return AV.Promise.error(error);
//            }
//        ).then(
//            function (){
//                resolve();
//            },
//            function (){
//                reject();
//            }
//        );
//    };
//
//    dao.getAllUsers().then(
//        function (user_id_list){
//            console.log("The user list is :");
//            console.log(user_id_list);
//            user_id_list.forEach(function (user_id){
//                work.addTask(user_id);
//            });
//            work.setWorker(worker);
//            return work.begin();
//        },
//        function (error){
//            return AV.Promise.error(error);
//        }
//    ).then(
//        function (task){
//            console.log("All work done!");
//            response.success({
//                code: 0,
//                userIdList: task,
//                message: "Every users' events are generated correctly."
//            });
//        },
//        function (error){
//            response.error({
//                code: 1,
//                message: "There is some error occur: " + error
//            });
//        }
//    );
//});

var post_wilddog_config = function(user_id, config){
    var req = require('request');
    req.post({url: "https://leancloud.cn/1.1/functions/notify_new_config",
            headers: {"X-LC-Id": "wsbz6p3ouef94ubvsdqk2jfty769wkyed3qsry5hebi2va2h",
                "X-LC-Key": "6z6n0w3dopxmt32oi2eam2dt0orh8rxnqc8lgpf2hqnar4tr"},
            json: {"userId": user_id, "config": config}},
        function(err, res, body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                logger.info(JSON.stringify(err.message));
            }
            else{
                var body_str = JSON.stringify(body);
                logger.info(JSON.stringify(body_str));
                logger.info("saving to dashboard\n");
            }
        });
};

var get_post_wilddog_config = function(situation, sub_situtation, user_id, threshold){
    var wd_strategy = strategy['wilddog_strategy'];
    var level = "l2";

    console.log('userid: ' + user_id + ' ' + sub_situtation);
    if(wd_strategy[situation] && wd_strategy[situation][sub_situtation]){
        level = wd_strategy[situation][sub_situtation];
    }

    console.log('level: ' + level);
    post_wilddog_config(user_id, config['wilddog_config_' + level]);
    setTimeout(function(){
        console.log('Timeout!!!');
        post_wilddog_config(user_id, config['wilddog_config_' + 'l2']);
    }, threshold*1000);
};

AV.Cloud.afterSave('UserLocation', function(request) {
    var data = {};
    data['objectId'] = request.object.id;
    data['user_id'] = request.object._serverData.user.id;
    data['userRawdataId'] = request.object._serverData.userRawdataId;
    data['isTrainingSample'] = request.object._serverData.isTrainingSample;
    data['city'] = request.object._serverData.city;
    data['synced'] = request.object._serverData.synced;
    data['source'] = request.object._serverData.source || '';
    data['radius'] = request.object._serverData.radius;
    data['street'] = request.object._serverData.street;
    data['timestamp'] = request.object._serverData.timestamp;
    data['province'] = request.object._serverData.province;
    data['processStatus'] = request.object._serverData.processStatus;
    data['street_number'] = request.object._serverData.street_number;
    data['district'] = request.object._serverData.district;
    data['nation'] = request.object._serverData.nation;
    data['poiProbLv2'] = request.object._serverData.poiProbLv2;
    data['poiProbLv1'] = request.object._serverData.poiProbLv1;
    data['pois'] = JSON.parse(request.object._hashedJSON.pois);
    data['location'] = {'lat': request.object._serverData.location._latitude, 
                        'lng': request.object._serverData.location._longitude};
    data['senzedAt'] = request.object.senzedAt;
    data['createdAt'] = request.object.createdAt;
    data['updatedAt'] = request.object.updatedAt;

    var req = require('request');
    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline", 
              headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
                        "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"}, 
              json: {'name': 'UserLocation', 'obj': request.object}},
            function(err, res, body){
                if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                    logger.info(JSON.stringify(err.message));
                }
                else{
                    var body_str = JSON.stringify(body);
                    logger.info(JSON.stringify(body_str));
                    logger.info("saving to dashboard\n");
                }
            });
    req.post({url:"http://119.254.111.40:3000/api/UserLocations", json: data},
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                logger.info(JSON.stringify(err.message));
            }
            else{
                var body_str = JSON.stringify(body);
                logger.info(JSON.stringify(body_str));
                logger.info("fuck \n");
            }
    });
});

AV.Cloud.afterSave('UserMotion', function(request) {
    var data = {};
    data['objectId'] = request.object.id;
    data['user_id'] = request.object._serverData.user.id;
    data['userRawdataId'] = request.object._serverData.userRawdataId;
    data['type'] = request.object._serverData.type || '';
    data['isTrainingSample'] = request.object._serverData.isTrainingSample;
    data['timestamp'] = request.object._serverData.timestamp;
    data['processStatus'] = request.object._serverData.processStatus;
    data['rawInfo'] = JSON.parse(request.object._hashedJSON.rawInfo || '{}');
    data['sensor_data'] = JSON.parse(request.object._hashedJSON.sensor_data || '{}');
    data['motionProb'] = request.object._serverData.motionProb;
    data['senzedAt'] = request.object.senzedAt;
    data['createdAt'] = request.object.createdAt;
    data['updatedAt'] = request.object.updatedAt;

    var motionProb = request.object._serverData.motionProb;
    var motion = _.keys(motionProb).sort(function(a, b){return motionProb[a] < motionProb[b] ? 1 : -1})[0];
    get_post_wilddog_config('motion', motion, request.object._serverData.user.id, 10);

    var req = require('request');
    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline", 
              headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
                        "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"}, 
              json: {'name': 'UserMotion', 'obj': request.object}},
            function(err, res, body){
                if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                    logger.info(JSON.stringify(err.message));
                }
                else{
                    var body_str = JSON.stringify(body);
                    logger.info(JSON.stringify(body_str));
                    logger.info("saving to dashboard\n");
                }
            });
    req.post({url:"http://119.254.111.40:3000/api/UserMotions", json: data},
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                logger.info(JSON.stringify(err.message));
            }
            else{
                var body_str = JSON.stringify(body);
                logger.info(JSON.stringify(body_str));
                logger.info("fuck \n");
            }
        });
});

AV.Cloud.afterSave('UserInfoLog', function(request){
    var data = {};
    data['objectId'] = request.object.id;
    data['user_id'] = request.object._serverData.user.id;
    data['userRawdataId'] = request.object._serverData.userRawdataId;
    data['timestamp'] = request.object._serverData.timestamp;
    data['staticInfo'] = request.object._serverData.staticInfo;
    data['applist'] = request.object._serverData.applist;
    data['createdAt'] = request.object.createdAt;
    data['updatedAt'] = request.object.updatedAt;

    var req = require('request');
    req.post({url:"http://119.254.111.40:3000/api/UserStaticInfos", json: data},
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                logger.info(JSON.stringify(err.message));
            }
            else{
                var body_str = JSON.stringify(body);
                logger.info(JSON.stringify(body_str));
                logger.info("fuck \n");
            }
        });
    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline", 
              headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
                        "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"}, 
              json: {'name': 'UserInfoLog', 'obj': request.object}},
            function(err, res, body){
                if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                    logger.info(JSON.stringify(err.message));
                }
                else{
                    var body_str = JSON.stringify(body);
                    logger.info(JSON.stringify(body_str));
                    logger.info("saving to dashboard\n");
                }
            });
});

AV.Cloud.afterSave('UPoiVisitLog', function(request) {
    var req = require('request');
    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline", 
              headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
                        "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"}, 
              json: {'name': 'UPoiVisitLog', 'obj': request.object}},
            function(err, res, body){
                if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                    logger.info(JSON.stringify(err.message));
                }
                else{
                    var body_str = JSON.stringify(body);
                    logger.info(JSON.stringify(body_str));
                    logger.info("saving to dashboard\n");
                }
            });
});

AV.Cloud.afterSave('UserEvent', function(request) {
    var req = require('request');
    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline", 
              headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
                        "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"}, 
              json: {'name': 'UserEvent', 'obj': request.object}},
            function(err, res, body){
                if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                    logger.info(JSON.stringify(err.message));
                }
                else{
                    var body_str = JSON.stringify(body);
                    logger.info(JSON.stringify(body_str));
                    logger.info("saving to dashboard\n");
                }
            });
});

AV.Cloud.afterSave('UserActivity', function(request) {
    var req = require('request');
    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline", 
              headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
                        "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"}, 
              json: {'name': 'UserActivity', 'obj': request.object}},
            function(err, res, body){
                if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                    logger.info(JSON.stringify(err.message));
                }
                else{
                    var body_str = JSON.stringify(body);
                    logger.info(JSON.stringify(body_str));
                    logger.info("saving to dashboard\n");
                }
            });
});

AV.Cloud.afterSave('UserCalendar', function(request) {
    var data = {};
    data['objectId'] = request.object.id;
    data['user_id'] = request.object._serverData.user.id;
    data['type'] = request.object._serverData.type;
    data['userRawdataId'] = request.object._serverData.userRawdataId;
    data['timestamp'] = request.object._serverData.timestamp;
    data['calendarInfo'] = JSON.parse(request.object._hashedJSON.calendarInfo);
    data['createdAt'] = request.object.createdAt;
    data['updatedAt'] = request.object.updatedAt;
    var req = require('request');
    req.post({url:"http://119.254.111.40:3000/api/UserCalendars", json: data},
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                logger.info(JSON.stringify(err.message));
            }
            else{
                var body_str = JSON.stringify(body);
                logger.info(JSON.stringify(body_str));
                logger.info("fuck \n");
            }
        });
});

AV.Cloud.afterSave('Test', function(request) {
    console.log(request.object);
    console.log("@@@@@@@@@@@@@@");
    var data = {};
    data['createdAt'] = request.object.createdAt;
    data['updatedAt'] = request.object.updatedAt;
    data['mageia'] = request.object.attributes.mageia;

    console.log(data);
    var req = require('request');
    req.post('http://119.254.111.40:3000/api/ForTests').form(request.object);
});

module.exports = AV.Cloud;
