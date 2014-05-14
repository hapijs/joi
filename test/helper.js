// Load modules

var Async = require('async');
var Lab = require('lab');
var Joi = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


module.exports = function (schema, config, callback) {

    var compiled = Joi.compile(schema);
    Async.forEachSeries(config, function (item, next) {

        compiled.validate(item[0], function (err, value) {

            if (err !== null && item[1]) {
                console.log(err);
            }

            if (err === null && !item[1]) {
                console.log(item[0]);
            }

            expect(err === null).to.equal(item[1]);
            next();
        });
    },
    function (err) {

        callback();
    });
};

