var router = require("express").Router();
var AV     = require("leanengine");
var dao    = require("../lib/dao.js");
var _      = require("underscore");
var serialize_task = require("../lib/serialize_task.js");


router.get('/', function(req, res, next) {
    dao.getAllUsers().then(
        function (user_id_list){
            var user_status_list = [];
            var jobs_list = user_id_list;
            var work      = serialize_task.SerializeTask();
            var worker    = function (job, resolve, reject){
                dao.getLatestIntegratedSenz(job).then(
                    function (user_status){
                        var description = "User "  + job;
                        // Add motion description.
                        if (_.has(user_status, "userMotion") && _.has(user_status["userMotion"], "motionProb")){
                            var motion      = _.keys(user_status["userMotion"]["motionProb"]);
                            var m_probs     = _.values(user_status["userMotion"]["motionProb"]);
                            var m_max_prob  = 0;
                            var m_max_index = 0;
                            for (var i = 0; i < motion.length; i ++){
                                if (m_probs[i] > m_max_prob){
                                    m_max_prob  = m_probs[i];
                                    m_max_index = i;
                                }
                            }
                            console.log(user_status["userMotion"]["motionProb"]);
                            description += (" IS " + motion[m_max_index] + "(" + m_probs[m_max_index] + ")");
                        }
                        // Add location description.
                        if (_.has(user_status, "userLocation") && _.has(user_status["userLocation"], "poiProbLv1")){
                            var location    = _.keys(user_status["userLocation"]["poiProbLv1"]);
                            var l_probs     = _.values(user_status["userLocation"]["poiProbLv1"]);
                            var l_max_prob  = 0;
                            var l_max_index = 0;
                            for (var i = 0; i < location.length; i ++){
                                if (l_probs[i] > l_max_prob){
                                    l_max_prob  = l_probs[i];
                                    l_max_index = i;
                                }
                            }
                            console.log(user_status["userLocation"]["poiProbLv1"]);
                            description += (" AT " + location[l_max_index] + "(" + l_probs[l_max_index] + ")");
                        }
                        // Add sound description.
                        if (_.has(user_status, "userSound") && _.has(user_status["userSound"], "soundProb")){
                            var sound       = _.keys(user_status["userSound"]["soundProb"]);
                            var s_probs     = _.values(user_status["userSound"]["soundProb"]);
                            var s_max_prob  = 0;
                            var s_max_index = 0;
                            for (var i = 0; i < sound.length; i ++){
                                if (s_probs[i] > s_max_prob){
                                    s_max_prob  = s_probs[i];
                                    s_max_index = i;
                                }
                            }
                            console.log(user_status["userSound"]["soundProb"]);
                            description += (" IN " + sound[s_max_index] + "(" + s_probs[s_max_index] + ")");
                        }
                        // Add Timestamp.
                        description += (" AT TIME OF " + user_status["updatedAt"]);

                        console.log(description);
                        user_status_list.push(description);
                        resolve();
                    },
                    function (error){
                        var description = "User "  + job + " " + error;
                        user_status_list.push(description);
                        reject(error);
                    }
                );
            };
            jobs_list.forEach(function (job){
                work.addTask(job);
            });
            work.setWorker(worker);
            return work.begin().then(
                function (){
                    return AV.Promise.as(user_id_list, user_status_list);
                }
            );
        }
    ).then(
        function (user_id_list, user_status_list){
            console.log(user_id_list.length + user_status_list.length);
            console.log(user_id_list);
            var user_events_list = [];
            var jobs_list = user_id_list;
            var work      = serialize_task.SerializeTask();
            var worker    = function (job, resolve, reject){
                dao.getEvents(job, 1).then(
                    function (user_events){
                        var description = "User " + job + "'s EVENT is ";
                        if (!_.has(user_events[0], "event")){
                            description += "VACANT";
                        }
                        else {
                            var events = _.keys(user_events[0]["event"]);
                            var e_probs = _.values(user_events[0]["event"]);
                            var e_max_prob = 0;
                            var e_max_index = 0;
                            for (var i = 0; i < events.length; i++) {
                                if (e_probs[i] > e_max_prob) {
                                    e_max_prob = e_probs[i];
                                    e_max_index = i;
                                }
                            }
                            description += (events[e_max_index] + "(" + e_probs[e_max_index] + ")" + "AT TIME OF " + user_events[0]["updatedAt"]);
                        }
                        user_events_list.push(description);
                        resolve();
                    },
                    function (error){
                        var description = "User "  + job + " " + error;
                        user_events_list.push(description);
                        reject(error);
                    }
                );
            };
            jobs_list.forEach(function (job){
                work.addTask(job);
            });
            work.setWorker(worker);
            return work.begin().then(
                function (){
                    res.render("portal", {
                        user_status: user_status_list,
                        user_events: user_events_list
                    });
                }
            );
        }
    );
});

module.exports = router;