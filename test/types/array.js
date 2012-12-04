var Types = process.env.TEST_COV ? require('../../lib-cov/types') : require('../../lib/types');
var verifyBehavior = require("../support/meta").verifyValidatorBehavior;
var should = require("should");

describe("tests/types/array.js", function () {

    describe("Types.Array", function () {
        var A = Types.Array,
            N = Types.Number,
            S = Types.String;

        it("should have mixins", function (done) {
            var result = A();

            should.exist(result.validate);
            done();
        });

        describe('#convert', function () {

            it("should convert a string to an array", function (done) {
                var result = A().convert('[1,2,3]');

                result.length.should.equal(3);
                done();
            });

            it("should return a non array", function (done) {
                var result = A().convert(3);

                result.should.equal(3);
                done();
            });

            it("should convert a non-array string", function (done) {
                var result = A().convert('3');

                result.length.should.equal(1);
                done();
            });
        });

        describe("#validate", function () {
            it('should work', function (done) {

                (function () {
                    var arr = A();
                    var result = arr.validate([1]);
                }).should.not.throw();
                done();
            });

            it('should, by default, allow undefined, allow empty array', function (done) {
                verifyBehavior(A(), [
                    [undefined, true],
                    [
                        [],
                        true
                    ]
                ], done);
            });

            it("should, when .required(), deny undefined", function (done) {

                verifyBehavior(A().required(), [
                    [undefined, false]
                ], done);
            });

            it("should allow empty arrays with emptyOk", function (done) {

                verifyBehavior(A().emptyOk(), [
                    [undefined, true],
                    [[], true]
                ], done);
            });

            it("should exclude values when excludes is called", function (done) {

                verifyBehavior(A().excludes(S()), [
                    [['2', '1'], false],
                    [['1'], false],
                    [[2], true]
                ], done);
            });

            it("should validate array of Numbers", function (done) {
                verifyBehavior(A().includes(N()), [
                    [
                        [1, 2, 3],
                        true
                    ],
                    [
                        [50, 100, 1000],
                        true
                    ],
                    [
                        ["a", 1, 2],
                        false
                    ]
                ], done);
            });

            it("should validate array of mixed Numbers & Strings", function (done) {
                verifyBehavior(A().includes(N(), S()), [
                    [
                        [1, 2, 3],
                        true
                    ],
                    [
                        [50, 100, 1000],
                        true
                    ],
                    [
                        [1, "a", 5, 10],
                        true
                    ],
                    [
                        ["walmart", "everydaylowprices", 5000],
                        true
                    ]
                ], done);
            });

            it("should not validate array of unallowed mixed types (Array)", function (done) {
                verifyBehavior(A().includes(N()), [
                    [
                        [1, 2, 3],
                        true
                    ],
                    [
                        [1, 2, [1]],
                        false
                    ]
                ], done);
            });
        });

        describe("#_exclude", function () {
            it("should work", function (done) {
                var validator = A()._excludes(N());

                var n = [1, 2, "hippo"];
                var result = validator(n);

                result.should.equal(false);

                var m = ['x', 'y', 'z'];
                var result2 = validator(m);

                result2.should.equal(true);


                done();
            });
        });
    });
});