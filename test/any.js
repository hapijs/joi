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

    describe('equal()', () => {

        it('validates valid values', (done) => {

            Helper.validate(Joi.equal(4), [
                [4, true],
                [5, false]
            ], done);
        });
    });

    describe('not()', () => {

        it('validates invalid values', (done) => {

            Helper.validate(Joi.not(5), [
                [4, true],
                [5, false]
            ], done);
        });
    });

    describe('exist()', () => {

        it('validates required values', (done) => {

            Helper.validate(Joi.exist(), [
                [4, true],
                [undefined, false]
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
                [{ array: ['1'] }, false],
                [{ array: [3] }, true],
                [{ array: ['12345', 3] }, true],
                [{ array: ['3'] }, false],
                [{ array: [1] }, false]
            ], done);
        });

        it('can be disabled', (done) => {

            const schema = Joi.object({
                array: Joi.array().items(Joi.string().min(5), Joi.number().min(3))
            }).strict().strict(false);

            Helper.validate(schema, [
                [{ array: ['12345'] }, true],
                [{ array: ['1'] }, false],
                [{ array: [3] }, true],
                [{ array: ['12345', 3] }, true],
                [{ array: ['3'] }, true],
                [{ array: [1] }, false]
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
            }).to.throw('unknown key foo');
            done();
        });

        it('throws with an invalid option type', (done) => {

            expect(() => {

                Joi.any().options({ convert: 'yes' });
            }).to.throw('convert should be of type boolean');
            done();
        });

        it('throws with an invalid option value', (done) => {

            expect(() => {

                Joi.any().options({ presence: 'yes' });
            }).to.throw('presence should be one of required, optional, forbidden, ignore');
            done();
        });

        it('does not throw with multiple options including presence key', (done) => {

            expect(() => {

                Joi.any().options({ presence: 'optional', raw: true });
            }).to.not.throw();
            done();
        });
    });

    describe('#label', () => {

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
            expect(schema).to.deep.equal({ type: 'object', label: 'lbl' });
            done();
        });
    });

    describe('#strict', () => {

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

    describe('#raw', () => {

        it('gives the raw input', (done) => {

            const tests = [
                [Joi.array(), '[1,2,3]'],
                [Joi.binary(), 'abc'],
                [Joi.boolean(), 'false'],
                [Joi.date().format('YYYYMMDD'), '19700101'],
                [Joi.number(), '12'],
                [Joi.object(), '{ "a": 1 }'],
                [Joi.any().strict(), 'abc']
            ];

            tests.forEach((test) => {

                const baseSchema = test[0];
                const input = test[1];
                const schemas = [
                    baseSchema.raw(),
                    baseSchema.raw(true),
                    baseSchema.options({ raw: true })
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
    });

    describe('#default', () => {

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
                expect(value).to.deep.equal(defaultFn);
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
                expect(value).to.deep.equal(defaultFn);
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
    });

    describe('#optional', () => {

        it('validates optional with default required', (done) => {

            const schema = Joi.object({
                a: Joi.any(),
                b: Joi.any(),
                c: {
                    d: Joi.any()
                }
            }).options({ presence: 'required' });

            Helper.validate(schema, [
                [{ a: 5 }, false],
                [{ a: 5, b: 6 }, false],
                [{ a: 5, b: 6, c: {} }, false],
                [{ a: 5, b: 6, c: { d: 7 } }, true],
                [{}, false],
                [{ b: 5 }, false]
            ], done);
        });
    });

    describe('#forbidden', () => {

        it('validates forbidden', (done) => {

            const schema = {
                a: Joi.number(),
                b: Joi.forbidden()
            };

            Helper.validate(schema, [
                [{ a: 5 }, true],
                [{ a: 5, b: 6 }, false],
                [{ a: 'a' }, false],
                [{}, true],
                [{ b: undefined }, true],
                [{ b: null }, false]
            ], done);
        });
    });

    describe('#strip', () => {

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
    });

    describe('#description', () => {

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

    describe('#notes', () => {

        it('sets the notes', (done) => {

            const b = Joi.notes(['a']).notes('my notes');
            expect(b._notes).to.deep.equal(['a', 'my notes']);
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

    describe('#tags', () => {

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

    describe('#meta', () => {

        it('sets the meta', (done) => {

            const meta = { prop: 'val', prop2: 3 };
            let b = Joi.meta(meta);
            expect(b.describe().meta).to.deep.equal([meta]);

            b = b.meta({ other: true });
            expect(b.describe().meta).to.deep.equal([meta, {
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

    describe('#example', () => {

        it('sets an example', (done) => {

            const schema = Joi.valid(5, 6, 7).example(5);
            expect(schema._examples).to.include(5);
            expect(schema.describe().examples).to.deep.equal([5]);
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

    describe('#unit', () => {

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

    describe('#_validate', () => {

        it('checks value after conversion', (done) => {

            const schema = Joi.number().invalid(2);
            Joi.validate('2', schema, { abortEarly: false }, (err, value) => {

                expect(err).to.exist();
                done();
            });
        });
    });

    describe('#concat', () => {

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
                [1, true], ['1', true]
            ]);

            Helper.validate(a.concat(b), [
                [1, true], ['1', false]
            ], done);
        });

        it('merges two schemas (valid)', (done) => {

            const a = Joi.string().valid('a');
            const b = Joi.string().valid('b');

            Helper.validate(a, [
                ['a', true],
                ['b', false]
            ]);

            Helper.validate(b, [
                ['b', true],
                ['a', false]
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
                ['b', true], ['a', false]
            ]);

            Helper.validate(b, [
                ['a', true], ['b', false]
            ]);

            Helper.validate(a.concat(b), [
                ['a', false], ['b', false]
            ], done);
        });

        it('merges two schemas (valid/invalid)', (done) => {

            const a = Joi.string().valid('a').invalid('b');
            const b = Joi.string().valid('b').invalid('a');

            Helper.validate(a, [
                ['a', true],
                ['b', false]
            ]);

            Helper.validate(b, [
                ['b', true],
                ['a', false]
            ]);

            Helper.validate(a.concat(b), [
                ['a', false],
                ['b', true]
            ], done);
        });

        it('merges two schemas (tests)', (done) => {

            const a = Joi.number().min(5);
            const b = Joi.number().max(10);

            Helper.validate(a, [
                [4, false], [11, true]
            ]);

            Helper.validate(b, [
                [6, true], [11, false]
            ]);

            Helper.validate(a.concat(b), [
                [4, false], [6, true], [11, false]
            ], done);
        });

        it('merges two schemas (flags)', (done) => {

            const a = Joi.string().valid('a');
            const b = Joi.string().insensitive();

            Helper.validate(a, [
                ['a', true], ['A', false], ['b', false]
            ]);

            Helper.validate(a.concat(b), [
                ['a', true], ['A', true], ['b', false]
            ], done);
        });

        it('overrides and append information', (done) => {

            const a = Joi.description('a').unit('a').tags('a').example('a');
            const b = Joi.description('b').unit('b').tags('b').example('b');

            const desc = a.concat(b).describe();
            expect(desc).to.deep.equal({
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
                [{ b: 1 }, true], [{ b: 2 }, true]
            ]);

            Helper.validate(b, [
                [{ b: 1 }, true], [{ b: 2 }, false]
            ]);

            Helper.validate(a.concat(b), [
                [{ b: 1 }, true], [{ b: 2 }, false]
            ]);

            Helper.validate(b.concat(a), [
                [{ b: 1 }, true], [{ b: 2 }, false]
            ], done);
        });

        it('merges two objects (no key + any key)', (done) => {

            const a = Joi.object({});
            const b = Joi.object();

            Helper.validate(a, [
                [{}, true], [{ b: 2 }, false]
            ]);

            Helper.validate(b, [
                [{}, true], [{ b: 2 }, true]
            ]);

            Helper.validate(a.concat(b), [
                [{}, true], [{ b: 2 }, false]
            ]);

            Helper.validate(b.concat(a), [
                [{}, true], [{ b: 2 }, false]
            ], done);
        });

        it('merges two objects (key + key)', (done) => {

            const a = Joi.object({ a: 1 });
            const b = Joi.object({ b: 2 });

            Helper.validate(a, [
                [{ a: 1 }, true], [{ b: 2 }, false]
            ]);

            Helper.validate(b, [
                [{ a: 1 }, false], [{ b: 2 }, true]
            ]);

            Helper.validate(a.concat(b), [
                [{ a: 1 }, true], [{ b: 2 }, true]
            ]);

            Helper.validate(b.concat(a), [
                [{ a: 1 }, true], [{ b: 2 }, true]
            ], done);
        });

        it('merges two objects (renames)', (done) => {

            const a = Joi.object({ a: 1 }).rename('c', 'a');
            const b = Joi.object({ b: 2 }).rename('d', 'b');

            a.concat(b).validate({ c: 1, d: 2 }, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.deep.equal({ a: 1, b: 2 });
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
                [{ a: 3, b: 1, c: 2 }, false]
            ]);

            Helper.validate(b, [
                [{ a: 1, b: 2, c: 3 }, false],
                [{ a: 3, b: 1, c: 2 }, true]
            ]);

            Helper.validate(ab, [
                [{ a: 1, b: 2, c: 3 }, true],
                [{ a: 3, b: 1, c: 2 }, true],
                [{ a: 1, b: 2, c: 2 }, true],
                [{ a: 1, b: 2, c: 4 }, false]
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
                [{ a: { c: '5' }, b: 7, c: '6' }, false]
            ], done);
        });

        it('merges meta properly', (done) => {

            const metaA = { a: 1 };
            const metaB = { b: 1 };
            const a = Joi.any().meta(metaA);
            const b = Joi.any().meta(metaB);
            const c = Joi.any();
            const d = Joi.any();

            expect(a.concat(b)._meta).to.deep.equal([{ a: 1 }, { b: 1 }]);
            expect(a.concat(c)._meta).to.deep.equal([metaA]);
            expect(b.concat(c)._meta).to.deep.equal([metaB]);
            expect(c.concat(d)._meta).to.deep.equal([]);

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

    describe('#when', () => {

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
                [{ a: 5, b: 'z' }, false],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false],
                [{ a: 1, b: 'z' }, true],
                [{ a: 5, b: 'a' }, false],
                [{ b: 'a' }, false]
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
                [{ a: 5, b: 'z' }, false],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false],
                [{ a: 1, b: 'z' }, false],
                [{ a: 5, b: 'a' }, false],
                [{ b: 'a' }, false]
            ], done);
        });

        it('forks type into alternatives (only otherwise)', (done) => {

            const schema = {
                a: Joi.any(),
                b: Joi.string().valid('x').when('a', { is: 5, otherwise: Joi.valid('z') })
            };

            Helper.validate(schema, [
                [{ a: 5, b: 'x' }, true],
                [{ a: 5, b: 'y' }, false],
                [{ a: 5, b: 'z' }, false],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false],
                [{ a: 1, b: 'z' }, true],
                [{ a: 5, b: 'a' }, false],
                [{ b: 'a' }, false]
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
                [{ a: 5, b: 'z' }, false],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false],
                [{ a: 1, b: 'z' }, false],
                [{ a: 5, b: 'a' }, false],
                [{ b: 'a' }, false]
            ], done);
        });

        it('makes peer required', (done) => {

            const schema = {
                a: Joi.when('b', { is: 5, then: Joi.required() }),
                b: Joi.any()
            };

            Helper.validate(schema, [
                [{ b: 5 }, false],
                [{ b: 6 }, true],
                [{ a: 'b' }, true],
                [{ b: 5, a: 'x' }, true]
            ], done);
        });
    });

    describe('#requiredKeys', () => {

        it('should set keys as required', (done) => {

            const schema = Joi.object({ a: 0, b: 0, c: { d: 0, e: { f: 0 } }, g: { h: 0 } })
                .requiredKeys('a', 'b', 'c.d', 'c.e.f', 'g');
            Helper.validate(schema, [
                [{}, false],
                [{ a: 0 }, false],
                [{ a: 0, b: 0 }, false],
                [{ a: 0, b: 0, g: {} }, true],
                [{ a: 0, b: 0, c: {}, g: {} }, false],
                [{ a: 0, b: 0, c: { d: 0 }, g: {} }, true],
                [{ a: 0, b: 0, c: { d: 0, e: {} }, g: {} }, false],
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

    describe('#optionalKeys', () => {

        it('should set keys as optional', (done) => {

            const schema = Joi.object({ a: Joi.number().required(), b: Joi.number().required() }).optionalKeys('a', 'b');
            Helper.validate(schema, [
                [{}, true],
                [{ a: 0 }, true],
                [{ a: 0, b: 0 }, true]
            ], done);
        });
    });

    describe('#empty', () => {

        it('should void values when considered empty', (done) => {

            const schema = Joi.string().empty('');
            Helper.validate(schema, [
                [undefined, true, null, undefined],
                ['abc', true, null, 'abc'],
                ['', true, null, undefined]
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

    describe('Set', () => {

        describe('#add', () => {

            it('throws when adding a non ref function', (done) => {

                expect(() => {

                    Joi.valid(() => { });
                }).to.throw('Value cannot be an object or function');
                done();
            });

            it('throws when adding an object function', (done) => {

                expect(() => {

                    Joi.valid({});
                }).to.throw('Value cannot be an object or function');
                done();
            });
        });

        describe('#has', () => {

            it('compares date to null', (done) => {

                const any = Joi.any().clone();
                any._valids.add(null);
                expect(any._valids.has(new Date())).to.equal(false);
                done();
            });

            it('compares buffer to null', (done) => {

                const any = Joi.any().clone();
                any._valids.add(null);
                expect(any._valids.has(new Buffer(''))).to.equal(false);
                done();
            });
        });

        describe('#values', () => {

            it('returns array', (done) => {

                const a = Joi.any().valid('x').invalid('y');
                const b = a.invalid('x');
                expect(a._valids.values().length).to.equal(1);
                expect(b._valids.values().length).to.equal(0);
                expect(a._invalids.values().length).to.equal(1);
                expect(b._invalids.values().length).to.equal(2);
                done();
            });

            it('strips undefined', (done) => {

                const any = Joi.any().clone();
                any._valids.add(undefined);
                expect(any._valids.values({ stripUndefined: true })).to.not.include(undefined);
                done();
            });
        });

        describe('#allow', () => {

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

        describe('#valid', () => {

            it('allows valid values to be set', (done) => {

                expect(() => {

                    Joi.any().valid(true, 1, 'hello', new Date());
                }).not.to.throw();
                done();
            });

            it('throws when passed undefined', (done) => {

                expect(() => {

                    Joi.any().valid(undefined);
                }).to.throw(Error, 'Cannot call allow/valid/invalid with undefined');
                done();
            });
        });

        describe('#invalid', () => {

            it('allows invalid values to be set', (done) => {

                expect(() => {

                    Joi.any().valid(true, 1, 'hello', new Date());
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
    });
});
