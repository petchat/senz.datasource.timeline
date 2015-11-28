var APP_ENV    = process.env.APP_ENV;

// level: one of the three config [level];
// expired: set config to default after [expired] seconds
exports.wilddog_strategy = {
    "location": {
        "shopping_street": {
            "level": "l1",
            "expired": 60*60
        },
        "comprehensive_market": {
            "level": "l1",
            "expired": 60*60
        },
        "residence" : {
            "level": "l3",
            "expired": 60*60
        },
        "bus_route": {
            "level": "l1",
            "expired": 60*60
        }
    },
    "motion": {
        "driving": {
            "level": "l1",
            "expired": 5*60
        },
        "biking": {
            "level": "l1",
            "expired": 5*60
        },
        "sitting": {
            "level": "l3",
            "expired": 5*60
        }
    }
};

exports.wilddog_config_l1 = {
    "sensor": {
        "collector": {
            "isActive": true,
            "period": 30
        },
        "uploader": {
            "isActive": true,
            "strategy": "network"
        }
    },
    "location": {
        "collector": {
            "isActive": true,
            "period": 30
        },
        "uploader": {
            "isActive": true,
            "strategy": "network"
        }
    },
    "calendar": {
        "collector": {
            "isActive": true,
            "period": 30
        },
        "uploader": {
            "isActive": true,
            "strategy": "wifi"
        }
    }
};
exports.wilddog_config_l2 = {
    "sensor": {
        "collector": {
            "isActive": true,
            "period": 300
        },
        "uploader": {
            "isActive": true,
            "strategy": "network"
        }
    },
    "location": {
        "collector": {
            "isActive": true,
            "period": 300
        },
        "uploader": {
            "isActive": true,
            "strategy": "network"
        }
    },
    "calendar": {
        "collector": {
            "isActive": true,
            "period": 300
        },
        "uploader": {
            "isActive": true,
            "strategy": "wifi"
        }
    }
};
exports.wilddog_config_l3 = {
    "sensor": {
        "collector": {
            "isActive": true,
            "period": 900
        },
        "uploader": {
            "isActive": true,
            "strategy": "network"
        }
    },
    "location": {
        "collector": {
            "isActive": true,
            "period": 900
        },
        "uploader": {
            "isActive": true,
            "strategy": "network"
        }
    },
    "calendar": {
        "collector": {
            "isActive": true,
            "period": 900
        },
        "uploader": {
            "isActive": true,
            "strategy": "wifi"
        }
    }
};

var _request_info = {
    "test": {
        "test_url": "http://httpbin.org/post",
        "time_type_url": "http://127.0.0.1:9011/time_type/",
        // Middleware from log to raw senzes.
        "log_rawsenzes": {
            "url": "https://api.trysenz.com/test/middleware/log/rawsenz/",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b000001fbaca010e5a8436d7355e09be7a2d436"
            }
        },
        // Middleware from raw senzes to refined senzes.
        "rawsenzes_refinedsenzes": {
            "url": "https://api.trysenz.com/test/middleware/rawsenz/refinedsenzes/",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b0000010025f1061a8a4a93601be2c05f83d70c"
            }
        },
        // Middleware from prob senzes to multiple senzes.
        "probsenzes_multisenzes": {
            "url": "https://api.trysenz.com/test/middleware/probsenzlist/multisenzlist/",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b0000015ed2dae1b3a14e217f3ffd5a9e9f6735"
            }
        },
        // Middleware from userbehavior to event.
        "userbehavior_event": {
            //"url": "http://120.27.30.239:13418/predict/",
            "url": "https://api.trysenz.com/test/users/behavior/predict/",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b000001fe069319f82742695d9584af4f43d771",
                "Content-Type": "application/json; charset=utf-8"
            }
        },
        "notification": {
            "url": "https://api.trysenz.com/test/sdk/notification/",
            "headers": {
                "Content-Type": "application/json; charset=utf-8",
                "X-senz-Auth": "5548eb2ade57fc001b0000018f8b08f5a0ea4120775a41f8396783d2"
            }
        }
    },
    "prod": {
        "test_url": "http://httpbin.org/post",
        "time_type_url": "http://127.0.0.1:9011/time_type/",
        // Middleware from log to raw senzes.
        "log_rawsenzes": {
            "url": "https://api.trysenz.com/middleware/log/rawsenz/",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b000001fbaca010e5a8436d7355e09be7a2d436"
            }
        },
        // Middleware from raw senzes to refined senzes.
        "rawsenzes_refinedsenzes": {
            "url": "https://api.trysenz.com/middleware/rawsenz/refinedsenzes/",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b0000010025f1061a8a4a93601be2c05f83d70c"
            }
        },
        // Middleware from prob senzes to multiple senzes.
        "probsenzes_multisenzes": {
            "url": "https://api.trysenz.com/middleware/probsenzlist/multisenzlist/",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b0000015ed2dae1b3a14e217f3ffd5a9e9f6735"
            }
        },
        // Middleware from userbehavior to event.
        "userbehavior_event": {
            //"url": "http://120.27.30.239:13418/predict/",
            "url": "https://api.trysenz.com/users/behavior/predict/",
            "headers": {
                "X-senz-Auth": "5548eb2ade57fc001b000001fe069319f82742695d9584af4f43d771",
                "Content-Type": "application/json; charset=utf-8"
            }
        },
        "notification": {
            "url": "https://api.trysenz.com/sdk/notification/",
            "headers": {
                "Content-Type": "application/json; charset=utf-8",
                "X-senz-Auth": "5548eb2ade57fc001b0000018f8b08f5a0ea4120775a41f8396783d2"
            }
        }
    }
};

var _logentries_token = {
    "prod": "17f926e1-b004-4c56-a606-8dd2b9aeab23",
    "test": "b9a59716-9311-4ba8-84a0-3d283fce7e93"
};

// ---- Environment Configuration ----

exports.request_info = _request_info[APP_ENV];

exports.logentries_token = _logentries_token[APP_ENV];

// ---- Basic Configuration ----

exports.statusInfoObj = {
    "userSound": ["soundProb"],
    "userMotion": ["motionProb"],
    "userLocation": ["poiProbLv2", "poiProbLv1"]
};

exports.counterfeitProb = {
    "motion": {"unknown": 1.0},
    "sound": {"unknown": 1.0},
    "location": {"unknown": 1.0}
};

exports.counterfeitObjectId = "counterfeitObjectId";

exports.collector_primary_key = "location";

exports.expertsSystemDatabase = {
    study_in_class: [
        {sound: "unknown", motion: "sitting", location: "university"},
        {sound: "unknown", motion: "unknown", location: "university"},
        {sound: "unknown", motion: "sitting", location: "high_school"},
        {sound: "unknown", motion: "unknown", location: "high_school"},
        {sound: "unknown", motion: "sitting", location: "library"},
        {sound: "unknown", motion: "unknown", location: "library"}
    ],
    work_in_office: [
        {sound: "unknown", motion: "sitting", location: "business_building"},
        {sound: "unknown", motion: "unknown", location: "business_building"},
        {sound: "unknown", motion: "sitting", location: "work_office"},
        {sound: "unknown", motion: "unknown", location: "work_office"}
    ],
    watch_movie: [
        {sound: "unknown", motion: "sitting", location: "movie"},
        {sound: "unknown", motion: "unknown", location: "movie"},
        {sound: "unknown", motion: "sitting", location: "cinema"},
        {sound: "unknown", motion: "unknown", location: "cinema"}
    ],
    exercise_outdoor: [
        {sound: "unknown", motion: "running", location: "university"},
        {sound: "unknown", motion: "running", location: "outdoor"},
        {sound: "unknown", motion: "running", location: "park"},
        {sound: "unknown", motion: "running", location: "traffic"}
    ],
    // Types only for experts system.
    on_the_way: [
        {sound: "unknown", motion: "walking", location: "subway"},
        {sound: "unknown", motion: "unknown", location: "subway"},
        {sound: "unknown", motion: "walking", location: "traffic"},
        {sound: "unknown", motion: "unknown", location: "traffic"}
    ],
    at_home: [
        {sound: "unknown", motion: "sitting", location: "home"},
        {sound: "unknown", motion: "unknown", location: "home"},
        {sound: "unknown", motion: "sitting", location: "residence"},
        {sound: "unknown", motion: "unknown", location: "residence"}
    ]
};

// The users who has generated relevent sensor data for past few time
exports.user_list = {
    "UserMotion":   [],
    "UserLocation": [],
    "UserSound":    []
};

exports.logEventType = {
    "sta": "Start",
    "ret": "Retrieving",
    "sav": "Saving",
    "upd": "Updating",
    "r2s": "Middleware.Log.RawSenz",
    "r2r": "Middleware.RawSenz.RefinedSenz",
    "p2m": "Middleware.ProbSenz.MultiSenz",
    "anl": "Analyser.User.Event"
};

