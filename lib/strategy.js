var config          = require('./config.js');
var timer           = require('timer-promise');
var rp              = require('request-promise');

var tmp_frequency = {};

var _post_wilddog_config = function(user_id, config){
    var options = {
        method: 'POST',
        uri: "https://leancloud.cn/1.1/functions/notify_new_config",
        json: {"userId": user_id, "config": config},
        headers: {
            "X-LC-Id": "wsbz6p3ouef94ubvsdqk2jfty769wkyed3qsry5hebi2va2h",
            "X-LC-Key": "6z6n0w3dopxmt32oi2eam2dt0orh8rxnqc8lgpf2hqnar4tr"
        }
    };
    return rp(options).then(
        function (body) {
            console.log(JSON.stringify(body));
        },
        function (err) {
            console.log(err);
        }
    );
};


exports.get_post_wilddog_config = function(user_id, situation, sub_situation){
    var wd_strategy = config['wilddog_strategy'];

    console.log('userid: ' + user_id + ' ' + sub_situation);
    if(wd_strategy[situation] && wd_strategy[situation][sub_situation]){
        var level = wd_strategy[situation][sub_situation].level;
        var expired = wd_strategy[situation][sub_situation].expired;
        var will_send_count = 4;
        console.log('level: ' + level + ' ' + 'expired: ' + expired);

        if(tmp_frequency[user_id]){
            tmp_frequency[user_id].push(sub_situation);
        }else{
            tmp_frequency[user_id] = [sub_situation];
        }

        tmp_frequency[user_id].slice(-will_send_count, -1).forEach(function(item){
            var last = tmp_frequency[user_id].length - 1;
            if(item == tmp_frequency[user_id][last]){
                will_send_count -= 1;
            }
        });
        if (will_send_count == 1) {
            tmp_frequency[user_id] = [];
            return _post_wilddog_config(user_id, config['wilddog_config_' + level])
                .then(
                    function(){
                        return timer.start(user_id, expired * 1000)
                    },
                    function() {
                        console.log("post wilddog config error");
                    })
                .then(
                    function () {
                        console.log('Timeout!!!');
                        return _post_wilddog_config(user_id, config['wilddog_config_' + 'l2']);
                    },
                    function(){
                        console.log('post default config error');
                    });
            //_post_wilddog_config(user_id, config['wilddog_config_' + level]);
            //timer.start(user_id, expired * 1000).then(
            //    function () {
            //        console.log('Timeout!!!');
            //        _post_wilddog_config(user_id, config['wilddog_config_' + 'l2']);
            //    }
            //);
        }
    }
};