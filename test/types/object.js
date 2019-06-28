'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('object', () => {

    it('can be called on its own', () => {

        const object = Joi.object;
        expect(() => object()).to.throw('Must be invoked on a Joi instance.');
    });

    it('converts a json string to an object', async () => {

        const value = await Joi.object().validate('{"hi":true}');
        expect(value.hi).to.equal(true);
    });

    it('converts a json string with whitespace to an object', async () => {

        const value = await Joi.object().validate(' \n\r\t{ \n\r\t"hi" \n\r\t: \n\r\ttrue \n\r\t} \n\r\t');
        expect(value).to.equal({ hi: true });
    });

    it('fails on json string in strict mode', async () => {

        await expect(Joi.object().strict().validate('{"hi":true}')).to.reject('"value" must be an object');
    });

    it('errors on non-object string', async () => {

        const err = await expect(Joi.object().validate('a string')).to.reject('"value" must be an object');
        expect(err.details).to.equal([{
            message: '"value" must be an object',
            path: [],
            type: 'object.base',
            context: { label: 'value', value: 'a string' }
        }]);
    });

    it('validates an object', () => {

        const schema = Joi.object().required();
        Helper.validate(schema, [
            [{}, true],
            [{ hi: true }, true],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '' }
                }]
            }]
        ]);
    });

    it('validates references', () => {

        const schema = Joi.object().ref();

        Helper.validate(schema, [
            [{}, false, null, {
                message: '"value" must be a Joi reference',
                details: [{
                    message: '"value" must be a Joi reference',
                    path: [],
                    type: 'object.refType',
                    context: { label: 'value', value: {} }
                }]
            }],
            [Joi.ref('a.b'), true]
        ]);
    });

    it('returns object reference when no rules specified', async () => {

        const schema = Joi.object({
            a: Joi.object()
        });

        const item = { x: 5 };
        const value = await schema.validate({ a: item });
        expect(value.a).to.equal(item);
    });

    it('retains ignored values', async () => {

        const schema = Joi.object();
        const value = await schema.validate({ a: 5 });
        expect(value.a).to.equal(5);
    });

    it('retains skipped values', async () => {

        const schema = Joi.object({ b: 5 }).unknown(true);
        const value = await schema.validate({ b: '5', a: 5 });
        expect(value.a).to.equal(5);
        expect(value.b).to.equal(5);
    });

    it('retains symbols', async () => {

        const schema = Joi.object({ a: Joi.number() });

        const symbol = Symbol();
        const value = await schema.validate({ [symbol]: 5, a: 5 });
        expect(value[symbol]).to.equal(5);
    });

    it('retains non-enumerable', async () => {

        const schema = Joi.object({ a: Joi.number() });

        const obj = { a: 100 };
        Object.defineProperty(obj, 'test', { value: 42, enumerable: false });
        expect(obj.test).to.equal(42);

        const value = await schema.validate(obj, { nonEnumerables: true });
        expect(value.a).to.equal(100);
        expect(value.test).to.equal(42);
    });

    it('retains prototype', async () => {

        const schema = Joi.object({ a: Joi.number() });

        const Test = class {
            constructor() {

                this.a = 5;
            }
        };

        const value = await schema.validate(new Test());
        expect(value).to.be.instanceof(Test);
    });

    it('allows any key when schema is undefined', async () => {

        await Joi.object().validate({ a: 4 });
        await Joi.object(undefined).validate({ a: 4 });
    });

    it('allows any key when schema is null', async () => {

        await Joi.object(null).validate({ a: 4 });
    });

    it('throws on invalid object schema', () => {

        expect(() => {

            Joi.object(4);
        }).to.throw('Object schema must be a valid object');
    });

    it('throws on joi object schema', () => {

        expect(() => {

            Joi.object(Joi.object());
        }).to.throw('Object schema cannot be a joi schema');
    });

    it('skips conversion when value is undefined', async () => {

        const value = await Joi.object({ a: Joi.object() }).validate(undefined);
        expect(value).to.not.exist();
    });

    it('errors on array', async () => {

        const err = await expect(Joi.object().validate([1, 2, 3])).to.reject('"value" must be an object');
        expect(err.details).to.equal([{
            message: '"value" must be an object',
            path: [],
            type: 'object.base',
            context: { label: 'value', value: [1, 2, 3] }
        }]);
    });

    it('should prevent extra keys from existing by default', () => {

        const schema = Joi.object({ item: Joi.string().required() }).required();
        Helper.validate(schema, [
            [{ item: 'something' }, true],
            [{ item: 'something', item2: 'something else' }, false, null, {
                message: '"item2" is not allowed',
                details: [{
                    message: '"item2" is not allowed',
                    path: ['item2'],
                    type: 'object.allowUnknown',
                    context: { child: 'item2', label: 'item2', key: 'item2', value: 'something else' }
                }]
            }],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '' }
                }]
            }]
        ]);
    });

    it('validates count when min is set', () => {

        const schema = Joi.object().min(3);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must have at least 3 children',
                details: [{
                    message: '"value" must have at least 3 children',
                    path: [],
                    type: 'object.min',
                    context: { limit: 3, label: 'value', value: { item: 'something' } }
                }]
            }],
            [{ item: 'something', item2: 'something else' }, false, null, {
                message: '"value" must have at least 3 children',
                details: [{
                    message: '"value" must have at least 3 children',
                    path: [],
                    type: 'object.min',
                    context: {
                        limit: 3,
                        label: 'value',
                        value: { item: 'something', item2: 'something else' }
                    }
                }]
            }],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, true],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '' }
                }]
            }]
        ]);
    });

    it('validates count when max is set', () => {

        const schema = Joi.object().max(2);
        Helper.validate(schema, [
            [{ item: 'something' }, true],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, false, null, {
                message: '"value" must have less than or equal to 2 children',
                details: [{
                    message: '"value" must have less than or equal to 2 children',
                    path: [],
                    type: 'object.max',
                    context: {
                        limit: 2,
                        label: 'value',
                        value: { item: 'something', item2: 'something else', item3: 'something something else' }
                    }
                }]
            }],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '' }
                }]
            }]
        ]);
    });

    it('validates count when min and max is set', () => {

        const schema = Joi.object().max(3).min(2);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must have at least 2 children',
                details: [{
                    message: '"value" must have at least 2 children',
                    path: [],
                    type: 'object.min',
                    context: { limit: 2, label: 'value', value: { item: 'something' } }
                }]
            }],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, true],
            [{
                item: 'something',
                item2: 'something else',
                item3: 'something something else',
                item4: 'item4'
            }, false, null, {
                message: '"value" must have less than or equal to 3 children',
                details: [{
                    message: '"value" must have less than or equal to 3 children',
                    path: [],
                    type: 'object.max',
                    context: {
                        limit: 3,
                        label: 'value',
                        value: {
                            item: 'something',
                            item2: 'something else',
                            item3: 'something something else',
                            item4: 'item4'
                        }
                    }
                }]
            }],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '' }
                }]
            }]
        ]);
    });

    it('validates count when length is set', () => {

        const schema = Joi.object().length(2);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must have 2 children',
                details: [{
                    message: '"value" must have 2 children',
                    path: [],
                    type: 'object.length',
                    context: { limit: 2, label: 'value', value: { item: 'something' } }
                }]
            }],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, false, null, {
                message: '"value" must have 2 children',
                details: [{
                    message: '"value" must have 2 children',
                    path: [],
                    type: 'object.length',
                    context: {
                        limit: 2,
                        label: 'value',
                        value: { item: 'something', item2: 'something else', item3: 'something something else' }
                    }
                }]
            }],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '' }
                }]
            }]
        ]);
    });

    it('validates constructor when type is set', () => {

        const schema = Joi.object().instance(RegExp);
        const d = new Date();
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must be an instance of "RegExp"',
                details: [{
                    message: '"value" must be an instance of "RegExp"',
                    path: [],
                    type: 'object.instance',
                    context: { type: 'RegExp', label: 'value', value: { item: 'something' } }
                }]
            }],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: '' }
                }]
            }],
            [d, false, null, {
                message: '"value" must be an instance of "RegExp"',
                details: [{
                    message: '"value" must be an instance of "RegExp"',
                    path: [],
                    type: 'object.instance',
                    context: { type: 'RegExp', label: 'value', value: d }
                }]
            }],
            [/abcd/, true],
            [new RegExp(), true]
        ]);
    });

    it('should traverse an object and validate all properties in the top level', () => {

        const schema = Joi.object({
            num: Joi.number()
        });

        Helper.validate(schema, [
            [{ num: 1 }, true],
            [{ num: [1, 2, 3] }, false, null, {
                message: '"num" must be a number',
                details: [{
                    message: '"num" must be a number',
                    path: ['num'],
                    type: 'number.base',
                    context: { label: 'num', key: 'num', value: [1, 2, 3] }
                }]
            }]
        ]);
    });

    it('should traverse an object and child objects and validate all properties', () => {

        const schema = Joi.object({
            num: Joi.number(),
            obj: Joi.object({
                item: Joi.string()
            })
        });

        Helper.validate(schema, [
            [{ num: 1 }, true],
            [{ num: [1, 2, 3] }, false, null, {
                message: '"num" must be a number',
                details: [{
                    message: '"num" must be a number',
                    path: ['num'],
                    type: 'number.base',
                    context: { label: 'num', key: 'num', value: [1, 2, 3] }
                }]
            }],
            [{ num: 1, obj: { item: 'something' } }, true],
            [{ num: 1, obj: { item: 123 } }, false, null, {
                message: '"obj.item" must be a string',
                details: [{
                    message: '"obj.item" must be a string',
                    path: ['obj', 'item'],
                    type: 'string.base',
                    context: { value: 123, label: 'obj.item', key: 'item' }
                }]
            }]
        ]);
    });

    it('should traverse an object several levels', () => {

        const schema = Joi.object({
            obj: Joi.object({
                obj: Joi.object({
                    obj: Joi.object({
                        item: Joi.boolean()
                    })
                })
            })
        });

        Helper.validate(schema, [
            [{ num: 1 }, false, null, {
                message: '"num" is not allowed',
                details: [{
                    message: '"num" is not allowed',
                    path: ['num'],
                    type: 'object.allowUnknown',
                    context: { child: 'num', label: 'num', key: 'num', value: 1 }
                }]
            }],
            [{ obj: {} }, true],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, true],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, null, {
                message: '"obj.obj.obj.item" must be a boolean',
                details: [{
                    message: '"obj.obj.obj.item" must be a boolean',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'boolean.base',
                    context: { label: 'obj.obj.obj.item', key: 'item', value: 10 }
                }]
            }]
        ]);
    });

    it('should traverse an object several levels with required levels', () => {

        const schema = Joi.object({
            obj: Joi.object({
                obj: Joi.object({
                    obj: Joi.object({
                        item: Joi.boolean()
                    })
                }).required()
            })
        });

        Helper.validate(schema, [
            [null, false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: null }
                }]
            }],
            [undefined, true],
            [{}, true],
            [{ obj: {} }, false, null, {
                message: '"obj.obj" is required',
                details: [{
                    message: '"obj.obj" is required',
                    path: ['obj', 'obj'],
                    type: 'any.required',
                    context: { label: 'obj.obj', key: 'obj' }
                }]
            }],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, true],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, null, {
                message: '"obj.obj.obj.item" must be a boolean',
                details: [{
                    message: '"obj.obj.obj.item" must be a boolean',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'boolean.base',
                    context: { label: 'obj.obj.obj.item', key: 'item', value: 10 }
                }]
            }]
        ]);
    });

    it('should traverse an object several levels with required levels (without Joi.obj())', () => {

        const schema = {
            obj: {
                obj: {
                    obj: {
                        item: Joi.boolean().required()
                    }
                }
            }
        };

        Helper.validate(schema, [
            [null, false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', value: null }
                }]
            }],
            [undefined, true],
            [{}, true],
            [{ obj: {} }, true],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, false, null, {
                message: '"obj.obj.obj.item" is required',
                details: [{
                    message: '"obj.obj.obj.item" is required',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'any.required',
                    context: { label: 'obj.obj.obj.item', key: 'item' }
                }]
            }],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, null, {
                message: '"obj.obj.obj.item" must be a boolean',
                details: [{
                    message: '"obj.obj.obj.item" must be a boolean',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'boolean.base',
                    context: { label: 'obj.obj.obj.item', key: 'item', value: 10 }
                }]
            }]
        ]);
    });

    it('errors on unknown keys when functions allows', async () => {

        const schema = Joi.object({ a: Joi.number() }).prefs({ skipFunctions: true });
        const obj = { a: 5, b: 'value' };
        const err = await expect(schema.validate(obj)).to.reject('"b" is not allowed');
        expect(err.details).to.equal([{
            message: '"b" is not allowed',
            path: ['b'],
            type: 'object.allowUnknown',
            context: { child: 'b', label: 'b', key: 'b', value: 'value' }
        }]);
    });

    it('validates both valid() and with()', () => {

        const schema = Joi.object({
            first: Joi.valid('value'),
            second: Joi.any()
        }).with('first', 'second');

        Helper.validate(schema, [
            [{ first: 'value' }, false, null, {
                message: '"first" missing required peer "second"',
                details: [{
                    message: '"first" missing required peer "second"',
                    path: ['first'],
                    type: 'object.with',
                    context: {
                        main: 'first',
                        mainWithLabel: 'first',
                        peer: 'second',
                        peerWithLabel: 'second',
                        label: 'first',
                        key: 'first',
                        value: { first: 'value' }
                    }
                }]
            }]
        ]);
    });

    it('validates referenced arrays in valid()', () => {

        const ref = Joi.ref('$x');
        const schema = Joi.object({
            foo: Joi.valid(ref)
        });

        Helper.validate(schema, [
            [{ foo: 'bar' }, true, { context: { x: 'bar' } }],
            [{ foo: 'bar' }, true, { context: { x: ['baz', 'bar'] } }],
            [{ foo: 'bar' }, false, { context: { x: 'baz' } }, {
                message: '"foo" must be one of [ref:global:x]',
                details: [{
                    message: '"foo" must be one of [ref:global:x]',
                    path: ['foo'],
                    type: 'any.allowOnly',
                    context: { value: 'bar', valids: [ref], label: 'foo', key: 'foo' }
                }]
            }],
            [{ foo: 'bar' }, false, { context: { x: ['baz', 'qux'] } }, {
                message: '"foo" must be one of [ref:global:x]',
                details: [{
                    message: '"foo" must be one of [ref:global:x]',
                    path: ['foo'],
                    type: 'any.allowOnly',
                    context: { value: 'bar', valids: [ref], label: 'foo', key: 'foo' }
                }]
            }],
            [{ foo: 'bar' }, false, null, {
                message: '"foo" must be one of [ref:global:x]',
                details: [{
                    message: '"foo" must be one of [ref:global:x]',
                    path: ['foo'],
                    type: 'any.allowOnly',
                    context: { value: 'bar', valids: [ref], label: 'foo', key: 'foo' }
                }]
            }]
        ]);
    });

    it('errors on unknown nested keys with the correct path', async () => {

        const schema = Joi.object({ a: Joi.object().keys({}) });
        const obj = { a: { b: 'value' } };
        const err = await expect(schema.validate(obj)).to.reject('"a.b" is not allowed');
        expect(err.details).to.equal([{
            message: '"a.b" is not allowed',
            path: ['a', 'b'],
            type: 'object.allowUnknown',
            context: { child: 'b', label: 'a.b', key: 'b', value: 'value' }
        }]);
    });

    it('errors on unknown nested keys with the correct path at the root level', async () => {

        const schema = Joi.object({ a: Joi.object().keys({}) });
        const obj = { c: 'hello' };
        const err = await expect(schema.validate(obj)).to.reject('"c" is not allowed');
        expect(err.details).to.equal([{
            message: '"c" is not allowed',
            path: ['c'],
            type: 'object.allowUnknown',
            context: { child: 'c', label: 'c', key: 'c', value: 'hello' }
        }]);
    });

    it('should work on prototype-less objects', async () => {

        const input = Object.create(null);
        const schema = Joi.object().keys({
            a: Joi.number()
        });

        input.a = 1337;

        await schema.validate(input);
    });

    it('should be able to use rename safely with a fake hasOwnProperty', async () => {

        const schema = Joi.object()
            .rename('b', 'a');

        const input = { b: 2, a: 1, hasOwnProperty: 'foo' };

        const err = await expect(schema.validate(input)).to.reject('"value" cannot rename "b" because override is disabled and target "a" exists');
        expect(err.details).to.equal([{
            message: '"value" cannot rename "b" because override is disabled and target "a" exists',
            path: [],
            type: 'object.rename.override',
            context: { from: 'b', to: 'a', label: 'value', pattern: false, value: input }
        }]);
    });

    it('should be able to use object.with() safely with a fake hasOwnProperty', async () => {

        const input = { a: 1, hasOwnProperty: 'foo' };
        const schema = Joi.object({ a: 1 }).with('a', 'b');

        const err = await expect(schema.validate(input, { abortEarly: false })).to.reject();
        expect(err).to.be.an.error('"hasOwnProperty" is not allowed. "a" missing required peer "b"');
        expect(err.details).to.equal([
            {
                message: '"hasOwnProperty" is not allowed',
                path: ['hasOwnProperty'],
                type: 'object.allowUnknown',
                context: {
                    child: 'hasOwnProperty',
                    label: 'hasOwnProperty',
                    key: 'hasOwnProperty',
                    value: 'foo'
                }
            },
            {
                message: '"a" missing required peer "b"',
                path: ['a'],
                type: 'object.with',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peer: 'b',
                    peerWithLabel: 'b',
                    label: 'a',
                    key: 'a',
                    value: input
                }
            }
        ]);
    });

    it('aborts early on unknown keys', async () => {

        const input = { a: 1, unknown: 2 };
        const schema = Joi.object({ a: 1 }).with('a', 'b');

        const err = await expect(schema.validate(input)).to.reject();
        expect(err).to.be.an.error('"unknown" is not allowed');
    });

    it('should apply labels with nested objects', () => {

        const schema = Joi.object({
            a: Joi.number().label('first'),
            b: Joi.object({
                c: Joi.string().label('second'),
                d: Joi.number()
            })
        })
            .with('a', ['b.c']);

        const error = schema.validate({ a: 1, b: { d: 2 } }).error;
        expect(error).to.be.an.error('"first" missing required peer "b.second"');
        expect(error.details).to.equal([{
            message: '"first" missing required peer "b.second"',
            path: ['a'],
            type: 'object.with',
            context: {
                main: 'a',
                mainWithLabel: 'first',
                peer: 'b.c',
                peerWithLabel: 'b.second',
                label: 'a',
                key: 'a',
                value: { a: 1, b: { d: 2 } }
            }
        }]);
    });

    describe('cast()', () => {

        it('casts value to map', () => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number() }).cast('map');
            expect(schema.validate({ a: '1', b: '2' }).value).to.equal(new Map([['a', 1], ['b', 2]]));
        });

        it('ignores null', () => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number() }).allow(null).cast('map');
            expect(schema.validate(null).value).to.be.null();
        });

        it('ignores string', () => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number() }).allow('x').cast('map');
            expect(schema.validate('x').value).to.equal('x');
        });

        it('does not leak casts to any', () => {

            expect(() => Joi.any().cast('map')).to.throw('Type any does not support casting to map');
        });
    });

    describe('keys()', () => {

        it('allows any key', async () => {

            const a = Joi.object({ a: 4 });
            const b = a.keys();
            const err = await expect(a.validate({ b: 3 })).to.reject('"b" is not allowed');
            expect(err.details).to.equal([{
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.allowUnknown',
                context: { child: 'b', label: 'b', key: 'b', value: 3 }
            }]);

            await b.validate({ b: 3 });
        });

        it('forbids all keys', async () => {

            const a = Joi.object();
            const b = a.keys({});
            await a.validate({ b: 3 });
            const err = await expect(b.validate({ b: 3 })).to.reject('"b" is not allowed');
            expect(err.details).to.equal([{
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.allowUnknown',
                context: { child: 'b', label: 'b', key: 'b', value: 3 }
            }]);
        });

        it('adds to existing keys', async () => {

            const a = Joi.object({ a: 1 });
            const b = a.keys({ b: 2 });
            const err = await expect(a.validate({ a: 1, b: 2 })).to.reject('"b" is not allowed');
            expect(err.details).to.equal([{
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.allowUnknown',
                context: { child: 'b', label: 'b', key: 'b', value: 2 }
            }]);

            await b.validate({ a: 1, b: 2 });
        });

        it('overrides existing keys', () => {

            const a = Joi.object({ a: 1 });
            const b = a.keys({ a: Joi.string() });

            Helper.validate(a, [
                [{ a: 1 }, true, null, { a: 1 }],
                [{ a: '1' }, true, null, { a: 1 }],
                [{ a: '2' }, false, null, {
                    message: '"a" must be one of [1]',
                    details: [{
                        message: '"a" must be one of [1]',
                        path: ['a'],
                        type: 'any.allowOnly',
                        context: { value: 2, valids: [1], label: 'a', key: 'a' }
                    }]
                }]
            ]);

            Helper.validate(b, [
                [{ a: 1 }, false, null, {
                    message: '"a" must be a string',
                    details: [{
                        message: '"a" must be a string',
                        path: ['a'],
                        type: 'string.base',
                        context: { value: 1, label: 'a', key: 'a' }
                    }]
                }],
                [{ a: '1' }, true, null, { a: '1' }]
            ]);
        });

        it('strips keys flagged with strip', async () => {

            const schema = Joi.object({
                a: Joi.string().strip(),
                b: Joi.string()
            });
            const value = await schema.validate({ a: 'test', b: 'test' });
            expect(value.a).to.not.exist();
            expect(value.b).to.equal('test');
        });

        it('strips keys after validation', async () => {

            const schema = Joi.object({
                a: Joi.string().strip(),
                b: Joi.string().default(Joi.ref('a'))
            });
            const value = await schema.validate({ a: 'test' });
            expect(value.a).to.not.exist();
            expect(value.b).to.equal('test');
        });

        it('strips keys while preserving transformed values', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({
                a: Joi.number().strip(),
                b: Joi.number().min(ref)
            });

            const result = schema.validate({ a: '1', b: '2' });
            expect(result.error).to.not.exist();
            expect(result.value.a).to.not.exist();
            expect(result.value.b).to.equal(2);

            const result2 = schema.validate({ a: '1', b: '0' });
            expect(result2.error).to.be.an.error('"b" must be larger than or equal to ref:a');
            expect(result2.error.details).to.equal([{
                message: '"b" must be larger than or equal to ref:a',
                path: ['b'],
                type: 'number.min',
                context: { limit: ref, value: 0, label: 'b', key: 'b' }
            }]);
        });

        it('does not alter the original object when stripping keys', async () => {

            const schema = Joi.object({
                a: Joi.string().strip(),
                b: Joi.string()
            });

            const valid = {
                a: 'test',
                b: 'test'
            };

            const value = await schema.validate(valid);
            expect(value.a).to.not.exist();
            expect(valid.a).to.equal('test');
            expect(value.b).to.equal('test');
            expect(valid.b).to.equal('test');
        });

        it('should strip from an alternative', async () => {

            const schema = Joi.object({
                a: [Joi.boolean().strip()]
            });

            const valid = {
                a: true
            };

            const value = await schema.validate(valid);
            expect(value).to.equal({});
        });
    });

    describe('append()', () => {

        it('should append schema', async () => {

            const schema = Joi.object()
                .keys({ a: Joi.string() })
                .append({ b: Joi.string() });

            await schema.validate({ a: 'x', b: 'y' });
        });

        it('should not change schema if it is null', async () => {

            const schema = Joi.object()
                .keys({ a: Joi.string() })
                .append(null);

            await schema.validate({ a: 'x' });
        });

        it('should not change schema if it is undefined', async () => {

            const schema = Joi.object()
                .keys({ a: Joi.string() })
                .append(undefined);

            await schema.validate({ a: 'x' });
        });

        it('should not change schema if it is empty-object', async () => {

            const schema = Joi.object()
                .keys({ a: Joi.string() })
                .append({});

            await schema.validate({ a: 'x' });
        });
    });

    describe('unknown()', () => {

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.object().unknown();
            expect(schema.unknown()).to.shallow.equal(schema);
        });

        it('allows local unknown without applying to children', () => {

            const schema = Joi.object({
                a: {
                    b: Joi.number()
                }
            }).unknown();

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true],
                [{ a: { b: 'x' } }, false, null, {
                    message: '"a.b" must be a number',
                    details: [{
                        message: '"a.b" must be a number',
                        path: ['a', 'b'],
                        type: 'number.base',
                        context: { label: 'a.b', key: 'b', value: 'x' }
                    }]
                }],
                [{ a: { b: 5 }, c: 'ignore' }, true],
                [{ a: { b: 5, c: 'ignore' } }, false, null, {
                    message: '"a.c" is not allowed',
                    details: [{
                        message: '"a.c" is not allowed',
                        path: ['a', 'c'],
                        type: 'object.allowUnknown',
                        context: { child: 'c', label: 'a.c', key: 'c', value: 'ignore' }
                    }]
                }]
            ]);
        });

        it('forbids local unknown without applying to children', () => {

            const schema = Joi.object({
                a: Joi.object({
                    b: Joi.number()
                }).unknown()
            }).prefs({ allowUnknown: false });

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true],
                [{ a: { b: 'x' } }, false, null, {
                    message: '"a.b" must be a number',
                    details: [{
                        message: '"a.b" must be a number',
                        path: ['a', 'b'],
                        type: 'number.base',
                        context: { label: 'a.b', key: 'b', value: 'x' }
                    }]
                }],
                [{ a: { b: 5 }, c: 'ignore' }, false, null, {
                    message: '"c" is not allowed',
                    details: [{
                        message: '"c" is not allowed',
                        path: ['c'],
                        type: 'object.allowUnknown',
                        context: { child: 'c', label: 'c', key: 'c', value: 'ignore' }
                    }]
                }],
                [{ a: { b: 5, c: 'ignore' } }, true]
            ]);
        });

        it('overrides stripUnknown at a local level', () => {

            const schema = Joi.object({
                a: Joi.object({
                    b: Joi.number(),
                    c: Joi.object({
                        d: Joi.number()
                    })
                }).unknown()
            }).prefs({ allowUnknown: false, stripUnknown: true });

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true, null, { a: { b: 5 } }],
                [{ a: { b: 'x' } }, false, null, {
                    message: '"a.b" must be a number',
                    details: [{
                        message: '"a.b" must be a number',
                        path: ['a', 'b'],
                        type: 'number.base',
                        context: { label: 'a.b', key: 'b', value: 'x' }
                    }]
                }],
                [{ a: { b: 5 }, d: 'ignore' }, true, null, { a: { b: 5 } }],
                [{ a: { b: 5, d: 'ignore' } }, true, null, { a: { b: 5, d: 'ignore' } }],
                [{ a: { b: 5, c: { e: 'ignore' } } }, true, null, { a: { b: 5, c: {} } }]
            ]);
        });
    });

    describe('rename()', () => {

        it('allows renaming multiple times with multiple enabled', async () => {

            const schema = Joi.object({
                test: Joi.string()
            }).rename('test1', 'test').rename('test2', 'test', { multiple: true });

            await Joi.compile(schema).validate({ test1: 'a', test2: 'b' });
        });

        it('errors renaming multiple times with multiple disabled', async () => {

            const schema = Joi.object({
                test: Joi.string()
            }).rename('test1', 'test').rename('test2', 'test');

            const err = await expect(Joi.compile(schema).validate({ test1: 'a', test2: 'b' })).to.reject();
            expect(err).to.be.an.error('"value" cannot rename "test2" because multiple renames are disabled and another key was already renamed to "test"');
            expect(err.details).to.equal([{
                message: '"value" cannot rename "test2" because multiple renames are disabled and another key was already renamed to "test"',
                path: [],
                type: 'object.rename.multiple',
                context: { from: 'test2', to: 'test', label: 'value', pattern: false, value: { test: 'a', test2: 'b' } }
            }]);
        });

        it('errors multiple times when abortEarly is false', async () => {

            const schema = Joi.object()
                .rename('a', 'b')
                .rename('c', 'b')
                .rename('d', 'b')
                .prefs({ abortEarly: false });

            const err = await expect(schema.validate({ a: 1, c: 1, d: 1 })).to.reject();
            expect(err).to.be.an.error('"value" cannot rename "c" because multiple renames are disabled and another key was already renamed to "b". "value" cannot rename "d" because multiple renames are disabled and another key was already renamed to "b"');
            expect(err.details).to.equal([
                {
                    message: '"value" cannot rename "c" because multiple renames are disabled and another key was already renamed to "b"',
                    path: [],
                    type: 'object.rename.multiple',
                    context: { from: 'c', to: 'b', label: 'value', pattern: false, value: { b: 1 } }
                },
                {
                    message: '"value" cannot rename "d" because multiple renames are disabled and another key was already renamed to "b"',
                    path: [],
                    type: 'object.rename.multiple',
                    context: { from: 'd', to: 'b', label: 'value', pattern: false, value: { b: 1 } }
                }
            ]);
        });

        it('aliases a key', async () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.number()
            }).rename('a', 'b', { alias: true });

            const obj = { a: 10 };

            const value = await Joi.compile(schema).validate(obj);
            expect(value.a).to.equal(10);
            expect(value.b).to.equal(10);
        });

        it('with override disabled should not allow overwriting existing value', async () => {

            const schema = Joi.object({
                test1: Joi.string()
            }).rename('test', 'test1');

            const err = await expect(schema.validate({ test: 'b', test1: 'a' })).to.reject();
            expect(err).to.be.an.error('"value" cannot rename "test" because override is disabled and target "test1" exists');
            expect(err.details).to.equal([{
                message: '"value" cannot rename "test" because override is disabled and target "test1" exists',
                path: [],
                type: 'object.rename.override',
                context: { from: 'test', to: 'test1', label: 'value', pattern: false, value: { test: 'b', test1: 'a' } }
            }]);
        });

        it('with override enabled should allow overwriting existing value', async () => {

            const schema = Joi.object({
                test1: Joi.string()
            }).rename('test', 'test1', { override: true });

            await schema.validate({ test: 'b', test1: 'a' });
        });

        it('renames when data is nested in an array via items', async () => {

            const schema = {
                arr: Joi.array().items(Joi.object({
                    one: Joi.string(),
                    two: Joi.string()
                }).rename('uno', 'one').rename('dos', 'two'))
            };

            const data = { arr: [{ uno: '1', dos: '2' }] };
            const value = await Joi.object(schema).validate(data);
            expect(value.arr[0].one).to.equal('1');
            expect(value.arr[0].two).to.equal('2');
        });

        it('applies rename and validation in the correct order regardless of key order', async () => {

            const schema1 = Joi.object({
                a: Joi.number()
            }).rename('b', 'a');

            const input1 = { b: '5' };

            const value1 = await schema1.validate(input1);
            expect(value1.b).to.not.exist();
            expect(value1.a).to.equal(5);

            const schema2 = Joi.object({ a: Joi.number(), b: Joi.any() }).rename('b', 'a');
            const input2 = { b: '5' };

            const value2 = await schema2.validate(input2);
            expect(value2.b).to.not.exist();
            expect(value2.a).to.equal(5);
        });

        it('sets the default value after key is renamed', async () => {

            const schema = Joi.object({
                foo2: Joi.string().default('test')
            }).rename('foo', 'foo2');

            const input = {};

            const value = await schema.validate(input);
            expect(value.foo2).to.equal('test');
        });

        it('renames keys that are empty strings', async () => {

            const schema = Joi.object().rename('', 'notEmpty');
            const input = {
                '': 'something'
            };

            const value = await schema.validate(input);
            expect(value['']).to.not.exist();
            expect(value.notEmpty).to.equal('something');
        });

        it('should not create new keys when the key in question does not exist', async () => {

            const schema = Joi.object()
                .rename('b', '_b');

            const input = {
                a: 'something'
            };

            const value = await schema.validate(input);
            expect(value).to.to.equal(input);
        });

        it('ignores a key with ignoredUndefined if from does not exist', async () => {

            const schema = Joi.object().rename('b', 'a', { ignoreUndefined: true });

            const input = {
                a: 'something'
            };

            const value = await schema.validate(input);
            expect(value).to.equal({ a: 'something' });
        });

        it('deletes a key with override and ignoredUndefined if from exists', async () => {

            const schema = Joi.object()
                .rename('b', 'a', { ignoreUndefined: true, override: true });

            const input = {
                a: 'something',
                b: 'something else'
            };

            const value = await schema.validate(input);
            expect(value).to.equal({ a: 'something else' });
        });

        it('deletes a key with override if present and undefined', async () => {

            const schema = Joi.object()
                .rename('b', 'a', { override: true });

            const input = {
                a: 'something',
                b: undefined
            };

            const value = await schema.validate(input);
            expect(value).to.equal({});
        });

        it('leaves target if source is present and undefined and ignoreUndefined is set', async () => {

            const schema = Joi.object()
                .rename('b', 'a', { override: true, ignoreUndefined: true });

            const input = {
                a: 'something',
                b: undefined
            };

            const value = await schema.validate(input);
            expect(value).to.equal(input);
        });

        it('should fulfill describe() with defaults', () => {

            const schema = Joi.object().rename('b', 'a');
            const desc = schema.describe();

            expect(desc).to.equal({
                type: 'object',
                renames: [{
                    from: 'b',
                    to: 'a',
                    options: {
                        alias: false,
                        multiple: false,
                        override: false
                    }
                }]
            });
        });

        it('should fulfill describe() with non-defaults', () => {

            const schema = Joi.object().rename('b', 'a', { alias: true, multiple: true, override: true });
            const desc = schema.describe();

            expect(desc).to.equal({
                type: 'object',
                renames: [{
                    from: 'b',
                    to: 'a',
                    options: {
                        alias: true,
                        multiple: true,
                        override: true
                    }
                }]
            });
        });

        it('should leave key if from does not exist regardless of override', async () => {

            const schema = Joi.object()
                .rename('b', 'a', { override: true });

            const input = {
                a: 'something'
            };

            const value = await schema.validate(input);
            expect(value).to.equal(input);
        });

        describe('using regex', () => {

            it('renames using a regular expression', async () => {

                const regex = /foobar/i;

                const schema = Joi.object({
                    fooBar: Joi.string()
                }).rename(regex, 'fooBar');

                await Joi.compile(schema).validate({ FOOBAR: 'a' });
            });

            it('aliases a key', async () => {

                const regex = /^a$/i;

                const schema = Joi.object({
                    other: Joi.any(),
                    A: Joi.number(),
                    b: Joi.number(),
                    c: Joi.number()
                }).rename(regex, 'b', { alias: true });

                const value = await Joi.compile(schema).validate({ other: 'here', A: 100, c: 50 });
                expect(value.A).to.equal(100);
                expect(value.b).to.equal(100);
                expect(value.c).to.equal(50);
            });

            it('uses template', async () => {

                const schema = Joi.object()
                    .rename(/^(\d+)$/, Joi.x('x{#1}x'))
                    .pattern(/^x\d+x$/, Joi.any());

                const input = {
                    123: 'x',
                    1: 'y',
                    0: 'z',
                    x4x: 'test'
                };

                const value = await Joi.compile(schema).validate(input);
                expect(value).to.equal({
                    x123x: 'x',
                    x1x: 'y',
                    x0x: 'z',
                    x4x: 'test'
                });

                expect(schema.describe()).to.equal({
                    type: 'object',
                    patterns: [{
                        regex: '/^x\\d+x$/',
                        rule: { type: 'any' }
                    }],
                    renames: [{
                        from: { regex: '/^(\\d+)$/' },
                        to: {
                            template: 'x{#1}x',
                            options: {}
                        },
                        options: {
                            alias: false,
                            multiple: false,
                            override: false
                        }
                    }]
                });
            });

            it('uses template with prefix override', async () => {

                const schema = Joi.object()
                    .rename(/^(\d+)$/, Joi.x('x{@1}x', { prefix: { local: '@' } }))
                    .pattern(/^x\d+x$/, Joi.any());

                const input = {
                    123: 'x',
                    1: 'y',
                    0: 'z',
                    x4x: 'test'
                };

                const value = await Joi.compile(schema).validate(input);
                expect(value).to.equal({
                    x123x: 'x',
                    x1x: 'y',
                    x0x: 'z',
                    x4x: 'test'
                });

                expect(schema.describe()).to.equal({
                    type: 'object',
                    patterns: [{
                        regex: '/^x\\d+x$/',
                        rule: { type: 'any' }
                    }],
                    renames: [{
                        from: { regex: '/^(\\d+)$/' },
                        to: {
                            template: 'x{@1}x',
                            options: { prefix: { local: '@' } }
                        },
                        options: {
                            alias: false,
                            multiple: false,
                            override: false
                        }
                    }]
                });
            });

            it('uses template that references another sibling key', async () => {

                const schema = Joi.object({
                    prefix: Joi.string().lowercase().required()
                })
                    .rename(/^(\d+)$/, Joi.x('{.prefix}{#1}'))
                    .unknown();

                const input = {
                    123: 'x',
                    1: 'y',
                    0: 'z',
                    prefix: 'TEST'
                };

                const value = await Joi.compile(schema).validate(input);
                expect(value).to.equal({
                    TEST123: 'x',
                    TEST1: 'y',
                    TEST0: 'z',
                    prefix: 'test'
                });
            });

            it('uses template that references peer key', () => {

                const schema = Joi.object({
                    a: Joi.object()
                        .rename(/^(\d+)$/, Joi.x('{b.prefix}{#1}'))
                        .unknown(),
                    b: {
                        prefix: Joi.string().lowercase()
                    }
                });

                Helper.validate(schema, [
                    [{ a: { 5: 'x' }, b: { prefix: 'p' } }, true, null, { a: { p5: 'x' }, b: { prefix: 'p' } }],
                    [{ a: { 5: 'x' }, b: { prefix: 'P' } }, true, null, { a: { p5: 'x' }, b: { prefix: 'p' } }],
                    [{ b: { prefix: 'P' }, a: { 5: 'x' } }, true, null, { a: { p5: 'x' }, b: { prefix: 'p' } }],
                    [{ b: {}, a: { 5: 'x' } }, true, null, { a: { 5: 'x' }, b: {} }],
                    [{ a: { 5: 'x' } }, true, null, { a: { 5: 'x' } }]
                ]);
            });

            it('uses template without refs', async () => {

                const schema = Joi.object()
                    .rename(/^(\d+)$/, Joi.x('x'))
                    .unknown();

                const value = await Joi.compile(schema).validate({ 1: 'x' });
                expect(value).to.equal({ x: 'x' });
            });

            it('deletes a key with override if present and undefined', async () => {

                const schema = Joi.object()
                    .rename(/b/, 'a', { override: true });

                const input = {
                    a: 'something',
                    b: undefined
                };

                const value = await schema.validate(input);
                expect(value).to.equal({});
            });

            it('with override disabled it should not allow overwriting existing value', async () => {

                const schema = Joi.object({
                    test1: Joi.string()
                })
                    .rename(/^test1$/i, 'test');

                const item = {
                    test: 'b',
                    test1: 'a'
                };

                const err = await expect(Joi.compile(schema).validate(item)).to.reject('"value" cannot rename "test1" because override is disabled and target "test" exists');
                expect(err.details).to.equal([{
                    message: '"value" cannot rename "test1" because override is disabled and target "test" exists',
                    path: [],
                    type: 'object.rename.override',
                    context: { from: 'test1', to: 'test', label: 'value', pattern: true, value: item }
                }]);
            });

            it('with override enabled should allow overwriting existing value', async () => {

                const regex = /^test$/i;

                const schema = Joi.object({
                    test1: Joi.string()
                }).rename(regex, 'test1', { override: true });

                await schema.validate({ test: 'b', test1: 'a' });
            });

            it('renames when data is nested in an array via items', async () => {

                const regex1 = /^uno$/i;
                const regex2 = /^dos$/i;

                const schema = {
                    arr: Joi.array().items(Joi.object({
                        one: Joi.string(),
                        two: Joi.string()
                    }).rename(regex1, 'one').rename(regex2, 'two'))
                };

                const data = { arr: [{ uno: '1', dos: '2' }] };
                const value = await Joi.object(schema).validate(data);
                expect(value.arr[0].one).to.equal('1');
                expect(value.arr[0].two).to.equal('2');
            });

            it('skips when existing name matches', async () => {

                const regex = /^abc$/i;

                const schema = Joi.object({ abc: Joi.string() }).rename(regex, 'abc', { override: true });

                expect(await schema.validate({ ABC: 'x' })).to.equal({ abc: 'x' });
                expect(await schema.validate({ abc: 'x' })).to.equal({ abc: 'x' });
            });

            it('applies rename and validation in the correct order regardless of key order', async () => {

                const regex = /^b$/i;

                const schema1 = Joi.object({
                    a: Joi.number()
                }).rename(regex, 'a');

                const input1 = { b: '5' };

                const value1 = await schema1.validate(input1);
                expect(value1.b).to.not.exist();
                expect(value1.a).to.equal(5);

                const schema2 = Joi.object({ a: Joi.number(), b: Joi.any() }).rename('b', 'a');
                const input2 = { b: '5' };

                const value2 = await schema2.validate(input2);
                expect(value2.b).to.not.exist();
                expect(value2.a).to.equal(5);
            });

            it('sets the default value after key is renamed', async () => {

                const regex = /^foo$/i;

                const schema = Joi.object({
                    foo2: Joi.string().default('test')
                }).rename(regex, 'foo2');

                const input = {};

                const value = await schema.validate(input);
                expect(value.foo2).to.equal('test');
            });

            it('should not create new keys when the key in question does not exist', async () => {

                const schema = Joi.object()
                    .rename(/^b$/i, '_b');

                const input = {
                    a: 'something'
                };

                const value = await schema.validate(input);
                expect(Object.keys(value)).to.include('a');
                expect(value.a).to.equal('something');
            });

            it('should leave key if from does not exist regardless of override', async () => {

                const schema = Joi.object()
                    .rename(/^b$/i, 'a', { override: true });

                const input = {
                    a: 'something'
                };

                const value = await schema.validate(input);
                expect(value).to.equal(input);
            });

            it('skips when all matches are undefined and ignoredUndefined is true', async () => {

                const schema = Joi.object().keys({
                    a: Joi.any(),
                    b: Joi.any()
                })
                    .rename(/^b$/i, 'a', { ignoreUndefined: true });

                const input = {
                    b: undefined
                };

                const value = await schema.validate(input);
                expect(value).to.equal({ b: undefined });
            });

            it('deletes a key with override and ignoredUndefined if from exists', async () => {

                const schema = Joi.object().keys({
                    c: Joi.any(),
                    a: Joi.any()
                })
                    .rename(/^b$/, 'a', { ignoreUndefined: true, override: true });

                const input = {
                    a: 'something',
                    b: 'something else'
                };

                const value = await schema.validate(input);
                expect(value).to.equal({ a: 'something else' });
            });

            it('should fulfill describe() with non-defaults', () => {

                const regex = /^b$/i;

                const schema = Joi.object().rename(regex, 'a', { alias: true, multiple: true, override: true });
                const desc = schema.describe();

                expect(desc).to.equal({
                    type: 'object',
                    renames: [{
                        from: { regex: regex.toString() },
                        to: 'a',
                        options: {
                            alias: true,
                            multiple: true,
                            override: true
                        }
                    }]
                });
            });

            it('should fulfill describe() with defaults', () => {

                const regex = /^b$/i;

                const schema = Joi.object().rename(regex, 'a');
                const desc = schema.describe();

                expect(desc).to.equal({
                    type: 'object',
                    renames: [{
                        from: { regex: regex.toString() },
                        to: 'a',
                        options: {
                            alias: false,
                            multiple: false,
                            override: false
                        }
                    }]
                });
            });

            it('allows renaming multiple times with multiple enabled', async () => {

                const schema = Joi.object({
                    fooBar: Joi.string()
                }).rename(/foobar/i, 'fooBar', { multiple: true });

                const value = await Joi.compile(schema).validate({ FOOBAR: 'a', FooBar: 'b' });
                expect(value.fooBar).to.equal('b');
            });

            it('errors renaming multiple times with multiple disabled', async () => {

                const schema = Joi.object({
                    fooBar: Joi.string()
                })
                    .rename(/foobar/i, 'fooBar')
                    .rename(/foobar/i, 'fooBar');

                const err = await expect(Joi.compile(schema).validate({ FOOBAR: 'a', FooBar: 'b' })).to.reject();
                expect(err.message).to.equal('"value" cannot rename "FooBar" because multiple renames are disabled and another key was already renamed to "fooBar"');
                expect(err.details).to.equal([{
                    message: '"value" cannot rename "FooBar" because multiple renames are disabled and another key was already renamed to "fooBar"',
                    path: [],
                    type: 'object.rename.multiple',
                    context: { from: 'FooBar', to: 'fooBar', label: 'value', pattern: true, value: { FooBar: 'b', fooBar: 'a' } }
                }]);
            });

            it('errors multiple times when abortEarly is false', async () => {

                const schema = Joi.object({
                    z: Joi.string()
                })
                    .rename(/a/i, 'b')
                    .rename(/c/i, 'b')
                    .rename(/z/i, 'z')
                    .prefs({ abortEarly: false });

                const err = await expect(schema.validate({ a: 1, c: 1, d: 1, z: 1 })).to.reject('"value" cannot rename "c" because multiple renames are disabled and another key was already renamed to "b". "z" must be a string. "d" is not allowed. "b" is not allowed');
                expect(err.details).to.equal([
                    {
                        message: '"value" cannot rename "c" because multiple renames are disabled and another key was already renamed to "b"',
                        path: [],
                        type: 'object.rename.multiple',
                        context: { from: 'c', to: 'b', label: 'value', pattern: true, value: { b: 1, d: 1, z: 1 } }
                    },
                    {
                        message: '"z" must be a string',
                        path: ['z'],
                        type: 'string.base',
                        context: { value: 1, key: 'z', label: 'z' }
                    },
                    {
                        message: '"d" is not allowed',
                        path: ['d'],
                        type: 'object.allowUnknown',
                        context: { child: 'd', key: 'd', label: 'd', value: 1 }
                    },
                    {
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'object.allowUnknown',
                        context: { child: 'b', key: 'b', label: 'b', value: 1 }
                    }
                ]);
            });
        });
    });

    describe('describe()', () => {

        it('return empty description when no schema defined', () => {

            const schema = Joi.object();
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'object'
            });
        });

        it('respects the shallow parameter', () => {

            const schema = Joi.object({
                name: Joi.string(),
                child: Joi.object({
                    name: Joi.string()
                })
            });

            expect(Object.keys(schema.describe(true))).to.not.include('children');
            expect(Object.keys(schema.describe())).to.include('children');

        });

        it('describes patterns', () => {

            const schema = Joi.object({
                a: Joi.string()
            }).pattern(/\w\d/i, Joi.boolean());

            expect(schema.describe()).to.equal({
                type: 'object',
                children: {
                    a: {
                        type: 'string',
                        invalids: ['']
                    }
                },
                patterns: [
                    {
                        regex: '/\\w\\d/i',
                        rule: {
                            type: 'boolean',
                            truthy: [true],
                            falsy: [false],
                            flags: {
                                insensitive: true
                            }
                        }
                    }
                ]
            });
        });

        it('describes patterns with schema', () => {

            const schema = Joi.object({
                a: Joi.string()
            }).pattern(Joi.string().uuid({ version: 'uuidv4' }), Joi.boolean());

            expect(schema.describe()).to.equal({
                type: 'object',
                children: {
                    a: {
                        type: 'string',
                        invalids: ['']
                    }
                },
                patterns: [
                    {
                        schema: {
                            invalids: [''],
                            rules: [{
                                arg: { version: 'uuidv4' },
                                name: 'guid'
                            }],
                            type: 'string'
                        },
                        rule: {
                            type: 'boolean',
                            truthy: [true],
                            falsy: [false],
                            flags: {
                                insensitive: true
                            }
                        }
                    }
                ]
            });
        });
    });

    describe('length()', () => {

        it('throws when length is not a number', () => {

            expect(() => {

                Joi.object().length('a');
            }).to.throw('limit must be a positive integer or reference');
        });
    });

    describe('min()', () => {

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.object().min('a');
            }).to.throw('limit must be a positive integer or reference');
        });
    });

    describe('max()', () => {

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.object().max('a');
            }).to.throw('limit must be a positive integer or reference');
        });
    });

    describe('pattern()', () => {

        it('shows path to errors in schema', () => {

            expect(() => {

                Joi.object().pattern(/.*/, {
                    a: {
                        b: {
                            c: {
                                d: undefined
                            }
                        }
                    }
                });
            }).to.throw('Invalid schema content: (a.b.c.d)');

            expect(() => {

                Joi.object().pattern(/.*/, () => {

                });
            }).to.throw('Invalid schema content: ');

        });

        it('validates unknown keys using a regex pattern', async () => {

            const schema = Joi.object({
                a: Joi.number()
            }).pattern(/\d+/, Joi.boolean()).pattern(/\w\w+/, 'x');

            const err = await expect(schema.validate({ bb: 'y', 5: 'x' }, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('"5" must be a boolean. "bb" must be one of [x]');
            expect(err.details).to.equal([
                {
                    message: '"5" must be a boolean',
                    path: ['5'],
                    type: 'boolean.base',
                    context: { label: '5', key: '5', value: 'x' }
                },
                {
                    message: '"bb" must be one of [x]',
                    path: ['bb'],
                    type: 'any.allowOnly',
                    context: { value: 'y', valids: ['x'], label: 'bb', key: 'bb' }
                }
            ]);

            Helper.validate(schema, [
                [{ a: 5 }, true],
                [{ a: 'x' }, false, null, {
                    message: '"a" must be a number',
                    details: [{
                        message: '"a" must be a number',
                        path: ['a'],
                        type: 'number.base',
                        context: { label: 'a', key: 'a', value: 'x' }
                    }]
                }],
                [{ b: 'x' }, false, null, {
                    message: '"b" is not allowed',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'object.allowUnknown',
                        context: { child: 'b', label: 'b', key: 'b', value: 'x' }
                    }]
                }],
                [{ bb: 'x' }, true],
                [{ 5: 'x' }, false, null, {
                    message: '"5" must be a boolean',
                    details: [{
                        message: '"5" must be a boolean',
                        path: ['5'],
                        type: 'boolean.base',
                        context: { label: '5', key: '5', value: 'x' }
                    }]
                }],
                [{ 5: false }, true],
                [{ 5: undefined }, true]
            ]);
        });

        it('validates unknown keys using a schema pattern', async () => {

            const schema = Joi.object({
                a: Joi.number()
            }).pattern(Joi.number().positive(), Joi.boolean())
                .pattern(Joi.string().length(2), 'x');

            const err = await expect(schema.validate({ bb: 'y', 5: 'x' }, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('"5" must be a boolean. "bb" must be one of [x]');
            expect(err.details).to.equal([
                {
                    message: '"5" must be a boolean',
                    path: ['5'],
                    type: 'boolean.base',
                    context: { label: '5', key: '5', value: 'x' }
                },
                {
                    message: '"bb" must be one of [x]',
                    path: ['bb'],
                    type: 'any.allowOnly',
                    context: { value: 'y', valids: ['x'], label: 'bb', key: 'bb' }
                }
            ]);

            Helper.validate(schema, [
                [{ a: 5 }, true],
                [{ a: 'x' }, false, null, {
                    message: '"a" must be a number',
                    details: [{
                        message: '"a" must be a number',
                        path: ['a'],
                        type: 'number.base',
                        context: { label: 'a', key: 'a', value: 'x' }
                    }]
                }],
                [{ b: 'x' }, false, null, {
                    message: '"b" is not allowed',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'object.allowUnknown',
                        context: { child: 'b', label: 'b', key: 'b', value: 'x' }
                    }]
                }],
                [{ bb: 'x' }, true],
                [{ 5: 'x' }, false, null, {
                    message: '"5" must be a boolean',
                    details: [{
                        message: '"5" must be a boolean',
                        path: ['5'],
                        type: 'boolean.base',
                        context: { label: '5', key: '5', value: 'x' }
                    }]
                }],
                [{ 5: false }, true],
                [{ 5: undefined }, true]
            ]);
        });

        it('validates unknown keys using a schema pattern with a reference', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object().pattern(Joi.only(Joi.ref('a')), Joi.boolean())
            });

            Helper.validate(schema, [
                [{ a: 'x' }, true],
                [{ a: 5 }, false, null, {
                    message: '"a" must be a string',
                    details: [{
                        message: '"a" must be a string',
                        path: ['a'],
                        type: 'string.base',
                        context: { label: 'a', key: 'a', value: 5 }
                    }]
                }],
                [{ b: 'x' }, false, null, {
                    message: '"b" must be an object',
                    details: [{
                        message: '"b" must be an object',
                        path: ['b'],
                        type: 'object.base',
                        context: { label: 'b', key: 'b', value: 'x' }
                    }]
                }],
                [{ b: {} }, true],
                [{ b: { foo: true } }, false, null, {
                    message: '"b.foo" is not allowed',
                    details: [{
                        message: '"b.foo" is not allowed',
                        path: ['b', 'foo'],
                        type: 'object.allowUnknown',
                        context: { child: 'foo', value: true, key: 'foo', label: 'b.foo' }
                    }]
                }],
                [{ a: 'x', b: { foo: true } }, false, null, {
                    message: '"b.foo" is not allowed',
                    details: [{
                        message: '"b.foo" is not allowed',
                        path: ['b', 'foo'],
                        type: 'object.allowUnknown',
                        context: { child: 'foo', value: true, key: 'foo', label: 'b.foo' }
                    }]
                }],
                [{ a: 'x', b: { x: 'y' } }, false, null, {
                    message: '"b.x" must be a boolean',
                    details: [{
                        message: '"b.x" must be a boolean',
                        path: ['b', 'x'],
                        type: 'boolean.base',
                        context: { value: 'y', key: 'x', label: 'b.x' }
                    }]
                }]
            ]);
        });

        it('validates unknown keys using a pattern (nested)', async () => {

            const schema = Joi.object({
                x: Joi.object({
                    a: Joi.number()
                }).pattern(/\d+/, Joi.boolean()).pattern(/\w\w+/, 'x')
            });

            const err = await expect(schema.validate({
                x: {
                    bb: 'y',
                    5: 'x'
                }
            }, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('"x.5" must be a boolean. "x.bb" must be one of [x]');
            expect(err.details).to.equal([
                {
                    message: '"x.5" must be a boolean',
                    path: ['x', '5'],
                    type: 'boolean.base',
                    context: { label: 'x.5', key: '5', value: 'x' }
                },
                {
                    message: '"x.bb" must be one of [x]',
                    path: ['x', 'bb'],
                    type: 'any.allowOnly',
                    context: { value: 'y', valids: ['x'], label: 'x.bb', key: 'bb' }
                }
            ]);
        });

        it('validates unknown keys using a pattern (nested)', async () => {

            const schema = Joi.object({
                x: Joi.object({
                    a: Joi.number()
                }).pattern(Joi.number().positive(), Joi.boolean()).pattern(Joi.string().length(2), 'x')
            });

            const err = await expect(schema.validate({
                x: {
                    bb: 'y',
                    5: 'x'
                }
            }, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('"x.5" must be a boolean. "x.bb" must be one of [x]');
            expect(err.details).to.equal([
                {
                    message: '"x.5" must be a boolean',
                    path: ['x', '5'],
                    type: 'boolean.base',
                    context: { label: 'x.5', key: '5', value: 'x' }
                },
                {
                    message: '"x.bb" must be one of [x]',
                    path: ['x', 'bb'],
                    type: 'any.allowOnly',
                    context: { value: 'y', valids: ['x'], label: 'x.bb', key: 'bb' }
                }
            ]);
        });

        it('errors when using a pattern on empty schema with unknown(false) and regex pattern mismatch', async () => {

            const schema = Joi.object().pattern(/\d/, Joi.number()).unknown(false);

            const err = await expect(schema.validate({ a: 5 }, { abortEarly: false })).to.reject('"a" is not allowed');
            expect(err.details).to.equal([{
                message: '"a" is not allowed',
                path: ['a'],
                type: 'object.allowUnknown',
                context: { child: 'a', label: 'a', key: 'a', value: 5 }
            }]);
        });

        it('errors when using a pattern on empty schema with unknown(false) and schema pattern mismatch', async () => {

            const schema = Joi.object().pattern(Joi.number().positive(), Joi.number()).unknown(false);

            const err = await expect(schema.validate({ a: 5 }, { abortEarly: false })).to.reject('"a" is not allowed');
            expect(err.details).to.equal([{
                message: '"a" is not allowed',
                path: ['a'],
                type: 'object.allowUnknown',
                context: { child: 'a', label: 'a', key: 'a', value: 5 }
            }]);
        });

        it('reject global and sticky flags from patterns', () => {

            expect(() => Joi.object().pattern(/a/g, Joi.number())).to.throw('pattern should not use global or sticky mode');
            expect(() => Joi.object().pattern(/a/y, Joi.number())).to.throw('pattern should not use global or sticky mode');
        });

        it('allows using empty() on values', async () => {

            const schema = Joi.object().pattern(/a/, Joi.any().empty(null));

            const value = await schema.validate({ a1: undefined, a2: null, a3: 'test' });
            expect(value).to.equal({ a1: undefined, a2: undefined, a3: 'test' });
        });

        it('errors if pattern is not regex or instance of Any', () => {

            let error;
            try {
                Joi.object().pattern(17, Joi.boolean());
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);
        });

        it('allows using refs in .valid() schema pattern', async () => {

            const schema = Joi.object().pattern(Joi.string().valid(Joi.ref('$keys')), Joi.any());

            const value = await schema.validate({ a: 'test' }, { context: { keys: ['a'] } });
            expect(value).to.equal({ a: 'test' });
        });

        it('enforces pattern matches rule', () => {

            const ref1 = Joi.ref('a');
            const ref2 = Joi.x('{a - 1}');

            const schema = Joi.object({
                a: Joi.number().required()
            })
                .pattern(/^x\d+$/, Joi.boolean(), { matches: Joi.array().length(ref1), exclusive: true })
                .pattern(/^z\w+$/, Joi.number())
                .pattern(/^x\w+$/, Joi.number(), { matches: Joi.array().max(ref2) });

            Helper.validate(schema, [
                [{ a: 1, x1: true }, true],
                [{ a: 2, x1: true, x2: true, xx: 1 }, true],
                [{ a: 3, x1: true, x2: true, x3: false, xx: 1 }, true],
                [{ a: 0, x1: true }, false, null, {
                    message: '"value" keys failed to match pattern requirements',
                    details: [{
                        message: '"value" keys failed to match pattern requirements',
                        path: [],
                        type: 'object.pattern.match',
                        context: {
                            message: '"value" must contain ref:a items',
                            label: 'value',
                            value: { a: 0, x1: true },
                            matches: ['x1'],
                            details: [
                                {
                                    context: {
                                        label: 'value',
                                        limit: ref1,
                                        value: ['x1']
                                    },
                                    message: '"value" must contain ref:a items',
                                    path: [],
                                    type: 'array.length'
                                }
                            ]
                        }
                    }]
                }]
            ]);

            const description = schema.describe();
            expect(description).to.equal({
                type: 'object',
                children: {
                    a: {
                        type: 'number',
                        flags: {
                            unsafe: false,
                            presence: 'required'
                        },
                        invalids: [Infinity, -Infinity]
                    }
                },
                patterns: [
                    {
                        rule: {
                            type: 'boolean',
                            flags: {
                                insensitive: true
                            },
                            truthy: [true],
                            falsy: [false]
                        },
                        regex: '/^x\\d+$/',
                        matches: {
                            type: 'array',
                            flags: {
                                sparse: false
                            },
                            rules: [
                                {
                                    name: 'length',
                                    arg: {
                                        ref: 'value',
                                        key: 'a',
                                        path: ['a']
                                    }
                                }
                            ]
                        },
                        exclusive: true
                    },
                    {
                        rule: {
                            type: 'number',
                            flags: {
                                unsafe: false
                            },
                            invalids: [Infinity, -Infinity]
                        },
                        regex: '/^z\\w+$/'
                    },
                    {
                        rule: {
                            type: 'number',
                            flags: {
                                unsafe: false
                            },
                            invalids: [Infinity, -Infinity]
                        },
                        regex: '/^x\\w+$/',
                        matches: {
                            type: 'array',
                            flags: {
                                sparse: false
                            },
                            rules: [
                                {
                                    name: 'max',
                                    arg: {
                                        template: '{a - 1}',
                                        options: {}
                                    }
                                }
                            ]
                        }
                    }
                ]
            });
        });

        it('enforces pattern matches rule (abortEarly false)', async () => {

            const schema = Joi.object({
                a: Joi.number().required()
            })
                .pattern(/^x\d+$/, Joi.boolean(), { matches: Joi.array().length(Joi.ref('a')), exclusive: true })
                .pattern(/^x\w+$/, Joi.number(), { matches: Joi.array().max(Joi.x('{a - 1}')) });

            const err = await expect(schema.validate({ a: 0, x1: true, xx: 1 }, { abortEarly: false })).to.reject('"value" keys failed to match pattern requirements');
            expect(err.details).to.have.length(2);
        });
    });

    describe('with()', () => {

        it('errors when a parameter is not a string', () => {

            let error;
            try {
                Joi.object().with({});
                error = false;
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
        });

        it('validates correctly when key is an empty string', () => {

            const schema = Joi.object().with('', 'b');
            Helper.validate(schema, [
                [{ c: 'hi', d: 'there' }, true]
            ]);
        });

        it('should apply labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).with('a', ['b']);
            const error = schema.validate({ a: 1 }).error;
            expect(error).to.be.an.error('"first" missing required peer "second"');
            expect(error.details).to.equal([{
                message: '"first" missing required peer "second"',
                path: ['a'],
                type: 'object.with',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b',
                    peerWithLabel: 'second',
                    label: 'a',
                    key: 'a',
                    value: { a: 1 }
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).with('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: { c: 'test2' } }, true],
                [{ a: 'test', b: { d: 80 } }, false, null, {
                    message: '"a" missing required peer "b.c"',
                    details: [{
                        message: '"a" missing required peer "b.c"',
                        path: ['a'],
                        type: 'object.with',
                        context: {
                            main: 'a',
                            mainWithLabel: 'a',
                            peer: 'b.c',
                            peerWithLabel: 'b.c',
                            key: 'a',
                            label: 'a',
                            value: { a: 'test', b: { d: 80 } }
                        }
                    }]
                }]
            ]);

            const schema2 = Joi.object({
                a: Joi.object({ b: Joi.string() }),
                b: Joi.object({ c: Joi.string() })
            }).with('a.b', 'b.c');

            Helper.validate(schema2, [
                [{ a: { b: 'test' }, b: { c: 'test2' } }, true],
                [{ a: { b: 'test' }, b: {} }, false, null, {
                    message: '"a.b" missing required peer "b.c"',
                    details: [{
                        message: '"a.b" missing required peer "b.c"',
                        path: ['a', 'b'],
                        type: 'object.with',
                        context: {
                            main: 'a.b',
                            mainWithLabel: 'a.b',
                            peer: 'b.c',
                            peerWithLabel: 'b.c',
                            key: 'b',
                            label: 'a.b',
                            value: { a: { b: 'test' }, b: {} }
                        }
                    }]
                }]
            ]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).with('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: Object.assign(() => { }, { c: 'test2' }) }, true]
            ]);

            const error = schema.validate({ a: 'test', b: Object.assign(() => { }, { d: 80 }) }).error;
            expect(error).to.be.an.error('"a" missing required peer "b.c"');
            expect(error.details).to.equal([{
                message: '"a" missing required peer "b.c"',
                path: ['a'],
                type: 'object.with',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peer: 'b.c',
                    peerWithLabel: 'b.c',
                    key: 'a',
                    label: 'a',
                    value: error.details[0].context.value
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .with('a', ['b.c']);

            const error = schema.validate({ a: 1, b: { d: 2 } }).error;
            expect(error).to.be.an.error('"first" missing required peer "b.second"');
            expect(error.details).to.equal([{
                message: '"first" missing required peer "b.second"',
                path: ['a'],
                type: 'object.with',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b.c',
                    peerWithLabel: 'b.second',
                    label: 'a',
                    key: 'a',
                    value: { a: 1, b: { d: 2 } }
                }
            }]);

            const schema2 = Joi.object({
                a: Joi.object({
                    b: Joi.string().label('first')
                }),
                b: Joi.object({
                    c: Joi.string().label('second')
                })
            })
                .with('a.b', ['b.c']);

            const error2 = schema2.validate({ a: { b: 'test' }, b: {} }).error;
            expect(error2).to.be.an.error('"a.first" missing required peer "b.second"');
            expect(error2.details).to.equal([{
                message: '"a.first" missing required peer "b.second"',
                path: ['a', 'b'],
                type: 'object.with',
                context: {
                    main: 'a.b',
                    mainWithLabel: 'a.first',
                    peer: 'b.c',
                    peerWithLabel: 'b.second',
                    label: 'a.b',
                    key: 'b',
                    value: { a: { b: 'test' }, b: {} }
                }
            }]);
        });

        it('handles period in key names', async () => {

            const schema = Joi.object({
                'x.from': Joi.string().lowercase().email(),
                'x.url': Joi.string().uri({ scheme: ['https'] })
            })
                .with('x.from', 'x.url', { separator: false });

            const test = { 'x.url': 'https://example.com', 'x.from': 'test@example.com' };
            expect(await schema.validate(test)).to.equal(test);
        });
    });

    describe('without()', () => {

        it('errors when a parameter is not a string', () => {

            let error;
            try {
                Joi.object().without({});
                error = false;
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
        });

        it('validates correctly when key is an empty string', () => {

            const schema = Joi.object().without('', 'b');
            Helper.validate(schema, [
                [{ a: 'hi', b: 'there' }, true]
            ]);
        });

        it('validates correctly when key is stripped', () => {

            const schema = Joi.object({
                a: Joi.any().strip(),
                b: Joi.any()
            }).without('a', 'b');

            Helper.validate(schema, [
                [{ a: 'hi', b: 'there' }, true]
            ]);
        });

        it('should apply labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).without('a', ['b']);
            const error = schema.validate({ a: 1, b: 'b' }).error;
            expect(error).to.be.an.error('"first" conflict with forbidden peer "second"');
            expect(error.details).to.equal([{
                message: '"first" conflict with forbidden peer "second"',
                path: ['a'],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b',
                    peerWithLabel: 'second',
                    label: 'a',
                    key: 'a',
                    value: { a: 1, b: 'b' }
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).without('a', ['b.c', 'b.d']);

            const sampleObject = { a: 'test', d: 9000 };
            const sampleObject2 = { a: 'test', b: { d: 80 } };

            const error = schema.validate(sampleObject).error;
            expect(error).to.equal(null);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"a" conflict with forbidden peer "b.d"');
            expect(error2.details).to.equal([{
                message: '"a" conflict with forbidden peer "b.d"',
                path: ['a'],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peer: 'b.d',
                    peerWithLabel: 'b.d',
                    key: 'a',
                    label: 'a',
                    value: sampleObject2
                }
            }]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .without('a', ['b.c', 'b.d']);

            const sampleObject = { a: 'test', d: 9000 };
            const sampleObject2 = { a: 'test', b: Object.assign(() => { }, { d: 80 }) };

            const error = schema.validate(sampleObject).error;
            expect(error).to.equal(null);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"a" conflict with forbidden peer "b.d"');
            expect(error2.details).to.equal([{
                message: '"a" conflict with forbidden peer "b.d"',
                path: ['a'],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peer: 'b.d',
                    peerWithLabel: 'b.d',
                    key: 'a',
                    label: 'a',
                    value: error2.details[0].context.value
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .without('a', ['b.c']);

            const error = schema.validate({ a: 1, b: { c: 'c' } }).error;
            expect(error).to.be.an.error('"first" conflict with forbidden peer "b.second"');
            expect(error.details).to.equal([{
                message: '"first" conflict with forbidden peer "b.second"',
                path: ['a'],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b.c',
                    peerWithLabel: 'b.second',
                    label: 'a',
                    key: 'a',
                    value: { a: 1, b: { c: 'c' } }
                }
            }]);
        });
    });

    describe('xor()', () => {

        it('errors when a parameter is not a string', () => {

            let error;
            try {
                Joi.object().xor({});
                error = false;
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
        });

        it('should apply labels without any peer', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).xor('a', 'b');
            const error = schema.validate({}).error;
            expect(error).to.be.an.error('"value" must contain at least one of [first, second]');
            expect(error.details).to.equal([{
                message: '"value" must contain at least one of [first, second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b'],
                    peersWithLabels: ['first', 'second'],
                    label: 'value',
                    value: {}
                }
            }]);
        });

        it('should apply labels with too many peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).xor('a', 'b');
            const error = schema.validate({ a: 1, b: 'b' }).error;
            expect(error).to.be.an.error('"value" contains a conflict between exclusive peers [first, second]');
            expect(error.details).to.equal([{
                message: '"value" contains a conflict between exclusive peers [first, second]',
                path: [],
                type: 'object.xor',
                context: {
                    peers: ['a', 'b'],
                    peersWithLabels: ['first', 'second'],
                    present: ['a', 'b'],
                    presentWithLabels: ['first', 'second'],
                    label: 'value',
                    value: { a: 1, b: 'b' }
                }
            }]);
        });

        it('should apply labels with too many peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second'),
                c: Joi.string().label('third'),
                d: Joi.string().label('fourth')
            }).xor('a', 'b', 'c', 'd');
            const error = schema.validate({ a: 1, b: 'b', d: 'd' }).error;
            expect(error).to.be.an.error('"value" contains a conflict between exclusive peers [first, second, third, fourth]');
            expect(error.details).to.equal([{
                message: '"value" contains a conflict between exclusive peers [first, second, third, fourth]',
                path: [],
                type: 'object.xor',
                context: {
                    peers: ['a', 'b', 'c', 'd'],
                    peersWithLabels: ['first', 'second', 'third', 'fourth'],
                    present: ['a', 'b', 'd'],
                    presentWithLabels: ['first', 'second', 'fourth'],
                    label: 'value',
                    value: { a: 1, b: 'b', d: 'd' }
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).xor('a', 'b.c');

            const sampleObject = { a: 'test', b: { d: 80 } };
            const sampleObject2 = { a: 'test', b: { c: 'test2' } };

            const error = schema.validate(sampleObject).error;
            expect(error).to.equal(null);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" contains a conflict between exclusive peers [a, b.c]');
            expect(error2.details).to.equal([{
                message: '"value" contains a conflict between exclusive peers [a, b.c]',
                path: [],
                type: 'object.xor',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['a', 'b.c'],
                    present: ['a', 'b.c'],
                    presentWithLabels: ['a', 'b.c'],
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).xor('a', 'b.c');

            const sampleObject = { a: 'test', b: Object.assign(() => { }, { d: 80 }) };
            const sampleObject2 = { a: 'test', b: Object.assign(() => { }, { c: 'test2' }) };

            const error = schema.validate(sampleObject).error;
            expect(error).to.equal(null);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" contains a conflict between exclusive peers [a, b.c]');
            expect(error2.details).to.equal([{
                message: '"value" contains a conflict between exclusive peers [a, b.c]',
                path: [],
                type: 'object.xor',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['a', 'b.c'],
                    present: ['a', 'b.c'],
                    presentWithLabels: ['a', 'b.c'],
                    label: 'value',
                    value: error2.details[0].context.value
                }
            }]);
        });

        it('should apply labels without any nested peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .xor('a', 'b.c');

            const error = schema.validate({}).error;
            expect(error).to.be.an.error('"value" must contain at least one of [first, b.second]');
            expect(error.details).to.equal([{
                message: '"value" must contain at least one of [first, b.second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['first', 'b.second'],
                    label: 'value',
                    value: {}
                }
            }]);
        });

        it('should apply labels with too many nested peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .xor('a', 'b.c');

            const error = schema.validate({ a: 1, b: { c: 'c' } }).error;
            expect(error).to.be.an.error('"value" contains a conflict between exclusive peers [first, b.second]');
            expect(error.details).to.equal([{
                message: '"value" contains a conflict between exclusive peers [first, b.second]',
                path: [],
                type: 'object.xor',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['first', 'b.second'],
                    present: ['a', 'b.c'],
                    presentWithLabels: ['first', 'b.second'],
                    label: 'value',
                    value: { a: 1, b: { c: 'c' } }
                }
            }]);
        });

        it('handles period in key names', async () => {

            const schema = Joi.object({
                'x.from': Joi.string().lowercase().email(),
                'x.url': Joi.string().uri({ scheme: ['https'] })
            })
                .xor('x.from', 'x.url', { separator: false });

            const test = { 'x.url': 'https://example.com' };
            expect(await schema.validate(test)).to.equal(test);
        });
    });

    describe('oxor()', () => {

        it('errors when a parameter is not a string', () => {

            let error;
            try {
                Joi.object().oxor({});
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);

            try {
                Joi.object().oxor(123);
                error = false;
            }
            catch (e) {
                error = true;
            }

            expect(error).to.equal(true);
        });

        it('allows none of optional peers', () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.string()
            }).oxor('a', 'b');

            const error = schema.validate({}).error;
            expect(error).to.not.exist();
        });

        it('should apply labels with too many peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).oxor('a', 'b');
            const error = schema.validate({ a: 1, b: 'b' }).error;
            expect(error).to.be.an.error('"value" contains a conflict between optional exclusive peers [first, second]');
            expect(error.details).to.equal([{
                message: '"value" contains a conflict between optional exclusive peers [first, second]',
                path: [],
                type: 'object.oxor',
                context: {
                    peers: ['a', 'b'],
                    peersWithLabels: ['first', 'second'],
                    present: ['a', 'b'],
                    presentWithLabels: ['first', 'second'],
                    label: 'value',
                    value: { a: 1, b: 'b' }
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).oxor('a', 'b.c');

            const sampleObject = { a: 'test', b: { d: 80 } };
            const sampleObject2 = { a: 'test', b: { c: 'test2' } };

            const error = schema.validate(sampleObject).error;
            expect(error).to.equal(null);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" contains a conflict between optional exclusive peers [a, b.c]');
            expect(error2.details).to.equal([{
                message: '"value" contains a conflict between optional exclusive peers [a, b.c]',
                path: [],
                type: 'object.oxor',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['a', 'b.c'],
                    present: ['a', 'b.c'],
                    presentWithLabels: ['a', 'b.c'],
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).oxor('a', 'b.c');

            const sampleObject = { a: 'test', b: Object.assign(() => { }, { d: 80 }) };
            const sampleObject2 = { a: 'test', b: Object.assign(() => { }, { c: 'test2' }) };

            const error = schema.validate(sampleObject).error;
            expect(error).to.equal(null);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" contains a conflict between optional exclusive peers [a, b.c]');
            expect(error2.details).to.equal([{
                message: '"value" contains a conflict between optional exclusive peers [a, b.c]',
                path: [],
                type: 'object.oxor',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['a', 'b.c'],
                    present: ['a', 'b.c'],
                    presentWithLabels: ['a', 'b.c'],
                    label: 'value',
                    value: error2.details[0].context.value
                }
            }]);
        });
    });

    describe('or()', () => {

        it('errors when a parameter is not a string', () => {

            let error;
            try {
                Joi.object().or({});
                error = false;
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
        });

        it('errors multiple levels deep', async () => {

            const schema = Joi.object({
                a: {
                    b: Joi.object().or('x', 'y')
                }
            });

            const err = await expect(schema.validate({ a: { b: { c: 1 } } })).to.reject();
            expect(err).to.be.an.error('"a.b" must contain at least one of [x, y]');
            expect(err.details).to.equal([{
                message: '"a.b" must contain at least one of [x, y]',
                path: ['a', 'b'],
                type: 'object.missing',
                context: {
                    peers: ['x', 'y'],
                    peersWithLabels: ['x', 'y'],
                    label: 'a.b',
                    key: 'b',
                    value: { c: 1 }
                }
            }]);
        });

        it('should apply labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).or('a', 'b');
            const error = schema.validate({}).error;
            expect(error).to.be.an.error('"value" must contain at least one of [first, second]');
            expect(error.details).to.equal([{
                message: '"value" must contain at least one of [first, second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b'],
                    peersWithLabels: ['first', 'second'],
                    label: 'value',
                    value: {}
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string() }),
                d: Joi.number()
            }).or('a', 'b.c');

            const sampleObject = { b: { c: 'bc' } };
            const sampleObject2 = { d: 90 };

            const error = schema.validate(sampleObject).error;
            expect(error).to.equal(null);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" must contain at least one of [a, b.c]');
            expect(error2.details).to.equal([{
                message: '"value" must contain at least one of [a, b.c]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['a', 'b.c'],
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string() }),
                d: Joi.number()
            }).or('a', 'b.c');

            const sampleObject = { b: Object.assign(() => { }, { c: 'bc' }) };
            const sampleObject2 = { d: 90 };

            const error = schema.validate(sampleObject).error;
            expect(error).to.equal(null);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" must contain at least one of [a, b.c]');
            expect(error2.details).to.equal([{
                message: '"value" must contain at least one of [a, b.c]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['a', 'b.c'],
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .or('a', 'b.c');

            const error = schema.validate({}).error;
            expect(error).to.be.an.error('"value" must contain at least one of [first, b.second]');
            expect(error.details).to.equal([{
                message: '"value" must contain at least one of [first, b.second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['first', 'b.second'],
                    label: 'value',
                    value: {}
                }
            }]);
        });
    });

    describe('and()', () => {

        it('should apply labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).and('a', 'b');
            const error = schema.validate({ a: 1 }).error;
            expect(error).to.be.an.error('"value" contains [first] without its required peers [second]');
            expect(error.details).to.equal([{
                message: '"value" contains [first] without its required peers [second]',
                path: [],
                type: 'object.and',
                context: {
                    present: ['a'],
                    presentWithLabels: ['first'],
                    missing: ['b'],
                    missingWithLabels: ['second'],
                    label: 'value',
                    value: { a: 1 }
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).and('a', 'b.c');

            const sampleObject = { a: 'test', b: { c: 'test2' } };
            const sampleObject2 = { a: 'test', b: { d: 80 } };

            const error = schema.validate(sampleObject).error;
            expect(error).to.equal(null);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" contains [a] without its required peers [b.c]');
            expect(error2.details).to.equal([{
                message: '"value" contains [a] without its required peers [b.c]',
                path: [],
                type: 'object.and',
                context: {
                    present: ['a'],
                    presentWithLabels: ['a'],
                    missing: ['b.c'],
                    missingWithLabels: ['b.c'],
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).and('a', 'b.c');

            const sampleObject = { a: 'test', b: Object.assign(() => { }, { c: 'test2' }) };
            const sampleObject2 = { a: 'test', b: Object.assign(() => { }, { d: 80 }) };

            const error = schema.validate(sampleObject).error;
            expect(error).to.equal(null);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"value" contains [a] without its required peers [b.c]');
            expect(error2.details).to.equal([{
                message: '"value" contains [a] without its required peers [b.c]',
                path: [],
                type: 'object.and',
                context: {
                    present: ['a'],
                    presentWithLabels: ['a'],
                    missing: ['b.c'],
                    missingWithLabels: ['b.c'],
                    label: 'value',
                    value: error2.details[0].context.value
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .and('a', 'b.c');

            const error = schema.validate({ a: 1 }).error;
            expect(error).to.be.an.error('"value" contains [first] without its required peers [b.second]');
            expect(error.details).to.equal([{
                message: '"value" contains [first] without its required peers [b.second]',
                path: [],
                type: 'object.and',
                context: {
                    present: ['a'],
                    presentWithLabels: ['first'],
                    missing: ['b.c'],
                    missingWithLabels: ['b.second'],
                    label: 'value',
                    value: { a: 1 }
                }
            }]);
        });

        it('should apply labels with invalid nested peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .and('a', 'c.d');

            const error = schema.validate({ a: 1, b: { d: 1 } }).error;
            expect(error).to.be.an.error('"value" contains [first] without its required peers [c.d]');
            expect(error.details).to.equal([{
                message: '"value" contains [first] without its required peers [c.d]',
                path: [],
                type: 'object.and',
                context: {
                    present: ['a'],
                    presentWithLabels: ['first'],
                    missing: ['c.d'],
                    missingWithLabels: ['c.d'],
                    label: 'value',
                    value: { a: 1, b: { d: 1 } }
                }
            }]);
        });
    });

    describe('nand()', () => {

        it('should apply labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).nand('a', 'b');
            const error = schema.validate({ a: 1, b: 'b' }).error;
            expect(error).to.be.an.error('"first" must not exist simultaneously with [second]');
            expect(error.details).to.equal([{
                message: '"first" must not exist simultaneously with [second]',
                path: [],
                type: 'object.nand',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peers: ['b'],
                    peersWithLabels: ['second'],
                    label: 'value',
                    value: { a: 1, b: 'b' }
                }
            }]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).nand('a', 'b.c');

            const sampleObject = { a: 'test', b: { d: 80 } };
            const sampleObject2 = { a: 'test', b: { c: 'test2' } };

            const error = schema.validate(sampleObject).error;
            expect(error).to.equal(null);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"a" must not exist simultaneously with [b.c]');
            expect(error2.details).to.equal([{
                message: '"a" must not exist simultaneously with [b.c]',
                path: [],
                type: 'object.nand',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peers: ['b.c'],
                    peersWithLabels: ['b.c'],
                    label: 'value',
                    value: sampleObject2
                }
            }]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .nand('a', 'b.c');

            const sampleObject = { a: 'test', b: Object.assign(() => { }, { d: 80 }) };
            const sampleObject2 = { a: 'test', b: Object.assign(() => { }, { c: 'test2' }) };

            const error = schema.validate(sampleObject).error;
            expect(error).to.equal(null);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"a" must not exist simultaneously with [b.c]');
            expect(error2.details).to.equal([{
                message: '"a" must not exist simultaneously with [b.c]',
                path: [],
                type: 'object.nand',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peers: ['b.c'],
                    peersWithLabels: ['b.c'],
                    label: 'value',
                    value: error2.details[0].context.value
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .nand('a', 'b.c');

            const error = schema.validate({ a: 1, b: { c: 'c' } }).error;
            expect(error).to.be.an.error('"first" must not exist simultaneously with [b.second]');
            expect(error.details).to.equal([{
                message: '"first" must not exist simultaneously with [b.second]',
                path: [],
                type: 'object.nand',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peers: ['b.c'],
                    peersWithLabels: ['b.second'],
                    label: 'value',
                    value: { a: 1, b: { c: 'c' } }
                }
            }]);
        });
    });

    describe('assert()', () => {

        it('shows path to errors in schema', () => {

            expect(() => {

                Joi.object().assert('a.b', {
                    a: {
                        b: {
                            c: {
                                d: undefined
                            }
                        }
                    }
                });
            }).to.throw('Invalid schema content: (a.b.c.d)');
        });

        it('shows errors in schema', () => {

            expect(() => {

                Joi.object().assert('a.b', undefined);
            }).to.throw('Invalid schema content: ');
        });

        it('validates upwards reference', async () => {

            const schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            }).assert(Joi.ref('d/e', { separator: '/' }), Joi.ref('a.c'), 'equal to a.c');

            const err = await expect(schema.validate({ a: { b: 'x', c: 5 }, d: { e: 6 } })).to.reject();
            expect(err.message).to.equal('"value" is invalid because "d.e" failed to equal to a.c');

            Helper.validate(schema, [
                [{ a: { b: 'x', c: 5 }, d: { e: 5 } }, true]
            ]);
        });

        it('validates upwards reference with implicit context', async () => {

            const schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            }).assert('d.e', Joi.ref('a.c'), 'equal to a.c');

            const err = await expect(schema.validate({ a: { b: 'x', c: 5 }, d: { e: 6 } })).to.reject();
            expect(err).to.be.an.error('"value" is invalid because "d.e" failed to equal to a.c');
            expect(err.details).to.equal([{
                message: '"value" is invalid because "d.e" failed to equal to a.c',
                path: [],
                type: 'object.assert',
                context: { ref: 'd.e', message: 'equal to a.c', label: 'value', value: { a: { b: 'x', c: 5 }, d: { e: 6 } } }
            }]);

            Helper.validate(schema, [
                [{ a: { b: 'x', c: 5 }, d: { e: 5 } }, true]
            ]);
        });

        it('throws when context is at root level', () => {

            expect(() => {

                Joi.object({
                    a: {
                        b: Joi.string(),
                        c: Joi.number()
                    },
                    d: {
                        e: Joi.any()
                    }
                }).assert('a', Joi.ref('d.e'), 'equal to d.e');
            }).to.throw('Cannot use assertions for root level references - use direct key rules instead');
        });

        it('allows root level context ref', () => {

            expect(() => {

                Joi.object({
                    a: {
                        b: Joi.string(),
                        c: Joi.number()
                    },
                    d: {
                        e: Joi.any()
                    }
                }).assert('$a', Joi.ref('d.e'), 'equal to d.e');
            }).to.not.throw();
        });

        it('provides a default message for failed assertions', async () => {

            const schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            }).assert('d.e', Joi.boolean());

            const err = await expect(schema.validate({ d: { e: [] } })).to.reject();
            expect(err).to.be.an.error('"value" is invalid because "d.e" failed to pass the assertion test');
            expect(err.details).to.equal([{
                message: '"value" is invalid because "d.e" failed to pass the assertion test',
                path: [],
                type: 'object.assert',
                context: {
                    ref: 'd.e',
                    message: 'pass the assertion test',
                    label: 'value',
                    value: { d: { e: [] } }
                }
            }]);
        });
    });

    describe('type()', () => {

        it('uses constructor name for default type name', async () => {

            const Foo = function Foo() {
            };

            const schema = Joi.object().instance(Foo);
            const err = await expect(schema.validate({})).to.reject('"value" must be an instance of "Foo"');
            expect(err.details).to.equal([{
                message: '"value" must be an instance of "Foo"',
                path: [],
                type: 'object.instance',
                context: { type: 'Foo', label: 'value', value: {} }
            }]);
        });

        it('uses custom type name if supplied', async () => {

            const Foo = function () {
            };

            const schema = Joi.object().instance(Foo, 'Bar');
            const err = await expect(schema.validate({})).to.reject('"value" must be an instance of "Bar"');
            expect(err.details).to.equal([{
                message: '"value" must be an instance of "Bar"',
                path: [],
                type: 'object.instance',
                context: { type: 'Bar', label: 'value', value: {} }
            }]);
        });

        it('overrides constructor name with custom name', async () => {

            const Foo = function Foo() {
            };

            const schema = Joi.object().instance(Foo, 'Bar');
            const err = await expect(schema.validate({})).to.reject('"value" must be an instance of "Bar"');
            expect(err.details).to.equal([{
                message: '"value" must be an instance of "Bar"',
                path: [],
                type: 'object.instance',
                context: { type: 'Bar', label: 'value', value: {} }
            }]);
        });

        it('throws when constructor is not a function', () => {

            expect(() => Joi.object().instance('')).to.throw('type must be a constructor function');
        });

        it('uses the constructor name in the schema description', () => {

            const description = Joi.object().instance(RegExp).describe();

            expect(description.rules).to.include({ name: 'instance', arg: { name: 'RegExp', ctor: RegExp } });
        });

        it('uses the constructor reference in the schema description', () => {

            const Foo = function Foo() {
            };

            const description = Joi.object().instance(Foo).describe();

            expect(new Foo()).to.be.an.instanceof(description.rules[0].arg.ctor);
        });
    });

    describe('schema()', () => {

        it('should detect joi instances', () => {

            const schema = Joi.object().schema();
            Helper.validate(schema, [
                [{}, false, null, {
                    message: '"value" must be a Joi schema of any type',
                    details: [{
                        message: '"value" must be a Joi schema of any type',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', type: 'any', value: {} }
                    }]
                }],
                [{ isJoi: true }, false, null, {
                    message: '"value" must be a Joi schema of any type',
                    details: [{
                        message: '"value" must be a Joi schema of any type',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', type: 'any', value: { isJoi: true } }
                    }]
                }],
                [Joi.number().max(2), true]
            ]);
        });

        it('validated schema type', () => {

            const schema = Joi.object().schema('number');
            Helper.validate(schema, [
                [Joi.number().max(2), true],
                [{}, false, null, {
                    message: '"value" must be a Joi schema of number type',
                    details: [{
                        message: '"value" must be a Joi schema of number type',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', type: 'number', value: {} }
                    }]
                }],
                [{ isJoi: true }, false, null, {
                    message: '"value" must be a Joi schema of number type',
                    details: [{
                        message: '"value" must be a Joi schema of number type',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', type: 'number', value: { isJoi: true } }
                    }]
                }],
                [Joi.string(), false, null, {
                    message: '"value" must be a Joi schema of number type',
                    details: [{
                        message: '"value" must be a Joi schema of number type',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', type: 'number', value: Joi.string() }
                    }]
                }]
            ]);
        });
    });
});
