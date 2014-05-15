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


module.exports = function (schema, config, callback) {

    var compiled = Joi.compile(schema);
    for (var i = 0, il = config.length; i < il; ++i) {

        var item = config[i];
        var result = compiled.validate(item[0]);

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

