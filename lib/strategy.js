var config          = require('./config.js');
var timer           = require('timer-promise');
var rp              = require('request-promise');
var dao             = require('./dao.js');
var AV              = require('leanengine');


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
            //console.log(JSON.stringify(body));
            return AV.Promise.as(body);
        },
        function (err) {
            //console.log(err);
            return AV.Promise.error(err);
        }
    );
};

var _get_default_config = function(){
    return config['wilddog_config_' + 'l2'];
};
var _calculate_expired = function(strategy, situation, sub_situation){
    if(strategy[situation] && strategy[situation][sub_situation]) {
        return strategy[situation][sub_situation].expired;
    }
    return 300;
};

var tmp_frequency = {};
var _calculate_config = function(user_id, strategy, situation, sub_situation){
    var will_send_count = 3;

    if(strategy[situation] && strategy[situation][sub_situation]) {
        var level = strategy[situation][sub_situation].level;

        if (tmp_frequency[user_id]) {
            tmp_frequency[user_id].push(sub_situation);
        } else {
            tmp_frequency[user_id] = [sub_situation];
        }

        if (tmp_frequency[user_id].length > will_send_count){
            tmp_frequency[user_id].length = 0;
        }

        tmp_frequency[user_id].slice(-will_send_count, -1).forEach(function (item) {
            var last = tmp_frequency[user_id].length - 1;
            if (item == tmp_frequency[user_id][last]) {
                will_send_count -= 1;
            }
        });
    }
    return will_send_count == 1 ? config['wilddog_config_' + level] : config['wilddog_config_' + 'l2'];
};


exports.get_post_wilddog_config = function(user_id, situation, sub_situation){
    var expired = 300;
    dao.get_wilddog_strategy()
        .then(
            function(wd_strategy){
                var config = _calculate_config(user_id, wd_strategy, situation, sub_situation);
                expired = _calculate_expired(wd_strategy, situation, sub_situation);
                return AV.Promise.as(config);
            },
            function(err){
                return AV.Promise.error(err);
            })
        .then(
            function(config){
                return _post_wilddog_config(user_id, config)
            },
            function(err){
                return AV.Promise.error(err);
            })
        .then(
            function () {
                return timer.start(user_id, expired * 1000)
            },
            function(err){
                return AV.Promise.error(err);
            })
        .then(
            function () {
                console.log('Timeout!!!');
                return _post_wilddog_config(user_id, _get_default_config());
            },
            function(err){
                return AV.Promise.error(err);
            });
};
