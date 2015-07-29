var dao    = require("./dao.js");
var AV     = require("leanengine");
var _      = require("underscore");
var serialize_task = require("./serialize_task.js");

// TODO: The middleware would be migrated to A Cloud Service within flask framework.
var _middlewareRawEvents2EventSet = function (raw_events){
    // Preliminary Process
    // exclude the alternative selection of event types.
    // the result looks like:
    // [{type: "exercise_indoor", startTime: xxx, endTime: xxx, behaviorId: xxxxxxx}, ...]
    var event_objs_list = _.map(raw_events, function (raw_event){
        var processed_event = _.map(raw_event["eventType"], function (possibility){
            var max_type       = _.max(_.pairs(possibility["types"]), function (type){ return type[1] }),
                max_type_key   = max_type[0],
                max_type_value = max_type[1],
                type_prob      = possibility["probability"],
                res            = {};
            res[max_type_key]  = max_type_value + type_prob;
            return res;
        });
        return {
            type: _.keys(_.max(processed_event, function (type){ return _.values(type)[0] }))[0],
            prob: _.values(_.max(processed_event, function (type){ return _.values(type)[0] }))[0],
            startTime: raw_event["startTime"],
            endTime: raw_event["endTime"],
            behaviorId: raw_event["behaviorId"]
        };
    });

    // Computation of events set.
    var event_set = [{
        type: event_objs_list[0]["type"],
        prob: Math.exp(event_objs_list[0]["prob"]),
        startTime: (event_objs_list[0]["startTime"] + event_objs_list[0]["endTime"])/2 - 5*60*1000,
        endTime: (event_objs_list[0]["startTime"] + event_objs_list[0]["endTime"])/2 + 5*60*1000,
        behaviorIds: [event_objs_list[0]["behaviorId"]]
    }];
    for (var i = 1; i < event_objs_list.length; i ++){
        if (event_objs_list[i]["type"] != event_objs_list[i-1]["type"]){
            var new_event = {
                type: event_objs_list[i]["type"],
                prob: Math.exp(event_objs_list[i]["prob"]),
                startTime: (event_objs_list[i]["startTime"] + event_objs_list[i]["endTime"])/2 - 5*60*1000,
                endTime: (event_objs_list[i]["startTime"] + event_objs_list[i]["endTime"])/2 + 5*60*1000,
                behaviorIds: [event_objs_list[i]["behaviorId"]]
            };
            event_set.push(new_event);
        }
        else{
            event_set[event_set.length-1]["prob"] += Math.exp(event_objs_list[i]["prob"]);
            event_set[event_set.length-1]["endTime"] = (event_objs_list[i]["startTime"] + event_objs_list[i]["endTime"])/2;
            event_set[event_set.length-1]["behaviorIds"].push(event_objs_list[i]["behaviorId"]);
        }
    }

    // Average of events' prob.
    for (var i = 0; i < event_set.length; i ++){
        event_set[i]["prob"] = event_set[i]["prob"]/event_set[i]["behaviorIds"].length;
    }
    // Remove invalid events.
    var result = [];
    for (var i = 0; i < event_set.length; i ++){
        if (event_set[i]["startTime"] < event_set[i]["endTime"]) {
            result.push(event_set[i]);
        }
    }
    return result;
};

var eventProcess = function (user_id, start_time, end_time){
    dao.getUserRawEvent(user_id, start_time, end_time).then(
        function (raw_events){
            var work = new serialize_task.SerializeTask();
            var event_set = _middlewareRawEvents2EventSet(raw_events);
            console.log(event_set);
            event_set.forEach(function (event){
                work.addTask(event);
            });
            work.setWorker(function (event, resolve, reject){
                dao.addEvent(user_id, event["type"], event["startTime"], event["endTime"], event["behaviorIds"]).then(
                    function (event) {
                        resolve(event);
                    },
                    function (error) {
                        reject(error);
                    }
                );
            });
            return work.begin().then(
                function (){
                    console.log("All user " + user_id + "'s event have been computed.");
                    return AV.Promise.as("All user " + user_id + "'s event have been computed.");
                }
            );
        },
        function (error){
            return AV.Promise.error(error);
        }
    );
};

//eventProcess("559e280ae4b0d4d1b2104c16", 1438127945131, 1438149545131);