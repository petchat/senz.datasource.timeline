/**
 * Created by woodie on 4/23/15.
 */
var config = require('cloud/config.js');
var util = require('cloud/util.js');

var user_status = AV.Object.extend('UserStatus');
var Behavior = AV.Object.extend('UserBehavior');
var Senz = AV.Object.extend('UserSenz');

var _getUnbindData = function (UserRawdata, is_training) {
    var promise = new AV.Promise();
    var user_rawdata = AV.Object.extend(UserRawdata);
    var query = new AV.Query(user_rawdata);
    query.ascending("timestamp");
    query.equalTo('processStatus', 'untreated');
    query.equalTo('isTrainingSample', is_training);
    query.find().then(
        function (results) {
            console.log('From ' + UserRawdata);
            console.log('Successfully retrieved ' + results.length + ' untreated raw data.');
            var untreatedData = {};
            results.forEach(function (result) {
                var user = result.get('user').id;
                if (!(user in untreatedData)) {
                    // Add the new user to the global user id list
                    config.user_list[UserRawdata].push(user);
                    untreatedData[user] = [];
                }
                console.log('Find the user ' + user + ' data');
                var data = {
                    'objectId': result.id,
                    'rawdataId': result.get('userRawdataId'),
                    'timestamp': result.get('timestamp')
                };
                console.log('* id: ' + result.id + '\n  timestamp: ' + result.get('timestamp'));
                untreatedData[user].push(data);
            });
            console.log('untreated data content is:\n' + JSON.stringify(untreatedData, null, 4));
            promise.resolve(untreatedData);
        },
        function (error_info) {
            console.log('  Error occurs! ' + error_info.code + ' ' + error_info.message);
            promise.reject(error_info);
        }
    );
    return promise;
};

var _completeRawdataBinding = function (UserRawdata, rawdata_id) {
    console.log('* id: ' + rawdata_id + ' in Class ' + UserRawdata);
    var promise = new AV.Promise();
    if (rawdata_id == config.counterfeitObjectId){
        console.log('  It is a counterfeit object, there is no need to update status!');
        promise.resolve(rawdata_id);
    }
    else {
        var user_rawdata = AV.Object.extend(UserRawdata);
        var query = new AV.Query(user_rawdata);
        query.get(rawdata_id, {
            success: function (userRawdata) {
                var date = new Date();
                // *** HERE NEED TO REVISE THE PROCESS STATUS TO SENZED ***
                userRawdata.set('processStatus', 'senzed');
                userRawdata.set('senzedAt', date);
                userRawdata.save().then(
                    function (obj) {
                        console.log('  Update status successfully!');
                        promise.resolve(obj.id);
                    },
                    function (error_info) {
                        console.log('  Failed to update status, with error code: ' + error_info.message);
                        promise.reject(error_info)
                    }
                );
            },
            error: function (error_info) {
                // TODO promise.reject, convert to .then .then
                console.log('Error occurs! ' + error_info.code + ' ' + error_info.message);
            }
        });
    }
    return promise;
};

var _addSenz = function (user_id, location_obj_id, motion_obj_id, sound_obj_id, timestamp, is_training) {
    console.log(
        'At Unix time ' + new Date(timestamp)
        + '\nfor the user ' + user_id
        + '\n* motion id: ' + motion_obj_id
        + '\n* location id: ' + location_obj_id
        + '\n* sound id: ' + sound_obj_id
    );
    var promise = new AV.Promise();
    //var Senz = AV.Object.extend('UserSenz');
    var senz = new Senz();
    if (motion_obj_id != config.counterfeitObjectId){
        var motion_pointer = AV.Object.createWithoutData('UserMotion', motion_obj_id);
        senz.set('userMotion', motion_pointer);
    }
    if (sound_obj_id != config.counterfeitObjectId){
        var sound_pointer = AV.Object.createWithoutData('UserSound', sound_obj_id);
        senz.set('userSound', sound_pointer);
    }
    if (location_obj_id != config.counterfeitObjectId){
        var location_pointer = AV.Object.createWithoutData('UserLocation', location_obj_id);
        senz.set('userLocation', location_pointer);
    }
    var user_pointer = AV.Object.createWithoutData('_User', user_id);
    senz.set('user', user_pointer);
    senz.set('timestamp', timestamp);
    senz.set('isTrainingSample', is_training);
    // Set the senz's time zone.
    senz.set('tenMinScale', util.calculateTimeZone(timestamp, 'tenMinScale'));
    senz.set('halfHourScale', util.calculateTimeZone(timestamp, 'halfHourScale'));
    senz.set('perHourScale', util.calculateTimeZone(timestamp, 'perHourScale'));
    senz.save().then(
        function (senz) {
            console.log('  New Senz object created with objectId: ' + senz.id);
            var result = {
                'user_id': user_id,
                'senz_id': senz.id,
                'location_id': location_obj_id,
                'motion_id': motion_obj_id,
                'sound_id': sound_obj_id
            };
            promise.resolve(result);
        },
        function (error_info) {
            console.log('  Failed to create new Senz object, with error code: ' + error_info.code + ' ' + error_info.message);
            promise.reject(error_info);
        }
    );
    return promise;
};

exports.getUnbindRawdata = function (is_training) {
    console.log('\nRetrieving untreated data...');
    console.log('------------------------------------------');
    return AV.Promise.when(
        _getUnbindData('UserLocation', is_training),
        _getUnbindData('UserMotion', is_training),
        _getUnbindData('UserSound', is_training)
    );
};

exports.completeRawdataBinding = function (location_id_list, motion_id_list, sound_id_list) {
    console.log('\nMake the corresponding rawdata treated...');
    console.log('------------------------------------------');
    //console.log('The location id list: \n'+ location_id_list + '\nThe motion id list: \n' + motion_id_list + '\nThe sound id list: \n' + sound_id_list);
    var promises = [];
    location_id_list.forEach(function (id) {
        promises.push(_completeRawdataBinding('UserLocation', id));
    });
    motion_id_list.forEach(function (id) {
        promises.push(_completeRawdataBinding('UserMotion', id));
    });
    sound_id_list.forEach(function (id) {
        promises.push(_completeRawdataBinding('UserSound', id));
    });
    return AV.Promise.all(promises);
};

exports.addSenz = function (user, senz_list, is_training) {
    console.log('\nAdding new generated senzes to database...');
    console.log('------------------------------------------');
    var promises = [];
    var user_id = user;
    senz_list.forEach(function (senz_tuple) {
        var location_id = "",
            motion_id   = "",
            sound_id    = "";
        if (!!senz_tuple['location']){
            location_id = senz_tuple['location']['objectId'];
        }
        else{
            location_id = config.counterfeitObjectId;
        }
        if (!!senz_tuple['motion']){
            motion_id = senz_tuple['motion']['objectId'];
        }
        else{
            motion_id = config.counterfeitObjectId;
        }
        if (!!senz_tuple['sound']){
            sound_id = senz_tuple['sound']['objectId'];
        }
        else{
            sound_id = config.counterfeitObjectId;
        }
        //var location_id = senz_tuple['location']['objectId'];
        //var motion_id = senz_tuple['motion']['objectId'];
        //var sound_id = senz_tuple['sound']['objectId'];
        var timestamp = senz_tuple[config.collector_primary_key]['timestamp'];
        promises.push(_addSenz(user_id, location_id, motion_id, sound_id, timestamp, is_training));
    });
    return AV.Promise.all(promises);
};

exports.getUserRawBehavior = function (user_id, start_time, end_time, is_training) {
    //console.log('\nRetrieving User ' + user_id + ' Behavior...');
    //console.log('------------------------------------------');
    var promise = new AV.Promise();
    var user = AV.Object.createWithoutData('_User', user_id);
    var query = new AV.Query(Senz);
    query.equalTo('user', user);
    query.equalTo('isTrainingSample', is_training);
    query.greaterThan('timestamp', start_time);
    query.lessThan('timestamp', end_time);
    query.limit(500);
    query.include('userSound');
    query.include('userLocation');
    query.include('userMotion');
    query.find().then(
        function (results) {
            //console.log('  Successfully retrieved ' + results.length + ' senzes in User Behavior during this period.');
            var behavior = [];
            results.forEach(function (result) {
                var data = {
                    'senzId': result.id,
                    'tenMinScale': result.get('tenMinScale'),
                    'halfHourScale': result.get('halfHourScale'),
                    'perHourScale': result.get('perHourScale'),
                    'timestamp': result.get('timestamp')
                };
                // counterfeit motion prob
                if (result.get('userMotion') != undefined){
                    data['motionProb'] = result.get('userMotion')['attributes']['motionProb'];
                }
                else {
                    data['motionProb'] = config.counterfeitProb['motion'];
                }
                // counterfeit location prob
                if (result.get('userLocation') != undefined){
                    data['poiProbLv1'] = result.get('userLocation')['attributes']['poiProbLv1'];
                    data['poiProbLv2'] = result.get('userLocation')['attributes']['poiProbLv2'];
                }
                else {
                    data['poiProbLv1'] = config.counterfeitProb['location'];
                    data['poiProbLv2'] = config.counterfeitProb['location'];
                }
                // counterfeit sound prob
                if (result.get('userSound') != undefined){
                    data['soundProb'] = result.get('userSound')['attributes']['soundProb'];
                }
                else {
                    data['soundProb'] = config.counterfeitProb['sound'];
                }
                //if (result.get('userMotion') != undefined &&
                //    result.get('userLocation') != undefined &&
                //    result.get('userSound') != undefined) {
                //    data = {
                //        'senzId': result.id,
                //        'motionProb': result.get('userMotion')['attributes']['motionProb'],
                //        'poiProbLv1': result.get('userLocation')['attributes']['poiProbLv1'],
                //        'poiProbLv2': result.get('userLocation')['attributes']['poiProbLv2'],
                //        'soundProb': result.get('userSound')['attributes']['soundProb'],
                //        'tenMinScale': result.get('tenMinScale'),
                //        'halfHourScale': result.get('halfHourScale'),
                //        'perHourScale': result.get('perHourScale'),
                //        'timestamp': result.get('timestamp')
                //    };
                //}
                behavior.push(data);
            });
            var user_behavior = new Object({'user': user_id, 'behavior': behavior});
            //console.log('  The result is:\n' + JSON.stringify(user_behavior, null, 4));
            promise.resolve(user_behavior);
        },
        function (error_info) {
            console.log('  Error occurs! ' + error_info.code + ' ' + error_info.message);
            promise.reject(error_info);
        }
    );
    return promise;
};

exports.addBehavior = function (user_id, behavior_data, day_type, senz_id_list, start_time, end_time) {
    var behavior = new Behavior();
    var related_senzes = [];
    senz_id_list.forEach(function (senz_id) {
        related_senzes.push(AV.Object.createWithoutData("UserSenz", senz_id));
    });
    var user_pointer = AV.Object.createWithoutData('_User', user_id);
    var relation = behavior.relation("relatedSenzes");
    //var timestamp = new Date();
    if (behavior_data.length >= 1){
        behavior.set('behaviorData', behavior_data);
        behavior.set('user', user_pointer);
        //behavior.set('startTime', behavior_data[0]['timestamp']);
        //behavior.set('endTime', behavior_data[behavior_data.length - 1]['timestamp']);
        behavior.set('startTime', start_time);
        behavior.set('endTime', end_time);
        behavior.set('dayType', day_type);
        relation.add(related_senzes);
        return behavior.save();
    }
    else{
        return AV.Promise.error("the behavior is undefine");
    }
};

exports.getUserBehaviorLastUpdateTime = function (user_id) {
    var promise = new AV.Promise();
    var user = AV.Object.createWithoutData('_User', user_id);
    var query = new AV.Query(user_status);
    query.equalTo('user', user);
    query.ascending("timestamp");
    query.first().then(
        function (result) {
            var timestamp = result.get("behaviorLastUpdatedAt");
            console.log(timestamp);
            promise.resolve(timestamp);
        },
        function (error_info) {
            promise.reject(error_info);
        }
    );
    return promise;
};

exports.updateUserBehaviorLastUpdatedTime = function (user_id, unix_timestamp) {
    var new_timestamp = new Date(unix_timestamp);
    var user = AV.Object.createWithoutData('_User', user_id);
    var query = new AV.Query(user_status);
    query.equalTo('user', user);
    query.ascending("timestamp");
    return query.first().then(
        function (result) {
            return query.get(result.id);
        }
    ).then(
        function (user){
            console.log("New time is:");
            console.log(new_timestamp);
            //user.set('behaviorLastUpdatedAt', new_timestamp);
            return user.save();
        }
    );
};




