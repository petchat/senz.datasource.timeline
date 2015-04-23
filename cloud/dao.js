/**
 * Created by woodie on 4/23/15.
 */
var untreatedData = {
    'UserLocation': [],
    'UserMotion': [],
    'UserSound': []
};

var _getUntreatedData = function(UserRawdata){
    var user_rawdata = AV.Object.extend(UserRawdata);
    var query = new AV.Query(user_rawdata);
    query.equalTo('processStatus', 'untreated');
    return query.find({
        success: function(result){
            console.log('\nFrom ' + UserRawdata);
            console.log('Successfully retrieved '+ result.length + ' untreated raw data.');
            for (var i = 0; i < result.length; i++){
                var data = {
                    'objectId':  result[i].id,
                    'rawdataId': result[i].get('userRawdataId'),
                    'timestamp': result[i].get('timestamp')
                };
                untreatedData[UserRawdata].push(result[i]);
            }
        },
        error: function(error_info){
            console.log('Error occurs! ' + error_info.code + ' ' + error_info.message);
        }
    });
};

exports.getUntreatedData = function(callback){
    console.log('\nRetrieving untreated data...\n');
    var promises = [];
    promises.push(_getUntreatedData('UserLocation'));
    promises.push(_getUntreatedData('UserMotion'));
    promises.push(_getUntreatedData('UserSound'));
    AV.Promise.when(promises).then(callback(untreatedData));
};

exports.addSenz = function(motion_objid, sound_objid, location_objid, timestamp, callback){
    console.log('\nAdding new generated senz to database...\n');
    var Senz = AV.Object.extend('UserSenz');
    var senz = new Senz();
    var motion_pointer = AV.Object.createWithoutData('UserMotion', motion_objid);
    var sound_pointer = AV.Object.createWithoutData('UserSound', sound_objid);
    var location_pointer = AV.Object.createWithoutData('UserLocation', location_objid);
    senz.set('userMotion', motion_pointer);
    senz.set('userLocation', location_pointer);
    senz.set('userSound', sound_pointer);
    senz.set('timestamp', timestamp);
    senz.save(null, {
        success: function(senz){
            console.log('New Senz object created with objectId: ' + senz.id);
            callback(senz.id);
        },
        error: function(senz, error){
            console.log('Failed to create new Senz object, with error code: ' + error.message);
        }
    });

};




