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


describe('number', function () {

    it('fails on boolean', function (done) {

        var schema = Joi.number();
        Helper.validate(schema, [
            [true, false],
            [false, false]
        ], done);
    });

    describe('#validate', function () {

        it('should, by default, allow undefined', function (done) {

            Helper.validate(Joi.number(), [
                [undefined, true]
            ], done);
        });

        it('should, when .required(), deny undefined', function (done) {

            Helper.validate(Joi.number().required(), [
                [undefined, false]
            ], done);
        });

        it('should return false for denied value', function (done) {

            var text = Joi.number().invalid(50);
            text.validate(50, function (err, value) {

                expect(err).to.exist;
                done();
            });
        });

        it('should validate integer', function (done) {

            var t = Joi.number().integer();
            Helper.validate(t, [
                [100, true],
                [0, true],
                [null, false],
                [1.02, false],
                [0.01, false]
            ], done);
        });

        it('can accept string numbers', function (done) {

            var t = Joi.number();
            Helper.validate(t, [
                ['1', true],
                ['100', true],
                ['1e3', true],
                ['1 some text', false],
                ['\t\r', false],
                [' ', false],
                [' 2', true],
                ['\t\r43', true],
                ['43 ', true],
                ['', false]
            ], done);
        });

        it('required validates correctly', function (done) {

            var t = Joi.number().required();
            Helper.validate(t, [
                [NaN, false],
                ['100', true]
            ], done);
        });

        it('converts an object string to a number', function (done) {

            var config = { a: Joi.number() };
            var obj = { a: '123' };

            Joi.compile(config).validate(obj, function (err, value) {

                expect(err).to.not.exist;
                expect(value.a).to.equal(123);
                done();
            });
        });

        it('converts a string to a number', function (done) {

            Joi.number().validate('1', function (err, value) {

                expect(err).to.not.exist;
                expect(value).to.equal(1);
                done();
            });
        });

        it('errors on null', function (done) {

            Joi.number().validate(null, function (err, value) {

                expect(err).to.exist;
                expect(value).to.equal(null);
                done();
            });
        });

        it('should handle combination of min and max', function (done) {

            var rule = Joi.number().min(8).max(10);
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, and null allowed', function (done) {

            var rule = Joi.number().min(8).max(10).allow(null);
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [null, true]
            ], done);
        });

        it('should handle combination of min and positive', function (done) {

            var rule = Joi.number().min(-3).positive();
            Helper.validate(rule, [
                [1, true],
                [-2, false],
                [8, true],
                [null, false]
            ], done);
        });

        it('should handle combination of max and positive', function (done) {

            var rule = Joi.number().max(5).positive();
            Helper.validate(rule, [
                [4, true],
                [-2, false],
                [8, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min and negative', function (done) {

            var rule = Joi.number().min(-3).negative();
            Helper.validate(rule, [
                [4, false],
                [-2, true],
                [-4, false],
                [null, false]
            ], done);
        });

        it('should handle combination of negative and positive', function (done) {

            var rule = Joi.number().negative().positive();
            Helper.validate(rule, [
                [4, false],
                [-2, false],
                [0, false],
                [null, false]
            ], done);
        });

        it('should handle combination of negative and allow', function (done) {

            var rule = Joi.number().negative().allow(1);
            Helper.validate(rule, [
                [1, true],
                [-10, true],
                [8, false],
                [0, false],
                [null, false]
            ], done);
        });

        it('should handle combination of positive and allow', function (done) {

            var rule = Joi.number().positive().allow(-1);
            Helper.validate(rule, [
                [1, true],
                [-1, true],
                [8, true],
                [-10, false],
                [null, false]
            ], done);
        });

        it('should handle combination of positive, allow, and null allowed', function (done) {

            var rule = Joi.number().positive().allow(-1).allow(null);
            Helper.validate(rule, [
                [1, true],
                [-1, true],
                [8, true],
                [-10, false],
                [null, true]
            ], done);
        });

        it('should handle combination of negative, allow, and null allowed', function (done) {

            var rule = Joi.number().negative().allow(1).allow(null);
            Helper.validate(rule, [
                [1, true],
                [-10, true],
                [8, false],
                [0, false],
                [null, true]
            ], done);
        });

        it('should handle combination of positive, allow, null allowed, and invalid', function (done) {

            var rule = Joi.number().positive().allow(-1).allow(null).invalid(1);
            Helper.validate(rule, [
                [1, false],
                [-1, true],
                [8, true],
                [-10, false],
                [null, true]
            ], done);
        });

        it('should handle combination of negative, allow, null allowed, and invalid', function (done) {

            var rule = Joi.number().negative().allow(1).allow(null).invalid(-5);
            Helper.validate(rule, [
                [1, true],
                [-10, true],
                [-5, false],
                [8, false],
                [0, false],
                [null, true]
            ], done);
        });

        it('should handle combination of min, max, and allow', function (done) {

            var rule = Joi.number().min(8).max(10).allow(1);
            Helper.validate(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, allow, and null allowed', function (done) {

            var rule = Joi.number().min(8).max(10).allow(1).allow(null);
            Helper.validate(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, true],
                [null, true]
            ], done);
        });

        it('should handle combination of min, max, allow, and invalid', function (done) {

            var rule = Joi.number().min(8).max(10).allow(1).invalid(9);
            Helper.validate(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, allow, invalid, and null allowed', function (done) {

            var rule = Joi.number().min(8).max(10).allow(1).invalid(9).allow(null);
            Helper.validate(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, false],
                [null, true]
            ], done);
        });

        it('should handle combination of min, max, and integer', function (done) {

            var rule = Joi.number().min(8).max(10).integer();
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [9.1, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, integer, and allow', function (done) {

            var rule = Joi.number().min(8).max(10).integer().allow(9.1);
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [9.1, true],
                [9.2, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, integer, allow, and invalid', function (done) {

            var rule = Joi.number().min(8).max(10).integer().allow(9.1).invalid(8);
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, true],
                [9.1, true],
                [9.2, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, integer, allow, invalid, and null allowed', function (done) {

            var rule = Joi.number().min(8).max(10).integer().allow(9.1).invalid(8).allow(null);
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, true],
                [9.1, true],
                [9.2, false],
                [null, true]
            ], done);
        });
    });

    it('should instantiate separate copies on invocation', function (done) {

        var result1 = Joi.number().min(5);
        var result2 = Joi.number().max(5);

        expect(Object.keys(result1)).to.not.equal(Object.keys(result2));
        done();
    });

    it('should show resulting object with #valueOf', function (done) {

        var result = Joi.number().min(5);
        expect(result.valueOf()).to.exist;
        done();
    });

    describe('error message', function () {

        it('should display correctly for int type', function (done) {

            var t = Joi.number().integer();
            Joi.compile(t).validate('1.1', function (err, value) {

                expect(err.message).to.contain('integer');
                done();
            });
        });
    });

    describe('#min', function () {

        it('throws when limit is not a number', function (done) {

            expect(function () {

                Joi.number().min('a');
            }).to.throw('limit must be an integer');
            done();
        });

        it('supports 64bit numbers', function (done) {

            var schema = Joi.number().min(1394035612500);
            var input = 1394035612552

            schema.validate(input, function (err, value) {

                expect(err).to.not.exist;
                expect(value).to.equal(input);
                done();
            });
        });
    });

    describe('#max', function () {

        it('throws when limit is not a number', function (done) {

            expect(function () {

                Joi.number().max('a');
            }).to.throw('limit must be an integer');
            done();
        });
    });
});