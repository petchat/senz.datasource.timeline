var express = require("express");
var AV      = require("leanengine");

var path         = require("path");
var cookieParser = require("cookie-parser");
var bodyParser   = require("body-parser");

var cloud   = require("./cloud.js");
var context = require("./routes/context.js");
var events  = require("./routes/events.js");

var app = express();

// Set view engine.
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

// Loading Cloud function
app.use(cloud);

//app.use(AV.Cloud);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get("/hello", function(req, res) {
    res.json({ currentTime: new Date() });
});

// Defined routers
app.use("/context", context);
app.use("/events", events);

// 如果任何路由都没匹配到，则认为 404
// 生成一个异常让后面的 err handler 捕获
app.use(function(req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

// error handlers

// 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
if (app.get("env") === "development") {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: err
        });
    });
}


// 如果是非开发环境，则页面只输出简单的错误信息
app.use(function(err, req, res, next) {
    console.log("It's production environment");
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});

module.exports = app;
