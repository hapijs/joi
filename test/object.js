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


describe('object', function () {

    it('converts a json string to an object', function (done) {

        Joi.object().validate('{"hi":true}', function (err, value) {

            expect(err).to.not.exist;
            expect(value.hi).to.equal(true);
            done();
        });
    });

    it('errors on non-object string', function (done) {

        Joi.object().validate('a string', function (err, value) {

            expect(err).to.exist;
            expect(value).to.equal('a string');
            done();
        });
    });

    it('should validate an object', function (done) {

        var schema = Joi.object().required();
        Validate(schema, [
            [{}, true],
            [{ hi: true }, true],
            ['', false]
        ]);
        done();
    });

    it('allows any key when schema is undefined', function (done) {

        Joi.object().validate({ a: 4 }, function (err, value) {

            expect(err).to.not.exist;

            Joi.object(undefined).validate({ a: 4 }, function (err, value) {

                expect(err).to.not.exist;
                done();
            });
        });
    });

    it('allows any key when schema is null', function (done) {

        Joi.object(null).validate({ a: 4 }, function (err, value) {

            expect(err).to.not.exist;
            done();
        });
    });

    it('throws on invalid object schema', function (done) {

        expect(function () {

            Joi.object(4);
        }).to.throw('Object schema must be a valid object');
        done();
    });

    it('throws on joi object schema', function (done) {

        expect(function () {

            Joi.object(Joi.object());
        }).to.throw('Object schema cannot be a joi schema');
        done();
    });

    it('skips conversion when value is undefined', function (done) {

        Joi.object({ a: Joi.object() }).validate(undefined, function (err, value) {

            expect(err).to.not.exist;
            expect(value).to.not.exist;
            done();
        });
    });

    it('errors on array', function (done) {

        Joi.object().validate([1, 2, 3], function (err, value) {

            expect(err).to.exist;
            done();
        });
    });

    it('should prevent extra keys from existing by default', function (done) {

        var schema = Joi.object({ item: Joi.string().required() }).required();
        Validate(schema, [
            [{ item: 'something' }, true],
            [{ item: 'something', item2: 'something else' }, false],
            ['', false]
        ]);
        done();
    });

    it('should validate count when min is set', function (done) {

        var schema = Joi.object().min(3);
        Validate(schema, [
            [{ item: 'something' }, false],
            [{ item: 'something', item2: 'something else' }, false],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, true],
            ['', false]
        ]);
        done();
    });

    it('should validate count when max is set', function (done) {

        var schema = Joi.object().max(2);
        Validate(schema, [
            [{ item: 'something' }, true],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, false],
            ['', false]
        ]);
        done();
    });

    it('should validate count when min and max is set', function (done) {

        var schema = Joi.object().max(3).min(2);
        Validate(schema, [
            [{ item: 'something' }, false],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else', item4: 'item4' }, false],
            ['', false]
        ]);
        done();
    });

    it('should validate count when length is set', function (done) {

        var schema = Joi.object().length(2);
        Validate(schema, [
            [{ item: 'something' }, false],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, false],
            ['', false]
        ]);
        done();
    });

    it('should traverse an object and validate all properties in the top level', function (done) {

        var schema = Joi.object({
            num: Joi.number()
        });

        Validate(schema, [
            [{ num: 1 }, true],
            [{ num: [1, 2, 3] }, false]
        ]);
        done();
    });

    it('should traverse an object and child objects and validate all properties', function (done) {

        var schema = Joi.object({
            num: Joi.number(),
            obj: Joi.object({
                item: Joi.string()
            })
        });

        Validate(schema, [
            [{ num: 1 }, true],
            [{ num: [1, 2, 3] }, false],
            [{ num: 1, obj: { item: 'something' } }, true],
            [{ num: 1, obj: { item: 123 } }, false]
        ]);
        done();
    });

    it('should traverse an object several levels', function (done) {

        var schema = Joi.object({
            obj: Joi.object({
                obj: Joi.object({
                    obj: Joi.object({
                        item: Joi.boolean()
                    })
                })
            })
        });

        Validate(schema, [
            [{ num: 1 }, false],
            [{ obj: {} }, true],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, true],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false]
        ]);
        done();
    });

    it('should traverse an object several levels with required levels', function (done) {

        var schema = Joi.object({
            obj: Joi.object({
                obj: Joi.object({
                    obj: Joi.object({
                        item: Joi.boolean()
                    })
                }).required()
            })
        });

        Validate(schema, [
            [null, false],
            [undefined, true],
            [{}, true],
            [{ obj: {} }, false],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, true],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false]
        ]);
        done();
    });

    it('should traverse an object several levels with required levels (without Joi.obj())', function (done) {

        var schema = {
            obj: {
                obj: {
                    obj: {
                        item: Joi.boolean().required()
                    }
                }
            }
        };

        Validate(schema, [
            [null, false],
            [undefined, true],
            [{}, true],
            [{ obj: {} }, true],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, false],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false]
        ]);
        done();
    });

    it('errors on unknown keys when functions allows', function (done) {

        var schema = Joi.object({ a: Joi.number() }).options({ skipFunctions: true });
        var obj = { a: 5, b: 'value' };
        schema.validate(obj, function (err, value) {

            expect(err).to.exist;
            done();
        });
    });

    it('validates both valid() and with()', function (done) {

        var schema = Joi.object({
            first: Joi.valid('value'),
            second: Joi.any()
        }).with('first', 'second');

        Validate(schema, [[{ first: 'value' }, false]]);
        done();
    });

    describe('#keys', function () {

        it('allows any key', function (done) {

            var a = Joi.object({ a: 4 });
            var b = a.keys();
            a.validate({ b: 3 }, function (err, value) {

                expect(err).to.exist;
                b.validate({ b: 3 }, function (err, value) {

                    expect(err).to.not.exist;
                    done();
                });
            });
        });

        it('forbids all keys', function (done) {

            var a = Joi.object();
            var b = a.keys({});
            a.validate({ b: 3 }, function (err, value) {

                expect(err).to.not.exist;
                b.validate({ b: 3 }, function (err, value) {

                    expect(err).to.exist;
                    done();
                });
            });
        });

        it('adds to existing keys', function (done) {

            var a = Joi.object({ a: 1 });
            var b = a.keys({ b: 2 });
            a.validate({ a: 1, b: 2 }, function (err, value) {

                expect(err).to.exist;
                b.validate({ a: 1, b: 2 }, function (err, value) {

                    expect(err).to.not.exist;
                    done();
                });
            });
        });
    });

    describe('#rename', function () {

        it('allows renaming multiple times with multiple enabled', function (done) {

            var schema = Joi.object({
                test: Joi.string()
            }).rename('test1', 'test').rename('test2', 'test', { multiple: true });

            Joi.compile(schema).validate({ test1: 'a', test2: 'b' }, function (err, value) {

                expect(err).to.not.exist;
                done();
            });
        });

        it('errors renaming multiple times with multiple disabled', function (done) {

            var schema = Joi.object({
                test: Joi.string()
            }).rename('test1', 'test').rename('test2', 'test');

            Joi.compile(schema).validate({ test1: 'a', test2: 'b' }, function (err, value) {

                expect(err.message).to.equal('value cannot rename child test2 because multiple renames are disabled and another key was already renamed to test');
                done();
            });
        });

        it('errors multiple times when abortEarly is false', function (done) {

            Joi.object().rename('a', 'b').rename('c', 'b').rename('d', 'b').options({ abortEarly: false }).validate({ a: 1, c: 1, d: 1 }, function (err, value) {

                expect(err).to.exist;
                expect(err.message).to.equal('value cannot rename child c because multiple renames are disabled and another key was already renamed to b. value cannot rename child d because multiple renames are disabled and another key was already renamed to b');
                done();
            });
        });

        it('aliases a key', function (done) {

            var schema = Joi.object({
                a: Joi.number(),
                b: Joi.number()
            }).rename('a', 'b', { alias: true });

            var obj = { a: 10 };

            Joi.compile(schema).validate(obj, function (err, value) {

                expect(err).to.not.exist;
                expect(value.a).to.equal(10);
                expect(value.b).to.equal(10);
                done();
            });
        });

        it('with override disabled should not allow overwriting existing value', function (done) {

            var schema = Joi.object({
                test1: Joi.string()
            }).rename('test', 'test1');

            schema.validate({ test: 'b', test1: 'a' }, function (err, value) {

                expect(err.message).to.equal('value cannot rename child test because override is disabled and target test1 exists');
                done();
            });
        });

        it('with override enabled should allow overwriting existing value', function (done) {

            var schema = Joi.object({
                test1: Joi.string()
            }).rename('test', 'test1', { override: true });

            schema.validate({ test: 'b', test1: 'a' }, function (err, value) {

                expect(err).to.not.exist;
                done();
            });
        });

        it('renames when data is nested in an array via includes', function (done) {

            var schema = {
                arr: Joi.array().includes(Joi.object({
                    one: Joi.string(),
                    two: Joi.string()
                }).rename('uno', 'one').rename('dos', 'two'))
            };

            var data = { arr: [{ uno: '1', dos: '2' }] };
            Joi.object(schema).validate(data, function (err, value) {

                expect(err).to.not.exist;
                expect(value.arr[0].one).to.equal('1');
                expect(value.arr[0].two).to.equal('2');
                done();
            });
        });

        it('applies rename and validation in the correct order regardless of key order', function (done) {

            var schema1 = Joi.object({
                a: Joi.number()
            }).rename('b', 'a');

            var input1 = { b: '5' };

            schema1.validate(input1, function (err1, value1) {

                expect(err1).to.not.exist;
                expect(value1.b).to.not.exist;
                expect(value1.a).to.equal(5);

                var schema2 = Joi.object({ a: Joi.number(), b: Joi.any() }).rename('b', 'a');
                var input2 = { b: '5' };

                schema2.validate(input2, function (err2, value2) {

                    expect(err2).to.not.exist;
                    expect(value2.b).to.not.exist;
                    expect(value2.a).to.equal(5);

                    done();
                });
            });
        });

        it('sets the default value after key is renamed', function (done) {

            var schema = Joi.object({
                foo2: Joi.string().default('test')
            }).rename('foo', 'foo2');

            var input = {};

            Joi.validate(input, schema, function (err, value) {

                expect(err).to.not.exist;
                expect(value.foo2).to.equal('test');

                done();
            });
        });
    });

    describe('#describe', function () {

        it('return empty description when no schema defined', function (done) {

            var schema = Joi.object();
            var desc = schema.describe();
            expect(desc).to.deep.equal({
                type: 'object',
                valids: [undefined],
                invalids: [null]
            });
            done();
        });
    });

    describe('#length', function () {

        it('throws when length is not a number', function (done) {

            expect(function () {

                Joi.object().length('a');
            }).to.throw('limit must be a positive integer');
            done();
        });
    });

    describe('#min', function () {

        it('throws when limit is not a number', function (done) {

            expect(function () {

                Joi.object().min('a');
            }).to.throw('limit must be a positive integer');
            done();
        });
    });

    describe('#max', function () {

        it('throws when limit is not a number', function (done) {

            expect(function () {

                Joi.object().max('a');
            }).to.throw('limit must be a positive integer');
            done();
        });
    });

    describe('#with', function () {

        it('should throw an error when a parameter is not a string', function (done) {

            try {
                Joi.object().with({});
                var error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);

            try {
                Joi.object().with(123);
                error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);
            done();
        });
    });

    describe('#without', function () {

        it('should throw an error when a parameter is not a string', function (done) {

            try {
                Joi.object().without({});
                var error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);

            try {
                Joi.object().without(123);
                error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);
            done();
        });
    });

    describe('#xor', function () {

        it('should throw an error when a parameter is not a string', function (done) {

            try {
                Joi.object().xor({});
                var error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);

            try {
                Joi.object().xor(123);
                error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);
            done();
        });
    });

    describe('#or', function () {

        it('should throw an error when a parameter is not a string', function (done) {

            try {
                Joi.object().or({});
                var error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);

            try {
                Joi.object().or(123);
                error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);
            done();
        });

        it('errors multiple levels deep', function (done) {

            Joi.object({
                a: {
                    b: Joi.object().or('x', 'y')
                }
            }).validate({ a: { b: { c: 1 } } }, function (err, value) {

                expect(err).to.exist;
                expect(err.message).to.equal('value must contain at least one of x, y');
                done();
            });
        });
    });

    describe('#assert', function () {

        it('validates upwards reference', function (done) {

            var schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            }).assert(Joi.ref('d/e', { separator: '/' }), Joi.ref('a.c'), 'equal to a.c');

            schema.validate({ a: { b: 'x', c: 5 }, d: { e: 6 } }, function (err, value) {

                expect(err).to.exist;
                expect(err.message).to.equal('value validation failed because d.e failed to equal to a.c');

                Validate(schema, [
                    [{ a: { b: 'x', c: 5 }, d: { e: 5 } }, true]
                ]);

                done();
            });
        });

        it('validates upwards reference with implicit context', function (done) {

            var schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            }).assert('d.e', Joi.ref('a.c'), 'equal to a.c');

            schema.validate({ a: { b: 'x', c: 5 }, d: { e: 6 } }, function (err, value) {

                expect(err).to.exist;
                expect(err.message).to.equal('value validation failed because d.e failed to equal to a.c');

                Validate(schema, [
                    [{ a: { b: 'x', c: 5 }, d: { e: 5 } }, true]
                ]);

                done();
            });
        });

        it('throws when context is at root level', function (done) {

            expect(function () {

                var schema = Joi.object({
                    a: {
                        b: Joi.string(),
                        c: Joi.number()
                    },
                    d: {
                        e: Joi.any()
                    }
                }).assert('a', Joi.ref('d.e'), 'equal to d.e');
            }).to.throw('Cannot use assertions for root level references - use direct key rules instead');
            done();
        });
    });
});

