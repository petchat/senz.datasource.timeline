/**
 * Created by woodie on 4/23/15.
 */

var _getUntreatedData = function (UserRawdata){
    var promise = new AV.Promise();
    var user_rawdata = AV.Object.extend(UserRawdata);
    var query = new AV.Query(user_rawdata);
    query.equalTo('processStatus', 'untreated');
    query.find().then(
        function (result) {
            console.log('From ' + UserRawdata);
            console.log('Successfully retrieved ' + result.length + ' untreated raw data.');
            var untreatedData = [];
            for (var i = 0; i < result.length; i++) {
                var data = {
                    'objectId': result[i].id,
                    'rawdataId': result[i].get('userRawdataId'),
                    'timestamp': result[i].get('timestamp')
                };
                console.log('* id: ' + result[i].id + '\n  timestamp: ' + result[i].get('timestamp'));
                untreatedData.push(data);
            }
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
        error: function(object, error_info){
            console.log('Error occurs! ' + error_info.code + ' ' + error_info.message);
        }
    });
    return promise;
};

exports.getUntreatedRawdata = function (){
    console.log('\nRetrieving untreated data...');
    return AV.Promise.when(
        _getUntreatedData('UserLocation'),
        _getUntreatedData('UserMotion'),
        _getUntreatedData('UserSound')
    );
};

exports.labelRawdataSenzed = function (location_id_list, motion_id_list, sound_id_list){
    console.log('\nMake the corresponding rawdata treated...');
    var promises = [];
    for (var id in location_id_list){
        promises.push(_labelRawdataSenzed('UserLocation', location_id_list[id]));
    }
    for (var id in motion_id_list){
        promises.push(_labelRawdataSenzed('UserMotion', motion_id_list[id]));
    }
    for (var id in sound_id_list){
        promises.push(_labelRawdataSenzed('UserSound',sound_id_list[id]));
    }
    return AV.Promise.when(promises);
};

exports.addSenz = function (location_obj_id, motion_obj_id, sound_obj_id, timestamp){
    console.log('\nAdding new generated senz to database...');
    var promise = new AV.Promise();
    var Senz = AV.Object.extend('UserSenz');
    var senz = new Senz();
    var motion_pointer = AV.Object.createWithoutData('UserMotion', motion_obj_id);
    var sound_pointer = AV.Object.createWithoutData('UserSound', sound_obj_id);
    var location_pointer = AV.Object.createWithoutData('UserLocation', location_obj_id);
    senz.set('userMotion', motion_pointer);
    senz.set('userLocation', location_pointer);
    senz.set('userSound', sound_pointer);
    senz.set('timestamp', timestamp);
    senz.save().then(
        function (senz){
            console.log('New Senz object created with objectId: ' + senz.id);
            promise.resolve(senz.id);
        },
        function (senz, error_info) {
            console.log('Failed to create new Senz object, with error code: ' + error.message);
            promise.reject(error_info);
        }
    );
    return promise;
};





