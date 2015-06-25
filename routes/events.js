var router = require("express").Router();
var AV     = require("leanengine");

router.get("/:user_id", function (req, res, next){
    var user_id = req.params.user_id;

    res.json({ userId: user_id });
});

module.exports = router;