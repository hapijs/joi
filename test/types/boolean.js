// Load modules

var Chai = require('chai');
var Joi = process.env.TEST_COV ? require('../../lib-cov') : require('../../lib');
var Support = require('../support/meta');


// Declare internals

var internals = {};
var verifyBehavior = Support.verifyValidatorBehavior;


// Test shortcuts

var expect = Chai.expect;


describe('Types', function () {

    describe('Boolean', function () {

        var B = Joi.types.Boolean;

        it('should have mixins', function (done) {

            var result = B();
            expect(result.validate).to.exist;
            done();
        });

        describe('#convert', function () {

            it('should convert a string to a boolean', function (done) {

                var result = B().convert('true');
                expect(result).to.equal(true);
                done();
            });

            it('should not convert a number to a boolean', function (done) {

                var result = B().convert(1);
                expect(result).to.equal(1);
                done();
            });
        });

        describe('#validate', function () {

            it('should handle work with nullOk', function (done) {

                var rule = B().nullOk();
                verifyBehavior(rule, [
                    ['1234', false],
                    [false, true],
                    [null, true]
                ], done);
            });

            it('should handle work with required', function (done) {

                var rule = B().required();
                verifyBehavior(rule, [
                    ['1234', false],
                    ['true', false],
                    [false, true],
                    [true, true],
                    [null, false]
                ], done);
            });

            it('should handle work with allow', function (done) {

                var rule = B().allow(false);
                verifyBehavior(rule, [
                    ['1234', false],
                    [false, true],
                    [null, false]
                ], done);
            });

            it('should handle work with deny', function (done) {

                var rule = B().deny(false);
                verifyBehavior(rule, [
                    ['1234', false],
                    [false, false],
                    [true, true],
                    [null, false]
                ], done);
            });

            it('should handle work with deny and nullOk', function (done) {

                var rule = B().deny(false).nullOk();
                verifyBehavior(rule, [
                    ['1234', false],
                    [false, false],
                    [true, true],
                    [null, true]
                ], done);
            });

            it('should handle work with allow and deny', function (done) {

                var rule = B().deny(true).allow(false);
                verifyBehavior(rule, [
                    ['1234', false],
                    [false, true],
                    [true, false],
                    [null, false]
                ], done);
            });

            it('should handle work with allow, deny, and nullOk', function (done) {

                var rule = B().deny(true).allow(false).nullOk();
                verifyBehavior(rule, [
                    ['1234', false],
                    [false, true],
                    [true, false],
                    [null, true]
                ], done);
            });
        });
    });
});

