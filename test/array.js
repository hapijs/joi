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


describe('Types', function () {

    describe('Array', function () {

        it('converts a string to an array', function (done) {

            Joi.array().validate('[1,2,3]', function (err, value) {

                expect(err).to.not.exist;
                expect(value.length).to.equal(3);
                done();
            });
        });

        it('converts a non-array string to an array', { skip: true }, function (done) {

            // This is wrong behavior

            Joi.array().validate('{ "something": false }', function (err, value) {

                expect(err).to.not.exist;
                expect(value.length).to.equal(1);
                done();
            });
        });

        it('errors on number', function (done) {

            Joi.array().validate(3, function (err, value) {

                expect(err).to.exist;
                expect(value).to.equal(3);
                done();
            });
        });

        it('converts a non-array string with number type', function (done) {

            Joi.array().validate('3', function (err, value) {

                expect(err).to.exist;
                expect(value).to.equal('3');
                done();
            });
        });

        it('errors on a non-array string', function (done) {

            Joi.array().validate('asdf', function (err, value) {

                expect(err).to.exist;
                expect(value).to.equal('asdf');
                done();
            });
        });

        describe('#includes', function () {

            it('converts members', function (done) {

                var array = ['1', '2', '3'];
                var schema = Joi.array().includes(Joi.number());
                Joi.validate(array, schema, function (err, value) {

                    expect(err).to.not.exist;
                    expect(value).to.deep.equal([1, 2, 3]);
                    done();
                });
            });

            it('allows zero size', function (done) {

                var data = { test: [] };
                var schema = {
                    test: Joi.array().includes(Joi.object({
                        foo: Joi.string().required()
                    }))
                };

                Joi.validate(data, schema, function (err, value) {

                    expect(err).to.not.exist;
                    done();
                });
            });

            it('returns the first error when only one inclusion', function (done) {

                var data = { test: [{ foo: 'a' }, { bar: 2 }] };
                var schema = {
                    test: Joi.array().includes(Joi.object({
                        foo: Joi.string().required()
                    }))
                };

                Joi.validate(data, schema, function (err, value) {

                    expect(err.message).to.equal('the test array value in position 1 fails because the value of foo is not allowed to be undefined');
                    done();
                });
            });
        });

        describe('#min', function () {

            it('validates array size', function (done) {

                var schema = Joi.array().min(2);
                Validate(schema, [
                    [[1, 2], true],
                    [[1], false]
                ]);
                done();
            });

            it('throws when limit is not a number', function (done) {

                expect(function () {

                    Joi.array().min('a');
                }).to.throw('limit must be a positive integer');
                done();
            });

            it('throws when limit is not an integer', function (done) {

                expect(function () {

                    Joi.array().min(1.2);
                }).to.throw('limit must be a positive integer');
                done();
            });
        });

        describe('#max', function () {

            it('validates array size', function (done) {

                var schema = Joi.array().max(1);
                Validate(schema, [
                    [[1, 2], false],
                    [[1], true]
                ]);
                done();
            });

            it('throws when limit is not a number', function (done) {

                expect(function () {

                    Joi.array().max('a');
                }).to.throw('limit must be a positive integer');
                done();
            });

            it('throws when limit is not an integer', function (done) {

                expect(function () {

                    Joi.array().max(1.2);
                }).to.throw('limit must be a positive integer');
                done();
            });
        });

        describe('#length', function () {

            it('validates array size', function (done) {

                var schema = Joi.array().length(2);
                Validate(schema, [
                    [[1, 2], true],
                    [[1], false]
                ]);
                done();
            });

            it('throws when limit is not a number', function (done) {

                expect(function () {

                    Joi.array().length('a');
                }).to.throw('limit must be a positive integer');
                done();
            });

            it('throws when limit is not an integer', function (done) {

                expect(function () {

                    Joi.array().length(1.2);
                }).to.throw('limit must be a positive integer');
                done();
            });
        });

        describe('#validate', function () {

            it('should, by default, allow undefined, allow empty array', function (done) {

                Validate(Joi.array(), [
                    [undefined, true],
                    [[], true]
                ]);
                done();
            });

            it('should, when .required(), deny undefined', function (done) {

                Validate(Joi.array().required(), [
                    [undefined, false]
                ]);
                done();
            });

            it('allows empty arrays', function (done) {

                Validate(Joi.array(), [
                    [undefined, true],
                    [[], true]
                ]);
                done();
            });

            it('should exclude values when excludes is called', function (done) {

                Validate(Joi.array().excludes(Joi.string()), [
                    [['2', '1'], false],
                    [['1'], false],
                    [[2], true]
                ]);
                done();
            });

            it('should allow types to be excluded', function (done) {

                var schema = Joi.array().excludes(Joi.number());

                var n = [1, 2, 'hippo'];
                schema.validate(n, function (err, value) {

                    expect(err).to.exist;

                    var m = ['x', 'y', 'z'];
                    schema.validate(m, function (err2, value) {

                        expect(err2).to.not.exist;
                        done();
                    });
                });
            });

            it('should validate array of Numbers', function (done) {

                Validate(Joi.array().includes(Joi.number()), [
                    [[1, 2, 3], true],
                    [[50, 100, 1000], true],
                    [['a', 1, 2], false]
                ]);
                done();
            });

            it('should validate array of mixed Numbers & Strings', function (done) {

                Validate(Joi.array().includes(Joi.number(), Joi.string()), [
                    [[1, 2, 3], true],
                    [[50, 100, 1000], true],
                    [[1, 'a', 5, 10], true],
                    [['joi', 'everydaylowprices', 5000], true]
                ]);
                done();
            });

            it('should validate array of objects with schema', function (done) {

                Validate(Joi.array().includes(Joi.object({ h1: Joi.number().required() })), [
                    [[{ h1: 1 }, { h1: 2 }, { h1: 3 }], true],
                    [[{ h2: 1, h3: 'somestring' }, { h1: 2 }, { h1: 3 }], false],
                    [[1, 2, [1]], false]
                ]);
                done();
            });

            it('should not validate array of unallowed mixed types (Array)', function (done) {

                Validate(Joi.array().includes(Joi.number()), [
                    [[1, 2, 3], true],
                    [[1, 2, [1]], false]
                ]);
                done();
            });

            it('errors on invalid number rule using includes', function (done) {

                var schema = {
                    arr: Joi.array().includes(Joi.number().integer())
                };

                var input = { arr: [1, 2, 2.1] };
                Joi.validate(input, schema, function (err, value) {

                    expect(err).to.exist;
                    expect(err.message).to.equal('the arr array value in position 2 fails because the value of 2 must be an integer');
                    done();
                });
            });

            it('validates an array within an object', function (done) {

                var schema = Joi.object({
                    array: Joi.array().includes(Joi.string().min(5), Joi.number().min(3))
                }).options({ convert: false });

                Validate(schema, [
                    [{ array: ['12345'] }, true],
                    [{ array: ['1'] }, false],
                    [{ array: [3] }, true],
                    [{ array: ['12345', 3] }, true]
                ]);
                done();
            });
        });
    });
});
