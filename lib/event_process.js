var dao    = require("./dao.js");
var AV     = require("leanengine");
var _      = require("underscore");
var notification   = require("./notification.js");
var serialize_task = require("./serialize_task.js");

// TODO: The middleware would be migrated to A Cloud Service within flask framework.
var _middlewareRawEvents2EventSet = function (raw_events){
    // Preliminary Process
    // exclude the alternative selection of event types.
    // the result looks like:
    // [{type: "exercise_indoor", startTime: xxx, endTime: xxx, behaviorId: xxxxxxx}, ...]
    var event_objs_list = _.map(raw_events, function (raw_event){
        // Preliminary step for processing event.
        var preliminary_chain = _.chain(raw_event["eventType"])
            // Get the possibility which remains maximum of probability in different condition of one behavior.
            .max(function (types){ return types["probability"]; })
            // Select the info of types out.
            .pick("types")
            // Convert dict to two-dimensional array.
            .pairs().last().last().pairs()
            // Calculate log as probability of each type.
            // type[0] is name of type.
            // type[1] is probability of type.
            .map(function (type){ return [type[0], Math.exp(type[1])]; });
        // Reduce step for Calculating average of probability in one type.
        var average_probability = preliminary_chain.unzip().last().reduce(function (memo, prob){ return memo + prob; }).value(),
            type_name           = preliminary_chain.max(function (type){ return type[1]; }).value()[0],
            type_prob           = preliminary_chain.max(function (type){ return type[1]; }).value()[1]/average_probability;

        return {
            type: type_name,
            prob: type_prob,
            startTime: raw_event["startTime"],
            endTime: raw_event["endTime"],
            behaviorId: raw_event["behaviorId"]
        };
    });

    // Computation of events set.
    var event_set = [{
        type: event_objs_list[0]["type"],
        prob: event_objs_list[0]["prob"],
        // Please do not revise the parameter because it is the optimal value.
        startTime: (event_objs_list[0]["startTime"] + event_objs_list[0]["endTime"])/2 - 5*60*1000,
        endTime: (event_objs_list[0]["startTime"] + event_objs_list[0]["endTime"])/2 + 5*60*1000,
        behaviorIds: [event_objs_list[0]["behaviorId"]]
    }];
    for (var i = 1; i < event_objs_list.length; i ++){
        if (event_objs_list[i]["type"] != event_objs_list[i-1]["type"]){
            var new_event = {
                type: event_objs_list[i]["type"],
                prob: event_objs_list[i]["prob"],
                startTime: (event_objs_list[i]["startTime"] + event_objs_list[i]["endTime"])/2 - 5*60*1000,
                endTime: (event_objs_list[i]["startTime"] + event_objs_list[i]["endTime"])/2 + 5*60*1000,
                behaviorIds: [event_objs_list[i]["behaviorId"]]
            };
            event_set.push(new_event);
        }
        else{
            event_set[event_set.length-1]["prob"] += event_objs_list[i]["prob"];
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

var _notifyUserTimeline = function (user_id, start_time, end_time){
    return dao.getTimeline(user_id, start_time, end_time).then(
        function (events){
            var res = {
                events: events
            };
            return notification.notifyUserEvents(user_id, res);
        },
        function (error){
            return AV.Promise.error(error);
        }
    ).then(
        function (result){
            console.log("The user " + user_id + " has been notified with msg: " +  JSON.stringify(result));
            return AV.Promise.as("The user " + user_id + " has been notified with msg: " +  result);
        },
        function (error){
            console.log("There is an error occurred when notify user " + user_id + " with msg: " + error);
            return AV.Promise.error(error);
        }
    );
};

exports.eventProcess = function (user_id, start_time, end_time){
    return dao.getUserRawEvent(user_id, start_time, end_time).then(
        function (raw_events){
            var work = new serialize_task.SerializeTask();
            var event_set = _middlewareRawEvents2EventSet(raw_events);
            event_set.forEach(function (event){
                work.addTask(event);
            });
            work.setWorker(function (event, resolve, reject){
                dao.addEvent(user_id, event["type"], event["prob"], event["startTime"], event["endTime"], event["behaviorIds"]).then(
                    function (res) {
                        console.log("A new event ( " + event["type"] +" ) was generated from " + new Date(event["startTime"]) +
                                    " to " + new Date(event["endTime"]) + " for user " + user_id);
                        // asynchorous running.
                        _notifyUserTimeline(user_id, start_time, end_time);
                        resolve(res);
                    },
                    function (error) {
                        console.log("There was an error occured which event is " + event["type"] +
                                    " for user " + user_id + " from " + event["startTime"] + " to " + event["endTime"]);
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
            console.log("There is an error occurred: " + error);
            return AV.Promise.error(error);
        }
    );
};

