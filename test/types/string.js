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


describe('Joi.types.String', function () {

    var S = Joi.types.String;

    it('should have mixins', function (done) {

        var result = S();
        expect(result.validate).to.exist;
        done();
    });

    it('should instantiate separate copies on invocation', function (done) {

        var result1 = S().min(5);
        var result2 = S().max(5);
        expect(Object.keys(result1)).to.not.equal(Object.keys(result2));
        done();
    });

    describe('#valid', function () {

        it('should throw error on input not matching type', function (done) {

            expect(function () {

                S().valid(1);
            }).to.throw;
            done();
        });

        it('should not throw on input matching type', function (done) {

            expect(function () {

                S().valid('walmart');
            }).to.not.throw;
            done();
        });
    });

    describe('#invalid', function () {

        it('should throw error on input not matching type', function (done) {

            expect(function () {

                S().invalid(1);
            }).to.throw;
            done();
        });

        it('should not throw on input matching type', function (done) {

            expect(function () {

                S().invalid('walmart');
            }).to.not.throw;
            done();
        });
    });

    describe('#validate', function () {

        it('should work', function (done) {

            expect(function () {

                var text = S();
                var result = text.validate('joi');
            }).to.not.throw;
            done();
        });

        it('should, by default, allow undefined, deny empty string', function (done) {

            var conditions = [
                [undefined, true],
                ['', false]
            ];
            verifyBehavior(S(), conditions, done);
        });

        it('should, when .required(), deny undefined, deny empty string', function (done) {

            var t = S().required();
            verifyBehavior(t, [
                [undefined, false],
                ['', false]
            ], done);
        });

        it('should, when .required(), print a friend error message for an empty string', function (done) {

            var t = S().required();
            var result = Joi.validate('', t);

            expect(result.message).to.contain('be empty');
            done();
        });

        it('should, when .required(), validate non-empty strings', function (done) {

            var t = S().required();
            verifyBehavior(t, [
                ['test', true],
                ['0', true],
                [null, false]
            ], done);
        });

        it('should validate invalid values', function (done) {

            var t = S().invalid('a', 'b', 'c');
            verifyBehavior(t, [
                ['x', true],
                ['a', false],
                ['c', false]
            ], done);
        });

        it('should invalid undefined if min set', function (done) {

            var t = S().min(3);
            verifyBehavior(t, [
                [undefined, false]
            ], done);
        });

        it('should invalidate invalid values', function (done) {

            var t = S().valid('a', 'b', 'c');
            verifyBehavior(t, [
                ['x', false],
                ['a', true],
                ['c', true]
            ], done);
        });

        it('should handle array arguments correctly', function(done) {

            var t = S().valid(['a', 'b', 'c']);
            verifyBehavior(t, [
                ['x', false],
                ['a', true],
                ['c', true]
            ], done);
        });

        it('should validate minimum length when min is used', function (done) {

            var t = S().min(3);
            verifyBehavior(t, [
                ['test', true],
                ['0', false],
                [null, false]
            ], done);
        });

        it('should validate minimum length when min is 0', function (done) {

            var t = S().min(0);
            verifyBehavior(t, [
                ['0', true],
                [null, false],
                [undefined, false]
            ], done);
        });

        it('should return false with minimum length and a null value passed in', function (done) {

            var t = S().min(3);
            verifyBehavior(t, [
                [null, false]
            ], done);
        });

        it('nullOk overrides min length requirement', function (done) {

            var t = S().min(3).nullOk();
            verifyBehavior(t, [
                [null, true]
            ], done);
        });

        it('should validate maximum length when max is used', function (done) {

            var t = S().max(3);
            verifyBehavior(t, [
                ['test', false],
                ['0', true],
                [null, false]
            ], done);
        });

        it('should return true with max and not required when value is undefined', function (done) {

            var t = S().max(3);
            verifyBehavior(t, [
                [undefined, true]
            ], done);
        });

        it('should validate regex', function (done) {

            var t = S().regex(/^[0-9][-][a-z]+$/);
            verifyBehavior(t, [
                ['van', false],
                ['0-www', true]
            ], done);
        });

        it('should validate alphanum when alphanum allows spaces', function (done) {

            var t = S().alphanum(true);
            verifyBehavior(t, [
                ['w0rld of w4lm4rtl4bs', true],
                ['abcd#f?h1j orly?', false]
            ], done);
        });

        it('should validate alphanum when alphanum doesn\'t allow spaces', function (done) {

            var t = S().alphanum(false);
            verifyBehavior(t, [
                ['w0rld of w4lm4rtl4bs', false],
                ['w0rldofw4lm4rtl4bs', true],
                ['abcd#f?h1j orly?', false]
            ], done);
        });

        it('should validate alphanum when allow spaces is null', function (done) {

            var t = S().alphanum(null);
            verifyBehavior(t, [
                ['w0rld of w4lm4rtl4bs', true],
                ['abcd#f?h1j orly?', false]
            ], done);
        });

        it('should validate email', function (done) {

            var t = S().email();
            verifyBehavior(t, [
                ['van@walmartlabs.com', true],
                ['@iaminvalid.com', false]
            ], done);
        });

        it('should validate email with a friendly error message', function (done) {

            var schema = { item: S().email() };
            var err = Joi.validate({ item: 'something' }, schema);

            expect(err.message).to.contain('must be a valid email');
            done();
        });

        it('should validate date', function (done) {

            var t = S().date();
            verifyBehavior(t, [
                ['Mon Aug 20 2012 12:14:33 GMT-0700 (PDT)', true],
                ['2012-08-20T19:14:33.000Z', true],
                [null, false],
                ['worldofwalmartlabs', false]
            ], done);
        });

        it('should return false for denied value', function (done) {

            var text = S().deny('joi');
            var result = text.validate('joi');
            expect(result).to.exist;
            expect(result).to.equal(false);
            done();
        });

        it('should return true for allowed value', function (done) {

            var text = S().allow('hapi');
            var result = text.validate('result');
            expect(result).to.exist;
            expect(result).to.equal(true);
            done();
        });

        it('should validate with one validator (min)', function (done) {

            var text = S().min(3);
            var result = text.validate('walmart');
            expect(result).to.exist;
            expect(result).to.equal(true);
            done();
        });

        it('should validate with two validators (min, required)', function (done) {

            var text = S().min(3).required();
            var result = text.validate('walmart');
            expect(result).to.exist;
            expect(result).to.equal(true);

            var result2 = text.validate();
            expect(result2).to.exist;
            expect(result2).to.equal(false);

            done();
        });

        it('should validate null with nullOk()', function (done) {

            verifyBehavior(S().nullOk(), [
                [null, true]
            ], done);
        });

        it('should validate "" (empty string) with emptyOk()', function (done) {

            verifyBehavior(S().emptyOk(), [
                ['', true],
                ['', true]
            ], done);
        });

        it('should handle combination of required and min', function (done) {

            var rule = S().required().min(3);
            verifyBehavior(rule, [
                ['x', false],
                ['123', true],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of required and max', function (done) {

            var rule = S().required().max(3);
            verifyBehavior(rule, [
                ['x', true],
                ['123', true],
                ['1234', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of emptyOk and min', function (done) {

            var rule = S().emptyOk().min(3);
            verifyBehavior(rule, [
                ['x', false],
                ['123', true],
                ['1234', true],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of emptyOk and max', function (done) {

            var rule = S().emptyOk().max(3);
            verifyBehavior(rule, [
                ['x', true],
                ['123', true],
                ['1234', false],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of nullOk and max', function (done) {
            var rule = S().nullOk().max(3);
            verifyBehavior(rule, [
                ['x', true],
                ['123', true],
                ['1234', false],
                ['', false],
                [null, true]
            ], done);
        });

        it('should handle combination of min and max', function (done) {

            var rule = S().min(2).max(3);
            verifyBehavior(rule, [
                ['x', false],
                ['123', true],
                ['1234', false],
                ['12', true],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, and emptyOk', function (done) {

            var rule = S().min(2).max(3).emptyOk();
            verifyBehavior(rule, [
                ['x', false],
                ['123', true],
                ['1234', false],
                ['12', true],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, and required', function (done) {

            var rule = S().min(2).max(3).required();
            verifyBehavior(rule, [
                ['x', false],
                ['123', true],
                ['1234', false],
                ['12', true],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, and regex', function (done) {

            var rule = S().min(2).max(3).regex(/^a/);
            verifyBehavior(rule, [
                ['x', false],
                ['123', false],
                ['1234', false],
                ['12', false],
                ['ab', true],
                ['abc', true],
                ['abcd', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, regex, and emptyOk', function (done) {

            var rule = S().min(2).max(3).regex(/^a/).emptyOk();
            verifyBehavior(rule, [
                ['x', false],
                ['123', false],
                ['1234', false],
                ['12', false],
                ['ab', true],
                ['abc', true],
                ['abcd', false],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, regex, and required', function (done) {

            var rule = S().min(2).max(3).regex(/^a/).required();
            verifyBehavior(rule, [
                ['x', false],
                ['123', false],
                ['1234', false],
                ['12', false],
                ['ab', true],
                ['abc', true],
                ['abcd', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, and alphanum', function (done) {

            var rule = S().min(2).max(3).alphanum();
            verifyBehavior(rule, [
                ['x', false],
                ['123', true],
                ['1234', false],
                ['12', true],
                ['ab', true],
                ['abc', true],
                ['abcd', false],
                ['*ab', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, alphanum, and emptyOk', function (done) {

            var rule = S().min(2).max(3).alphanum().emptyOk();
            verifyBehavior(rule, [
                ['x', false],
                ['123', true],
                ['1234', false],
                ['12', true],
                ['ab', true],
                ['abc', true],
                ['abcd', false],
                ['*ab', false],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, alphanum, and required', function (done) {

            var rule = S().min(2).max(3).alphanum().required();
            verifyBehavior(rule, [
                ['x', false],
                ['123', true],
                ['1234', false],
                ['12', true],
                ['ab', true],
                ['abc', true],
                ['abcd', false],
                ['*ab', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, alphanum, and regex', function (done) {

            var rule = S().min(2).max(3).alphanum().regex(/^a/);
            verifyBehavior(rule, [
                ['x', false],
                ['123', false],
                ['1234', false],
                ['12', false],
                ['ab', true],
                ['abc', true],
                ['a2c', true],
                ['abcd', false],
                ['*ab', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, alphanum, required, and regex', function (done) {

            var rule = S().min(2).max(3).alphanum().required().regex(/^a/);
            verifyBehavior(rule, [
                ['x', false],
                ['123', false],
                ['1234', false],
                ['12', false],
                ['ab', true],
                ['abc', true],
                ['a2c', true],
                ['abcd', false],
                ['*ab', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, alphanum, emptyOk, and regex', function (done) {

            var rule = S().min(2).max(3).alphanum().emptyOk().regex(/^a/);
            verifyBehavior(rule, [
                ['x', false],
                ['123', false],
                ['1234', false],
                ['12', false],
                ['ab', true],
                ['abc', true],
                ['a2c', true],
                ['abcd', false],
                ['*ab', false],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, and date', function (done) {

            var rule = S().min(2).max(3).date();
            verifyBehavior(rule, [
                ['12', true],
                ['1-2', true],
                ['abc', false],
                ['a2c', false],
                ['abcd', false],
                ['*ab', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of date and regex', function (done) {

            var rule = S().date().regex(/^1/);
            verifyBehavior(rule, [
                ['x', false],
                ['1-2-1990', true],
                ['2-2-1990', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of date, regex, and min', function (done) {

            var rule = S().date().regex(/^1/).min(4);
            verifyBehavior(rule, [
                ['x', false],
                ['1-2-1990', true],
                ['1-2', false],
                ['2-2-1990', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of date, regex, and max', function (done) {

            var rule = S().date().regex(/^1/).max(4);
            verifyBehavior(rule, [
                ['x', false],
                ['1-2-1990', false],
                ['1-2', true],
                ['2-2-1990', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of date, regex, min, and max', function (done) {

            var rule = S().date().regex(/^1/).min(3).max(4);
            verifyBehavior(rule, [
                ['x', false],
                ['1-2-1990', false],
                ['1-2', true],
                ['2-2-1990', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of date, regex, min, max, and allow', function (done) {

            var rule = S().date().regex(/^1/).min(3).max(4).allow('x');
            verifyBehavior(rule, [
                ['x', true],
                ['1-2-1990', false],
                ['1-2', true],
                ['2-2-1990', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of date, regex, min, max, allow, and deny', function (done) {

            var rule = S().date().regex(/^1/).min(3).max(4).allow('x').deny('1-2');
            verifyBehavior(rule, [
                ['x', true],
                ['1-2-1990', false],
                ['1-2', false],
                ['2-2-1990', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of date, regex, min, max, allow, deny, and emptyOk', function (done) {

            var rule = S().date().regex(/^1/).min(3).max(4).allow('x').deny('1-2').emptyOk();
            verifyBehavior(rule, [
                ['x', true],
                ['1-2-1990', false],
                ['1-2', false],
                ['2-2-1990', false],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of date, regex, min, max, and emptyOk', function (done) {

            var rule = S().date().regex(/^1/).min(3).max(4).emptyOk();
            verifyBehavior(rule, [
                ['x', false],
                ['1-2-1990', false],
                ['1-2', true],
                ['2-2-1990', false],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of date, regex, min, max, and nullOk', function (done) {

            var rule = S().date().regex(/^1/).min(3).max(4).nullOk();
            verifyBehavior(rule, [
                ['x', false],
                ['1-2-1990', false],
                ['1-2', true],
                ['2-2-1990', false],
                ['', false],
                [null, true]
            ], done);
        });

        it('should handle combination of date, regex, min, max, nullOk, emptyOk', function (done) {

            var rule = S().date().regex(/^1/).min(3).max(4).nullOk().emptyOk();
            verifyBehavior(rule, [
                ['x', false],
                ['1-2-1990', false],
                ['1-2', true],
                ['2-2-1990', false],
                ['', true],
                [null, true]
            ], done);
        });

        it('should handle combination of date, regex, min, max, and required', function (done) {

            var rule = S().date().regex(/^1/).min(3).max(4).required();
            verifyBehavior(rule, [
                ['x', false],
                ['1-2-1990', false],
                ['1-2', true],
                ['2-2-1990', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of email and min', function (done) {

            var rule = S().email().min(8);
            verifyBehavior(rule, [
                ['x@x.com', false],
                ['123@x.com', true],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of email, min, and max', function (done) {

            var rule = S().email().min(8).max(10);
            verifyBehavior(rule, [
                ['x@x.com', false],
                ['123@x.com', true],
                ['1234@x.com', true],
                ['12345@x.com', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of email, min, max, and deny', function (done) {

            var rule = S().email().min(8).max(10).deny('123@x.com');
            verifyBehavior(rule, [
                ['x@x.com', false],
                ['123@x.com', false],
                ['1234@x.com', true],
                ['12345@x.com', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of email, min, max, and allow', function (done) {

            var rule = S().email().min(8).max(10).allow('x@x.com');
            verifyBehavior(rule, [
                ['x@x.com', true],
                ['123@x.com', true],
                ['1234@x.com', true],
                ['12345@x.com', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of email, min, max, allow, and deny', function (done) {

            var rule = S().email().min(8).max(10).allow('x@x.com').deny('123@x.com');
            verifyBehavior(rule, [
                ['x@x.com', true],
                ['123@x.com', false],
                ['1234@x.com', true],
                ['12345@x.com', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of email, min, max, allow, deny, and emptyOk', function (done) {

            var rule = S().email().min(8).max(10).allow('x@x.com').deny('123@x.com').emptyOk();
            verifyBehavior(rule, [
                ['x@x.com', true],
                ['123@x.com', false],
                ['1234@x.com', true],
                ['12345@x.com', false],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of email, min, max, allow, and emptyOk', function (done) {

            var rule = S().email().min(8).max(10).allow('x@x.com').emptyOk();
            verifyBehavior(rule, [
                ['x@x.com', true],
                ['123@x.com', true],
                ['1234@x.com', true],
                ['12345@x.com', false],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of email, min, max, allow, deny, and regex', function (done) {

            var rule = S().email().min(8).max(10).allow('x@x.com').deny('123@x.com').regex(/^1/);
            verifyBehavior(rule, [
                ['x@x.com', true],
                ['123@x.com', false],
                ['1234@x.com', true],
                ['12345@x.com', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of email, min, max, allow, deny, regex, and emptyOk', function (done) {

            var rule = S().email().min(8).max(10).allow('x@x.com').deny('123@x.com').regex(/^1/).emptyOk();
            verifyBehavior(rule, [
                ['x@x.com', true],
                ['123@x.com', false],
                ['1234@x.com', true],
                ['12345@x.com', false],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of email, min, max, and emptyOk', function (done) {

            var rule = S().email().min(8).max(10).emptyOk();
            verifyBehavior(rule, [
                ['x@x.com', false],
                ['123@x.com', true],
                ['1234@x.com', true],
                ['12345@x.com', false],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of email, min, max, and regex', function (done) {

            var rule = S().email().min(8).max(10).regex(/^1234/);
            verifyBehavior(rule, [
                ['x@x.com', false],
                ['123@x.com', false],
                ['1234@x.com', true],
                ['12345@x.com', false],
                ['', false],
                [null, false]
            ], done);
        });

        it('should handle combination of email, min, max, regex, and emptyOk', function (done) {

            var rule = S().email().min(8).max(10).regex(/^1234/).emptyOk();
            verifyBehavior(rule, [
                ['x@x.com', false],
                ['123@x.com', false],
                ['1234@x.com', true],
                ['12345@x.com', false],
                ['', true],
                [null, false]
            ], done);
        });

        it('should handle combination of email, min, max, regex, and required', function (done) {

            var rule = S().email().min(8).max(10).regex(/^1234/).required();
            verifyBehavior(rule, [
                ['x@x.com', false],
                ['123@x.com', false],
                ['1234@x.com', true],
                ['12345@x.com', false],
                ['', false],
                [null, false]
            ], done);
        });
    });
});
