/**
 * Created by woodie on 4/26/15.
 */
var _ = require("underscore");
var Set = require("simplesets").Set;

exports.bindRawdataIdFromSenzList = function (rawdata_type, senz_list){
    var rawdata_id_list = new Set();
    senz_list.forEach(function (user){
        user.forEach(function (senz){
            rawdata_id_list.add(senz[rawdata_type]);
        });
    });
    return rawdata_id_list._items;
};


exports.uniqueUsersSet = function (users_sets){
    var universal_set = new Set();
    for (var users_set in users_sets) {
        users_sets[users_set].forEach(function (user) {
            universal_set.add(user);
        });
    }
    return universal_set._items;
};

// time_zone_type:
// - tenMinScale
// - halfHourScale
// - perHourScale
exports.calculateTimeZone = function (the_unix_time, time_zone_type){
    var the_time = new Date(the_unix_time);
    var year     = the_time.getFullYear();
    var month    = the_time.getMonth();
    var date     = the_time.getDate();
    // Set the start time of this day.
    var the_day  = new Date();
    the_day.setFullYear(year);the_day.setMonth(month);the_day.setDate(date);
    the_day.setHours(0);the_day.setMinutes(0);the_day.setSeconds(0);the_day.setMilliseconds(0);
    // Calculate interval time.
    var interval_time  = the_time - the_day;
    // Set the time zone.
    if (time_zone_type == 'tenMinScale'){
        return Math.floor(interval_time / (1000*60*10));
    }
    else if (time_zone_type == 'halfHourScale'){
        return Math.floor(interval_time / (1000*60*30));
    }
    else if (time_zone_type == 'perHourScale'){
        return Math.floor(interval_time / (1000*60*60));
    }
    else{
        console.log('Calculate Time Zone: There is default time zone selected.');
        return Math.floor(interval_time / (1000*60));
    }
};


// TODO: From database, not this function.
exports.convertSenz = function (behaivor) {
    var new_behavior = [];
    behaivor.forEach(function (senz){
        var prob_object = _.pick(senz, "motionProb", "poiProbLv2", "poiProbLv1", "soundProb");
        var new_senz = _.omit(senz, "motionProb", "poiProbLv2", "poiProbLv1", "soundProb");
        new_senz["motion"] = prob_object["motionProb"];
        new_senz["location"] = prob_object["poiProbLv2"];
        new_senz["sound"] = prob_object["soundProb"];
        new_behavior.push(new_senz);
    });
    return new_behavior;
};
