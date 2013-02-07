// Load modules

var Chai = require('chai');
var Joi = process.env.TEST_COV ? require('../../lib-cov') : require('../../lib');
var FunctionType = process.env.TEST_COV ? require('../../lib-cov/types/function') : require('../../lib/types/function');
var Support = require('../support/meta');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;
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

