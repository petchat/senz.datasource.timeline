var router = require("express").Router();
var AV     = require("leanengine");
var dao    = require("../lib/dao.js");
var method = require("../lib/method.js");

router.get("/:userId/context/history", function (req, res){
    var user_id    = req.params.userId,
        start_time = parseInt(req.query.startTime),
        end_time   = parseInt(req.query.endTime),
        scale      = req.query.scale;

    console.log(user_id);
    console.log(start_time);
    console.log(end_time);
    console.log(scale);
    method.behaviorGenerator(user_id, start_time, end_time, scale, false).then(
        function (historical_senzes){
            var result = [];
            historical_senzes.forEach(function (senz){
                if (senz["senzId"].length > 0){
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
        function (error){
            res.json({
                code: 1,
                message: error
            });
        }
    );
});

router.get("/:userId/context", function (req, res){
    var user_id = req.params.userId;
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
});

router.get("/:userId/events", function (req, res){
    var user_id = req.params.userId;
    var limit   = req.query.limit;

    if (limit == undefined){
        limit = 1;
    }
    dao.getLatestEvents(user_id, limit).then(
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