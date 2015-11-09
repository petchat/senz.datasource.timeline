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

exports.get_post_wilddog_config = function(user_id, situation, sub_situation){
    var wd_strategy = config['wilddog_strategy'];

    console.log('userid: ' + user_id + ' ' + sub_situation);
    if(wd_strategy[situation] && wd_strategy[situation][sub_situation]){
        var level = wd_strategy[situation][sub_situation].level;
        var expired = wd_strategy[situation][sub_situation].expired;
        //var status_old = config.wilddog_user_status[situation].pop();
        //config.wilddog_user_status[situation].push(sub_situation);

        //if(status_old == sub_situation){
            console.log('level: ' + level + ' ' + 'expired: ' + expired);
            if (level && expired) {
                _post_wilddog_config(user_id, config['wilddog_config_' + level]);
                timer.start(user_id, expired * 1000).then(
                    function () {
                        console.log('Timeout!!!');
                        _post_wilddog_config(user_id, config['wilddog_config_' + 'l2']);
                    }
                );
            }
        }
    //}
};