var router = require("express").Router();
var AV     = require("leanengine");
var dao    = require("../lib/dao.js");

router.get("/", function (req, res){
    var user_id = req.query.userId;
    console.log(user_id);
    var limit   = req.query.limit;
    console.log(limit);

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