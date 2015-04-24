/**
 * Created by woodie on 4/23/15.
 */
//var untreatedData = {
//    'UserLocation': [],
//    'UserMotion': [],
//    'UserSound': []
//};

var _getUntreatedData = function (UserRawdata) {
    var promise = new AV.Promise();
    var user_rawdata = AV.Object.extend(UserRawdata);
    var query = new AV.Query(user_rawdata);
    query.equalTo('processStatus', 'untreated');
    query.find().then(
        function (result) {
            console.log('\nFrom ' + UserRawdata);
            console.log('Successfully retrieved ' + result.length + ' untreated raw data.');
            var untreatedData = [];
            for (var i = 0; i < result.length; i++) {
                var data = {
                    'objectId': result[i].id,
                    'rawdataId': result[i].get('userRawdataId'),
                    'timestamp': result[i].get('timestamp')
                };
                console.log('* id: ' + result[i].id + '\n* timestamp: ' + result[i].get('timestamp'));
                untreatedData.push(data);
            }
            promise.resolve(untreatedData);
        },
        function (error_info) {
            console.log('\nError occurs! ' + error_info.code + ' ' + error_info.message);
            promise.reject(error_info);
        }
    );
    return promise;
};

exports.getUntreatedData = function (callback) {
    console.log('\nRetrieving untreated data...');
    AV.Promise.when(
        _getUntreatedData('UserLocation'),
        _getUntreatedData('UserMotion'),
        _getUntreatedData('UserSound')
    ).then(function (user_location, user_motion, user_sound){
            callback(user_location, user_motion, user_sound)
    });
};

exports.addSenz = function (location_obj_id, motion_obj_id, sound_obj_id, timestamp, callback) {
    console.log('\nAdding new generated senz to database...');
    var Senz = AV.Object.extend('UserSenz');
    var senz = new Senz();
    var motion_pointer = AV.Object.createWithoutData('UserMotion', motion_obj_id);
    var sound_pointer = AV.Object.createWithoutData('UserSound', sound_obj_id);
    var location_pointer = AV.Object.createWithoutData('UserLocation', location_obj_id);
    senz.set('userMotion', motion_pointer);
    senz.set('userLocation', location_pointer);
    senz.set('userSound', sound_pointer);
    senz.set('timestamp', timestamp);
    senz.save(null, {
        success: function (senz) {
            console.log('\nNew Senz object created with objectId: ' + senz.id);
            callback(senz.id);
        },
        error: function (senz, error) {
            console.log('\nFailed to create new Senz object, with error code: ' + error.message);
        }
    });

};




