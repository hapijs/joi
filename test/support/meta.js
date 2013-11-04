// Load modules

var Lab = require('lab');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


exports.verifyValidatorBehavior = function (schema, config, callback) {

    for (var i in config) {
        var result = schema.validate(config[i][0]);
        expect(result === null).to.equal(config[i][1]);
    }

    callback();
};

