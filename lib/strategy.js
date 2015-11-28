var config          = require('./config.js');
var timer           = require('timer-promise');
var rp              = require('request-promise');
var dao             = require('./dao.js');
var logger          = require("./logger.js");
var AV              = require('leanengine');
var _              = require('underscore');


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
            console.log(body.result.message);
            logger.info("wilddog_config", "write config to wilddog success");
            return AV.Promise.as("post success");
        })
        .catch(
        function (err) {
            console.log(err.message);
            logger.error("wilddog_config", "write config to wilddog error");
            return AV.Promise.error(err.message);
        });
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

var wilddog_config_posted_flag = {}; //事件缓冲,满足对应次数后改变config
var wilddog_config_last_config = {}; //上一次的config

var _calculate_config = function(user_id, strategy, situation, sub_situation){
	console.log('user_id: ' + user_id + ' sub_situtaion: ' + sub_situation);

    if(!wilddog_config_posted_flag[user_id]) {
        wilddog_config_posted_flag[user_id] = {};
    }
	if(! wilddog_config_posted_flag[user_id][situation]){
		wilddog_config_posted_flag[user_id][situation] = [];
	}

	var ret_config = undefined;
	if(strategy[situation] && strategy[situation][sub_situation]){
		var level = strategy[situation][sub_situation].level;
		ret_config = config['wilddog_config_' + level];
	}

	wilddog_config_posted_flag[user_id][situation].forEach(function(item){
		if(item != sub_situation){
			ret_config = config['wilddog_config_l2'];
		}
	});

	if(wilddog_config_posted_flag[user_id][situation].length < 3){
		ret_config = undefined;
	}


	if(_.isEqual(wilddog_config_last_config[user_id], ret_config)){
		ret_config = undefined;
	}
	wilddog_config_last_config[user_id] = ret_config;

	wilddog_config_posted_flag[user_id][situation].push(sub_situation);
	if(wilddog_config_posted_flag[user_id][situation].length > 3){
		wilddog_config_posted_flag[user_id][situation].shift();
	}

	console.log(wilddog_config_posted_flag[user_id]);
	return ret_config;
};

exports.get_post_wilddog_config = function(user_id, situation, sub_situation){
    console.log("get_post_wilddog_config");
    dao.get_wilddog_strategy()
    .then(
        function(wd_strategy){
            var config = _calculate_config(user_id, wd_strategy, situation, sub_situation);
            var expired = _calculate_expired(wd_strategy, situation, sub_situation);
            return AV.Promise.as(config, expired);
        },
        function(err){
            return AV.Promise.error(err);
        })
    .then(
        function(config, expired){
            if(config){
                return _post_wilddog_config(user_id, config).then(
                    function(){
                        timer.start(user_id, expired*1000)
                            .then(
                                function(){
                                    console.log('Timeout!!!');
	                                wilddog_config_last_config[user_id] = undefined;
                                    return _post_wilddog_config(user_id, _get_default_config());
                                },
                                function(err){
                                    return AV.Promise.error(err);
                            })
                    },
                    function(err){
                        return AV.Promise.error(err);
                    })
            }else{
                console.log(user_id + " default config ignored!");
            }
        },
        function(err){
            return AV.Promise.error(err);
        })
};
