'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Joi = require('../lib');
const Helper = require('./helper');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('any', () => {

    it('should throw an exception if arguments were passed.', (done) => {

        expect(
          () => Joi.any('invalid argument.')
        ).to.throw('Joi.any() does not allow arguments.');

        done();
    });

    describe('equal()', () => {

        it('validates valid values', (done) => {

            Helper.validate(Joi.equal(4), [
                [4, true],
                [5, false, null, '"value" must be one of [4]']
            ], done);
        });
    });

    describe('not()', () => {

        it('validates invalid values', (done) => {

            Helper.validate(Joi.not(5), [
                [4, true],
                [5, false, null, '"value" contains an invalid value']
            ], done);
        });
    });

    describe('exist()', () => {

        it('validates required values', (done) => {

            Helper.validate(Joi.exist(), [
                [4, true],
                [undefined, false, null, '"value" is required']
            ], done);
        });
    });

    describe('strict()', () => {

        it('validates without converting', (done) => {

            const schema = Joi.object({
                array: Joi.array().items(Joi.string().min(5), Joi.number().min(3))
            }).strict();

            Helper.validate(schema, [
                [{ array: ['12345'] }, true],
                [{ array: ['1'] }, false, null, 'child "array" fails because ["array" at position 0 does not match any of the allowed types]'],
                [{ array: [3] }, true],
                [{ array: ['12345', 3] }, true],
                [{ array: ['3'] }, false, null, 'child "array" fails because ["array" at position 0 does not match any of the allowed types]'],
                [{ array: [1] }, false, null, 'child "array" fails because ["array" at position 0 does not match any of the allowed types]']
            ], done);
        });

        it('can be disabled', (done) => {

            const schema = Joi.object({
                array: Joi.array().items(Joi.string().min(5), Joi.number().min(3))
            }).strict().strict(false);

            Helper.validate(schema, [
                [{ array: ['12345'] }, true],
                [{ array: ['1'] }, false, null, 'child "array" fails because ["array" at position 0 does not match any of the allowed types]'],
                [{ array: [3] }, true],
                [{ array: ['12345', 3] }, true],
                [{ array: ['3'] }, true],
                [{ array: [1] }, false, null, 'child "array" fails because ["array" at position 0 does not match any of the allowed types]']
            ], done);
        });
    });

    describe('options()', () => {

        it('adds to existing options', (done) => {

            const schema = Joi.object({ b: Joi.number().strict().options({ convert: true }) });
            const input = { b: '2' };
            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value.b).to.equal(2);
                done();
            });
        });

        it('throws with an invalid option', (done) => {

            expect(() => {

                Joi.any().options({ foo: 'bar' });
            }).to.throw('"foo" is not allowed');
            done();
        });

        it('throws with an invalid option type', (done) => {

            expect(() => {

                Joi.any().options({ convert: 'yes' });
            }).to.throw('"convert" must be a boolean');
            done();
        });

        it('throws with an invalid option value', (done) => {

            expect(() => {

                Joi.any().options({ presence: 'yes' });
            }).to.throw('"presence" must be one of [required, optional, forbidden, ignore]');
            done();
        });

        it('does not throw with multiple options including presence key', (done) => {

            expect(() => {

                Joi.any().options({ presence: 'optional', raw: true });
            }).to.not.throw();
            done();
        });
    });

    describe('label()', () => {

        it('adds to existing options', (done) => {

            const schema = Joi.object({ b: Joi.string().email().label('Custom label') });
            const input = { b: 'not_a_valid_email' };
            schema.validate(input, (err, value) => {

                expect(err).to.exist();
                expect(err.details[0].message).to.equal('"Custom label" must be a valid email');
                done();
            });
        });

        it('throws when label is missing', (done) => {

            expect(() => {

                Joi.label();
            }).to.throw('Label name must be a non-empty string');
            done();
        });

        it('can describe a label', (done) => {

            const schema = Joi.object().label('lbl').describe();
            expect(schema).to.equal({ type: 'object', label: 'lbl', flags: {} });
            done();
        });

        it('does not leak into sub objects', (done) => {

            const schema = Joi.object({ a: Joi.number() }).label('foo');
            schema.validate({ a: 'a' }, (err, value) => {

                expect(err).to.exist();
                expect(err.message).to.equal('child "a" fails because ["a" must be a number]');
                done();
            });
        });

        it('does not leak into sub objects from an array', (done) => {

            const schema = Joi.array().items(Joi.object({ a: Joi.number() }).label('foo')).label('bar');
            schema.validate([{ a: 'a' }], (err, value) => {

                expect(err).to.exist();
                expect(err.message).to.equal('"bar" at position 0 fails because [child "a" fails because ["a" must be a number]]');
                done();
            });
        });

        it('does not leak into unknown keys', (done) => {

            const schema = Joi.object({ a: Joi.number() }).label('foo');
            schema.validate({ b: 'a' }, (err, value) => {

                expect(err).to.exist();
                expect(err.message).to.equal('"b" is not allowed');
                done();
            });
        });
    });

    describe('strict()', () => {

        it('adds to existing options', (done) => {

            const schema = Joi.object({ b: Joi.number().options({ convert: true }).strict() });
            const input = { b: '2' };
            schema.validate(input, (err, value) => {

                expect(err).to.exist();
                expect(value.b).to.equal('2');
                done();
            });
        });
    });

    describe('raw()', () => {

        it('gives the raw input', (done) => {

            const tests = [
                [Joi.array(), '[1,2,3]'],
                [Joi.binary(), 'abc'],
                [Joi.boolean(), false],
                [Joi.date(), '1970/01/01'],
                [Joi.number(), '12'],
                [Joi.object(), '{ "a": 1 }'],
                [Joi.any().strict(), 'abc']
            ];

            tests.forEach((test) => {

                const baseSchema = test[0];
                const input = test[1];
                const schemas = [
                    baseSchema.raw(),
                    baseSchema.raw(true)
                ];

                schemas.forEach((schema) => {

                    schema.raw().validate(input, (err, value) => {

                        expect(err).to.not.exist();
                        expect(value).to.equal(input);
                    });
                });
            });

            done();
        });

        it('avoids unnecessary cloning when called twice', (done) => {

            const schema = Joi.any().raw();
            expect(schema.raw()).to.shallow.equal(schema);
            done();
        });
    });

    describe('default()', () => {

        it('sets the value', (done) => {

            const schema = Joi.object({ foo: Joi.string().default('test') });
            const input = {};

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value.foo).to.equal('test');
                done();
            });
        });

        it('throws when value is a method and no description is provided', (done) => {

            expect(() => {

                Joi.object({
                    foo: Joi.string().default(() => {

                        return 'test';

                    })
                });
            }).to.throw();

            done();
        });

        it('allows passing description as a property of a default method', (done) => {

            const defaultFn = function () {

                return 'test';
            };

            defaultFn.description = 'test';

            expect(() => {

                Joi.object({ foo: Joi.string().default(defaultFn) });
            }).to.not.throw();

            done();
        });

        it('sets the value when passing a method', (done) => {

            const schema = Joi.object({
                foo: Joi.string().default(() => {

                    return 'test';
                }, 'testing')
            });
            const input = {};

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value.foo).to.equal('test');
                done();
            });
        });

        it('executes the default method each time validate is called', (done) => {

            let count = 0;
            const schema = Joi.object({
                foo: Joi.number().default(() => {

                    return ++count;
                }, 'incrementer')
            });
            const input = {};

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value.foo).to.equal(1);
            });

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value.foo).to.equal(2);
            });

            done();
        });

        it('passes a clone of the context if the default method accepts an argument', (done) => {

            const schema = Joi.object({
                foo: Joi.string().default((context) => {

                    return context.bar + 'ing';
                }, 'testing'),
                bar: Joi.string()
            });
            const input = { bar: 'test' };

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value.foo).to.equal('testing');
                done();
            });
        });

        it('does not modify the original object when modifying the clone in a default method', (done) => {

            const defaultFn = function (context) {

                context.bar = 'broken';
                return 'test';
            };
            defaultFn.description = 'testing';

            const schema = Joi.object({
                foo: Joi.string().default(defaultFn),
                bar: Joi.string()
            });
            const input = { bar: 'test' };

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value.bar).to.equal('test');
                expect(value.foo).to.equal('test');
                done();
            });
        });

        it('passes undefined as the context if the default method has no parent', (done) => {

            let c;
            let methodCalled = false;
            const schema = Joi.string().default((context) => {

                methodCalled = true;
                c = context;
                return 'test';
            }, 'testing');

            schema.validate(undefined, (err, value) => {

                expect(err).to.not.exist();
                expect(methodCalled).to.equal(true);
                expect(c).to.equal(undefined);
                expect(value).to.equal('test');
                done();
            });
        });

        it('allows passing a method with no description to default when the object being validated is a function', (done) => {

            const defaultFn = function () {

                return 'just a function';
            };

            let schema;
            expect(() => {

                schema = Joi.func().default(defaultFn);
            }).to.not.throw();

            schema.validate(undefined, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(defaultFn);
                done();
            });
        });

        it('allows passing a method that generates a default method when validating a function', (done) => {

            const defaultFn = function () {

                return 'just a function';
            };

            const defaultGeneratorFn = function () {

                return defaultFn;
            };
            defaultGeneratorFn.description = 'generate a default fn';

            let schema;
            expect(() => {

                schema = Joi.func().default(defaultGeneratorFn);
            }).to.not.throw();

            schema.validate(undefined, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(defaultFn);
                done();
            });
        });

        it('allows passing a ref as a default without a description', (done) => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.string().default(Joi.ref('a'))
            });

            schema.validate({ a: 'test' }, (err, value) => {

                expect(err).to.not.exist();
                expect(value.a).to.equal('test');
                expect(value.b).to.equal('test');
                done();
            });
        });

        it('ignores description when passing a ref as a default', (done) => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.string().default(Joi.ref('a'), 'this is a ref')
            });

            schema.validate({ a: 'test' }, (err, value) => {

                expect(err).to.not.exist();
                expect(value.a).to.equal('test');
                expect(value.b).to.equal('test');
                done();
            });
        });

        it('catches errors in default methods', (done) => {

            const defaultFn = function () {

                throw new Error('boom');
            };
            defaultFn.description = 'broken method';

            const schema = Joi.string().default(defaultFn);

            schema.validate(undefined, (err, value) => {

                expect(err).to.exist();
                expect(err.details).to.have.length(1);
                expect(err.details[0].message).to.contain('threw an error when running default method');
                expect(err.details[0].type).to.equal('any.default');
                expect(err.details[0].context).to.be.an.instanceof(Error);
                expect(err.details[0].context.message).to.equal('boom');
                done();
            });
        });

        it('should not overide a value when value is given', (done) => {

            const schema = Joi.object({ foo: Joi.string().default('bar') });
            const input = { foo: 'test' };

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value.foo).to.equal('test');
                done();
            });
        });

        it('sets value based on condition (outer)', (done) => {

            const schema = Joi.object({
                a: Joi.boolean(),
                b: Joi.boolean().default(false).when('a', { is: true, then: Joi.required(), otherwise: Joi.forbidden() })
            });

            schema.validate({ a: false }, (err, value) => {

                expect(err).to.not.exist();
                expect(value.b).to.equal(false);
                done();
            });
        });

        it('sets value based on condition (inner)', (done) => {

            const schema = Joi.object({
                a: Joi.boolean(),
                b: Joi.boolean().when('a', { is: true, then: Joi.default(false), otherwise: Joi.forbidden() })
            });

            schema.validate({ a: true }, (err, value) => {

                expect(err).to.not.exist();
                expect(value.b).to.equal(false);
                done();
            });
        });

        it('sets value based on multiple conditions (without otherwise)', (done) => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number()
                    .when('a', { is: 0, then: Joi.valid(1) })
                    .when('a', { is: 1, then: Joi.valid(2) })
                    .when('a', { is: 2, then: Joi.valid(3) })
            });

            Helper.validate(schema, [
                [{ a: 0, b: 1 }, true],
                [{ a: 0, b: 2 }, false, null, 'child "b" fails because ["b" must be one of [1]]'],
                [{ a: 1, b: 2 }, true],
                [{ a: 1, b: 3 }, false, null, 'child "b" fails because ["b" must be one of [2]]'],
                [{ a: 2, b: 3 }, true],
                [{ a: 2, b: 4 }, false, null, 'child "b" fails because ["b" must be one of [3]]'],
                [{ a: 42, b: 128 }, true]
            ], done);
        });

        it('sets value based on multiple conditions (with otherwise)', (done) => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number()
                    .when('a', { is: 0, then: Joi.valid(1) })
                    .when('a', { is: 1, otherwise: Joi.valid(2) })
                    .when('a', { is: 2, then: Joi.valid(3) })
            });

            Helper.validate(schema, [
                [{ a: 0, b: 1 }, true],
                [{ a: 0, b: 2 }, false, null, 'child "b" fails because ["b" must be one of [1]]'],
                [{ a: 1, b: 2 }, true],
                [{ a: 1, b: 3 }, true],
                [{ a: 2, b: 3 }, false, null, 'child "b" fails because ["b" must be one of [2]]'],
                [{ a: 2, b: 2 }, true],
                [{ a: 42, b: 128 }, false, null, 'child "b" fails because ["b" must be one of [2]]'],
                [{ a: 42, b: 2 }, true]
            ], done);
        });

        it('sets value based on multiple conditions (with base rules)', (done) => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number().valid(10)
                    .when('a', { is: 0, then: Joi.valid(1) })
                    .when('a', { is: 1, then: Joi.valid(2) })
                    .when('a', { is: 2, then: Joi.valid(3) })
            });

            Helper.validate(schema, [
                [{ a: 0, b: 1 }, true],
                [{ a: 0, b: 2 }, false, null, 'child "b" fails because ["b" must be one of [10, 1]]'],
                [{ a: 0, b: 10 }, true],
                [{ a: 1, b: 2 }, true],
                [{ a: 1, b: 3 }, false, null, 'child "b" fails because ["b" must be one of [10, 2]]'],
                [{ a: 1, b: 10 }, true],
                [{ a: 2, b: 3 }, true],
                [{ a: 2, b: 4 }, false, null, 'child "b" fails because ["b" must be one of [10, 3]]'],
                [{ a: 2, b: 10 }, true],
                [{ a: 42, b: 128 }, false, null, 'child "b" fails because ["b" must be one of [10]]'],
                [{ a: 42, b: 10 }, true]
            ], done);
        });

        it('creates deep defaults', (done) => {

            const schema = Joi.object({
                a: Joi.number().default(42),
                b: Joi.object({
                    c: Joi.boolean().default(true),
                    d: Joi.string()
                }).default()
            }).default();

            Helper.validate(schema, [
                [undefined, true, null, { a: 42, b: { c: true } }],
                [{ a: 24 }, true, null, { a: 24, b: { c: true } }]
            ], done);
        });

        it('should not affect objects other than object when called without an argument', (done) => {

            const schema = Joi.object({
                a: Joi.number().default()
            }).default();

            Helper.validate(schema, [
                [undefined, true, null, {}],
                [{ a: 24 }, true, null, { a: 24 }]
            ], done);
        });

        it('should set default value as a clone', (done) => {

            const defaultValue = { bar: 'val' };
            const schema = Joi.object({ foo: Joi.object().default(defaultValue) });
            const input = {};

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value.foo).to.not.shallow.equal(defaultValue);
                expect(value.foo).to.only.include({ bar: 'val' });

                value.foo.bar = 'mutated';

                schema.validate(input, (err2, value2) => {

                    expect(err2).to.not.exist();
                    expect(value2.foo).to.not.shallow.equal(defaultValue);
                    expect(value2.foo).to.only.include({ bar: 'val' });

                    done();
                });
            });
        });

        it('should not apply default values if the noDefaults option is enquire', (done) => {

            const schema = Joi.object({
                a: Joi.string().default('foo'),
                b: Joi.number()
            });

            const input = { b: 42 };

            Joi.validate(input, schema, { noDefaults: true }, (err, value) => {

                expect(err).to.not.exist();
                expect(value.a).to.not.exist();
                expect(value.b).to.be.equal(42);

                done();
            });
        });

        it('should not apply default values from functions if the noDefaults option is enquire', (done) => {

            const func = function (context) {

                return 'foo';
            };

            func.description = 'test parameter';

            const schema = Joi.object({
                a: Joi.string().default(func),
                b: Joi.number()
            });

            const input = { b: 42 };

            Joi.validate(input, schema, { noDefaults: true }, (err, value) => {

                expect(err).to.not.exist();
                expect(value.a).to.not.exist();
                expect(value.b).to.be.equal(42);

                done();
            });
        });

        it('should not apply default values from references if the noDefaults option is enquire', (done) => {

            const schema = Joi.object({
                a: Joi.string().default(Joi.ref('b')),
                b: Joi.number()
            });

            const input = { b: 42 };

            Joi.validate(input, schema, { noDefaults: true }, (err, value) => {

                expect(err).to.not.exist();
                expect(value.a).to.not.exist();
                expect(value.b).to.be.equal(42);

                done();
            });
        });

        it('should be able to support both empty and noDefaults', (done) => {

            const schema = Joi.object({
                a: Joi.string().empty('foo').default('bar'),
                b: Joi.number()
            });

            const input = { a: 'foo', b: 42 };

            Joi.validate(input, schema, { noDefaults: true }, (err, value) => {

                expect(err).to.not.exist();
                expect(value.a).to.not.exist();
                expect(value.b).to.be.equal(42);

                done();
            });
        });
    });

    describe('required', () => {

        it('avoids unnecessary cloning when called twice', (done) => {

            const schema = Joi.any().required();
            expect(schema.required()).to.shallow.equal(schema);
            done();
        });
    });

    describe('optional()', () => {

        it('validates optional with default required', (done) => {

            const schema = Joi.object({
                a: Joi.any(),
                b: Joi.any(),
                c: {
                    d: Joi.any()
                }
            }).options({ presence: 'required' });

            Helper.validate(schema, [
                [{ a: 5 }, false, null, 'child "b" fails because ["b" is required]'],
                [{ a: 5, b: 6 }, false, null, 'child "c" fails because ["c" is required]'],
                [{ a: 5, b: 6, c: {} }, false, null, 'child "c" fails because [child "d" fails because ["d" is required]]'],
                [{ a: 5, b: 6, c: { d: 7 } }, true],
                [{}, false, null, 'child "a" fails because ["a" is required]'],
                [{ b: 5 }, false, null, 'child "a" fails because ["a" is required]']
            ], done);
        });

        it('avoids unnecessary cloning when called twice', (done) => {

            const schema = Joi.any().optional();
            expect(schema.optional()).to.shallow.equal(schema);
            done();
        });
    });

    describe('forbidden()', () => {

        it('validates forbidden', (done) => {

            const schema = {
                a: Joi.number(),
                b: Joi.forbidden()
            };

            Helper.validate(schema, [
                [{ a: 5 }, true],
                [{ a: 5, b: 6 }, false, null, 'child "b" fails because ["b" is not allowed]'],
                [{ a: 'a' }, false, null, 'child "a" fails because ["a" must be a number]'],
                [{}, true],
                [{ b: undefined }, true],
                [{ b: null }, false, null, 'child "b" fails because ["b" is not allowed]']
            ], done);
        });

        it('avoids unnecessary cloning when called twice', (done) => {

            const schema = Joi.any().forbidden();
            expect(schema.forbidden()).to.shallow.equal(schema);
            done();
        });
    });

    describe('strip()', () => {

        it('validates and returns undefined', (done) => {

            const schema = Joi.string().strip();

            schema.validate('test', (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.not.exist();
                done();
            });
        });

        it('validates and returns an error', (done) => {

            const schema = Joi.string().strip();

            schema.validate(1, (err, value) => {

                expect(err).to.exist();
                expect(err.message).to.equal('"value" must be a string');
                done();
            });
        });

        it('avoids unnecessary cloning when called twice', (done) => {

            const schema = Joi.any().strip();
            expect(schema.strip()).to.shallow.equal(schema);
            done();
        });
    });

    describe('description()', () => {

        it('sets the description', (done) => {

            const b = Joi.description('my description');
            expect(b._description).to.equal('my description');
            done();
        });

        it('throws when description is missing', (done) => {

            expect(() => {

                Joi.description();
            }).to.throw('Description must be a non-empty string');
            done();
        });
    });

    describe('notes()', () => {

        it('sets the notes', (done) => {

            const b = Joi.notes(['a']).notes('my notes');
            expect(b._notes).to.equal(['a', 'my notes']);
            done();
        });

        it('throws when notes are missing', (done) => {

            expect(() => {

                Joi.notes();
            }).to.throw('Notes must be a non-empty string or array');
            done();
        });

        it('throws when notes are invalid', (done) => {

            expect(() => {

                Joi.notes(5);
            }).to.throw('Notes must be a non-empty string or array');
            done();
        });
    });

    describe('tags()', () => {

        it('sets the tags', (done) => {

            const b = Joi.tags(['tag1', 'tag2']).tags('tag3');
            expect(b._tags).to.include('tag1');
            expect(b._tags).to.include('tag2');
            expect(b._tags).to.include('tag3');
            done();
        });

        it('throws when tags are missing', (done) => {

            expect(() => {

                Joi.tags();
            }).to.throw('Tags must be a non-empty string or array');
            done();
        });

        it('throws when tags are invalid', (done) => {

            expect(() => {

                Joi.tags(5);
            }).to.throw('Tags must be a non-empty string or array');
            done();
        });
    });

    describe('meta()', () => {

        it('sets the meta', (done) => {

            const meta = { prop: 'val', prop2: 3 };
            let b = Joi.meta(meta);
            expect(b.describe().meta).to.equal([meta]);

            b = b.meta({ other: true });
            expect(b.describe().meta).to.equal([meta, {
                other: true
            }]);

            done();
        });

        it('throws when meta is missing', (done) => {

            expect(() => {

                Joi.meta();
            }).to.throw('Meta cannot be undefined');
            done();
        });
    });

    describe('example()', () => {

        it('sets an example', (done) => {

            const schema = Joi.valid(5, 6, 7).example(5);
            expect(schema._examples).to.include(5);
            expect(schema.describe().examples).to.equal([5]);
            done();
        });

        it('does not flatten examples', (done) => {

            const schema = Joi.array().items(5, 6, 7).example([5, 6]);
            expect(schema._examples).to.equal([[5, 6]]);
            expect(schema.describe().examples).to.equal([[5, 6]]);
            done();
        });

        it('throws when tags are missing', (done) => {

            expect(() => {

                Joi.example();
            }).to.throw('Missing example');
            done();
        });

        it('throws when example fails own rules', (done) => {

            expect(() => {

                Joi.valid(5, 6, 7).example(4);
            }).to.throw('Bad example: "value" must be one of [5, 6, 7]');
            done();
        });
    });

    describe('unit()', () => {

        it('sets the unit', (done) => {

            const b = Joi.unit('milliseconds');
            expect(b._unit).to.equal('milliseconds');
            expect(b.describe().unit).to.equal('milliseconds');
            done();
        });

        it('throws when unit is missing', (done) => {

            expect(() => {

                Joi.unit();
            }).to.throw('Unit name must be a non-empty string');
            done();
        });
    });

    describe('_validate()', () => {

        it('checks value after conversion', (done) => {

            const schema = Joi.number().invalid(2);
            Joi.validate('2', schema, { abortEarly: false }, (err, value) => {

                expect(err).to.exist();
                done();
            });
        });
    });

    describe('validate()', () => {

        it('accepts only value (sync way)', (done) => {

            const schema = Joi.number();
            const result = schema.validate('2');
            expect(result).to.equal({ value: 2, error: null });
            done();
        });

        it('accepts value and callback', (done) => {

            const schema = Joi.number();
            schema.validate('2', (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(2);
                done();
            });
        });

        it('accepts value and options', (done) => {

            const schema = Joi.number();
            const result = schema.validate('2', { convert: false });
            expect(result.error).to.be.an.error('"value" must be a number');
            done();
        });

        it('accepts value, options and callback', (done) => {

            const schema = Joi.number();
            schema.validate('2', { convert: false }, (err, value) => {

                expect(err).to.be.an.error('"value" must be a number');
                done();
            });
        });

    });

    describe('concat()', () => {

        it('throws when schema is not any', (done) => {

            expect(() => {

                Joi.string().concat(Joi.number());
            }).to.throw('Cannot merge type string with another type: number');
            done();
        });

        it('throws when schema is missing', (done) => {

            expect(() => {

                Joi.string().concat();
            }).to.throw('Invalid schema object');
            done();
        });

        it('throws when schema is invalid', (done) => {

            expect(() => {

                Joi.string().concat(1);
            }).to.throw('Invalid schema object');
            done();
        });

        it('merges two schemas (settings)', (done) => {

            const a = Joi.number().options({ convert: true });
            const b = Joi.options({ convert: false });

            Helper.validate(a, [
                [1, true],
                ['1', true]
            ]);

            Helper.validate(a.concat(b), [
                [1, true],
                ['1', false, null, '"value" must be a number']
            ], done);
        });

        it('merges two schemas (valid)', (done) => {

            const a = Joi.string().valid('a');
            const b = Joi.string().valid('b');

            Helper.validate(a, [
                ['a', true],
                ['b', false, null, '"value" must be one of [a]']
            ]);

            Helper.validate(b, [
                ['b', true],
                ['a', false, null, '"value" must be one of [b]']
            ]);

            Helper.validate(a.concat(b), [
                ['a', true],
                ['b', true]
            ], done);
        });

        it('merges two schemas (invalid)', (done) => {

            const a = Joi.string().invalid('a');
            const b = Joi.invalid('b');

            Helper.validate(a, [
                ['b', true],
                ['a', false, null, '"value" contains an invalid value']
            ]);

            Helper.validate(b, [
                ['a', true],
                ['b', false, null, '"value" contains an invalid value']
            ]);

            Helper.validate(a.concat(b), [
                ['a', false, null, '"value" contains an invalid value'],
                ['b', false, null, '"value" contains an invalid value']
            ], done);
        });

        it('merges two schemas (valid/invalid)', (done) => {

            const a = Joi.string().valid('a').invalid('b');
            const b = Joi.string().valid('b').invalid('a');

            Helper.validate(a, [
                ['a', true],
                ['b', false, null, '"value" contains an invalid value']
            ]);

            Helper.validate(b, [
                ['b', true],
                ['a', false, null, '"value" contains an invalid value']
            ]);

            Helper.validate(a.concat(b), [
                ['a', false, null, '"value" contains an invalid value'],
                ['b', true]
            ], done);
        });

        it('merges two schemas (tests)', (done) => {

            const a = Joi.number().min(5);
            const b = Joi.number().max(10);

            Helper.validate(a, [
                [4, false, null, '"value" must be larger than or equal to 5'],
                [11, true]
            ]);

            Helper.validate(b, [
                [6, true],
                [11, false, null, '"value" must be less than or equal to 10']
            ]);

            Helper.validate(a.concat(b), [
                [4, false, null, '"value" must be larger than or equal to 5'],
                [6, true],
                [11, false, null, '"value" must be less than or equal to 10']
            ], done);
        });

        it('merges two schemas (flags)', (done) => {

            const a = Joi.string().valid('a');
            const b = Joi.string().insensitive();

            Helper.validate(a, [
                ['a', true],
                ['A', false, null, '"value" must be one of [a]'],
                ['b', false, null, '"value" must be one of [a]']
            ]);

            Helper.validate(a.concat(b), [
                ['a', true],
                ['A', true],
                ['b', false, null, '"value" must be one of [a]']
            ], done);
        });

        it('overrides and append information', (done) => {

            const a = Joi.description('a').unit('a').tags('a').example('a');
            const b = Joi.description('b').unit('b').tags('b').example('b');

            const desc = a.concat(b).describe();
            expect(desc).to.equal({
                type: 'any',
                description: 'b',
                tags: ['a', 'b'],
                examples: ['a', 'b'],
                unit: 'b'
            });
            done();
        });

        it('merges two objects (any key + specific key)', (done) => {

            const a = Joi.object();
            const b = Joi.object({ b: 1 });

            Helper.validate(a, [
                [{ b: 1 }, true],
                [{ b: 2 }, true]
            ]);

            Helper.validate(b, [
                [{ b: 1 }, true],
                [{ b: 2 }, false, null, 'child "b" fails because ["b" must be one of [1]]']
            ]);

            Helper.validate(a.concat(b), [
                [{ b: 1 }, true],
                [{ b: 2 }, false, null, 'child "b" fails because ["b" must be one of [1]]']
            ]);

            Helper.validate(b.concat(a), [
                [{ b: 1 }, true],
                [{ b: 2 }, false, null, 'child "b" fails because ["b" must be one of [1]]']
            ], done);
        });

        it('merges two objects (no key + any key)', (done) => {

            const a = Joi.object({});
            const b = Joi.object();

            Helper.validate(a, [
                [{}, true],
                [{ b: 2 }, false, null, '"b" is not allowed']
            ]);

            Helper.validate(b, [
                [{}, true],
                [{ b: 2 }, true]
            ]);

            Helper.validate(a.concat(b), [
                [{}, true],
                [{ b: 2 }, false, null, '"b" is not allowed']
            ]);

            Helper.validate(b.concat(a), [
                [{}, true],
                [{ b: 2 }, false, null, '"b" is not allowed']
            ], done);
        });

        it('merges two objects (key + key)', (done) => {

            const a = Joi.object({ a: 1 });
            const b = Joi.object({ b: 2 });

            Helper.validate(a, [
                [{ a: 1 }, true],
                [{ b: 2 }, false, null, '"b" is not allowed']
            ]);

            Helper.validate(b, [
                [{ a: 1 }, false, null, '"a" is not allowed'],
                [{ b: 2 }, true]
            ]);

            Helper.validate(a.concat(b), [
                [{ a: 1 }, true],
                [{ b: 2 }, true]
            ]);

            Helper.validate(b.concat(a), [
                [{ a: 1 }, true],
                [{ b: 2 }, true]
            ], done);
        });

        it('merges two objects (renames)', (done) => {

            const a = Joi.object({ a: 1 }).rename('c', 'a');
            const b = Joi.object({ b: 2 }).rename('d', 'b');

            a.concat(b).validate({ c: 1, d: 2 }, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal({ a: 1, b: 2 });
                done();
            });
        });

        it('merges two objects (deps)', (done) => {

            const a = Joi.object({ a: 1 });
            const b = Joi.object({ b: 2 }).and('b', 'a');

            a.concat(b).validate({ a: 1, b: 2 }, (err, value) => {

                expect(err).to.not.exist();
                done();
            });
        });

        it('merges two objects (same key)', (done) => {

            const a = Joi.object({ a: 1, b: 2, c: 3 });
            const b = Joi.object({ b: 1, c: 2, a: 3 });

            const ab = a.concat(b);

            Helper.validate(a, [
                [{ a: 1, b: 2, c: 3 }, true],
                [{ a: 3, b: 1, c: 2 }, false, null, 'child "a" fails because ["a" must be one of [1]]']
            ]);

            Helper.validate(b, [
                [{ a: 1, b: 2, c: 3 }, false, null, 'child "b" fails because ["b" must be one of [1]]'],
                [{ a: 3, b: 1, c: 2 }, true]
            ]);

            Helper.validate(ab, [
                [{ a: 1, b: 2, c: 3 }, true],
                [{ a: 3, b: 1, c: 2 }, true],
                [{ a: 1, b: 2, c: 2 }, true],
                [{ a: 1, b: 2, c: 4 }, false, null, 'child "c" fails because ["c" must be one of [3, 2]]']
            ], done);
        });

        it('throws when schema key types do not match', (done) => {

            const a = Joi.object({ a: Joi.number() });
            const b = Joi.object({ a: Joi.string() });

            expect(() => {

                a.concat(b);
            }).to.throw('Cannot merge type number with another type: string');
            done();
        });

        it('merges two alternatives with references', (done) => {

            const schema = {
                a: { c: Joi.number() },
                b: Joi.alternatives(Joi.ref('a.c')).concat(Joi.alternatives(Joi.ref('c'))),
                c: Joi.number()
            };

            Helper.validate(schema, [
                [{ a: {} }, true],
                [{ a: { c: '5' }, b: 5 }, true],
                [{ a: { c: '5' }, b: 6, c: '6' }, true],
                [{ a: { c: '5' }, b: 7, c: '6' }, false, null, 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]']
            ], done);
        });

        it('merges meta properly', (done) => {

            const metaA = { a: 1 };
            const metaB = { b: 1 };
            const a = Joi.any().meta(metaA);
            const b = Joi.any().meta(metaB);
            const c = Joi.any();
            const d = Joi.any();

            expect(a.concat(b)._meta).to.equal([{ a: 1 }, { b: 1 }]);
            expect(a.concat(c)._meta).to.equal([metaA]);
            expect(b.concat(c)._meta).to.equal([metaB]);
            expect(c.concat(d)._meta).to.equal([]);

            done();
        });

        it('merges into an any', (done) => {

            const a = Joi.any().required();
            const b = Joi.number().only(0);

            expect(() => {

                a.concat(b);
            }).to.not.throw();

            const schema = a.concat(b);
            expect(schema.validate().error.message).to.equal('"value" is required');
            expect(schema.validate(1).error.message).to.equal('"value" must be one of [0]');

            done();
        });
    });

    describe('when()', () => {

        it('throws when options are invalid', (done) => {

            expect(() => {

                Joi.when('a');
            }).to.throw('Invalid options');
            done();
        });

        it('forks type into alternatives', (done) => {

            const schema = {
                a: Joi.any(),
                b: Joi.string().valid('x').when('a', { is: 5, then: Joi.valid('y'), otherwise: Joi.valid('z') })
            };

            Helper.validate(schema, [
                [{ a: 5, b: 'x' }, true],
                [{ a: 5, b: 'y' }, true],
                [{ a: 5, b: 'z' }, false, null, 'child "b" fails because ["b" must be one of [x, y]]'],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false, null, 'child "b" fails because ["b" must be one of [x, z]]'],
                [{ a: 1, b: 'z' }, true],
                [{ a: 5, b: 'a' }, false, null, 'child "b" fails because ["b" must be one of [x, y]]'],
                [{ b: 'a' }, false, null, 'child "b" fails because ["b" must be one of [x, z]]']
            ], done);
        });

        it('forks type into alternatives (only then)', (done) => {

            const schema = {
                a: Joi.any(),
                b: Joi.string().valid('x').when('a', { is: 5, then: Joi.valid('y') })
            };

            Helper.validate(schema, [
                [{ a: 5, b: 'x' }, true],
                [{ a: 5, b: 'y' }, true],
                [{ a: 5, b: 'z' }, false, null, 'child "b" fails because ["b" must be one of [x, y]]'],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false, null, 'child "b" fails because ["b" must be one of [x]]'],
                [{ a: 1, b: 'z' }, false, null, 'child "b" fails because ["b" must be one of [x]]'],
                [{ a: 5, b: 'a' }, false, null, 'child "b" fails because ["b" must be one of [x, y]]'],
                [{ b: 'a' }, false, null, 'child "b" fails because ["b" must be one of [x]]']
            ], done);
        });

        it('forks type into alternatives (only otherwise)', (done) => {

            const schema = {
                a: Joi.any(),
                b: Joi.string().valid('x').when('a', { is: 5, otherwise: Joi.valid('z') })
            };

            Helper.validate(schema, [
                [{ a: 5, b: 'x' }, true],
                [{ a: 5, b: 'y' }, false, null, 'child "b" fails because ["b" must be one of [x]]'],
                [{ a: 5, b: 'z' }, false, null, 'child "b" fails because ["b" must be one of [x]]'],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false, null, 'child "b" fails because ["b" must be one of [x, z]]'],
                [{ a: 1, b: 'z' }, true],
                [{ a: 5, b: 'a' }, false, null, 'child "b" fails because ["b" must be one of [x]]'],
                [{ b: 'a' }, false, null, 'child "b" fails because ["b" must be one of [x, z]]']
            ], done);
        });

        it('forks type into alternatives (with a schema)', (done) => {

            const schema = {
                a: Joi.any(),
                b: Joi.string().valid('x').when('a', { is: Joi.number().only(5).required(), then: Joi.valid('y') })
            };

            Helper.validate(schema, [
                [{ a: 5, b: 'x' }, true],
                [{ a: 5, b: 'y' }, true],
                [{ a: 5, b: 'z' }, false, null, 'child "b" fails because ["b" must be one of [x, y]]'],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false, null, 'child "b" fails because ["b" must be one of [x]]'],
                [{ a: 1, b: 'z' }, false, null, 'child "b" fails because ["b" must be one of [x]]'],
                [{ a: 5, b: 'a' }, false, null, 'child "b" fails because ["b" must be one of [x, y]]'],
                [{ b: 'a' }, false, null, 'child "b" fails because ["b" must be one of [x]]']
            ], done);
        });

        it('makes peer required', (done) => {

            const schema = {
                a: Joi.when('b', { is: 5, then: Joi.required() }),
                b: Joi.any()
            };

            Helper.validate(schema, [
                [{ b: 5 }, false, null, 'child "a" fails because ["a" is required]'],
                [{ b: 6 }, true],
                [{ a: 'b' }, true],
                [{ b: 5, a: 'x' }, true]
            ], done);
        });

        it('can describe as the original object', (done) => {

            const schema = Joi.number().min(10).when('a', { is: 5, then: Joi.number().max(20).required() }).describe();
            expect(schema).to.equal({
                type: 'alternatives',
                flags: {
                    presence: 'ignore'
                },
                alternatives: [{
                    ref: 'ref:a',
                    is: {
                        type: 'number',
                        flags: {
                            allowOnly: true,
                            presence: 'required'
                        },
                        valids: [5],
                        invalids: [Infinity, -Infinity]
                    },
                    then: {
                        type: 'number',
                        flags: {
                            presence: 'required'
                        },
                        invalids: [Infinity, -Infinity],
                        rules: [{ name: 'min', arg: 10 }, { name: 'max', arg: 20 }]
                    }
                }]
            });
            done();
        });
    });

    describe('requiredKeys()', () => {

        it('should set keys as required', (done) => {

            const schema = Joi.object({ a: 0, b: 0, c: { d: 0, e: { f: 0 } }, g: { h: 0 } })
                .requiredKeys('a', 'b', 'c.d', 'c.e.f', 'g');
            Helper.validate(schema, [
                [{}, false, null, 'child "a" fails because ["a" is required]'],
                [{ a: 0 }, false, null, 'child "b" fails because ["b" is required]'],
                [{ a: 0, b: 0 }, false, null, 'child "g" fails because ["g" is required]'],
                [{ a: 0, b: 0, g: {} }, true],
                [{ a: 0, b: 0, c: {}, g: {} }, false, null, 'child "c" fails because [child "d" fails because ["d" is required]]'],
                [{ a: 0, b: 0, c: { d: 0 }, g: {} }, true],
                [{ a: 0, b: 0, c: { d: 0, e: {} }, g: {} }, false, null, 'child "c" fails because [child "e" fails because [child "f" fails because ["f" is required]]]'],
                [{ a: 0, b: 0, c: { d: 0, e: { f: 0 } }, g: {} }, true]
            ], done);
        });

        it('should work on types other than objects', (done) => {

            const schemas = [Joi.array(), Joi.binary(), Joi.boolean(), Joi.date(), Joi.func(), Joi.number(), Joi.string()];
            schemas.forEach((schema) => {

                expect(() => {

                    schema.applyFunctionToChildren([''], 'required');
                }).to.not.throw();

                expect(() => {

                    schema.applyFunctionToChildren(['', 'a'], 'required');
                }).to.throw();

                expect(() => {

                    schema.applyFunctionToChildren(['a'], 'required');
                }).to.throw();
            });

            done();
        });

        it('should throw on unknown key', (done) => {

            expect(() => {

                Joi.object({ a: 0, b: 0 }).requiredKeys('a', 'c', 'b', 'd', 'd.e.f');
            }).to.throw(Error, 'unknown key(s) c, d');

            expect(() => {

                Joi.object({ a: 0, b: 0 }).requiredKeys('a', 'b', 'a.c.d');
            }).to.throw(Error, 'unknown key(s) a.c.d');

            done();
        });

        it('should throw on empty object', (done) => {

            expect(() => {

                Joi.object().requiredKeys('a', 'c', 'b', 'd');
            }).to.throw(Error, 'unknown key(s) a, b, c, d');
            done();
        });

        it('should not modify original object', (done) => {

            const schema = Joi.object({ a: 0 });
            const requiredSchema = schema.requiredKeys('a');
            schema.validate({}, (err) => {

                expect(err).to.not.exist();

                requiredSchema.validate({}, (err) => {

                    expect(err).to.exist();
                    done();
                });
            });
        });
    });

    describe('optionalKeys()', () => {

        it('should set keys as optional', (done) => {

            const schema = Joi.object({ a: Joi.number().required(), b: Joi.number().required() }).optionalKeys('a', 'b');
            Helper.validate(schema, [
                [{}, true],
                [{ a: 0 }, true],
                [{ a: 0, b: 0 }, true]
            ], done);
        });
    });

    describe('empty()', () => {

        it('should void values when considered empty', (done) => {

            const schema = Joi.string().empty('');
            Helper.validate(schema, [
                [undefined, true, null, undefined],
                ['abc', true, null, 'abc'],
                ['', true, null, undefined]
            ], done);
        });

        it('should void values with trim enabled', (done) => {

            const schema = Joi.string().empty('').trim();
            Helper.validate(schema, [
                [undefined, true, null, undefined],
                ['abc', true, null, 'abc'],
                ['', true, null, undefined],
                [' ', true, null, undefined],
                ['       ', true, null, undefined],
                [42, false, null, '"value" must be a string']
            ], done);
        });

        it('should override any previous empty', (done) => {

            const schema = Joi.string().empty('').empty('abc');
            Helper.validate(schema, [
                [undefined, true, null, undefined],
                ['abc', true, null, undefined],
                ['', false, null, '"value" is not allowed to be empty'],
                ['def', true, null, 'def']
            ], done);
        });

        it('should be possible to reset the empty value', (done) => {

            const schema = Joi.string().empty('').empty();
            Helper.validate(schema, [
                [undefined, true, null, undefined],
                ['abc', true, null, 'abc'],
                ['', false, null, '"value" is not allowed to be empty']
            ], done);
        });

        it('should have no effect if only reset is used', (done) => {

            const schema = Joi.string().empty();
            Helper.validate(schema, [
                [undefined, true, null, undefined],
                ['abc', true, null, 'abc'],
                ['', false, null, '"value" is not allowed to be empty']
            ], done);
        });

        it('should work with dependencies', (done) => {

            const schema = Joi.object({
                a: Joi.string().empty(''),
                b: Joi.string().empty('')
            }).or('a', 'b');

            Helper.validate(schema, [
                [{}, false, null, '"value" must contain at least one of [a, b]'],
                [{ a: '' }, false, null, '"value" must contain at least one of [a, b]'],
                [{ a: 'a' }, true, null, { a: 'a' }],
                [{ a: '', b: 'b' }, true, null, { b: 'b' }]
            ], done);
        });
    });

    describe('allow()', () => {

        it('allows valid values to be set', (done) => {

            expect(() => {

                Joi.any().allow(true, 1, 'hello', new Date());
            }).not.to.throw();
            done();
        });

        it('throws when passed undefined', (done) => {

            expect(() => {

                Joi.any().allow(undefined);
            }).to.throw(Error, 'Cannot call allow/valid/invalid with undefined');
            done();
        });
    });

    describe('valid()', () => {

        it('allows valid values to be set', (done) => {

            expect(() => {

                Joi.any().valid(true, 1, 'hello', new Date(), Symbol('foo'), () => {}, {});
            }).not.to.throw();
            done();
        });

        it('throws when passed undefined', (done) => {

            expect(() => {

                Joi.any().valid(undefined);
            }).to.throw(Error, 'Cannot call allow/valid/invalid with undefined');
            done();
        });

        it('validates differents types of values', (done) => {

            expect(Joi.valid(1).validate(1).error).to.be.null();
            expect(Joi.valid(1).validate(2).error).to.exist();

            const d = new Date();
            expect(Joi.valid(d).validate(new Date(d.getTime())).error).to.be.null();
            expect(Joi.valid(d).validate(new Date(d.getTime() + 1)).error).to.exist();

            const str = 'foo';
            expect(Joi.valid(str).validate(str).error).to.be.null();
            expect(Joi.valid(str).validate('foobar').error).to.exist();

            const s = Symbol('foo');
            expect(Joi.valid(s).validate(s).error).to.be.null();
            expect(Joi.valid(s).validate(Symbol('foo')).error).to.exist();

            const o = {};
            expect(Joi.valid(o).validate(o).error).to.be.null();
            expect(Joi.valid(o).validate({}).error).to.exist();

            const f = () => {};
            expect(Joi.valid(f).validate(f).error).to.be.null();
            expect(Joi.valid(f).validate(() => {}).error).to.exist();

            const b = new Buffer('foo');
            expect(Joi.valid(b).validate(b).error).to.be.null();
            expect(Joi.valid(b).validate(new Buffer('foobar')).error).to.exist();

            done();
        });
    });

    describe('invalid()', () => {

        it('allows invalid values to be set', (done) => {

            expect(() => {

                Joi.any().valid(true, 1, 'hello', new Date(), Symbol('foo'));
            }).not.to.throw();
            done();
        });

        it('throws when passed undefined', (done) => {

            expect(() => {

                Joi.any().invalid(undefined);
            }).to.throw('Cannot call allow/valid/invalid with undefined');
            done();
        });
    });

    describe('error()', () => {

        it('returns custom error', (done) => {

            const schema = Joi.object({
                a: Joi.string(),
                b: {
                    c: Joi.number().strict().error(new Error('Really wanted a number!'))
                }
            });

            Joi.validate({ a: 'abc', b: { c: 'x' } }, schema, (err) => {

                expect(err).to.exist();
                expect(err.isJoi).to.not.exist();
                expect(err.message).to.equal('Really wanted a number!');
                done();
            });
        });

        it('returns first custom error with multiple errors', (done) => {

            const schema = Joi.object({
                a: Joi.string(),
                b: {
                    c: Joi.number().error(new Error('Really wanted a number!'))
                }
            }).options({ abortEarly: false });

            Joi.validate({ a: 22, b: { c: 'x' } }, schema, (err) => {

                expect(err).to.exist();
                expect(err.isJoi).to.not.exist();
                expect(err.message).to.equal('Really wanted a number!');
                done();
            });
        });

        it('returns first error with multiple errors (first not custom)', (done) => {

            const schema = Joi.object({
                a: Joi.string(),
                b: {
                    c: Joi.number().error(new Error('Really wanted a number!'))
                }
            });

            Joi.validate({ a: 22, b: { c: 'x' } }, schema, (err) => {

                expect(err).to.exist();
                expect(err.isJoi).to.be.true();
                done();
            });
        });

        it('errors on invalid error option', (done) => {

            expect(() => {

                Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().error('Really wanted a number!')
                    }
                });
            }).to.throw('Must provide a valid Error object or a function');

            done();
        });

        it('errors on missing error option', (done) => {

            expect(() => {

                Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().error()
                    }
                });
            }).to.throw('Must provide a valid Error object or a function');

            done();
        });

        describe('with a function', () => {

            it('should replace the error message with a string', (done) => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().strict().error(() => 'Really wanted a number!')
                    }
                });

                Joi.validate({ a: 'abc', b: { c: 'x' } }, schema, (err) => {

                    expect(err).to.exist();
                    expect(err.isJoi).to.exist();
                    expect(err.message).to.equal('child "b" fails because [child "c" fails because [Really wanted a number!]]');
                    expect(err.details).to.equal([{
                        message: '"c" must be a number',
                        path: 'b.c',
                        type: 'number.base',
                        context: { key: 'c' }
                    }]);
                    done();
                });
            });

            it('should be able to combine several error messages', (done) => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict().error((errors) => {

                            return errors.join(' and '); // Automatic toString() of each error on join
                        })
                    }
                });

                Joi.validate({ a: 'abc', b: { c: -1.5 } }, schema, { abortEarly: false }, (err) => {

                    expect(err).to.exist();
                    expect(err.isJoi).to.exist();
                    expect(err.message).to.equal('child "b" fails because [child "c" fails because ["c" must be larger than or equal to 0 and "c" must be an integer]]');
                    expect(err.details).to.equal([
                        {
                            message: '"c" must be larger than or equal to 0',
                            path: 'b.c',
                            type: 'number.min',
                            context: { limit: 0, value: -1.5, key: 'c' }
                        },
                        {
                            message: '"c" must be an integer',
                            path: 'b.c',
                            type: 'number.integer',
                            context: { value: -1.5, key: 'c' }
                        }
                    ]);
                    done();
                });
            });

            it('should be able to combine several error messages using context', (done) => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict().error((errors) => {

                            return errors.reduce((memo, error) => {

                                let text = memo ? ' && ' : '';
                                switch (error.type) {
                                    case 'number.base':
                                        text += `"${error.context.key}" ∈ ℝ`;
                                        break;
                                    case 'number.min':
                                        text += `"${error.context.key}" > ${error.context.limit}`;
                                        break;
                                    case 'number.integer':
                                        text += `"${error.context.key}" ∈ ℤ`;
                                        break;
                                }
                                return memo + text;
                            }, '');
                        })
                    }
                });

                Joi.validate({ a: 'abc', b: { c: -1.5 } }, schema, { abortEarly: false }, (err) => {

                    expect(err).to.exist();
                    expect(err.isJoi).to.exist();
                    expect(err.message).to.equal('child "b" fails because [child "c" fails because ["c" > 0 && "c" ∈ ℤ]]');
                    expect(err.details).to.equal([
                        {
                            message: '"c" must be larger than or equal to 0',
                            path: 'b.c',
                            type: 'number.min',
                            context: { limit: 0, value: -1.5, key: 'c' }
                        },
                        {
                            message: '"c" must be an integer',
                            path: 'b.c',
                            type: 'number.integer',
                            context: { value: -1.5, key: 'c' }
                        }
                    ]);
                    done();
                });
            });

            it('should be able to override at the root level', (done) => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict()
                    }
                }).error((errors) => {

                    const getLeafs = (errs, leafs) => {

                        leafs = leafs || [];

                        errs.forEach((err) => {

                            if (err.context.reason) {
                                getLeafs(err.context.reason, leafs);
                            }
                            else {
                                leafs.push(err);
                            }
                        });

                        return leafs;
                    };

                    return getLeafs(errors).join(' | ');
                });

                Joi.validate({ a: 'abc', b: { c: -1.5 } }, schema, { abortEarly: false }, (err) => {

                    expect(err).to.exist();
                    expect(err.isJoi).to.exist();
                    expect(err.message).to.equal('"c" must be larger than or equal to 0 | "c" must be an integer');
                    expect(err.details).to.equal([
                        {
                            message: '"c" must be larger than or equal to 0',
                            path: 'b.c',
                            type: 'number.min',
                            context: { limit: 0, value: -1.5, key: 'c' }
                        },
                        {
                            message: '"c" must be an integer',
                            path: 'b.c',
                            type: 'number.integer',
                            context: { value: -1.5, key: 'c' }
                        }
                    ]);
                    done();
                });
            });

            it('should be able to override at several levels', (done) => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict().error(() => '"c" must be a positive integer')
                    }
                }).error((errors) => {

                    const getLeafs = (errs, leafs) => {

                        leafs = leafs || [];

                        errs.forEach((err) => {

                            if (err.context.reason && err.type !== 'override') {
                                getLeafs(err.context.reason, leafs);
                            }
                            else {
                                leafs.push(err);
                            }
                        });

                        return leafs;
                    };

                    return getLeafs(errors).join(' | ');
                });

                Joi.validate({ a: 'abc', b: { c: -1.5 } }, schema, { abortEarly: false }, (err) => {

                    expect(err).to.exist();
                    expect(err.isJoi).to.exist();
                    expect(err.message).to.equal('"c" must be a positive integer');
                    expect(err.details).to.equal([
                        {
                            message: '"c" must be larger than or equal to 0',
                            path: 'b.c',
                            type: 'number.min',
                            context: { limit: 0, value: -1.5, key: 'c' }
                        },
                        {
                            message: '"c" must be an integer',
                            path: 'b.c',
                            type: 'number.integer',
                            context: { value: -1.5, key: 'c' }
                        }
                    ]);
                    done();
                });
            });

            it('should be able to create an error out of nowhere', (done) => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict().error((errors) => ({
                            type: 'override',
                            message: 'Moar numbers !',
                            context: {
                                value: errors[0].context.value
                            }
                        }))
                    }
                });

                Joi.validate({ a: 'abc', b: { c: -1.5 } }, schema, { abortEarly: false }, (err) => {

                    expect(err).to.exist();
                    expect(err.isJoi).to.exist();
                    expect(err.message).to.equal('child "b" fails because [child "c" fails because [Moar numbers !]]');
                    expect(err.details).to.equal([
                        {
                            message: 'Moar numbers !',
                            path: 'b.c',
                            type: 'override',
                            context: { value: -1.5, key: 'c' }
                        }
                    ]);
                    done();
                });
            });

            it('should be able to create an error out of nowhere without giving a type', (done) => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict().error((errors) => ({
                            message: 'Moar numbers !',
                            context: {
                                value: errors[0].context.value
                            }
                        }))
                    }
                });

                Joi.validate({ a: 'abc', b: { c: -1.5 } }, schema, { abortEarly: false }, (err) => {

                    expect(err).to.exist();
                    expect(err.isJoi).to.exist();
                    expect(err.message).to.equal('child "b" fails because [child "c" fails because [Moar numbers !]]');
                    expect(err.details).to.equal([
                        {
                            message: 'Moar numbers !',
                            path: 'b.c',
                            type: 'override',
                            context: { value: -1.5, key: 'c' }
                        }
                    ]);
                    done();
                });
            });

            it('should be able to create an error with a template', (done) => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict().error((errors) => ({
                            template: 'oops, I received {{value}}',
                            context: {
                                value: errors[0].context.value
                            }
                        }))
                    }
                });

                Joi.validate({ a: 'abc', b: { c: -1.5 } }, schema, { abortEarly: false }, (err) => {

                    expect(err).to.exist();
                    expect(err.isJoi).to.exist();
                    expect(err.message).to.equal('child "b" fails because [child "c" fails because ["c" oops, I received -1.5]]');
                    expect(err.details).to.equal([
                        {
                            message: '"c" oops, I received -1.5',
                            path: 'b.c',
                            type: 'override',
                            context: { value: -1.5, key: 'c' }
                        }
                    ]);
                    done();
                });
            });

            it('should be able to do a no-op on errors', (done) => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict().error((errors) => errors)
                    }
                });

                Joi.validate({ a: 'abc', b: { c: -1.5 } }, schema, { abortEarly: false }, (err) => {

                    expect(err).to.exist();
                    expect(err.isJoi).to.exist();
                    expect(err.message).to.equal('child "b" fails because [child "c" fails because ["c" must be larger than or equal to 0, "c" must be an integer]]');
                    expect(err.details).to.equal([
                        {
                            message: '"c" must be larger than or equal to 0',
                            path: 'b.c',
                            type: 'number.min',
                            context: { limit: 0, value: -1.5, key: 'c' }
                        },
                        {
                            message: '"c" must be an integer',
                            path: 'b.c',
                            type: 'number.integer',
                            context: { value: -1.5, key: 'c' }
                        }
                    ]);
                    done();
                });
            });

            it('should be able to throw a javascript Error', (done) => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict().error((errors) => new Error(`error of type ${errors[0].type}`))
                    }
                });

                Joi.validate({ a: 'abc', b: { c: -1.5 } }, schema, { abortEarly: false }, (err) => {

                    expect(err).to.be.an.error('error of type number.min');
                    expect(err.isJoi).to.not.exist();
                    done();
                });
            });
        });
    });
});
