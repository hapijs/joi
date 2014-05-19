// Load modules

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


exports.validate = function (schema, config, callback) {

    return exports.validateOptions(schema, config, null, callback);
}


exports.validateOptions = function (schema, config, options, callback) {

    var compiled = Joi.compile(schema);
    for (var i = 0, il = config.length; i < il; ++i) {

        var item = config[i];
        var result = Joi.validate(item[0], compiled, item[2] || options);

        var err = result.error;
        var value = result.value;

        if (err !== null && item[1]) {
            console.log(err);
        }

        if (err === null && !item[1]) {
            console.log(item[0]);
        }

        expect(err === null).to.equal(item[1]);
    }

    if (callback) {
        callback();
    }
};

