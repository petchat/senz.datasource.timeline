/**
 * Created by MeoWoodie on 5/22/15.
 */
var AV     = require('leanengine');
var dao    = require('./dao.js');
var sp     = require("./senz_process.js");
var algo   = require("./algo.js");
var util   = require("./util.js");
var config = require("./config.js");
var logger = require("./logger.js");
var _      = require("underscore");
var serialize_task = require("./serialize_task.js");

var _middlewareExpertsSystem = function (senz_list){
    // Preliminary processing.
    var senzes_len           = senz_list.length,
        senz_statistic_chain = _
            // Senz list
            .chain(senz_list)
            // Extract useful info of sensor
            // such as: [["unknown", "sitting", "business_building"], [...], ...]
            .map(function (senz){
                return [senz["sound"], senz["motion"], senz["location"]];
            })
            // Count every possible condition in varies of sensor.
            // such as: {sound: {unknown: 10}, motion: {sitting: 9, walking: 1}, location: {business_building: 7, work_office: 3}}
            .reduce(function (memo, refined_senz){
                if (!_.has(memo["sound"], refined_senz[0])) { memo["sound"][refined_senz[0]] = 1; } else { memo["sound"][refined_senz[0]] ++; }
                if (!_.has(memo["motion"], refined_senz[1])) { memo["motion"][refined_senz[1]] = 1; } else { memo["motion"][refined_senz[1]] ++; }
                if (!_.has(memo["location"], refined_senz[2])) { memo["location"][refined_senz[2]] = 1; } else { memo["location"][refined_senz[2]] ++; }
                return memo;
            }, {sound: {}, motion: {}, location: {}})
            // Pick the maximum of count of sensor condition in varies of sensor
            // such as: {sound: {unknown: 10}, motion: {sitting: 9}, location: {business_building: 7}}
            .mapObject(function (sensor_statistics, sensor_type){
                return _
                    // Every sensor's statistics
                    // such as: {sitting: 9, walking: 1} in motion.
                    .chain(sensor_statistics)
                    // Convert Object to Array
                    // such as: From {unknown: 10} to [["unknown", 10]]
                    .pairs()
                    // Pick the maximum of count sensor condition
                    // such as: From [["sitting", 9], ["walking", 1]] to ["sitting", 9]
                    .max(function (statistic){ return statistic[1]; })
                    // Convert Array to Object
                    // such as: From ["unknown", 10] to {unknown: 10}
                    .partition().filter(function (item){ return item.length >= 1; }).object()
                    .value();
            });

    // Output of logger in stdout.
    console.log("The result of experts system:");
    console.log(JSON.stringify(senz_statistic_chain.value()));

    // The prediction of occurrence of this condition.
    var possibility = senz_statistic_chain
        // Convert Object to Array
        // such as: [["sound", ["unknown", 10]], ["motion", ["sitting", 9]], ["location", ["work_office", 7]]]
        .pairs().map(function (item){ return [item[0], _.chain(item[1]).pairs().flatten().value()]; })
        // Extract sensor type and it's condition.
        // such as: [["sound", "unknown", 10], ["motion", "sitting", 9], ["location", "work_office", 7]]
        .map(function (sensor_statistic){ return [sensor_statistic[0], sensor_statistic[1][0]]; })
        // Convert array to object.
        // such as: {{sound: "unknown"}, {motion: "sitting"}, {location: "work_office"}
        .object().value();
    var prediction_existence_chain = _
        // The experts system database object.
        // such as: {study_in_class: [{sound: "unknown", motion: "sitting", location: "university"}, {...}, ...], ...}
        .chain(config.expertsSystemDatabase)
        // Find which condition in experts system database matches with the possibility above.
        // such as: {study_in_class: true, work_in_office: false, ...}
        .mapObject(function (_possibilities, p){
            var _assertion = false;
            _possibilities.forEach(function (_possibility){
                if (_.isEqual(_possibility, possibility)){
                    _assertion = true;
                }
            });
            return _assertion;
        })
        // Convert Object to Array.
        // such as: [["study_in_class", true], ["work_in_office", false], ...]
        .pairs()
        // Filter which prediction is true
        // such as: [["study_in_class", true], ...]
        .filter(function (p){ return p[1]; })
        // Return the prediction and assertion
        // Theoretically, there is only one prediction is true.
        // such as: ["study_in_class", true]
        .last();

    // Assertion of experts system.
    var assertion_existence  = false;
    // Return the assertion.
    // such as: true.
    if (prediction_existence_chain.value() != undefined && prediction_existence_chain.last().value()){
        assertion_existence = true;
    }
    var assertion_proportion = senz_statistic_chain
        // Convert Object to Array
        // such as: [["sound", ["unknown", 10]], ["motion", ["sitting", 9]], ["location", ["work_office", 7]]]
        .pairs().map(function (item){ return [item[0], _.chain(item[1]).pairs().flatten().value()]; })
        // Assert each type of sensor.
        // such as: [true, true, true]
        .map(function (sensor_statistic){ return (sensor_statistic[1][1] / senzes_len) > 0.8; })
        // Assert the whole array.
        // If there are all true, then return true, else false.
        // such as: true & true & true = true.
        .reduce(function (memo, assertion){ return memo && assertion; })
        .value();
    var assertion = assertion_existence && assertion_proportion;

    // Output of logger in stdout.
    console.log("The assertion of experts system:");
    console.log(assertion);

    // Prediction of experts system.
    var prediction = {};
    if (assertion){
        // The probability of occurrence of this condition.
        var probability = senz_statistic_chain
            // Convert Object to Array
            // such as: [["sound", ["unknown", 10]], ["motion", ["sitting", 9]], ["location", ["work_office", 7]]]
            .pairs().map(function (item){ return [item[0], _.chain(item[1]).pairs().flatten().value()]; })
            // Extract the condition type of each sensor and it's probability.
            // such as: [["unknown", 1], ["sitting", 0.9], ["work_office", 0.7]]
            .map(function (sensor_statistic){ return [sensor_statistic[1][0], sensor_statistic[1][1]/senzes_len]; })
            // Calculate the probability of occurrence of this condition
            // such as: 1 * 0.9 * 0.7 = 0.63
            .reduce(function (memo, possibility){ return memo * possibility[1]; }, 1)
            .value();
        var _prediction = prediction_existence_chain
            // Return the prediction.
            // such as: "study_in_class"
            .first().value();
        prediction[_prediction] = probability;
    }
    // The result of experts system.
    return {assertion: assertion, prediction: AV.Promise.as(prediction)};
};

exports.behaviorProcess = function (behavior_len, step, scale, user_id, algo_type, tag, counter_setting) {
    logger.info(config.logEventType.sta, "processing behavior");
    logger.info(config.logEventType.ret, "user<" + user_id + ">'s behavior last updated time");
    return dao.getUserBehaviorLastUpdateTime(user_id, behavior_len).then(
        function (timestamp) {
            logger.info(config.logEventType.ret, "user<" + user_id + ">'s behavior last updated time is got");
            var start_time = timestamp.getTime();
            var end_time   = start_time + behavior_len;
            var cur_time   = (new Date()).getTime();
            var work       = new serialize_task.SerializeTask();

            var counter = 0;
            while (end_time < cur_time && counter < counter_setting){
                var during = {
                    startTime: start_time,
                    endTime: end_time
                };
                work.addTask(during);
                start_time += step;
                end_time   += step;
                counter    ++;
            }

            work.setWorker(function (task, resolve, reject){
                sp.behaviorGenerator(user_id, task["startTime"], task["endTime"], scale, true).then(
                    function (saved_result) {
                        logger.info(config.logEventType.sav, "user<" + user_id + ">'s behavior from " + new Date(start_time) + " to " + new Date(end_time) + "is saved");
                        var behavior = saved_result.get("behaviorData");
                        console.log("senzes : " + behavior.length);
                        var behavior_id = saved_result.id;
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
                        console.log("refined senzes : " + senz_list_result.length);
                        logger.info(config.logEventType.p2m, "receive user<" + user_id + ">'s several observation without probability from " + new Date(start_time) + " to " + new Date(end_time));
                        var promises = [];
                        senz_list_result.forEach(function (senz_object) {
                            var prob = senz_object["prob"];
                            var senz_list = senz_object["senzList"];
                            var es_result = _middlewareExpertsSystem(senz_list);
                            // First of all, A pre-defined experts system would try to give a prediction.
                            if (es_result["assertion"]){
                                logger.info(config.logEventType.anl, "Experts system predict user<" + user_id + ">'s observation from " + new Date(start_time) + " to " + new Date(end_time));
                                promises.push(es_result["prediction"]);
                            }
                            // If experts system could not give an answer about prediction.
                            // Then middleware of "Behavior 2 Event" which is made of GMMHMM would solve it.
                            else {
                                logger.info(config.logEventType.anl, "request with user<" + user_id + ">'s a observation from " + new Date(start_time) + " to " + new Date(end_time));
                                promises.push(algo.middlewareUserBehavior2Event(algo_type, tag, senz_list));
                            }
                        });
                        return AV.Promise.when(promises).then(
                            function (predict_result1, predict_result2, predict_result3){ return AV.Promise.as([predict_result1, predict_result2, predict_result3], senz_list_result, behavior_id); },
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
                        //console.log("Prediction: " + predict_result);
                        var predictions = [];
                        for (var i=0; i<senz_list_result.length; i++){
                            var prediction_obj = {
                                "behavior": senz_list_result[i],
                                //"prediction": util.convertDot2Pound(predict_result[i]["scores"]),
                                "prediction": predict_result[i],
                                "algoType": algo_type,
                                "modelTag": tag
                            };
                            predictions.push(prediction_obj);
                        }
                        logger.info(config.logEventType.upd, "update user behavior's prediction");
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
                    },
                    function (error){
                        reject(error);
                    }
                );
            });
            logger.info(config.logEventType.upd, "update user behavior last updated time as " + new Date(start_time));
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

exports.behaviorExtract = function (user_id, start_time, end_time, scale){
    return sp.behaviorGenerator(user_id, start_time, end_time, scale, false).then(
        function (senz_list){
            console.log(JSON.stringify(senz_list));
            return algo.middlewareProbSenzes2MultiSenzes(util.convertSenz(senz_list), "SELECT_MAX_N_PROB");
        },
        function (error){
            return AV.Promise.error(error);
        }
    )
};