/**
 * Created by woodie on 4/26/15.
 */

var inArray = function (element, array){
    for (index in array){
        if (array[index] == element){
            return true;
        }
    }
    return false;
};

exports.extractRawdataIdFromSenzList = function (rawdata_type, senz_list){
    var rawdata_id_list = new Array();
    for (var user in senz_list){
        for (var senz in senz_list[user]){
            rawdata_id_list.push(senz_list[user][senz][rawdata_type]);
        }
    }
    return rawdata_id_list;
};


exports.universalUsersSet = function (users_sets){
    var universal_set = new Array();
    for (users_set in users_sets){
        for (user in users_sets[users_set]){
            if (!inArray(users_sets[users_set][user], universal_set)){
                universal_set.push(users_sets[users_set][user]);
            }
        }
    }
    return universal_set;
};