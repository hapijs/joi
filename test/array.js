// Load modules

var Lab = require('lab');
var Code = require('code');
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
var expect = Code.expect;


describe('array', function () {

    it('converts a string to an array', function (done) {

        Joi.array().validate('[1,2,3]', function (err, value) {

            expect(err).to.not.exist();
            expect(value.length).to.equal(3);
            done();
        });
    });

    it('errors on non-array string', function (done) {

        Joi.array().validate('{ "something": false }', function (err, value) {

            expect(err).to.exist();
            expect(err.message).to.equal('value must be an array');
            done();
        });
    });

    it('errors on number', function (done) {

        Joi.array().validate(3, function (err, value) {

            expect(err).to.exist();
            expect(value).to.equal(3);
            done();
        });
    });

    it('converts a non-array string with number type', function (done) {

        Joi.array().validate('3', function (err, value) {

            expect(err).to.exist();
            expect(value).to.equal('3');
            done();
        });
    });

    it('errors on a non-array string', function (done) {

        Joi.array().validate('asdf', function (err, value) {

            expect(err).to.exist();
            expect(value).to.equal('asdf');
            done();
        });
    });

    describe('#includes', function () {

        it('converts members', function (done) {

            var schema = Joi.array().includes(Joi.number());
            var input = ['1', '2', '3'];
            schema.validate(input, function (err, value) {

                expect(err).to.not.exist();
                expect(value).to.deep.equal([1, 2, 3]);
                done();
            });
        });

        it('allows zero size', function (done) {

            var schema = Joi.object({
                test: Joi.array().includes(Joi.object({
                    foo: Joi.string().required()
                }))
            });
            var input = { test: [] };

            schema.validate(input, function (err, value) {

                expect(err).to.not.exist();
                done();
            });
        });

        it('returns the first error when only one inclusion', function (done) {

            var schema = Joi.object({
                test: Joi.array().includes(Joi.object({
                    foo: Joi.string().required()
                }))
            });
            var input = { test: [{ foo: 'a' }, { bar: 2 }] };

            schema.validate(input, function (err, value) {

                expect(err.message).to.equal('test position 1 fails because foo is required');
                done();
            });
        });

        it('validates multiple types added in two calls', function (done) {

            var schema = Joi.array()
                .includes(Joi.number())
                .includes(Joi.string());

            Helper.validate(schema, [
                [[1, 2, 3], true],
                [[50, 100, 1000], true],
                [[1, 'a', 5, 10], true],
                [['joi', 'everydaylowprices', 5000], true]
            ], done);
        });
    });

    describe('#min', function () {

        it('validates array size', function (done) {

            var schema = Joi.array().min(2);
            Helper.validate(schema, [
                [[1, 2], true],
                [[1], false]
            ], done);
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
            Helper.validate(schema, [
                [[1, 2], false],
                [[1], true]
            ], done);
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
            Helper.validate(schema, [
                [[1, 2], true],
                [[1], false]
            ], done);
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

            Helper.validate(Joi.array(), [
                [undefined, true],
                [[], true]
            ], done);
        });

        it('should, when .required(), deny undefined', function (done) {

            Helper.validate(Joi.array().required(), [
                [undefined, false]
            ], done);
        });

        it('allows empty arrays', function (done) {

            Helper.validate(Joi.array(), [
                [undefined, true],
                [[], true]
            ], done);
        });

        it('excludes values when excludes is called', function (done) {

            Helper.validate(Joi.array().excludes(Joi.string()), [
                [['2', '1'], false],
                [['1'], false],
                [[2], true]
            ], done);
        });

        it('allows types to be excluded', function (done) {

            var schema = Joi.array().excludes(Joi.number());

            var n = [1, 2, 'hippo'];
            schema.validate(n, function (err, value) {

                expect(err).to.exist();

                var m = ['x', 'y', 'z'];
                schema.validate(m, function (err2, value) {

                    expect(err2).to.not.exist();
                    done();
                });
            });
        });

        it('validates array of Numbers', function (done) {

            Helper.validate(Joi.array().includes(Joi.number()), [
                [[1, 2, 3], true],
                [[50, 100, 1000], true],
                [['a', 1, 2], false],
                [['1', '2', 4], true]
            ], done);
        });

        it('validates array of mixed Numbers & Strings', function (done) {

            Helper.validate(Joi.array().includes(Joi.number(), Joi.string()), [
                [[1, 2, 3], true],
                [[50, 100, 1000], true],
                [[1, 'a', 5, 10], true],
                [['joi', 'everydaylowprices', 5000], true]
            ], done);
        });

        it('validates array of objects with schema', function (done) {

            Helper.validate(Joi.array().includes(Joi.object({ h1: Joi.number().required() })), [
                [[{ h1: 1 }, { h1: 2 }, { h1: 3 }], true],
                [[{ h2: 1, h3: 'somestring' }, { h1: 2 }, { h1: 3 }], false],
                [[1, 2, [1]], false]
            ], done);
        });

        it('errors on array of unallowed mixed types (Array)', function (done) {

            Helper.validate(Joi.array().includes(Joi.number()), [
                [[1, 2, 3], true],
                [[1, 2, [1]], false]
            ], done);
        });

        it('errors on invalid number rule using includes', function (done) {

            var schema = Joi.object({
                arr: Joi.array().includes(Joi.number().integer())
            });

            var input = { arr: [1, 2, 2.1] };
            schema.validate(input, function (err, value) {

                expect(err).to.exist();
                expect(err.message).to.equal('arr position 2 fails because 2 must be an integer');
                done();
            });
        });

        it('validates an array within an object', function (done) {

            var schema = Joi.object({
                array: Joi.array().includes(Joi.string().min(5), Joi.number().min(3))
            }).options({ convert: false });

            Helper.validate(schema, [
                [{ array: ['12345'] }, true],
                [{ array: ['1'] }, false],
                [{ array: [3] }, true],
                [{ array: ['12345', 3] }, true]
            ], done);
        });

        describe('#describe', function () {

            it('returns an empty description when no rules are applied', function (done) {

                var schema = Joi.array();
                var desc = schema.describe();
                expect(desc).to.deep.equal({
                    type: 'array'
                });
                done();
            });

            it('returns an includes array only if includes are specified', function (done) {

                var schema = Joi.array().includes().max(5);
                var desc = schema.describe();
                expect(desc.includes).to.not.exist();
                done();
            });

            it('returns a recursively defined array of includes when specified', function (done) {

                var schema = Joi.array().includes(Joi.number(), Joi.string()).excludes(Joi.boolean());
                var desc = schema.describe();
                expect(desc.includes).to.have.length(2);
                expect(desc.excludes).to.have.length(1);
                expect(desc).to.deep.equal({
                    type: 'array',
                    includes: [{ type: 'number' }, { type: 'string', invalids: [''] }],
                    excludes: [{ type: 'boolean' }]
                });

                done();
            });
        });
    });

    describe('#unique', function() {

        it('errors if duplicate numbers or string', function(done) {
            var schema = Joi.array().unique();

            Helper.validate(schema, [
                [[2, 2], false],
                [[02, 2], false],
                [[0x2, 2], false],
                [['duplicate', 'duplicate'], false]
            ], done);
        });

        it('ignores duplicates if they are of different types', function(done) {
            var schema = Joi.array().unique();

            Helper.validate(schema, [
                [[2, '2'], true]
            ], done);
        });

        it('ignores duplicates objects, binaries, functions, dates and booleans', function(done) {
            var buffer = new Buffer('hello world');
            var func = function() {};
            var now = new Date();
            var schema = Joi.array().unique();

            Helper.validate(schema, [
                [[{ a: 'b' }, { a: 'b' }], true],
                [[buffer, buffer], true],
                [[func, func], true],
                [[now, now], true],
                [[true, true], true]
            ], done);
        });
    });
});
