/**
 * Created by MeoWoodie on 5/22/15.
 */

var dao = require('cloud/dao.js');
var method = require("cloud/method.js");
var algo = require("cloud/algo.js");


// TODO: From database, not this function.
var convertSenz = function (behaivor) {
    var new_behavior = [];
    if (behaivor != undefined && behaivor.length >= 1) {
        behaivor.forEach(function (senz) {
            var new_senz = {
                "motion": {},
                "location": {},
                "sound": {}
            };
            new_senz["motion"] = senz["motionProb"];
            new_senz["location"] = senz["poiProbLv2"];
            new_senz["sound"] = senz["soundProb"];
            new_behavior.push(new_senz);
        });
    }
    else {
        console.log("Fuck!!!!");
    }
    return new_behavior;
};

exports.behaviorProcess = function (behavior_len, step, scale, user_id) {
    dao.getUserBehaviorLastUpdateTime(user_id).then(
        function (timestamp) {
            var start_time = timestamp.getTime();
            var end_time = start_time + behavior_len;
            var cur_time = (new Date()).getTime();
            while (end_time < cur_time) {
                method.behaviorGenerator(user_id, start_time, end_time, scale, true).then(
                    function (saved_result) {
                        var behavior = saved_result.get("behaviorData");
                        // TODO: prob2muti need to fill the empty scale.
                        return algo.prob2muti(convertSenz(behavior), "SELECT_MAX_PROB");
                    }
                ).then(
                    function (senz_list_result) {
                        var promises = [];
                        senz_list_result.forEach(function (senz_object) {
                            var prob = senz_object["prob"];
                            var senz_list = senz_object["senzList"];
                            //console.log(JSON.stringify(senz_list));
                            promises.push(algo.predict("GMMHMM", "random_generated_base_model", senz_list));
                        });
                        return AV.Promise.all(promises);
                    }
                ).then(
                    function (predict_result){
                        console.log(predict_result);
                    }
                );
                start_time += step;
                end_time += step;
            }
            return dao.updateUserBehaviorLastUpdatedTime(user_id, start_time);
        }
    );

};