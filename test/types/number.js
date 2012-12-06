// Load modules

var Chai = require('chai');
var Joi = process.env.TEST_COV ? require('../../lib-cov') : require('../../lib');
var Support = require('../support/meta');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;
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
    })

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
        })

        it('should invalidate on known invalid inputs', function (done) {

            var inputs = [0, 1, 2, 3, 4];
            var validator = N()._min(5);
            for (var i in inputs) {
                var currentResult = validator(inputs[i]);
                expect(currentResult).to.exist;
                expect(currentResult).to.equal(false);
            }
            done();
        })
    })

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

        it('should invalidate on known invalid inputs', function (done) {

            var inputs = [5, 6, 7, 8];
            var validator = N()._max(4);
            for (var i in inputs) {
                var currentResult = validator(inputs[i]);
                expect(currentResult).to.exist;
                expect(currentResult).to.equal(false);
            }
            done();
        });
    });
});