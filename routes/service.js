var router = require("express").Router();
var AV     = require("leanengine");
var dao    = require("../lib/dao.js");

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