/**
 * Created by MeoWoodie on 5/22/15.
 */

var dao = require('cloud/dao.js');
var method = require("cloud/method.js");
var algo = require("cloud/algo.js");
var util = require("cloud/util.js");
var config = require("cloud/config.js");
var logger = require("cloud/logger.js");

exports.behaviorProcess = function (behavior_len, step, scale, user_id, algo_type, tag, counter_setting) {
    logger.info(config.logEventType.sta, "processing behavior");
    logger.info(config.logEventType.ret, "user<" + user_id + ">'s behavior last updated time");
    return dao.getUserBehaviorLastUpdateTime(user_id, behavior_len).then(
        function (timestamp) {
            logger.info(config.logEventType.ret, "user<" + user_id + ">'s behavior last updated time is got");
            var start_time = timestamp.getTime();
            var end_time = start_time + behavior_len;
            var cur_time = (new Date()).getTime();

            var Work = (function SerializeTask() {
                var taskIndex = 0,
                    tasks = [],
                    _worker,
                    promise = new AV.Promise();

                function worker() {
                    //console.log('fuck!');
                    if (taskIndex < tasks.length) {
                        _worker(tasks[taskIndex],
                            function (result) {
                                console.log(result);
                                taskIndex++;
                                worker();
                            },
                            function (error) {
                                console.log('!!error occurd');
                                console.log(error);
                                taskIndex++;
                                worker();
                            }
                        );
                    }
                    else {
                        promise.resolve(tasks);
                    }
                    return promise;
                }

                return {
                    addTask: function (t) {
                        tasks.push(t);
                    },
                    setWorker: function (w) {
                        _worker = w;
                    },
                    begin: function () {
                        taskIndex = 0;
                        return worker();
                    }
                }
            })();
            var counter = 0;
            while (end_time < cur_time && counter < counter_setting){
                var during = {
                    startTime: start_time,
                    endTime: end_time
                };
                //console.log(during);
                Work.addTask(during);
                start_time += step;
                end_time += step;
                counter ++;
            }

            Work.setWorker(function (task, resolve, reject){
                method.behaviorGenerator(user_id, task["startTime"], task["endTime"], scale, true).then(
                    function (saved_result) {
                        logger.info(config.logEventType.sav, "user<" + user_id + ">'s behavior from " + new Date(start_time) + " to " + new Date(end_time) + "is saved");
                        var behavior = saved_result.get("behaviorData");
                        var behavior_id = saved_result.id;
                        // TODO: prob2muti need to fill the empty scale.
                        logger.info(config.logEventType.p2m, "request with user<" + user_id + ">'s behavior  from " + new Date(start_time) + " to " + new Date(end_time) + " (probability obj)");
                        return algo.prob2muti(util.convertSenz(behavior), "SELECT_MAX_N_PROB").then(
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
                            promises.push(algo.predict(algo_type, tag, senz_list));
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
                                "prediction": predict_result[i]["scores"],
                                "algoType": algo_type,
                                "modelTag": tag
                            };
                            predictions.push(prediction_obj);
                        }
                        logger.info(config.logEventType.upd, "update user behavior's prediction");
                        console.log(behavior_id);
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
            return Work.begin().then(
                function (tasks) {
                    console.log('all completed');
                    console.log(tasks);
                    return dao.updateUserBehaviorLastUpdatedTime(user_id, start_time);
                }
            );
        }
    );
};



///**
// * Created by MeoWoodie on 5/22/15.
// */
//
//var dao = require('cloud/dao.js');
//var method = require("cloud/method.js");
//var algo = require("cloud/algo.js");
//var util = require("cloud/util.js");
//var config = require("cloud/config.js");
//var logger = require("cloud/logger.js");
//
//exports.behaviorProcess = function (behavior_len, step, scale, user_id, algo_type, tag) {
//    logger.info(config.logEventType.sta, "processing behavior");
//    logger.info(config.logEventType.ret, "user<" + user_id + ">'s behavior last updated time");
//    return dao.getUserBehaviorLastUpdateTime(user_id).then(
//        function (timestamp) {
//            logger.info(config.logEventType.ret, "user<" + user_id + ">'s behavior last updated time is got");
//            var start_time = timestamp.getTime();
//            var end_time = start_time + behavior_len;
//            var cur_time = (new Date()).getTime();
//            var Promises = [];
//            //var _behavior_ids = {};
//            //var _senz_list_results = {};
//
//            while (end_time < cur_time) {
//                var start_t = new Date(start_time);
//                var end_t = new Date(end_time);
//
//                var bp = method.behaviorGenerator(user_id, start_time, end_time, scale, true).then(
//                    function (saved_result) {
//                        logger.info(config.logEventType.sav, "user<" + user_id + ">'s behavior from " + start_t + " to " + end_t + "is saved");
//                        var behavior = saved_result.get("behaviorData");
//                        var behavior_id = saved_result.id;
//                        // TODO: prob2muti need to fill the empty scale.
//                        logger.info(config.logEventType.p2m, "request with user<" + user_id + ">'s behavior  from " + start_t + " to " + end_t + " (probability obj)");
//                        return algo.prob2muti(util.convertSenz(behavior), "SELECT_MAX_N_PROB").then(
//                            function (senz_list_result){ return AV.Promise.as(senz_list_result, behavior_id); },
//                            function (error){ return AV.Promise.error(error); }
//                        )
//                    },
//                    function (error){
//                        logger.error(config.logEventType.sav, "user<" + user_id + ">'s behavior is unsaved from " + start_t + " to " + end_t + " ,error msg:" + error);
//                        return AV.Promise.error(error);
//                    }
//                ).then(
//                    function (senz_list_result, behavior_id) {
//                        logger.info(config.logEventType.p2m, "receive user<" + user_id + ">'s several observation without probability from " + start_t + " to " + end_t);
//                        var promises = [];
//                        //_senz_list_results[start_time.toString()] = senz_list_result;
//                        senz_list_result.forEach(function (senz_object) {
//                            var prob = senz_object["prob"];
//                            var senz_list = senz_object["senzList"];
//                            console.log(JSON.stringify(senz_list));
//                            logger.info(config.logEventType.anl, "request with user<" + user_id + ">'s a observation from " + start_t + " to " + end_t);
//                            promises.push(algo.predict(algo_type, tag, senz_list));
//                        });
//                        return AV.Promise.all(promises).then(
//                            function (predict_result){ return AV.Promise.as(predict_result, senz_list_result, behavior_id); },
//                            function (error){ return AV.Promise.error(error); }
//                        );
//                    },
//                    function (error){
//                        logger.error(config.logEventType.p2m, "receive user<" + user_id + ">'s several observation without probability failed from " + start_t + " to " + end_t + " ,error msg:" + error);
//                        return AV.Promise.error(error);
//                    }
//                ).then(
//                    function (predict_result, senz_list_result, behavior_id){
//                        logger.info(config.logEventType.anl, "receive user<" + user_id + ">'s prediction");
//                        console.log(predict_result);
//                        var predictions = [];
//                        for (var i=0; i<senz_list_result.length; i++){
//                            var prediction_obj = {
//                                "behavior": senz_list_result[i],
//                                "prediction": predict_result[i]["scores"],
//                                "algoType": algo_type,
//                                "modelTag": tag
//                            };
//                            predictions.push(prediction_obj);
//                        }
//                        logger.info(config.logEventType.upd, "update user behavior's prediction");
//                        console.log(behavior_id);
//                        return dao.updateUserBehaviorPrediction(behavior_id, predictions);
//                    },
//                    function (error){
//                        logger.error(config.logEventType.anl, "predict user<" + user_id + "> failed, error msg:" + error);
//                        return AV.Promise.error(error);
//                    }
//                );
//                Promises.push(bp);
//                start_time += step;
//                end_time += step;
//            }
//            logger.info(config.logEventType.upd, "update user behavior last updated time as " + new Date(start_time));
//            Promises.push(dao.updateUserBehaviorLastUpdatedTime(user_id, start_time));
//            return AV.Promise.when(Promises);
//        }
//    );
//};