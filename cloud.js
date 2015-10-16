var sp             = require("./lib/senz_process.js");
var dao            = require("./lib/dao.js");
var bp             = require("./lib/behavior_process.js");
var serialize_task = require("./lib/serialize_task.js");
var notification   = require("./lib/notification.js");
var ep             = require("./lib/event_process.js");
var AV             = require("leanengine");
var logger         = require("./lib/logger.js");
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

AV.Cloud.define("senzTimer", function (request, response) {

    var is_training = 0;
    console.log("i'm here");
    sp.senzGenerator(is_training).then(
        function (bindedSenzes) {
            console.log("fuck i'm done");
            response.success({
                code: 0,
                result: bindedSenzes,
                message: "rawsenz generated."
            });
        },
        function (err) {
            console.log("i've had enough of you!");
            response.error(err);
        });
});

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

AV.Cloud.define("behaviorTimer", function (request, response) {
//    var behavior_len = 90 * 60 * 1000,
//        step = 10 * 60 * 1000,
//        scale = "tenMinScale",
//        algo_type = "GMMHMM",
//        tag = "randomTrain",
//        counter_setting = 500;
    var behavior_len = request.params.behaviorLen,
        step         = request.params.step,
        scale        = request.params.scale,
        algo_type    = request.params.algoType,
        tag          = request.params.tag,
        counter_setting = 500;

    var work = new serialize_task.SerializeTask();

    var worker = function (user_id, resolve, reject) {
        bp.behaviorProcess(behavior_len, step, scale, user_id, algo_type, tag, counter_setting).then(
            function (event_results) {
                console.log("All new events are generated.");
                resolve(event_results);
            },
            function (error) {
                console.log("There are some event are vacant, but still go on.");
                reject(error);
            }
        );
    };

    dao.getAllUsers().then(
        function (user_id_list){
            console.log("The user list is :");
            console.log(user_id_list);
            user_id_list.forEach(function (user_id){
                work.addTask(user_id);
            });
            work.setWorker(worker);
            return work.begin();
        },
        function (error){
            return AV.Promise.error(error);
        }
    ).then(
        function (task){
            console.log("All work done!");
            response.success({
                code: 0,
                userIdList: task,
                message: "Every users' events are generated correctly."
            });
        },
        function (error){
            response.error({
                code: 1,
                errorEventList: error,
                message: "There is some error occur."
            });
        }
    );
});

AV.Cloud.define("eventTimer", function (request, response){
    var start_time = request.params.startTime;
    var end_time   = request.params.endTime;

    var work = new serialize_task.SerializeTask();

    var worker = function (user_id, resolve, reject) {
        console.log("Start processing user: " + user_id);
        // Every time compute user's events from start_time to end_time.
        // It would remove the events during this interval time in db first.
        dao.removeEvents(user_id, start_time, end_time).then(
            function (){
                return ep.eventProcess(user_id, start_time, end_time);
            },
            function (error){
                return AV.Promise.error(error);
            }
        ).then(
            function (){
                resolve();
            },
            function (){
                reject();
            }
        );
    };

    dao.getAllUsers().then(
        function (user_id_list){
            console.log("The user list is :");
            console.log(user_id_list);
            user_id_list.forEach(function (user_id){
                work.addTask(user_id);
            });
            work.setWorker(worker);
            return work.begin();
        },
        function (error){
            return AV.Promise.error(error);
        }
    ).then(
        function (task){
            console.log("All work done!");
            response.success({
                code: 0,
                userIdList: task,
                message: "Every users' events are generated correctly."
            });
        },
        function (error){
            response.error({
                code: 1,
                message: "There is some error occur: " + error
            });
        }
    );
});

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

    var lean_cloud_data = {};
    lean_cloud_data['user_id'] = request.object._serverData.user.id;
    lean_cloud_data['location'] = request.object._serverData.location;
    console.log(lean_cloud_data);
    //req.post({url: "http://127.0.0.1:3000/v1/Location", json: lean_cloud_data},
    req.post({url: "http://dashboard.avosapps.com/v1/Location", json: lean_cloud_data},
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                logger.info(JSON.stringify(err.message));
            }else{
                var body_str = JSON.stringify(body);
                logger.info(body_str);
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

    var req = require('request');
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

    var lean_cloud_data = {};
    lean_cloud_data['user_id'] = request.object._serverData.user.id;
    lean_cloud_data['staticInfo'] = request.object._serverData.staticInfo;
    console.log(lean_cloud_data);
    //req.post({url: "http://127.0.0.1:3000/v1/StaticInfo", json: lean_cloud_data},
    req.post({url: "http://dashboard.avosapps.com/v1/StaticInfo", json: lean_cloud_data},
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                logger.info(JSON.stringify(err.message));
            }
            else{
                var body_str = JSON.stringify(body);
                logger.info(body_str);
                logger.info("fuck \n");
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
