var express = require('express');
var app = express();
var mongodb = require('mongodb');
var bodyparser = require('body-parser');

var GENERIC_ERROR = "generic error";
var COUNT_MARKER_KEYS = 4;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyparser.json());

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//db connection setup
var server = mongodb.Server('ds045021.mongolab.com', 45021, {auto_reconnect: true});
var db = new mongodb.Db('markers-db', server);

var openDb = function(successCb, errorCb) {
    db.open(function (err, client) {
        client.authenticate('root', 'root', function(err, success) {
            if (err != undefined) {
                errorCb();
                return;
            }

            successCb();
        });
    });
};

var closeDb = function() {
    db.close();
};

app.get('/', function(request, response) {
  response.render('pages/index');
});

/**
 * @input request
 * @input response
 */
app.get('/api/markers', function(request, response) {
    //open db and get data
    openDb(function() {
        //var cursor = db.collection('markers').find({}, { _id: 0 });
        var cursor = db.collection('markers').find();
        cursor.toArray(function(error, doc) {
            //output response
            response.json(doc);
            //close db
            closeDb();
        });
    },
    function () {
        response.status(500);
        response.json({"error" : GENERIC_ERROR});
        closeDb();
    });
});

/**
 * get all markers
 * @input request
 * @input response
 */
app.put('/api/markers', function(request, response) {
    //open db and get data
    openDb(function() {
        db.collection('markers').insert(request.body, function (error, result) {
            if (error != undefined ||
                ! isValidMarker(request.body)) {
                var message = error != null ? error.message : "failed to insert";
                response.status(500);
                response.json({ "error" : message });
                closeDb();
                return;
            }

            response.json(request.body);
            //close db
            closeDb();
        });
    },
    function () {
        response.status(500);
        response.json({ "error" : GENERIC_ERROR });
        closeDb();
    });
});

/**
 * get all markers
 * @input request
 * @input response
 */
app.delete('/api/markers/:id', function(request, response) {

    openDb(function() {
        db.collection('markers').remove({ _id: new mongodb.ObjectID(request.params.id) }, function (error, result) {
            console.log();
            if (error != undefined ||
                result.result.n == 0) {
                var message = error != null ? error.message : "id " + request.params.id + " not deleted";
                response.status(500);
                response.json({ "error" : message });
                closeDb();
                return;
            }

            response.json({ _id: request.params.id });
            //close db
            closeDb();
        })
    },
    function () {
        response.status(500);
        response.json({ "error" : GENERIC_ERROR});
        closeDb();
    });
});

/**
 * private method
 */
var isValidMarker = function(data) {
    return data != null &&
            data != undefined &&
            data.hasOwnProperty('lat') &&
            data.hasOwnProperty('long') &&
            data.hasOwnProperty('title') &&
            Object.keys(data).length == COUNT_MARKER_KEYS;
};

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


