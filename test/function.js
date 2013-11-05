// Load modules

var Lab = require('lab');
var Joi = require('../lib');
var Validate = require('./helper');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Types', function () {

    describe('Function', function () {

        it('should validate a function', function (done) {

            Validate(Joi.func().required(), [
                [function(){ }, true],
                ['', false]
            ]);
            done();
        });
    });
});

