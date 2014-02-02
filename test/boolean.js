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

    describe('Boolean', function () {

        describe('#convert', function () {

            it('should convert a string to a boolean', function (done) {

                var result = Joi.boolean()._convert('true');
                expect(result).to.equal(true);
                done();
            });

            it('should not convert a number to a boolean', function (done) {

                var result = Joi.boolean()._convert(1);
                expect(result).to.equal(1);
                done();
            });
        });

        describe('#validate', function () {

            it('converts string values and validates', function (done) {

                var rule = Joi.boolean();
                Validate(rule, [
                    ['1234', false],
                    [false, true],
                    [true, true],
                    [null, false],
                    ['on', true],
                    ['off', true],
                    ['true', true],
                    ['false', true],
                    ['yes', true],
                    ['no', true]
                ]); done();
            });

            it('should handle work with required', function (done) {

                var rule = Joi.boolean().required();
                Validate(rule, [
                    ['1234', false],
                    ['true', true],
                    [false, true],
                    [true, true],
                    [null, false]
                ]); done();
            });

            it('should handle work with allow', function (done) {

                var rule = Joi.boolean().allow(false);
                Validate(rule, [
                    ['1234', false],
                    [false, true],
                    [null, false]
                ]); done();
            });

            it('should handle work with deny', function (done) {

                var rule = Joi.boolean().deny(false);
                Validate(rule, [
                    ['1234', false],
                    [false, false],
                    [true, true],
                    [null, false]
                ]); done();
            });

            it('should handle work with deny and nullOk', function (done) {

                var rule = Joi.boolean().deny(false).nullOk();
                Validate(rule, [
                    ['1234', false],
                    [false, false],
                    [true, true],
                    [null, true]
                ]); done();
            });

            it('should handle work with allow and deny', function (done) {

                var rule = Joi.boolean().deny(true).allow(false);
                Validate(rule, [
                    ['1234', false],
                    [false, true],
                    [true, false],
                    [null, false]
                ]); done();
            });

            it('should handle work with allow, deny, and nullOk', function (done) {

                var rule = Joi.boolean().deny(true).allow(false).nullOk();
                Validate(rule, [
                    ['1234', false],
                    [false, true],
                    [true, false],
                    [null, true]
                ]); done();
            });
        });
    });
});

