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


describe('Number', function () {

    var N = Joi.types.Number;

    it('should have mixins', function (done) {
        var result = N();

        expect(result.validate).to.exist;
        done();
    });

    describe('#validate', function () {

        it('should work', function (done) {

            expect(function () {
                var num = N();
                var result = num.validate(100);
            }).to.not.throw;
            done();
        });

        it('should, by default, allow undefined', function (done) {

            verifyBehavior(N(), [
                [undefined, true]
            ], done);
        });

        it('should, when .required(), deny undefined', function (done) {

            verifyBehavior(N().required(), [
                [undefined, false]
            ], done);
        });

        it('should return false for denied value', function (done) {

            var text = N().deny(50);
            var result = text.validate(50);
            expect(result).to.exist;
            expect(result).to.equal(false);
            done();
        });

        it('should validate float', function (done) {

            var t = N().float();
            verifyBehavior(t, [
                [100, false],
                [0, false],
                [null, false],
                [1.02, true],
                [0.01, true]
            ], done);
        });

        it('should validate integer', function (done) {

            var t = N().integer();
            verifyBehavior(t, [
                [100, true],
                [0, true],
                [null, false],
                [1.02, false],
                [0.01, false]
            ], done);
        });

        it('should validate empty', function (done) {

            var t = N().empty();
            verifyBehavior(t, [
                [NaN, false],
                [null, true]
            ], done);
        });

        it('can convert strings to numbers', function (done) {

            var t = N();
            verifyBehavior(t, [
                ['1', true],
                ['100', true]
            ], done);
        });

        it('required validates correctly', function (done) {

            var t = N().required();
            verifyBehavior(t, [
                [NaN, false],
                ['100', true]
            ], done);
        });

        it('convert will convert a string to a number', function (done) {

            var t = N().convert('1');
            expect(t).to.equal(1);
            done();
        });

        it('convert will not convert a null', function (done) {

            var t = N().convert(null);
            expect(t).to.not.exist;
            done();
        });

        it('should handle combination of min and max', function (done) {

            var rule = N().min(8).max(10);
            verifyBehavior(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, and nullOk', function (done) {

            var rule = N().min(8).max(10).nullOk();
            verifyBehavior(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [null, true]
            ], done);
        });

        it('should handle combination of min, max, and allow', function (done) {

            var rule = N().min(8).max(10).allow(1);
            verifyBehavior(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, allow, and nullOk', function (done) {

            var rule = N().min(8).max(10).allow(1).nullOk();
            verifyBehavior(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, true],
                [null, true]
            ], done);
        });

        it('should handle combination of min, max, allow, and deny', function (done) {

            var rule = N().min(8).max(10).allow(1).deny(9);
            verifyBehavior(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, allow, deny, and nullOk', function (done) {

            var rule = N().min(8).max(10).allow(1).deny(9).nullOk();
            verifyBehavior(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, false],
                [null, true]
            ], done);
        });

        it('should handle combination of min, max, and float', function (done) {

            var rule = N().min(8).max(10).float();
            verifyBehavior(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, false],
                [9.1, true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, float, and allow', function (done) {

            var rule = N().min(8).max(10).float().allow(9);
            verifyBehavior(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, true],
                [9.1, true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, float, and deny', function (done) {

            var rule = N().min(8).max(10).float().deny(9.1);
            verifyBehavior(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, false],
                [9.1, false],
                [9.2, true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, float, allow, and deny', function (done) {

            var rule = N().min(8).max(10).float().allow(9).deny(9.1);
            verifyBehavior(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, true],
                [9.1, false],
                [9.2, true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, float, allow, deny, and nullOk', function (done) {

            var rule = N().min(8).max(10).float().allow(9).deny(9.1).nullOk();
            verifyBehavior(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, true],
                [9.1, false],
                [9.2, true],
                [null, true]
            ], done);
        });

        it('should handle combination of min, max, and integer', function (done) {

            var rule = N().min(8).max(10).integer();
            verifyBehavior(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [9.1, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, integer, and allow', function (done) {

            var rule = N().min(8).max(10).integer().allow(9.1);
            verifyBehavior(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [9.1, true],
                [9.2, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, integer, allow, and deny', function (done) {

            var rule = N().min(8).max(10).integer().allow(9.1).deny(8);
            verifyBehavior(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, true],
                [9.1, true],
                [9.2, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, integer, allow, deny, and nullOk', function (done) {

            var rule = N().min(8).max(10).integer().allow(9.1).deny(8).nullOk();
            verifyBehavior(rule, [
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

        var result1 = N().min(5);
        var result2 = N().max(5);

        expect(Object.keys(result1)).to.not.equal(Object.keys(result2));
        done();
    });

    it('should inherit functions from BaseType', function (done) {

        var fns = ['required', 'add'];

        for (var i in fns) {
            expect(N()[fns[i]]).to.exist;
        }
        done();
    });

    it('should show resulting object with #valueOf', function (done) {

        var result = N().min(5);
        expect(result.valueOf()).to.exist;
        done();
    });

    describe('#min', function () {

        it('should exist', function (done) {

            expect(N().min).to.exist;
            done();
        });

        it('should have corresponding validator function', function (done) {

            expect(N()._min).to.exist;
            done();
        });
    });

    describe('#_min', function () {

        it('should validate on known valid input', function (done) {

            var inputs = [5, 6, 7, 8, 9];
            var validator = N()._min(5);
            for (var i in inputs) {
                var currentResult = validator(inputs[i]);
                expect(currentResult).to.exist;
                expect(currentResult).to.equal(true);
            }
            done();
        });
    });

    describe('#max', function () {

        it('should exist', function (done) {

            expect(N().max).to.exist;
            done();
        });

        it('should have corresponding validator function', function (done) {
            expect(N()._max).to.exist;
            done();
        });
    });

    describe('#_max', function () {

        it('should validate on known valid input', function (done) {

            var inputs = [0, 1, 2, 3, 4];
            var validator = N()._max(4);
            for (var i in inputs) {
                var currentResult = validator(inputs[i]);
                expect(currentResult).to.exist;
                expect(currentResult).to.equal(true);
            }
            done();
        });
    });

    describe('error message', function () {

        it('should display correctly for int type', function (done) {

            var t = N().integer();
            var result = Joi.validate('', t);
            expect(result.message).to.contain('integer');
            done();
        });
    });
});