/**
 * Created by woodie on 4/23/15.
 */
config = require('cloud/config.js');

var _getUntreatedData = function (UserRawdata){
    var promise = new AV.Promise();
    var user_rawdata = AV.Object.extend(UserRawdata);
    var query = new AV.Query(user_rawdata);
    query.equalTo('processStatus', 'untreated');
    query.find().then(
        function (result) {
            console.log('From ' + UserRawdata);
            console.log('Successfully retrieved ' + result.length + ' untreated raw data.');
            var untreatedData = new Object();
            for (var i = 0; i < result.length; i++) {
                var user = result[i].get('user').id;
                if (!(user in untreatedData)){
                    // Add the new user to the global user id list
                    config.user_list[UserRawdata].push(user);
                    untreatedData[user] = new Array();
                }
                console.log('Find the user ' + user + ' data');
                var data = {
                    'objectId': result[i].id,
                    'rawdataId': result[i].get('userRawdataId'),
                    'timestamp': result[i].get('timestamp')
                };
                console.log('* id: ' + result[i].id + '\n  timestamp: ' + result[i].get('timestamp'));
                untreatedData[user].push(data);
            }
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

var _labelRawdataSenzed = function (UserRawdata, rawdata_id){
    console.log('* id: ' + rawdata_id + ' in Class ' + UserRawdata);
    var promise = new AV.Promise();
    var user_rawdata = AV.Object.extend(UserRawdata);
    var query = new AV.Query(user_rawdata);
    query.get(rawdata_id, {
        success: function(userRawdata){
            var date = new Date();
            // *** HERE NEED TO REVISE THE PROCESS STATUS TO SENZED ***
            userRawdata.set('processStatus', 'untreated');
            userRawdata.set('senzedAt', date);
            userRawdata.save().then(
                function(obj){
                    console.log('  Update status successfully!');
                    promise.resolve(obj);
                },
                function(error_info){
                    console.log('  Failed to update status, with error code: ' + error_info.message);
                    promise.reject(error_info);
                }
            );
        },
        error: function(error_info){
            console.log('Error occurs! ' + error_info.code + ' ' + error_info.message);
        }
    });
    return promise;
};

var _addSenz = function (user_id, location_obj_id, motion_obj_id, sound_obj_id, timestamp){
    console.log('At Unix time ' + timestamp + ' for the user ' + user_id + '\n* motion id: ' + motion_obj_id + '\n* location id: ' + location_obj_id + '\n* sound id: ' + sound_obj_id);
    var promise = new AV.Promise();
    var Senz = AV.Object.extend('UserSenz');
    var senz = new Senz();
    var motion_pointer   = AV.Object.createWithoutData('UserMotion', motion_obj_id);
    var sound_pointer    = AV.Object.createWithoutData('UserSound', sound_obj_id);
    var location_pointer = AV.Object.createWithoutData('UserLocation', location_obj_id);
    var user_pointer     = AV.Object.createWithoutData('_User', user_id);
    senz.set('userMotion', motion_pointer);
    senz.set('userLocation', location_pointer);
    senz.set('userSound', sound_pointer);
    senz.set('user', user_pointer);
    senz.set('timestamp', timestamp);
    senz.save().then(
        function (senz){
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

exports.getUntreatedRawdata = function (){
    console.log('\nRetrieving untreated data...');
    console.log('------------------------------------------');
    return AV.Promise.when(
        _getUntreatedData('UserLocation'),
        _getUntreatedData('UserMotion'),
        _getUntreatedData('UserSound')
    );
};

exports.labelRawdataSenzed = function (location_id_list, motion_id_list, sound_id_list){
    console.log('\nMake the corresponding rawdata treated...');
    console.log('------------------------------------------');
    console.log('The location id list: \n'+ location_id_list + '\nThe motion id list: \n' + motion_id_list + '\nThe sound id list: \n' + sound_id_list);
    var promises = new Array();
    for (var id in location_id_list){
        promises.push(_labelRawdataSenzed('UserLocation', location_id_list[id]));
    }
    for (var id in motion_id_list){
        promises.push(_labelRawdataSenzed('UserMotion', motion_id_list[id]));
    }
    for (var id in sound_id_list){
        promises.push(_labelRawdataSenzed('UserSound',sound_id_list[id]));
    }
    return AV.Promise.all(promises);
};

// For one user.
exports.addSenz = function (user, senz_list){
    console.log('\nAdding new generated senzes to database...');
    console.log('------------------------------------------');
    var promises = new Array();
    var user_id  = user;
    for (var senz_tuple in senz_list){
        var location_id = senz_list[senz_tuple]['location']['objectId'];
        var motion_id = senz_list[senz_tuple]['motion']['objectId'];
        var sound_id = senz_list[senz_tuple]['sound']['objectId'];
        var timestamp = senz_list[senz_tuple][config.collector_primary_key]['timestamp'];
        promises.push(_addSenz(user_id, location_id, motion_id, sound_id, timestamp));
    }
    return AV.Promise.all(promises);
};






