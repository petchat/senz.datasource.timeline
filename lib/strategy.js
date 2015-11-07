var config          = require('./config.js');
var timer           = require('timer-promise');

var _post_wilddog_config = function(user_id, config){
    var req = require('request');
    req.post({url: "https://leancloud.cn/1.1/functions/notify_new_config",
            headers: {"X-LC-Id": "wsbz6p3ouef94ubvsdqk2jfty769wkyed3qsry5hebi2va2h",
                "X-LC-Key": "6z6n0w3dopxmt32oi2eam2dt0orh8rxnqc8lgpf2hqnar4tr"},
            json: {"userId": user_id, "config": config}},
        function(err, res, body){
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                console.log(err);
            }
            else{
                var body_str = JSON.stringify(body);
                console.log(body_str);
            }
        });
};

var _get_post_wilddog_config = function(situation, sub_situtation, user_id, threshold){
    var wd_strategy = config['wilddog_strategy'];
    var level = "l2";

    console.log('userid: ' + user_id + ' ' + sub_situtation);
    if(wd_strategy[situation] && wd_strategy[situation][sub_situtation]){
        level = wd_strategy[situation][sub_situtation];
    }

    console.log('level: ' + level);
    _post_wilddog_config(user_id, config['wilddog_config_' + level]);
    timer.start(user_id, threshold*1000).then(
        function(){
            console.log('Timeout!!!');
            _post_wilddog_config(user_id, config['wilddog_config_' + 'l2']);
        }
    );
};

exports.post_wilddog_config = _post_wilddog_config;
exports.get_post_wilddog_config = _get_post_wilddog_config;