var router = require("express").Router();
var AV     = require("leanengine");
var dao    = require("../lib/dao.js");
var method = require("../lib/method.js");

router.get("/:userId/context", function (req, res){
    var user_id = req.params.userId,
        start_time = parseInt(req.query.startTime),
        end_time   = parseInt(req.query.endTime),
        scale      = req.query.scale.toString();

    if (start_time != undefined && end_time != undefined && scale != undefined){
        if (end_time - start_time > 1000*3600*24){
            res.json({
                code: 2,
                message: "The range of time scale should not be longer than one day."
            });
        }
        else {
            method.behaviorGenerator(user_id, start_time, end_time, scale, false).then(
                function (historical_senzes) {
                    var result = [];
                    historical_senzes.forEach(function (senz) {
                        if (senz["senzId"].length > 0) {
                            var _senz = {
                                "userMotion": {
                                    "motionProb": senz["motionProb"]
                                },
                                "userSound": {
                                    "soundProb": senz["soundProb"]
                                },
                                "userLocation": {
                                    "poiProbLv1": senz["poiProbLv1"],
                                    "poiProbLv2": senz["poiProbLv2"]
                                },
                                "count": senz["senzId"].length,
                                "updatedAt": new Date(senz["timestamp"])
                            };
                            result.push(_senz);
                        }
                    });
                    res.json({
                        code: 0,
                        historicalSenzes: result
                    });
                },
                function (error) {
                    res.json({
                        code: 1,
                        message: error
                    });
                }
            );
        }
    }
    else{
        dao.getLatestIntegratedSenz(user_id).then(
            function (result){
                var result_obj = {
                    code: 0,
                    result: result
                };
                res.json(result_obj);
            },
            function (error){
                console.log(error);
                var result_obj = {
                    code: 1,
                    message: error
                };
                res.json(result_obj);
            }
        );
    }
});

router.get("/:userId/events", function (req, res){
    var user_id    = req.params.userId,
        limit      = req.query.limit,
        start_time = req.query.startTime,
        end_time   = req.query.endTime;

    if (limit == undefined && start_time == undefined && end_time == undefined){
        limit = 1;
    }
    dao.getEvents(user_id, limit, start_time, end_time).then(
        function (result){
            var result_obj = {
                code: 0,
                result: result
            };
            res.json(result_obj);
        },
        function (error){
            console.log(error);
            var result_obj = {
                code: 1,
                message: error
            };
            res.json(result_obj);
        }
    );
});


module.exports = router;