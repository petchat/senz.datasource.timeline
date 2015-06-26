var router = require("express").Router();
var AV     = require("leanengine");
var dao    = require("../lib/dao.js");

router.get("/", function (req, res){
    var user_id = req.query.userId;
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

module.exports = router;