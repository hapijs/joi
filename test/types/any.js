// Load modules

var Lab = require('lab');
var Joi = require('../../lib');
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

    describe('Any', function () {

        it('should have mixins', function (done) {

            var result = Joi.types.Any();
            expect(result.validate).to.exist;
            done();
        });

        it('should allow any type and not allow nulls', function (done) {

            var t = Joi.types.Any();
            verifyBehavior(t, [
                [function(){ }, true],
                ['', true],
                [undefined, true],
                [null, false],
                [[], true],
                [{}, true],
                [1, true]
            ], done);
        });

        it('should work with required', function (done) {

            var t = Joi.types.Any().required();
            verifyBehavior(t, [
                ['', true],
                [undefined, false],
                [null, false]
            ], done);
        });

        it('should work with nullOk', function (done) {

            var t = Joi.types.Any().nullOk();
            verifyBehavior(t, [
                ['', true],
                [undefined, true],
                [null, true]
            ], done);
        });

        it('should work with optional and null ok', function (done) {

            var t = Joi.types.Any().optional().nullOk();
            verifyBehavior(t, [
                ['', true],
                [undefined, true],
                [null, true]
            ], done);
        });
    });
});

