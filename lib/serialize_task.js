/**
 * Created by MeoWoodie on 5/29/15.
 */
var AV = require('leanengine');

// Serialize Task without interruption.
exports.SerializeTask = function () {
    var taskIndex = 0,
        tasks = [],
        _worker,
        promise = new AV.Promise();

    function worker() {
        if (taskIndex < tasks.length) {
            _worker(tasks[taskIndex],
                function (result) {
                    //console.log(result);
                    taskIndex++;
                    worker();
                },
                function (error) {
                    console.log('!!error occurd');
                    console.log(error);
                    taskIndex++;
                    worker();
                }
            );
        }
        else {
            promise.resolve(tasks);
        }
        return promise;
    }

    return {
        addTask: function (t) {
            tasks.push(t);
        },
        setWorker: function (w) {
            _worker = w;
        },
        begin: function () {
            taskIndex = 0;
            return worker();
        }
    }
};

// Serialize Task with interruption when error occurs.
exports.SerializeTaskWithInterruption = function () {
    var taskIndex = 0,
        tasks = [],
        _worker,
        promise = new AV.Promise();

    function worker() {
        if (taskIndex < tasks.length) {
            _worker(tasks[taskIndex],
                function (result) {
                    //console.log(result);
                    taskIndex++;
                    worker();
                },
                function (error) {
                    console.log('The serialize task is interrupted.');
                    console.log(error);
                    promise.reject(error);
                }
            );
        }
        else {
            promise.resolve(tasks);
        }
        return promise;
    }

    return {
        addTask: function (t) {
            tasks.push(t);
        },
        setWorker: function (w) {
            _worker = w;
        },
        begin: function () {
            taskIndex = 0;
            return worker();
        }
    }
};