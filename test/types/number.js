var Types = process.env.TEST_COV ? require('../../lib-cov/types') : require('../../lib/types');
var should = require("should");
var verifyBehavior = require("../support/meta").verifyValidatorBehavior;

describe("test/types/number.js", function () {
    describe("Types.Number", function () {
        var N = Types.Number;

        it("should have mixins", function (done) {
            var result = N();

            should.exist(result.validate);
            done();
        });

        describe("#validate", function () {
            it('should work', function (done) {
                (function () {
                    var num = N();
                    var result = num.validate(100);
                }).should.not.throw();
                done();
            });

            it('should, by default, allow undefined', function (done) {
                verifyBehavior(N(), [
                    [undefined, true]
                ], done);
            });

            it("should, when .required(), deny undefined", function (done) {
                verifyBehavior(N().required(), [
                    [undefined, false]
                ], done);
            });

            it("should return false for denied value", function (done) {
                var text = N().deny(50);
                var result = text.validate(50);
                should.exist(result);
                result.should.equal(false);
                done();
            });
        })
    })
})

describe("Types.Number", function () {
    var N = Types.Number;

    it('should instantiate separate copies on invocation', function (done) {
        var result1 = N().min(5);
        var result2 = N().max(5);

        Object.keys(result1).should.not.equal(Object.keys(result2));
        done();
    })

    it("should inherit functions from BaseType", function (done) {
        var fns = ["required", "add"];

        for (var i in fns) {
            should.exist(N()[fns[i]]);
        }
        done();
    })

    it("should show resulting object with #valueOf", function (done) {
        var result = N().min(5);
        should.exist(result.valueOf());
        done();
    })

    describe("#min", function (done) {
        it('should exist', function (done) {
            should.exist(N().min);
            done();
        });

        it("should have corresponding validator function", function (done) {
            should.exist(N()._min);
            done();
        });
    })

    describe("#_min", function (done) {
        it('should validate on known valid input', function (done) {
            // var inputs = ["abcde", "fghij", "klmnopqrstuv"];
            var inputs = [5, 6, 7, 8, 9];
            var validator = N()._min(5);
            for (var i in inputs) {
                var currentResult = validator(inputs[i]);
                should.exist(currentResult);
                currentResult.should.equal(true);
            }
            done();
        })

        it('should invalidate on known invalid inputs', function (done) {
            // var inputs = ["abc", "de", ""];
            var inputs = [0, 1, 2, 3, 4];
            var validator = N()._min(5);
            for (var i in inputs) {
                var currentResult = validator(inputs[i]);
                should.exist(currentResult);
                currentResult.should.equal(false);
            }
            done();
        })
    })

    describe("#max", function (done) {
        it('should exist', function (done) {
            should.exist(N().max);
            done();
        });

        it("should have corresponding validator function", function (done) {
            should.exist(N()._max);
            done();
        });
    });

    describe("#_max", function (done) {
        it('should validate on known valid input', function (done) {
            // var inputs = ["abc", "de", ""];
            var inputs = [0, 1, 2, 3, 4];
            var validator = N()._max(4);
            for (var i in inputs) {
                var currentResult = validator(inputs[i]);
                should.exist(currentResult);
                currentResult.should.equal(true);
            }
            done();
        })

        it('should invalidate on known invalid inputs', function (done) {
            // var inputs = ["abcde", "fghij", "klmnopqrstuv"];
            var inputs = [5, 6, 7, 8];
            var validator = N()._max(4);
            for (var i in inputs) {
                var currentResult = validator(inputs[i]);
                should.exist(currentResult);
                currentResult.should.equal(false);
            }
            done();
        })
    })
})