var Types = process.env.TEST_COV ? require('../../lib-cov/types') : require('../../lib/types');
var should = require("should");
var verifyBehavior = require("../support/meta").verifyValidatorBehavior;


describe("Types.String", function () {

    var S = Types.String;

    it("should have mixins", function (done) {
        var result = S();

        should.exist(result.validate);
        done();
    });

    it("should instantiate separate copies on invocation", function (done) {
        var result1 = S().min(5);
        var result2 = S().max(5);

        Object.keys(result1).should.not.equal(Object.keys(result2));
        done();
    });

    describe("#valid", function () {

        it("should throw error on input not matching type", function (done) {
            (function () {
                S().valid(1);
            }).should.throw();
            done();
        });

        it("should not throw on input matching type", function (done) {
            (function () {
                S().valid("walmart");
            }).should.not.throw();
            done();
        });
    });

    describe("#invalid", function () {

        it("should throw error on input not matching type", function (done) {
            (function () {
                S().invalid(1);
            }).should.throw();
            done();
        });

        it("should not throw on input matching type", function (done) {
            (function () {
                S().invalid("walmart");
            }).should.not.throw();
            done();
        });
    });

    describe("#validate", function () {

        it('should work', function (done) {
            (function () {
                var text = S();
                var result = text.validate("joi");
            }).should.not.throw();
            done();
        });

        it('should, by default, allow undefined, deny empty string', function (done) {
            var conditions = [
                [undefined, true],
                ["", false]
            ];
            verifyBehavior(S(), conditions, done);
        });

        it("should, when .required(), deny undefined, deny empty string", function (done) {
            var t = S().required();
            verifyBehavior(t, [
                [undefined, false],
                ["", false]
            ], done);
        });

        it("should, when .required(), validate non-empty strings", function (done) {
            var t = S().required();
            verifyBehavior(t, [
                ['test', true],
                ['0', true],
                [null, false]
            ], done);
        });

        it("should validate minimum length when min is used", function (done) {
            var t = S().min(3);
            verifyBehavior(t, [
                ['test', true],
                ['0', false],
                [null, false]
            ], done);
        });

        it("should validate minimum length when min is 0", function (done) {
            var t = S().min(0);
            verifyBehavior(t, [
                ['0', true],
                [null, false]
            ], done);
        });

        it("should return false with minimum length and a null value passed in", function (done) {
            var t = S()._min(3);

            t(null).should.equal(false);
            done();
        });

        it("nullOk overrides min length requirement", function (done) {
            var t = S().min(3).nullOk();
            verifyBehavior(t, [
                [null, true]
            ], done);
        });

        it("should validate maximum length when max is used", function (done) {
            var t = S().max(3);
            verifyBehavior(t, [
                ['test', false],
                ['0', true],
                [null, false]
            ], done);
        });

        it("should validate regex", function (done) {
            var t = S().regex(/^[0-9][-][a-z]+$/);
            verifyBehavior(t, [
                ['van', false],
                ['0-www', true]
            ], done);
        });

        it("should validate alphanum when alphanum allows spaces", function (done) {
            var t = S().alphanum(true);
            verifyBehavior(t, [
                ['w0rld of w4lm4rtl4bs', true],
                ['abcd#f?h1j orly?', false]
            ], done);
        });

        it("should validate alphanum when alphanum doesn\'t allow spaces", function (done) {
            var t = S().alphanum(false);
            verifyBehavior(t, [
                ['w0rld of w4lm4rtl4bs', false],
                ['w0rldofw4lm4rtl4bs', true],
                ['abcd#f?h1j orly?', false]
            ], done);
        });

        it("should validate email", function (done) {
            var t = S().email();
            verifyBehavior(t, [
                ['van@walmartlabs.com', true],
                ['@iaminvalid.com', false]
            ], done);
        });

        it("should validate date", function (done) {
            var t = S().date();
            verifyBehavior(t, [
                ['Mon Aug 20 2012 12:14:33 GMT-0700 (PDT)', true],
                ['2012-08-20T19:14:33.000Z', true],
                [null, false],
                ['worldofwalmartlabs', false]
            ], done);
        });

        it("should return false for denied value", function (done) {
            var text = S().deny("joi");
            var result = text.validate("joi");
            should.exist(result);
            result.should.equal(false);
            done();
        });

        it("should return true for allowed value", function (done) {
            var text = S().allow("hapi");
            var result = text.validate("result");
            should.exist(result);
            result.should.equal(true);
            done();
        });

        it("should validate with one validator (min)", function (done) {
            var text = S().min(3);
            var result = text.validate("walmart");
            should.exist(result);
            result.should.equal(true);
            done();
        });

        it("should validate with two validators (min, required)", function (done) {
            var text = S().min(3).required();
            var result = text.validate("walmart");
            should.exist(result);
            result.should.equal(true);

            var result2 = text.validate();
            should.exist(result2);
            result2.should.equal(false);

            done();
        });

        it("should validate null with nullOk()", function (done) {
            verifyBehavior(S().nullOk(), [
                [null, true]
            ], done);
        });

        it("should validate '' (empty string) with emptyOk()", function (done) {
            verifyBehavior(S().emptyOk(), [
                ['', true],
                ["", true]
            ], done);
        });
    });
});