/**
 * Created by MeoWoodie on 5/22/15.
 */
var AV = require('leanengine');
var dao = require('./dao.js');
var method = require("./method.js");
var algo = require("./algo.js");
var util = require("./util.js");
var config = require("./config.js");
var logger = require("./logger.js");
var serialize_task = require("./serialize_task.js");

exports.behaviorProcess = function (behavior_len, step, scale, user_id, algo_type, tag, counter_setting) {
    logger.info(config.logEventType.sta, "processing behavior");
    logger.info(config.logEventType.ret, "user<" + user_id + ">'s behavior last updated time");
    return dao.getUserBehaviorLastUpdateTime(user_id, behavior_len).then(
        function (timestamp) {
            logger.info(config.logEventType.ret, "user<" + user_id + ">'s behavior last updated time is got");
            var start_time = timestamp.getTime();
            var end_time = start_time + behavior_len;
            var cur_time = (new Date()).getTime();
            var work = new serialize_task.SerializeTask();

            var counter = 0;
            while (end_time < cur_time && counter < counter_setting){
                var during = {
                    startTime: start_time,
                    endTime: end_time
                };
                //console.log(during);
                work.addTask(during);
                start_time += step;
                end_time += step;
                counter ++;
            }

            work.setWorker(function (task, resolve, reject){
                method.behaviorGenerator(user_id, task["startTime"], task["endTime"], scale, true).then(
                    function (saved_result) {
                        logger.info(config.logEventType.sav, "user<" + user_id + ">'s behavior from " + new Date(start_time) + " to " + new Date(end_time) + "is saved");
                        var behavior = saved_result.get("behaviorData");
                        var behavior_id = saved_result.id;
                        // TODO: prob2muti need to fill the empty scale.
                        logger.info(config.logEventType.p2m, "request with user<" + user_id + ">'s behavior from " + new Date(start_time) + " to " + new Date(end_time) + " (probability obj)");
                        return algo.middlewareProbSenzes2MultiSenzes(util.convertSenz(behavior), "SELECT_MAX_N_PROB").then(
                            function (senz_list_result){ return AV.Promise.as(senz_list_result, behavior_id); },
                            function (error){ return AV.Promise.error(error); }
                        )
                    },
                    function (error){
                        logger.error(config.logEventType.sav, "user<" + user_id + ">'s behavior is unsaved from " + new Date(start_time) + " to " + new Date(end_time) + " ,error msg:" + error);
                        return AV.Promise.error(error);
                    }
                ).then(
                    function (senz_list_result, behavior_id) {
                        logger.info(config.logEventType.p2m, "receive user<" + user_id + ">'s several observation without probability from " + new Date(start_time) + " to " + new Date(end_time));
                        var promises = [];
                        //_senz_list_results[start_time.toString()] = senz_list_result;
                        senz_list_result.forEach(function (senz_object) {
                            var prob = senz_object["prob"];
                            var senz_list = senz_object["senzList"];
                            console.log(JSON.stringify(senz_list));
                            logger.info(config.logEventType.anl, "request with user<" + user_id + ">'s a observation from " + new Date(start_time) + " to " + new Date(end_time));
                            promises.push(algo.middlewareUserBehavior2Event(algo_type, tag, senz_list));
                        });
                        return AV.Promise.all(promises).then(
                            function (predict_result){ return AV.Promise.as(predict_result, senz_list_result, behavior_id); },
                            function (error){ return AV.Promise.error(error); }
                        );
                    },
                    function (error){
                        logger.error(config.logEventType.p2m, "receive user<" + user_id + ">'s several observation without probability failed from " + new Date(start_time) + " to " + new Date(end_time) + " ,error msg:" + error);
                        return AV.Promise.error(error);
                    }
                ).then(
                    function (predict_result, senz_list_result, behavior_id){
                        logger.info(config.logEventType.anl, "receive user<" + user_id + ">'s prediction");
                        console.log(predict_result);
                        var predictions = [];
                        for (var i=0; i<senz_list_result.length; i++){
                            var prediction_obj = {
                                "behavior": senz_list_result[i],
                                "prediction": util.convertDot2Pound(predict_result[i]["scores"]),
                                "algoType": algo_type,
                                "modelTag": tag
                            };
                            predictions.push(prediction_obj);
                        }
                        logger.info(config.logEventType.upd, "update user behavior's prediction");
                        console.log(behavior_id);
                        console.log(JSON.stringify(predictions));
                        return dao.updateUserBehaviorPrediction(behavior_id, predictions);
                    },
                    function (error){
                        logger.error(config.logEventType.anl, "predict user<" + user_id + "> failed, error msg:" + error);
                        return AV.Promise.error(error);
                    }
                ).then(
                    function (updated_behavior){
                        resolve(updated_behavior);
                        //return AV.Promise.as(updated_behavior);
                    },
                    function (error){
                        reject(error);
                        //return AV.Promise.error(error);
                    }
                );
            });
            logger.info(config.logEventType.upd, "update user behavior last updated time as " + new Date(start_time));
            //console.log('madan!');
            return work.begin().then(
                function (tasks) {
                    console.log('all completed');
                    console.log(tasks);
                    return dao.updateUserBehaviorLastUpdatedTime(user_id, start_time);
                }
            );
        }
    );
};