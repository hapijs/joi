// Load modules

var Lab = require('lab');
var Joi = require('../lib');
var Helper = require('./helper');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('func', function () {

    it('should validate a function', function (done) {

        Helper.validate(Joi.func().required(), [
            [function () { }, true],
            ['', false]
        ], done);
    });
});

