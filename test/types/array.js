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


describe('Types', function () {

    describe('Array', function () {

        var A = Joi.types.Array,
            N = Joi.types.Number,
            S = Joi.types.String,
            O = Joi.types.Object;

        it('should have mixins', function (done) {

            var result = A();
            expect(result.validate).to.exist;
            done();
        });

        describe('#convert', function () {

            it('should convert a string to an array', function (done) {

                var result = A().convert('[1,2,3]');
                expect(result.length).to.equal(3);
                done();
            });

            it('should convert a non-array string to an array', function (done) {

                var result = A().convert('{ "something": false }');
                expect(result.length).to.equal(1);
                done();
            });

            it('should return a non array', function (done) {

                var result = A().convert(3);
                expect(result).to.equal(3);
                done();
            });

            it('should convert a non-array string with number type', function (done) {

                var result = A().convert('3');
                expect(result.length).to.equal(1);
                expect(result[0]).to.equal('3');
                done();
            });

            it('should convert a non-array string', function(done) {

                var result = A().convert('asdf');
                expect(result).to.equal('asdf');
                done();
            });
        });

        describe('#validate', function () {

            it('should work', function (done) {

                expect(function () {

                    var arr = A();
                    var result = arr.validate([1]);
                }).to.not.throw();
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

            it('should, when .required(), deny undefined', function (done) {

                verifyBehavior(A().required(), [
                    [undefined, false]
                ], done);
            });

            it('should allow empty arrays with emptyOk', function (done) {

                verifyBehavior(A().emptyOk(), [
                    [undefined, true],
                    [[], true]
                ], done);
            });

            it('should exclude values when excludes is called', function (done) {

                verifyBehavior(A().excludes(S()), [
                    [['2', '1'], false],
                    [['1'], false],
                    [[2], true]
                ], done);
            });

            it('should allow types to be excluded', function (done) {

                var validator = A().excludes(N());

                var n = [1, 2, 'hippo'];
                var result = validator.validate(n);

                expect(result).to.equal(false);

                var m = ['x', 'y', 'z'];
                var result2 = validator.validate(m);

                expect(result2).to.equal(true);
                done();
            });

            it('should validate array of Numbers', function (done) {

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
                        ['a', 1, 2],
                        false
                    ]
                ], done);
            });

            it('should validate array of mixed Numbers & Strings', function (done) {

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
                        [1, 'a', 5, 10],
                        true
                    ],
                    [
                        ['walmart', 'everydaylowprices', 5000],
                        true
                    ]
                ], done);
            });

            it('should validate array of objects with schema', function (done) {

                verifyBehavior(A().includes(O({ h1: N().required()})), [
                    [
                        [{ h1: 1 }, { h1: 2 }, { h1: 3 }],
                        true
                    ],
                    [
                        [{ h2: 1, h3: 'somestring' }, { h1: 2 }, { h1: 3 }],
                        false
                    ],
                    [
                        [1, 2, [1]],
                        false
                    ]
                ], done);
            });

            it('should not validate array of unallowed mixed types (Array)', function (done) {

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

            it('should not throw when using includes', function (done) {

                var schema = {
                    arr: Joi.types.Array().includes(Joi.types.Number().integer())
                };

                var input = { arr: [1, 2, 2.1] };
                var err = Joi.validate(input, schema);

                expect(err).to.exist;
                expect(err.message).to.include('the value of arr must be an integer');
                done();
            });
        });
    });
});
