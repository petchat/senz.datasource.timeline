/**
 * Created by woodie on 4/26/15.
 */

exports.extractRawdataIdFromSenzList = function (rawdata_type, senz_list){
    var rawdata_id_list = [];
    for (var senz in senz_list){
        rawdata_id_list.push(senz_list[senz][rawdata_type]['objectId']);
    }
    return rawdata_id_list;
};