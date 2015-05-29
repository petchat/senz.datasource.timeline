/**
 * Created by MeoWoodie on 5/29/15.
 */
exports.SerializeTask = function () {
    var taskIndex = 0,
        tasks = [],
        _worker,
        promise = new AV.Promise();

    function worker() {
        //console.log('fuck!');
        if (taskIndex < tasks.length) {
            _worker(tasks[taskIndex],
                function (result) {
                    console.log(result);
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