'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('extension', () => {

    it('defines a custom type with a default base', () => {

        const customJoi = Joi.extend({
            name: 'myType'
        });

        expect(Joi.myType).to.not.exist();
        expect(customJoi.myType).to.be.a.function();

        const schema = customJoi.myType();
        expect(schema._type).to.equal('myType');
        expect(Joi.isSchema(schema)).to.be.true();
    });

    it('defines a custom type with a custom base', () => {

        const customJoi = Joi.extend({
            base: Joi.string().min(2),
            name: 'myType'
        });

        expect(Joi.myType).to.not.exist();
        expect(customJoi.myType).to.be.a.function();

        const schema = customJoi.myType();
        Helper.validate(schema, [
            [123, false, null, {
                message: '"value" must be a string',
                details: [{
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 123, label: 'value' }
                }]
            }],
            ['a', false, null, {
                message: '"value" length must be at least 2 characters long',
                details: [{
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'a',
                        encoding: undefined,
                        label: 'value'
                    }
                }]
            }],
            ['abc', true]
        ]);
    });

    it('defines a custom type with a custom base while preserving its original helper params', () => {

        const customJoi = Joi.extend({
            base: Joi.object(),
            name: 'myType'
        });

        expect(Joi.myType).to.not.exist();
        expect(customJoi.myType).to.be.a.function();

        const schema = customJoi.myType({ a: customJoi.number() });
        Helper.validate(schema, [
            [undefined, true],
            [{}, true],
            [{ a: 1 }, true],
            [{ a: 'a' }, false, null, {
                message: '"a" must be a number',
                details: [{
                    message: '"a" must be a number',
                    path: ['a'],
                    type: 'number.base',
                    context: { key: 'a', label: 'a', value: 'a' }
                }]
            }]
        ]);
    });

    it('defines a custom type with a custom base and pre (object)', () => {

        const customJoi = Joi.extend({
            base: Joi.object(),
            pre(value, state, prefs) {

                return value;
            },
            name: 'myType'
        });

        expect(Joi.myType).to.not.exist();
        expect(customJoi.myType).to.be.a.function();

        const schema = customJoi.myType({ a: customJoi.number() });
        Helper.validate(schema, [
            [undefined, true],
            [{}, true],
            [{ a: 1 }, true],
            [{ a: 'a' }, false, null, {
                message: '"a" must be a number',
                details: [{
                    message: '"a" must be a number',
                    path: ['a'],
                    type: 'number.base',
                    context: { key: 'a', label: 'a', value: 'a' }
                }]
            }]
        ]);
    });

    it('defines a custom type with a custom base and pre (number)', () => {

        const customJoi = Joi.extend({
            base: Joi.number(),
            pre(value, state, prefs) {

                return value;
            },
            name: 'myType'
        });

        expect(Joi.myType).to.not.exist();
        expect(customJoi.myType).to.be.a.function();

        const schema = customJoi.myType({ a: customJoi.number() });
        Helper.validate(schema, [
            [undefined, true],
            [1, true],
            ['1', true],
            [{}, false, null, {
                message: '"value" must be a number',
                details: [{
                    message: '"value" must be a number',
                    path: [],
                    type: 'number.base',
                    context: { label: 'value', value: {} }
                }]
            }]
        ]);
    });

    it('defines a custom type with new rules', () => {

        const customJoi = Joi.extend({
            name: 'myType',
            messages: {
                'myType.bar': '"{#label}" oh no bar !'
            },
            rules: [
                {
                    name: 'foo',
                    validate(params, value, state, prefs) {

                        return null; // Valid
                    }
                },
                {
                    name: 'bar',
                    validate(params, value, state, prefs) {

                        return this.createError('myType.bar', value, null, state, prefs);
                    }
                }
            ]
        });

        const original = Joi.any();
        expect(original.foo).to.not.exist();
        expect(original.bar).to.not.exist();

        const schema = customJoi.myType();
        const valid = schema.foo().validate({});
        const invalid = schema.bar().validate({});

        expect(valid.error).to.be.null();
        expect(invalid.error).to.be.an.instanceof(Error);
        expect(invalid.error.toString()).to.equal('ValidationError: "value" oh no bar !');
    });

    it('concat custom type', () => {

        const customJoi = Joi.extend({
            name: 'myType',
            rules: [
                {
                    name: 'test',
                    validate(params, value, state, prefs) {

                        return null; // Valid
                    }
                }
            ]
        });

        const schema = customJoi.myType();
        const base = schema.test();
        const merged = base.concat(base);

        expect(merged.describe()).to.equal({
            type: 'myType',
            rules: [{ name: 'test', arg: {} }, { name: 'test', arg: {} }]
        });
    });

    it('new rules should have the correct this', () => {

        const customJoi = Joi.extend({
            name: 'myType',
            messages: {
                'myType.bar': '"{#label}" oh no bar !'
            },
            rules: [
                {
                    name: 'foo',
                    validate(params, value, state, prefs) {

                        return this.createError('myType.bar', value, null, state, prefs);
                    }
                }
            ]
        });

        const schema = customJoi.myType().foo().label('baz');
        expect(schema.validate({}).error).to.be.an.error('"baz" oh no bar !');
    });

    it('defines a custom type with a rule with setup which return undefined', () => {

        const customJoi = Joi.extend({
            name: 'myType',
            pre(value, state, prefs) {

                return this._flags.foo;
            },
            rules: [
                {
                    name: 'foo',
                    params: {
                        first: Joi.string(),
                        second: Joi.object().ref()
                    },
                    setup(params) {

                        this._flags.foo = params;
                    }
                }
            ]
        });

        const schema = customJoi.myType();
        expect(schema.foo('bar').validate(null).value).to.equal({ first: 'bar', second: undefined });
        expect(schema.foo('bar', Joi.ref('a.b')).validate(null).value.first).to.equal('bar');
        expect(Joi.isRef(schema.foo('bar', Joi.ref('a.b')).validate(null).value.second)).to.be.true();
    });

    it('defines a custom type with a rule with setup which return a Joi object', () => {

        const customJoi = Joi.extend({
            name: 'myType',
            pre(value, state, prefs) {

                return 'baz';
            },
            rules: [
                {
                    name: 'foo',
                    setup(params) {

                        return Joi.string();
                    }
                }
            ]
        });

        const schema = customJoi.myType();
        expect(schema.foo().validate('bar').value).to.equal('bar');
        expect(schema.validate('baz').value).to.equal('baz');
    });

    it('defines a custom type with a rule with setup which return other value will throw error', () => {

        const customJoi = Joi.extend({
            name: 'myType',
            pre(value, state, prefs) {

                return Joi.number();
            },
            rules: [
                {
                    name: 'foo',
                    setup(params) {

                        return 0;
                    }
                }, {
                    name: 'bar',
                    setup(params) {

                        return null;
                    }
                }, {
                    name: 'foobar',
                    setup(params) {

                        return { isJoi: true };
                    }
                }
            ]
        });

        const schema = customJoi.myType();
        expect(() => schema.foo()).to.throw('Setup of extension Joi.myType().foo() must return undefined or a Joi object');
        expect(() => schema.bar()).to.throw('Setup of extension Joi.myType().bar() must return undefined or a Joi object');
        expect(() => schema.foobar()).to.throw('Setup of extension Joi.myType().foobar() must return undefined or a Joi object');
    });

    it('defines a custom type with a rule with both setup and validate', () => {

        const customJoi = Joi.extend({
            name: 'myType',
            pre(value, state, prefs) {

                return value + this._flags.add;
            },
            rules: [
                {
                    name: 'addTwice',
                    params: {
                        factor: Joi.number().required()
                    },
                    setup(params) {

                        this._flags.add = params.factor;
                    },
                    validate(params, value, state, prefs) {

                        return value + params.factor;
                    }
                }
            ]
        });

        const schema = customJoi.myType();
        expect(schema.addTwice(3).validate(0).value).to.equal(6);
    });

    it('defines a custom type with a rule with both setup and validate', () => {

        const customJoi = Joi.extend({
            name: 'myType',
            rules: [
                {
                    name: 'add',
                    params: {
                        factor: Joi.number().required()
                    },
                    setup(params) {

                        const newSchema = Joi.number().min(0);
                        newSchema._flags.add = params.factor;
                        return newSchema;
                    },
                    validate(params, value, state, prefs) {

                        return value + params.factor;
                    }
                }
            ]
        });

        const schema = customJoi.myType();
        expect(schema.add(3).validate(3).value).to.equal(6);
    });

    it('defines a rule that validates its parameters', () => {

        const customJoi = Joi.extend({
            base: Joi.number(),
            name: 'number',
            rules: [
                {
                    name: 'multiply',
                    params: {
                        q: Joi.number().required(),
                        currency: Joi.string()
                    },
                    validate(params, value, state, prefs) {

                        const v = value * params.q;
                        return params.currency ? params.currency + v : v;
                    }
                }
            ]
        });

        const original = Joi.number();
        expect(original.double).to.not.exist();

        expect(customJoi.number().multiply(2).validate(3)).to.contain({ error: null, value: 6 });
        expect(customJoi.number().multiply(5, '$').validate(7)).to.contain({ error: null, value: '$35' });
        expect(() => customJoi.number().multiply(5, 5)).to.throw(/"currency" must be a string/);
        expect(() => customJoi.number().multiply(5, '$', 'oops')).to.throw('Unexpected number of arguments');
    });

    it('defines a rule that validates its parameters when provided as a Joi schema', () => {

        const customJoi = Joi.extend({
            base: Joi.number(),
            name: 'number',
            rules: [
                {
                    name: 'multiply',
                    params: Joi.object({
                        q: Joi.number().required(),
                        currency: Joi.string()
                    }),
                    validate(params, value, state, prefs) {

                        const v = value * params.q;
                        return params.currency ? params.currency + v : v;
                    }
                }
            ]
        });

        const original = Joi.number();
        expect(original.double).to.not.exist();

        expect(customJoi.number().multiply(2).validate(3)).to.contain({ error: null, value: 6 });
        expect(customJoi.number().multiply(5, '$').validate(7)).to.contain({ error: null, value: '$35' });
        expect(() => customJoi.number().multiply(5, '$', 'oops')).to.throw('Unexpected number of arguments');
    });

    it('defines a rule that validates its parameters with references', () => {

        const customJoi = Joi.extend({
            base: Joi.number(),
            name: 'number',
            rules: [
                {
                    name: 'multiply',
                    params: {
                        q: Joi.object().ref(),
                        currency: Joi.string()
                    },
                    validate(params, value, state, prefs) {

                        const q = params.q.resolve(value, state, prefs) || 0;
                        const v = value * q;
                        return params.currency ? params.currency + v : v;
                    }
                }
            ]
        });

        const schema = customJoi.object({
            a: customJoi.number(),
            b: customJoi.number().multiply(customJoi.ref('a'))
        });

        Helper.validate(schema, [
            [{ a: 3, b: 5 }, true, null, { a: 3, b: 15 }],
            [{ b: 42 }, true, null, { b: 0 }]
        ]);
    });

    it('defines a rule that sets defaults for its parameters', () => {

        const customJoi = Joi.extend({
            base: Joi.number(),
            name: 'number',
            rules: [
                {
                    name: 'multiply',
                    params: {
                        q: Joi.number().required(),
                        currency: Joi.string().default('$')
                    },
                    validate(params, value, state, prefs) {

                        const v = value * params.q;
                        return params.currency + v;
                    }
                }
            ]
        });

        const original = Joi.number();
        expect(original.double).to.not.exist();

        expect(customJoi.number().multiply(5).validate(7)).to.contain({ error: null, value: '$35' });
        expect(() => customJoi.number().multiply(5, 5)).to.throw(/"currency" must be a string/);
    });

    it('defines a rule that can change the value', () => {

        const customJoi = Joi.extend({
            base: Joi.number(),
            name: 'number',
            rules: [
                {
                    name: 'double',
                    validate(params, value, state, prefs) {

                        return value * 2;
                    }
                }
            ]
        });

        const original = Joi.number();
        expect(original.double).to.not.exist();

        const schema = customJoi.number().double();
        expect(schema.validate(3)).to.contain({ error: null, value: 6 });
    });

    it('does not override a predefined messages', () => {

        const base = Joi.any().prefs({
            messages: {
                'myType.foo': '"{#label}" original'
            }
        });

        const customJoi = Joi.extend({
            base,
            name: 'myType',
            messages: {
                'myType.foo': '"{#label}" modified'
            },
            rules: [
                {
                    name: 'foo',
                    validate(params, value, state, prefs) {

                        return this.createError('myType.foo', value, null, state, prefs);
                    }
                }
            ]
        });

        // Checks for a messages leak in the base

        expect(base._preferences.messages['myType.foo'].source).to.equal('"{#label}" original');

        const schema = customJoi.myType().foo();
        const result = schema.validate({});
        expect(result.error).to.be.an.instanceof(Error);
        expect(result.error.toString()).to.equal('ValidationError: "value" original');
    });

    it('does not change predefined options', () => {

        const base = Joi.number().prefs({
            abortEarly: false
        });

        const customJoi = Joi.extend({
            base,
            name: 'myType',
            messages: {
                'myType.foo': '"{#label}" foo'
            },
            rules: [
                {
                    name: 'foo',
                    validate(params, value, state, prefs) {

                        return this.createError('myType.foo', value, null, state, prefs);
                    }
                }
            ]
        });

        const schema = customJoi.myType().min(10).max(0).foo();
        const result = schema.validate(5);
        expect(result.error).to.be.an.instanceof(Error);
        expect(result.error.toString()).to.equal('ValidationError: "value" must be larger than or equal to 10. "value" must be less than or equal to 0. "value" foo');
    });

    it('defines a custom type coercing its input value', () => {

        const customJoi = Joi.extend({
            base: Joi.string(),
            coerce(value, state, prefs) {

                return 'foobar';
            },
            name: 'myType'
        });

        const schema = customJoi.myType();
        const result = schema.validate(true);
        expect(result.error).to.be.null();
        expect(result.value).to.equal('foobar');
    });

    it('defines a custom type coercing its input value that runs early enough', () => {

        const customJoi = Joi.extend({
            base: Joi.string(),
            coerce(value, state, prefs) {

                return 'foobar';
            },
            name: 'myType'
        });

        const schema = customJoi.myType();
        const result = schema.validate('');
        expect(result.error).to.be.null();
        expect(result.value).to.equal('foobar');
    });

    it('defines multiple levels of coercion', () => {

        const customJoi = Joi.extend({
            base: Joi.string(),
            coerce(value, state, prefs) {

                return 'foobar';
            },
            name: 'myType'
        });

        const customJoi2 = customJoi.extend({
            base: customJoi.myType(),
            coerce(value, state, prefs) {

                expect(value).to.equal('foobar');
                return 'baz';
            },
            name: 'myType'
        });

        const schema = customJoi2.myType();
        const result = schema.validate('');
        expect(result.error).to.be.null();
        expect(result.value).to.equal('baz');
    });

    it('defines multiple levels of coercion where base fails', () => {

        const customJoi = Joi.extend({
            base: Joi.string(),
            coerce(value, state, prefs) {

                return this.createError('any.invalid', value, null, state, prefs);
            },
            name: 'myType'
        });

        const customJoi2 = customJoi.extend({
            base: customJoi.myType(),
            coerce(value, state, prefs) {

                expect(value).to.equal('foobar');
                return 'baz';
            },
            name: 'myType'
        });

        const schema = customJoi2.myType();
        const result = schema.validate('');
        expect(result.error).to.an.error('"value" contains an invalid value');
    });

    it('defines a custom type casting its input value (symbol)', () => {

        const customJoi = Joi.extend({
            base: Joi.string(),
            pre(value, state, prefs) {

                return Symbol(value);
            },
            name: 'myType'
        });

        const schema = customJoi.myType();
        const result = schema.validate('foo');
        expect(result.error).to.be.null();
        expect(typeof result.value).to.equal('symbol');
        expect(result.value.toString()).to.equal('Symbol(foo)');
    });

    it('defines a custom type coercing and casting its input value', () => {

        const customJoi = Joi.extend({
            base: Joi.bool(),
            coerce(value, state, prefs) {

                return true;
            },
            pre(value, state, prefs) {

                return value.toString();
            },
            name: 'myType'
        });

        const schema = customJoi.myType();
        const result = schema.validate('foo');
        expect(result.error).to.be.null();
        expect(result.value).to.equal('true');
    });

    it('defines a custom type coercing when base skips coercing', () => {

        const customJoi = Joi.extend({
            base: Joi.boolean(),
            coerce(value, state, prefs) {

                return !value;
            },
            name: 'myType'
        });

        const schema = customJoi.myType();
        const result = schema.validate(true);
        expect(result.error).to.be.null();
        expect(result.value).to.be.false();
    });

    it('defines a custom type with a failing coerce', () => {

        const customJoi = Joi.extend({
            coerce(value, state, prefs) {

                return this.createError('any.invalid', value, null, state, prefs);
            },
            name: 'myType'
        });

        const schema = customJoi.myType();
        const result = schema.validate('foo');
        expect(result.error).to.exist();
        expect(result.error.toString()).to.equal('ValidationError: "value" contains an invalid value');
    });

    it('defines a custom type with a failing pre', () => {

        const customJoi = Joi.extend({
            pre(value, state, prefs) {

                return this.createError('any.invalid', value, null, state, prefs);
            },
            name: 'myType'
        });

        const schema = customJoi.myType();
        const result = schema.validate('foo');
        expect(result.error).to.exist();
        expect(result.error.toString()).to.equal('ValidationError: "value" contains an invalid value');
    });

    it('defines a custom type with a non-modifying coerce', () => {

        const customJoi = Joi.extend({
            coerce(value, state, prefs) {

                return value;
            },
            name: 'myType'
        });

        const schema = customJoi.myType();
        const result = schema.validate('foo');
        expect(result.error).to.not.exist();
        expect(result.value).to.equal('foo');
    });

    it('defines a custom type with a non-modifying pre', () => {

        const customJoi = Joi.extend({
            pre(value, state, prefs) {

                return value;
            },
            name: 'myType'
        });

        const schema = customJoi.myType();
        const result = schema.validate('foo');
        expect(result.error).to.not.exist();
        expect(result.value).to.equal('foo');
    });

    it('never reaches a pre if the base is failing', () => {

        const customJoi = Joi.extend({
            base: Joi.number(),
            pre(value, state, prefs) {

                throw new Error('should not reach here');
            },
            name: 'myType'
        });

        const schema = customJoi.myType();
        const result = schema.validate('foo');
        expect(result.error).to.exist();
        expect(result.error.toString()).to.equal('ValidationError: "value" must be a number');
    });

    describe('parameters', () => {

        it('must be an object or multiple object arguments', () => {

            expect(() => Joi.extend(true)).to.throw(/"\[0\]" does not match any of the allowed types/);
            expect(() => Joi.extend(null)).to.throw(/"\[0\]" does not match any of the allowed types/);
            expect(() => Joi.extend({ name: 'foo' }, true)).to.throw(/"\[1\]" does not match any of the allowed types/);
            expect(() => Joi.extend({ name: 'foo' }, null)).to.throw(/"\[1\]" does not match any of the allowed types/);
            expect(() => Joi.extend([{ name: 'foo' }])).to.throw('Method no longer accepts array arguments: extend');
            expect(() => Joi.extend()).to.throw('You need to provide at least one extension');
        });

        it('must have a valid string as name for the type', () => {

            expect(() => Joi.extend({ base: Joi.number() })).to.throw(/"name" is required/);
            expect(() => Joi.extend({ name: 123 })).to.throw(/"name" must be a string/);
            expect(() => Joi.extend({ name: '' })).to.throw(/"name" is not allowed to be empty/);
        });

        it('must have a Joi schema as base when present', () => {

            expect(() => Joi.extend({ base: true })).to.throw(/"base" must be an object/);
            expect(() => Joi.extend({ base: { isJoi: true } })).to.throw(/"base" must be a Joi schema of any type/);
        });

        it('must have valid coerce function', () => {

            expect(() => Joi.extend({ name: 'a', coerce: true })).to.throw(/"coerce" must be a Function/);
            expect(() => Joi.extend({ name: 'a', coerce() { } })).to.throw(/"coerce" must have an arity of 3/);
            expect(() => Joi.extend({ name: 'a', coerce(a, b) { } })).to.throw(/"coerce" must have an arity of 3/);
            expect(() => Joi.extend({ name: 'a', coerce(a, b, c, d) { } })).to.throw(/"coerce" must have an arity of 3/);
        });

        it('must have valid pre function', () => {

            expect(() => Joi.extend({ name: 'a', pre: true })).to.throw(/"pre" must be a Function/);
            expect(() => Joi.extend({ name: 'a', pre() { } })).to.throw(/"pre" must have an arity of 3/);
            expect(() => Joi.extend({ name: 'a', pre(a, b) { } })).to.throw(/"pre" must have an arity of 3/);
            expect(() => Joi.extend({ name: 'a', pre(a, b, c, d) { } })).to.throw(/"pre" must have an arity of 3/);
        });

        it('must have valid messages object', () => {

            expect(() => Joi.extend({ name: 'a', messages: true })).to.throw(/"messages" must be an object/);
            expect(() => Joi.extend({ name: 'a', messages() { } })).to.throw(/"messages" must be an object/);
            expect(() => Joi.extend({ name: 'a', messages: null })).to.throw(/"messages" must be an object/);
        });

        it('must have valid rules', () => {

            expect(() => Joi.extend({ name: 'a', rules: true })).to.throw(/"rules" must be an array/);
            expect(() => Joi.extend({ name: 'a', rules: [true] })).to.throw(/"rules\[0\]" must be an object/);
            expect(() => Joi.extend({ name: 'a', rules: [{}] })).to.throw(/"rules\[0\].name" is required/);
            expect(() => Joi.extend({ name: 'a', rules: [{ name: true }] })).to.throw(/"rules\[0\].name" must be a string/);
            expect(() => Joi.extend({ name: 'a', rules: [{ name: 'foo' }] })).to.throw(/must contain at least one of \[setup, validate\]/);

            expect(() => {

                Joi.extend({ name: 'a', rules: [{ name: 'foo', validate: true }] });
            }).to.throw(/"rules\[0\].validate" must be a Function/);

            expect(() => {

                Joi.extend({
                    name: 'a',
                    rules: [{
                        name: 'foo',
                        validate() { }
                    }]
                });
            }).to.throw(/"rules\[0\].validate" must have an arity of 4/);

            expect(() => {

                Joi.extend({ name: 'a', rules: [{ name: 'foo', setup: true }] });
            }).to.throw(/"rules\[0\].setup" must be a Function/);

            expect(() => {

                Joi.extend({
                    name: 'a',
                    rules: [{
                        name: 'foo',
                        setup() { }
                    }]
                });
            }).to.throw(/"rules\[0\].setup" must have an arity of 1/);

            expect(() => {

                Joi.extend({
                    name: 'a',
                    rules: [{
                        name: 'foo',
                        validate(a, b, c, d) { },
                        params: {
                            foo: true
                        }
                    }]
                });
            }).to.throw(/"rules\[0\].params.foo" must be an object/);

            expect(() => {

                Joi.extend({
                    name: 'a',
                    rules: [{
                        name: 'foo',
                        validate(a, b, c, d) { },
                        params: {
                            foo: {}
                        }
                    }]
                });
            }).to.throw(/"rules\[0\].params.foo" must be a Joi schema of any type/);

            expect(() => {

                Joi.extend({
                    name: 'a',
                    rules: [{
                        name: 'foo',
                        validate(a, b, c, d) { },
                        params: {
                            foo: { isJoi: true }
                        }
                    }]
                });
            }).to.throw(/"rules\[0\].params.foo" must be a Joi schema of any type/);

            expect(() => {

                Joi.extend({
                    name: 'a',
                    rules: [{
                        name: 'foo',
                        validate(a, b, c, d) { },
                        params: Joi.number()
                    }]
                });
            }).to.throw(/"rules\[0\].params" must be a Joi schema of object type/);
        });
    });

    describe('describe()', () => {

        it('should describe a basic schema', () => {

            const customJoi = Joi.extend({
                name: 'myType'
            });

            const schema = customJoi.myType();
            expect(schema.describe()).to.equal({
                type: 'myType'
            });
        });

        it('should describe a schema with a base', () => {

            const customJoi = Joi.extend({
                base: Joi.number(),
                name: 'myType'
            });

            const schema = customJoi.myType();
            expect(schema.describe()).to.equal({
                type: 'myType',
                invalids: [Infinity, -Infinity],
                flags: { unsafe: false }
            });
        });

        it('should describe a schema with rules', () => {

            const customJoi = Joi.extend({
                name: 'myType',
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, prefs) { }
                    },
                    {
                        name: 'bar',
                        validate(params, value, state, prefs) { }
                    }
                ]
            });

            const schema = customJoi.myType().foo().bar();
            expect(schema.describe()).to.equal({
                type: 'myType',
                rules: [
                    { name: 'foo', arg: {} },
                    { name: 'bar', arg: {} }
                ]
            });
        });

        it('should describe a schema with rules and parameters', () => {

            const customJoi = Joi.extend({
                name: 'myType',
                rules: [
                    {
                        name: 'foo',
                        params: {
                            bar: Joi.string(),
                            baz: Joi.number(),
                            qux: Joi.object().ref(),
                            quux: Joi.object().ref()
                        },
                        validate(params, value, state, prefs) { }
                    }
                ]
            });

            const schema = customJoi.myType().foo('bar', 42, Joi.ref('a.b'), Joi.ref('$c.d'));
            expect(schema.describe()).to.equal({
                type: 'myType',
                rules: [
                    { name: 'foo', arg: { bar: 'bar', baz: 42, qux: { ref: 'value', key: 'a.b', path: ['a', 'b'] }, quux: { ref: 'global', key: 'c.d', path: ['c', 'd'] } } }
                ]
            });
        });

        it('should describe a schema with rules and parameters with custom description', () => {

            const customJoi = Joi.extend({
                name: 'myType',
                rules: [
                    {
                        name: 'foo',
                        params: {
                            bar: Joi.string()
                        },
                        description: 'something',
                        validate(params, value, state, prefs) { }
                    },
                    {
                        name: 'bar',
                        params: {
                            baz: Joi.string()
                        },
                        description(params) {

                            expect(params).to.equal({ baz: 'baz' });
                            return 'whatever';
                        },
                        validate(params, value, state, prefs) { }
                    }
                ]
            });

            const schema = customJoi.myType().foo('bar').bar('baz');
            expect(schema.describe()).to.equal({
                type: 'myType',
                rules: [
                    { name: 'foo', description: 'something', arg: { bar: 'bar' } },
                    { name: 'bar', description: 'whatever', arg: { baz: 'baz' } }
                ]
            });
        });

        it('should describe a schema with rules and parameters with custom description', () => {

            const customJoi = Joi.extend({
                name: 'myType',
                describe(description) {

                    expect(description).to.equal({
                        type: 'myType',
                        rules: [
                            { name: 'foo', description: 'something', arg: { bar: 'bar' } },
                            { name: 'bar', description: 'whatever', arg: { baz: 'baz' } }
                        ]
                    });

                    description.type = 'zalgo';
                    return description;
                },
                rules: [
                    {
                        name: 'foo',
                        params: {
                            bar: Joi.string()
                        },
                        description: 'something',
                        validate(params, value, state, prefs) { }
                    },
                    {
                        name: 'bar',
                        params: {
                            baz: Joi.string()
                        },
                        description(params) {

                            expect(params).to.equal({ baz: 'baz' });
                            return 'whatever';
                        },
                        validate(params, value, state, prefs) { }
                    }
                ]
            });

            const schema = customJoi.myType().foo('bar').bar('baz');
            expect(schema.describe()).to.equal({
                type: 'zalgo',
                rules: [
                    { name: 'foo', description: 'something', arg: { bar: 'bar' } },
                    { name: 'bar', description: 'whatever', arg: { baz: 'baz' } }
                ]
            });
        });
    });

    it('should return a custom Joi as an instance of Any', () => {

        const customJoi = Joi.extend({
            name: 'myType'
        });

        const Any = require('../lib/types/any');

        expect(customJoi).to.be.an.instanceof(Any);
    });

    it('should return a custom Joi with types not inheriting root properties', () => {

        const customJoi = Joi.extend({
            name: 'myType'
        });

        const schema = customJoi.valid(true);
        expect(schema.isRef).to.not.exist();
    });

    it('should be able to define a type in a factory function', () => {

        const customJoi = Joi.extend((joi) => ({
            name: 'myType'
        }));

        expect(() => customJoi.myType()).to.not.throw();
    });

    it('should be able to use types defined in the same extend call', () => {

        const customJoi = Joi.extend(
            {
                name: 'myType'
            },
            (joi) => ({
                name: 'mySecondType',
                base: joi.myType()
            })
        );

        expect(() => customJoi.mySecondType()).to.not.throw();
    });

    it('should be able to merge rules when type is defined several times in the same extend call', () => {

        const customJoi = Joi.extend(
            (joi) => ({
                name: 'myType',
                base: joi.myType ? joi.myType() : joi.number(), // Inherit an already existing implementation or number
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, prefs) {

                            return 1;
                        }
                    }
                ]
            }),
            (joi) => ({
                name: 'myType',
                base: joi.myType ? joi.myType() : joi.number(),
                rules: [
                    {
                        name: 'bar',
                        validate(params, value, state, prefs) {

                            return 2;
                        }
                    }
                ]
            })
        );

        expect(() => customJoi.myType().foo().bar()).to.not.throw();
        expect(customJoi.attempt({ a: 123, b: 456 }, Joi.object({ a: customJoi.myType().foo(), b: customJoi.myType().bar() }))).to.equal({ a: 1, b: 2 });
    });

    it('should only keep last definition when type is defined several times with different bases', () => {

        const customJoi = Joi.extend(
            (joi) => ({
                name: 'myType',
                base: Joi.number(),
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, prefs) {

                            return 1;
                        }
                    }
                ]
            }),
            (joi) => ({
                name: 'myType',
                base: Joi.string(),
                rules: [
                    {
                        name: 'bar',
                        validate(params, value, state, prefs) {

                            return 2;
                        }
                    }
                ]
            })
        );

        expect(() => customJoi.myType().foo()).to.throw();
        expect(() => customJoi.myType().bar()).to.not.throw();
    });

    it('returns a generic error when using an undefined messages', () => {

        const customJoi = Joi.extend({
            name: 'myType',
            rules: [{
                name: 'foo',
                validate(params, value, state, prefs) {

                    return this.createError('myType.foo', value, null, state, prefs);
                }
            }]
        });

        const result = customJoi.myType().foo().validate({});
        expect(result.error).to.be.an.error('Error code "myType.foo" is not defined, your custom type is missing the correct messages definition');
        expect(result.error.details).to.equal([{
            message: 'Error code "myType.foo" is not defined, your custom type is missing the correct messages definition',
            path: [],
            type: 'myType.foo',
            context: { label: 'value', value: {} }
        }]);
    });

    it('merges languages when multiple extensions extend the same type', () => {

        const customJoiWithBoth = Joi.extend(
            (joi) => ({
                base: joi.number(),
                name: 'number',
                messages: { 'number.foo': '"{#label}" foo' },
                rules: [{
                    name: 'foo',
                    validate(params, value, state, prefs) {

                        return this.createError('number.foo', value, null, state, prefs);
                    }
                }]
            }),
            (joi) => ({
                base: joi.number(),
                name: 'number',
                messages: { 'number.bar': '"{#label}" bar' },
                rules: [{
                    name: 'bar',
                    validate(params, value, state, prefs) {

                        return this.createError('number.bar', value, null, state, prefs);
                    }
                }]
            })
        );

        expect(customJoiWithBoth.number().foo().validate(0).error).to.be.an.error('"value" foo');
        expect(customJoiWithBoth.number().bar().validate(0).error).to.be.an.error('"value" bar');

        const customJoiWithFirst = Joi.extend(
            (joi) => ({
                base: joi.number(),
                name: 'number',
                messages: { 'number.foo': '"{#label}" foo' },
                rules: [{
                    name: 'foo',
                    validate(params, value, state, prefs) {

                        return this.createError('number.foo', value, null, state, prefs);
                    }
                }]
            }),
            (joi) => ({
                base: joi.number(),
                name: 'number',
                rules: [{
                    name: 'bar',
                    validate(params, value, state, prefs) {

                        return this.createError('number.base', value, null, state, prefs);
                    }
                }]
            })
        );

        expect(customJoiWithFirst.number().foo().validate(0).error).to.be.an.error('"value" foo');
        expect(customJoiWithFirst.number().bar().validate(0).error).to.be.an.error('"value" must be a number');

        const customJoiWithSecond = Joi.extend(
            (joi) => ({
                base: joi.number(),
                name: 'number',
                rules: [{
                    name: 'foo',
                    validate(params, value, state, prefs) {

                        return this.createError('number.base', value, null, state, prefs);
                    }
                }]
            }),
            (joi) => ({
                base: joi.number(),
                name: 'number',
                messages: { 'number.bar': '"{#label}" bar' },
                rules: [{
                    name: 'bar',
                    validate(params, value, state, prefs) {

                        return this.createError('number.bar', value, null, state, prefs);
                    }
                }]
            })
        );

        expect(customJoiWithSecond.number().foo().validate(0).error).to.be.an.error('"value" must be a number');
        expect(customJoiWithSecond.number().bar().validate(0).error).to.be.an.error('"value" bar');
    });
});
