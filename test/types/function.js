// Load modules

var Lab = require('lab');
var Joi = require('../../lib');
var FunctionType = require('../../lib/types/function');
var Support = require('../support/meta');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;
var verifyBehavior = Support.verifyValidatorBehavior;


describe('Types', function () {

    describe('Function', function () {

        var F = FunctionType; // Joi.types.Function;

        it('should have mixins', function (done) {

            var result = F();
            expect(result.validate).to.exist;
            done();
        });

        it('should validate a function', function (done) {

            var t = F().required();
            verifyBehavior(t, [
                [function(){ }, true],
                ['', false]
            ], done);
        });
    });
});

