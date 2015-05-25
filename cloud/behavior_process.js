/**
 * Created by MeoWoodie on 5/22/15.
 */

var dao = require('cloud/dao.js');
var method = require("cloud/method.js");
var algo = require("cloud/algo.js");
var util = require("cloud/util.js");

exports.behaviorProcess = function (behavior_len, step, scale, user_id) {
    return dao.getUserBehaviorLastUpdateTime(user_id).then(
        function (timestamp) {
            var start_time = timestamp.getTime();
            var end_time = start_time + behavior_len;
            var cur_time = (new Date()).getTime();
            var Promises = [];
            while (end_time < cur_time) {
                var bp = method.behaviorGenerator(user_id, start_time, end_time, scale, true).then(
                    function (saved_result) {
                        var behavior = saved_result.get("behaviorData");
                        //console.log(util.convertSenz(behavior));
                        // TODO: prob2muti need to fill the empty scale.
                        return algo.prob2muti(util.convertSenz(behavior), "SELECT_MAX_N_PROB");
                    },
                    function (error){
                        return AV.Promise.error(error);
                    }
                ).then(
                    function (senz_list_result) {
                        var promises = [];
                        senz_list_result.forEach(function (senz_object) {
                            var prob = senz_object["prob"];
                            var senz_list = senz_object["senzList"];
                            console.log(JSON.stringify(senz_list));
                            promises.push(algo.predict("GMMHMM", "random_generated_base_model", senz_list));
                        });
                        return AV.Promise.all(promises);
                    },
                    function (error){
                        return AV.Promise.error(error);
                    }
                ).then(
                    function (predict_result){
                        console.log(predict_result);
                        return AV.Promise.as(predict_result);
                    },
                    function (error){
                        return AV.Promise.error(error);
                    }
                );
                Promises.push(bp);
                start_time += step;
                end_time += step;
            }
            Promises.push(dao.updateUserBehaviorLastUpdatedTime(user_id, start_time));
            return AV.Promise.when(Promises);
        }
    );
};