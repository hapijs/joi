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


module.exports = function (schema, config) {

    for (var i in config) {
        var result = Joi.validate(config[i][0], schema);
        expect(result === null).to.equal(config[i][1]);
    }
};

