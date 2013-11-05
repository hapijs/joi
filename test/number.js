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


describe('Number', function () {

    var Number = Joi.number;

    describe('#validate', function () {

        it('should, by default, allow undefined', function (done) {

            Validate(Number(), [
                [undefined, true]
            ]); done();
        });

        it('should, when .required(), deny undefined', function (done) {

            Validate(Number().required(), [
                [undefined, false]
            ]); done();
        });

        it('should return false for denied value', function (done) {

            var text = Number().deny(50);
            var result = text.validate(50);
            expect(result).to.exist;
            done();
        });

        it('should validate integer', function (done) {

            var t = Number().integer();
            Validate(t, [
                [100, true],
                [0, true],
                [null, false],
                [1.02, false],
                [0.01, false]
            ]); done();
        });

        it('can accept string numbers', function (done) {

            var t = Number();
            Validate(t, [
                ['1', true],
                ['100', true]
            ]); done();
        });

        it('required validates correctly', function (done) {

            var t = Number().required();
            Validate(t, [
                [NaN, false],
                ['100', true]
            ]); done();
        });

        it('converts an object string to a number', function (done) {

            var config = { a: Number() };
            var obj = { a: '123' };

            var error = Joi.validate(obj, config, { modify: true });
            expect(error).to.not.exist;
            expect(obj.a).to.equal(123);
            done();
        });

        it('convert will convert a string to a number', function (done) {

            var t = Number()._convert('1');
            expect(t).to.equal(1);
            done();
        });

        it('convert will not convert a null', function (done) {

            var t = Number()._convert(null);
            expect(t).to.not.exist;
            done();
        });

        it('should handle combination of min and max', function (done) {

            var rule = Number().min(8).max(10);
            Validate(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [null, false]
            ]); done();
        });

        it('should handle combination of min, max, and nullOk', function (done) {

            var rule = Number().min(8).max(10).nullOk();
            Validate(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [null, true]
            ]); done();
        });

        it('should handle combination of min, max, and allow', function (done) {

            var rule = Number().min(8).max(10).allow(1);
            Validate(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, true],
                [null, false]
            ]); done();
        });

        it('should handle combination of min, max, allow, and nullOk', function (done) {

            var rule = Number().min(8).max(10).allow(1).nullOk();
            Validate(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, true],
                [null, true]
            ]); done();
        });

        it('should handle combination of min, max, allow, and deny', function (done) {

            var rule = Number().min(8).max(10).allow(1).deny(9);
            Validate(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, false],
                [null, false]
            ]); done();
        });

        it('should handle combination of min, max, allow, deny, and nullOk', function (done) {

            var rule = Number().min(8).max(10).allow(1).deny(9).nullOk();
            Validate(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, false],
                [null, true]
            ]); done();
        });

        it('should handle combination of min, max, and integer', function (done) {

            var rule = Number().min(8).max(10).integer();
            Validate(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [9.1, false],
                [null, false]
            ]); done();
        });

        it('should handle combination of min, max, integer, and allow', function (done) {

            var rule = Number().min(8).max(10).integer().allow(9.1);
            Validate(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [9.1, true],
                [9.2, false],
                [null, false]
            ]); done();
        });

        it('should handle combination of min, max, integer, allow, and deny', function (done) {

            var rule = Number().min(8).max(10).integer().allow(9.1).deny(8);
            Validate(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, true],
                [9.1, true],
                [9.2, false],
                [null, false]
            ]); done();
        });

        it('should handle combination of min, max, integer, allow, deny, and nullOk', function (done) {

            var rule = Number().min(8).max(10).integer().allow(9.1).deny(8).nullOk();
            Validate(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, true],
                [9.1, true],
                [9.2, false],
                [null, true]
            ]); done();
        });
    });

    it('should instantiate separate copies on invocation', function (done) {

        var result1 = Number().min(5);
        var result2 = Number().max(5);

        expect(Object.keys(result1)).to.not.equal(Object.keys(result2));
        done();
    });

    it('should show resulting object with #valueOf', function (done) {

        var result = Number().min(5);
        expect(result.valueOf()).to.exist;
        done();
    });

    describe('error message', function () {

        it('should display correctly for int type', function (done) {

            var t = Number().integer();
            var result = Joi.validate('', t);
            expect(result.message).to.contain('integer');
            done();
        });
    });
});