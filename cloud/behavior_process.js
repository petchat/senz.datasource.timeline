/**
 * Created by MeoWoodie on 5/22/15.
 */

var dao = require('cloud/dao.js');
var method = require("cloud/method.js");
var algo = require("cloud/algo.js");
var util = require("cloud/util.js");
var config = require("cloud/config.js");
var logger = require("cloud/logger.js");

exports.behaviorProcess = function (behavior_len, step, scale, user_id, algo_type, tag) {
    logger.info(config.logEventType.sta, "processing behavior");
    logger.info(config.logEventType.ret, "user<" + user_id + ">'s behavior last updated time");
    return dao.getUserBehaviorLastUpdateTime(user_id).then(
        function (timestamp) {
            logger.info(config.logEventType.ret, "user<" + user_id + ">'s behavior last updated time is got");
            var start_time = timestamp.getTime();
            var end_time = start_time + behavior_len;
            var cur_time = (new Date()).getTime();
            var Promises = [];

            while (end_time < cur_time) {
                var start_t = new Date(start_time);
                var end_t = new Date(end_time);
                var behavior_id = undefined;
                var _senz_list_result = [];
                var bp = method.behaviorGenerator(user_id, start_time, end_time, scale, true).then(
                    function (saved_result) {
                        logger.info(config.logEventType.sav, "user<" + user_id + ">'s behavior from " + start_t + " to " + end_t + "is saved");
                        var behavior = saved_result.get("behaviorData");
                        behavior_id = saved_result.id;
                        //console.log(util.convertSenz(behavior));
                        // TODO: prob2muti need to fill the empty scale.
                        logger.info(config.logEventType.p2m, "request with user<" + user_id + ">'s behavior  from " + start_t + " to " + end_t + " (probability obj)");
                        return algo.prob2muti(util.convertSenz(behavior), "SELECT_MAX_N_PROB");
                    },
                    function (error){
                        logger.error(config.logEventType.sav, "user<" + user_id + ">'s behavior is unsaved from " + start_t + " to " + end_t + " ,error msg:" + error);
                        return AV.Promise.error(error);
                    }
                ).then(
                    function (senz_list_result) {
                        logger.info(config.logEventType.p2m, "receive user<" + user_id + ">'s several observation without probability from " + start_t + " to " + end_t);
                        var promises = [];
                        _senz_list_result = senz_list_result;
                        senz_list_result.forEach(function (senz_object) {
                            var prob = senz_object["prob"];
                            var senz_list = senz_object["senzList"];
                            console.log(JSON.stringify(senz_list));
                            logger.info(config.logEventType.anl, "request with user<" + user_id + ">'s a observation from " + start_t + " to " + end_t);
                            promises.push(algo.predict(algo_type, tag, senz_list));
                        });
                        return AV.Promise.all(promises);
                    },
                    function (error){
                        logger.error(config.logEventType.p2m, "receive user<" + user_id + ">'s several observation without probability failed from " + start_t + " to " + end_t + " ,error msg:" + error);
                        return AV.Promise.error(error);
                    }
                ).then(
                    function (predict_result){
                        logger.info(config.logEventType.anl, "receive user<" + user_id + ">'s prediction");
                        console.log(predict_result);
                        var predictions = [];
                        for (var i=0; i<_senz_list_result.length; i++){
                            var prediction_obj = {
                                "behavior": _senz_list_result[i],
                                "prediction": predict_result[i]["scores"],
                                "algoType": algo_type,
                                "modelTag": tag
                            };
                            predictions.push(prediction_obj);
                        }
                        logger.info(config.logEventType.upd, "update user behavior's prediction");
                        return dao.updateUserBehaviorPediction(behavior_id, predictions);
                        //return AV.Promise.as(predict_result);
                    },
                    function (error){
                        logger.error(config.logEventType.anl, "predict user<" + user_id + "> failed, error msg:" + error);
                        return AV.Promise.error(error);
                    }
                );
                Promises.push(bp);
                start_time += step;
                end_time += step;
            }
            logger.info(config.logEventType.upd, "update user behavior last updated time as " + new Date(start_time));
            Promises.push(dao.updateUserBehaviorLastUpdatedTime(user_id, start_time));
            return AV.Promise.when(Promises);
        }
    );
};