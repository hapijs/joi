// Load modules

var Lab = require('lab');
var Joi = require('../lib');
var Helper = require('./helper');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;
var expect = Lab.expect;


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

        it('should validate credit card', function (done) {

            var t = Joi.number().creditCard();
            t.validate(4111111111111112, function (err, value) {

                expect(err.message).to.equal('value must be a credit card');

                Helper.validate(t, [
                    [378734493671000, true],  // american express
                    [371449635398431, true],  // american express
                    [378282246310005, true],  // american express
                    [341111111111111, true],  // american express
                    [5610591081018250, true], // australian bank
                    [5019717010103742, true], // dankort pbs
                    [38520000023237, true],   // diners club
                    [30569309025904, true],   // diners club
                    [6011000990139424, true], // discover
                    [6011111111111117, true], // discover
                    [6011601160116611, true], // discover
                    [3566002020360505, true], // jbc
                    [3530111333300000, true], // jbc
                    [5105105105105100, true], // mastercard
                    [5555555555554444, true], // mastercard
                    [5431111111111111, true], // mastercard
                    [6331101999990016, true], // switch/solo paymentech
                    [4222222222222, true],    // visa
                    [4012888888881881, true], // visa
                    [4111111111111111, true], // visa
                    [4111111111111112, false],
                    [null, false],
                ], done);
            });
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

        it('should handle limiting the number of decimal places', function (done) {

            var rule = Joi.number().precision(1);
            Helper.validate(rule, [
                [1, true],
                [9.1, true],
                [9.21, false],
                [9.9999, false],
                [9.999e99, true],
                [9.9e-99, false],
                [9.9e3, true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, integer, allow, invalid, null allowed and precision', function (done) {

            var rule = Joi.number().min(8).max(10).integer().allow(9.1).invalid(8).allow(null).precision(1);
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, true],
                [9.1, true],
                [9.11, false],
                [9.2, false],
                [9.22, false],
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
