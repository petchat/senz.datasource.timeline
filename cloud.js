var notification   = require("./lib/notification.js");
var AV             = require("leanengine");
var logger         = require("./lib/logger.js");
var strategy       = require("./lib/strategy.js");
var req            = require('request');
var _              = require("underscore");
var memwatch       = require('memwatch-next');

memwatch.on('leak', function(info) {
    console.log("leak  occured");
    console.log(info);
});
memwatch.on('stats', function(stats) {
    console.log(stats);
});

AV.Cloud.afterSave('UserLocation', function(request) {
    var data = {};
    data['objectId'] = request.object.id;
    data['user_id'] = request.object._serverData.user.id;
    data['userRawdataId'] = request.object._serverData.userRawdataId;
    data['isTrainingSample'] = request.object._serverData.isTrainingSample;
    data['near_home_office'] = request.object._serverData.near_home_office;
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

    var poiProbLv2 = request.object._serverData.poiProbLv2;
    var poi = _.keys(poiProbLv2).sort(function(a, b){return poiProbLv2[a] < poiProbLv2[b] ? 1 : -1})[0];
    strategy.get_post_wilddog_config(request.object._serverData.user.id, 'location', poi);

    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline",
              headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
                        "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"},
              json: {'name': 'UserLocation', 'obj': request.object}},
            function(err, res, body){
                if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                    logger.error(err);
                }
                else{
                    var body_str = JSON.stringify(body);
                    logger.info("dashboard", JSON.stringify(body_str));
                }
            });
    req.post({url:"http://119.254.111.40:3000/api/UserLocations", json: data},
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                console.log('UserLocation POST failed!');
                logger.error("UserLocation", JSON.stringify(err.message));
            }
            else{
                var body_str = JSON.stringify(body);
                logger.info("UserLocation", JSON.stringify(body_str));
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
    var motion = _.keys(motionProb).sort(function(a, b){return motionProb[a] < motionProb[b] ? 1 : -1});
    strategy.get_post_wilddog_config(request.object._serverData.user.id, 'motion', motion.toString());

    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline",
              headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
                        "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"},
              json: {'name': 'UserMotion', 'obj': request.object}},
            function(err, res, body){
                if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                    logger.error("UserMotion", err);
                }
                else{
                    var body_str = JSON.stringify(body);
                    logger.info("UserMotion", JSON.stringify(body_str));
                }
            });
    req.post({url:"http://119.254.111.40:3000/api/UserMotions", json: data},
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                console.log('UserMotion POST failed!');
                logger.error("UserMotion", err);
            }
            else{
                var body_str = JSON.stringify(body);
                logger.info("UserMotion", JSON.stringify(body_str));
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

    req.post({url:"http://119.254.111.40:3000/api/UserStaticInfos", json: data},
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                console.log('UserMotion POST failed!');
                logger.error("UserInfoLog", err);
            }
            else{
                var body_str = JSON.stringify(body);
                logger.info("UserInfoLog", JSON.stringify(body_str));
            }
        });
    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline", 
              headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
                        "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"}, 
              json: {'name': 'UserInfoLog', 'obj': request.object}},
            function(err, res, body){
                if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                    logger.info(err);
                }
                else{
                    var body_str = JSON.stringify(body);
                    logger.info(JSON.stringify(body_str));
                }
            });
});

AV.Cloud.afterSave('HomeOfficeStatus', function(request) {
    var status = request.object._serverData.status;
    strategy.get_post_wilddog_config(request.object._serverData.user.id, 'home_office_status', status);

    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline",
            headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
                "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"},
            json: {'name': 'HomeOfficeStatus', 'obj': request.object}},
        function(err, res, body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                console.log('UserMotion POST failed!');
                logger.error("HomeOfficeStatus", err);
            }
            else{
                var body_str = JSON.stringify(body);
                logger.info("HomeOfficeStatus", JSON.stringify(body_str));
            }
        });
});

//AV.Cloud.afterSave('UPoiVisitLog', function(request) {
//    var req = require('request');
//    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline",
//              headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
//                        "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"},
//              json: {'name': 'UPoiVisitLog', 'obj': request.object}},
//            function(err, res, body){
//                if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
//                    logger.info(err);
//                }
//                else{
//                    var body_str = JSON.stringify(body);
//                    logger.info(JSON.stringify(body_str));
//                }
//            });
//});

AV.Cloud.afterSave('UserEvent', function(request) {
    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline", 
              headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
                        "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"}, 
              json: {'name': 'UserEvent', 'obj': request.object}},
            function(err, res, body){
                if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                    logger.info(err);
                }
                else{
                    var body_str = JSON.stringify(body);
                    logger.info(JSON.stringify(body_str));
                }
            });
});

AV.Cloud.afterSave('UserActivity', function(request) {
    req.post({url: "https://leancloud.cn/1.1/functions/post_obj_from_timeline", 
              headers: {"X-LC-Id": "2x27tso41inyau4rkgdqts0mrao1n6rq1wfd6644vdrz2qfo",
                        "X-LC-Key": "3fuabth1ar3sott9sgxy4sf8uq31c9x8bykugv3zh7eam5ll"}, 
              json: {'name': 'UserActivity', 'obj': request.object}},
            function(err, res, body){
                if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                    logger.info(err);
                }
                else{
                    var body_str = JSON.stringify(body);
                    logger.info(JSON.stringify(body_str));
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

    req.post({url:"http://119.254.111.40:3000/api/UserCalendars", json: data},
        function(err,res,body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                logger.info(err);
            }
            else{
                var body_str = JSON.stringify(body);
                logger.info(JSON.stringify(body_str));
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
    req.post('http://119.254.111.40:3000/api/ForTests').form(request.object);
});

module.exports = AV.Cloud;
