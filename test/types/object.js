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
            context: { label: 'value', key: undefined, value: 'a string' }
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
                    context: { label: 'value', key: undefined, value: '' }
                }]
            }]
        ]);
    });

    it('return object reference when no rules specified', async () => {

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
            context: { label: 'value', key: undefined, value: [1, 2, 3] }
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
                    context: { label: 'value', key: undefined, value: '' }
                }]
            }]
        ]);
    });

    it('should validate count when min is set', () => {

        const schema = Joi.object().min(3);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must have at least 3 children',
                details: [{
                    message: '"value" must have at least 3 children',
                    path: [],
                    type: 'object.min',
                    context: { limit: 3, label: 'value', key: undefined, value: { item: 'something' } }
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
                        key: undefined,
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
                    context: { label: 'value', key: undefined, value: '' }
                }]
            }]
        ]);
    });

    it('should validate count when max is set', () => {

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
                        key: undefined,
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
                    context: { label: 'value', key: undefined, value: '' }
                }]
            }]
        ]);
    });

    it('should validate count when min and max is set', () => {

        const schema = Joi.object().max(3).min(2);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must have at least 2 children',
                details: [{
                    message: '"value" must have at least 2 children',
                    path: [],
                    type: 'object.min',
                    context: { limit: 2, label: 'value', key: undefined, value: { item: 'something' } }
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
                        key: undefined,
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
                    context: { label: 'value', key: undefined, value: '' }
                }]
            }]
        ]);
    });

    it('should validate count when length is set', () => {

        const schema = Joi.object().length(2);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must have 2 children',
                details: [{
                    message: '"value" must have 2 children',
                    path: [],
                    type: 'object.length',
                    context: { limit: 2, label: 'value', key: undefined, value: { item: 'something' } }
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
                        key: undefined,
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
                    context: { label: 'value', key: undefined, value: '' }
                }]
            }]
        ]);
    });

    it('should validate constructor when type is set', () => {

        const schema = Joi.object().type(RegExp);
        const d = new Date();
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must be an instance of "RegExp"',
                details: [{
                    message: '"value" must be an instance of "RegExp"',
                    path: [],
                    type: 'object.type',
                    context: { type: 'RegExp', label: 'value', key: undefined, value: { item: 'something' } }
                }]
            }],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', key: undefined, value: '' }
                }]
            }],
            [d, false, null, {
                message: '"value" must be an instance of "RegExp"',
                details: [{
                    message: '"value" must be an instance of "RegExp"',
                    path: [],
                    type: 'object.type',
                    context: { type: 'RegExp', label: 'value', key: undefined, value: d }
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
                message: 'child "num" fails because ["num" must be a number]',
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
                message: 'child "num" fails because ["num" must be a number]',
                details: [{
                    message: '"num" must be a number',
                    path: ['num'],
                    type: 'number.base',
                    context: { label: 'num', key: 'num', value: [1, 2, 3] }
                }]
            }],
            [{ num: 1, obj: { item: 'something' } }, true],
            [{ num: 1, obj: { item: 123 } }, false, null, {
                message: 'child "obj" fails because [child "item" fails because ["item" must be a string]]',
                details: [{
                    message: '"item" must be a string',
                    path: ['obj', 'item'],
                    type: 'string.base',
                    context: { value: 123, label: 'item', key: 'item' }
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
                message: 'child "obj" fails because [child "obj" fails because [child "obj" fails because [child "item" fails because ["item" must be a boolean]]]]',
                details: [{
                    message: '"item" must be a boolean',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'boolean.base',
                    context: { label: 'item', key: 'item', value: 10 }
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
                    context: { label: 'value', key: undefined, value: null }
                }]
            }],
            [undefined, true],
            [{}, true],
            [{ obj: {} }, false, null, {
                message: 'child "obj" fails because [child "obj" fails because ["obj" is required]]',
                details: [{
                    message: '"obj" is required',
                    path: ['obj', 'obj'],
                    type: 'any.required',
                    context: { label: 'obj', key: 'obj' }
                }]
            }],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, true],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, null, {
                message: 'child "obj" fails because [child "obj" fails because [child "obj" fails because [child "item" fails because ["item" must be a boolean]]]]',
                details: [{
                    message: '"item" must be a boolean',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'boolean.base',
                    context: { label: 'item', key: 'item', value: 10 }
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
                    context: { label: 'value', key: undefined, value: null }
                }]
            }],
            [undefined, true],
            [{}, true],
            [{ obj: {} }, true],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, false, null, {
                message: 'child "obj" fails because [child "obj" fails because [child "obj" fails because [child "item" fails because ["item" is required]]]]',
                details: [{
                    message: '"item" is required',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'any.required',
                    context: { label: 'item', key: 'item' }
                }]
            }],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, null, {
                message: 'child "obj" fails because [child "obj" fails because [child "obj" fails because [child "item" fails because ["item" must be a boolean]]]]',
                details: [{
                    message: '"item" must be a boolean',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'boolean.base',
                    context: { label: 'item', key: 'item', value: 10 }
                }]
            }]
        ]);
    });

    it('errors on unknown keys when functions allows', async () => {

        const schema = Joi.object({ a: Joi.number() }).options({ skipFunctions: true });
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
                        key: 'first'
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
                message: 'child "foo" fails because ["foo" must be one of [context:x]]',
                details: [{
                    message: '"foo" must be one of [context:x]',
                    path: ['foo'],
                    type: 'any.allowOnly',
                    context: { value: 'bar', valids: [ref], label: 'foo', key: 'foo' }
                }]
            }],
            [{ foo: 'bar' }, false, { context: { x: ['baz', 'qux'] } }, {
                message: 'child "foo" fails because ["foo" must be one of [context:x]]',
                details: [{
                    message: '"foo" must be one of [context:x]',
                    path: ['foo'],
                    type: 'any.allowOnly',
                    context: { value: 'bar', valids: [ref], label: 'foo', key: 'foo' }
                }]
            }],
            [{ foo: 'bar' }, false, null, {
                message: 'child "foo" fails because ["foo" must be one of [context:x]]',
                details: [{
                    message: '"foo" must be one of [context:x]',
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
        const err = await expect(schema.validate(obj)).to.reject('child "a" fails because ["b" is not allowed]');
        expect(err.details).to.equal([{
            message: '"b" is not allowed',
            path: ['a', 'b'],
            type: 'object.allowUnknown',
            context: { child: 'b', label: 'b', key: 'b', value: 'value' }
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

        await Joi.validate(input, schema);
    });

    it('should be able to use rename safely with a fake hasOwnProperty', async () => {

        const input = { a: 1, hasOwnProperty: 'foo' };
        const schema = Joi.object().rename('b', 'a');

        const err = await expect(Joi.validate(input, schema)).to.reject();
        expect(err).to.be.an.error('"value" cannot rename child "b" because override is disabled and target "a" exists');
        expect(err.details).to.equal([{
            message: '"value" cannot rename child "b" because override is disabled and target "a" exists',
            path: [],
            type: 'object.rename.override',
            context: { from: 'b', to: 'a', label: 'value', key: undefined }
        }]);
    });

    it('should be able to use object.with() safely with a fake hasOwnProperty', async () => {

        const input = { a: 1, hasOwnProperty: 'foo' };
        const schema = Joi.object({ a: 1 }).with('a', 'b');

        const err = await expect(Joi.validate(input, schema)).to.reject();
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
                    key: 'a'
                }
            }
        ]);
    });

    it('should apply labels with nested objects', () => {

        const schema = Joi.object({
            a: Joi.number().label('first'),
            b: Joi.object({ c: Joi.string().label('second'), d: Joi.number() })
        }).with('a', ['b.c']);
        const error = schema.validate({ a: 1, b: { d: 2 } }).error;
        expect(error).to.be.an.error('"first" missing required peer "second"');
        expect(error.details).to.equal([{
            message: '"first" missing required peer "second"',
            path: ['a'],
            type: 'object.with',
            context: {
                main: 'a',
                mainWithLabel: 'first',
                peer: 'b.c',
                peerWithLabel: 'second',
                label: 'a',
                key: 'a'
            }
        }]);
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
                    message: 'child "a" fails because ["a" must be one of [1]]',
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
                    message: 'child "a" fails because ["a" must be a string]',
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

            const schema = Joi.object({
                a: Joi.number().strip(),
                b: Joi.number().min(Joi.ref('a'))
            });

            const result = schema.validate({ a: '1', b: '2' });
            expect(result.error).to.not.exist();
            expect(result.value.a).to.not.exist();
            expect(result.value.b).to.equal(2);

            const result2 = schema.validate({ a: '1', b: '0' });
            expect(result2.error).to.be.an.error('child "b" fails because ["b" must be larger than or equal to 1]');
            expect(result2.error.details).to.equal([{
                message: '"b" must be larger than or equal to 1',
                path: ['b'],
                type: 'number.min',
                context: { limit: 1, value: 0, label: 'b', key: 'b' }
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
                    message: 'child "a" fails because [child "b" fails because ["b" must be a number]]',
                    details: [{
                        message: '"b" must be a number',
                        path: ['a', 'b'],
                        type: 'number.base',
                        context: { label: 'b', key: 'b', value: 'x' }
                    }]
                }],
                [{ a: { b: 5 }, c: 'ignore' }, true],
                [{ a: { b: 5, c: 'ignore' } }, false, null, {
                    message: 'child "a" fails because ["c" is not allowed]',
                    details: [{
                        message: '"c" is not allowed',
                        path: ['a', 'c'],
                        type: 'object.allowUnknown',
                        context: { child: 'c', label: 'c', key: 'c', value: 'ignore' }
                    }]
                }]
            ]);
        });

        it('forbids local unknown without applying to children', () => {

            const schema = Joi.object({
                a: Joi.object({
                    b: Joi.number()
                }).unknown()
            }).options({ allowUnknown: false });

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true],
                [{ a: { b: 'x' } }, false, null, {
                    message: 'child "a" fails because [child "b" fails because ["b" must be a number]]',
                    details: [{
                        message: '"b" must be a number',
                        path: ['a', 'b'],
                        type: 'number.base',
                        context: { label: 'b', key: 'b', value: 'x' }
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
            }).options({ allowUnknown: false, stripUnknown: true });

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true, null, { a: { b: 5 } }],
                [{ a: { b: 'x' } }, false, null, {
                    message: 'child "a" fails because [child "b" fails because ["b" must be a number]]',
                    details: [{
                        message: '"b" must be a number',
                        path: ['a', 'b'],
                        type: 'number.base',
                        context: { label: 'b', key: 'b', value: 'x' }
                    }]
                }],
                [{ a: { b: 5 }, d: 'ignore' }, true, null, { a: { b: 5 } }],
                [{ a: { b: 5, d: 'ignore' } }, true, null, { a: { b: 5, d: 'ignore' } }],
                [{ a: { b: 5, c: { e: 'ignore' } } }, true, null, { a: { b: 5, c: {} } }]
            ]);
        });
    });

    describe('rename()', () => {

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

            it('with override disabled it should not allow overwriting existing value', async () => {

                const regex = /^test1$/i;
                const schema = Joi.object({
                    test1: Joi.string()
                }).rename(regex, 'test1');

                const err = await expect(Joi.compile(schema).validate({ test: 'b', test1: 'a' })).to.reject();
                expect(err.message).to.equal('"value" cannot rename children [test1] because override is disabled and target "test1" exists');
                expect(err.details).to.equal([{
                    message: '"value" cannot rename children [test1] because override is disabled and target "test1" exists',
                    path: [],
                    type: 'object.rename.regex.override',
                    context: { from: ['test1'], to: 'test1', key: undefined, label: 'value' }
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

                const value = await Joi.validate(input, schema);
                expect(value.foo2).to.equal('test');
            });

            it('should not create new keys when they key in question does not exist', async () => {

                const regex = /^b$/i;

                const schema = Joi.object().rename(regex, '_b');

                const input = {
                    a: 'something'
                };

                const value = await schema.validate(input);
                expect(Object.keys(value)).to.include('a');
                expect(value.a).to.equal('something');
            });

            it('should remove a key with override if from does not exist', async () => {

                const regex = /^b$/i;

                const schema = Joi.object().rename(regex, 'a', { override: true });

                const input = {
                    a: 'something'
                };

                const value = await schema.validate(input);
                expect(value).to.equal({});
            });

            it('shouldn\'t delete a key with override and ignoredUndefined if from does not exist', async () => {

                const regex = /^b$/i;

                const schema = Joi.object().keys({
                    c: Joi.any(),
                    a: Joi.any()
                }).rename(regex, 'a', { ignoreUndefined: true, override: true });

                const input = {
                    a: 'something'
                };

                const value = await schema.validate(input);
                expect(value).to.equal({ a: 'something' });
            });

            it('should delete a key with override and ignoredUndefined if from exists', async () => {

                const regex = /^b$/i;

                const schema = Joi.object().keys({
                    c: Joi.any(),
                    a: Joi.any()
                }).rename(regex, 'a', { ignoreUndefined: true, override: true });

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
                        from: regex,
                        to: 'a',
                        isRegExp: true,
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
                        from: regex,
                        to: 'a',
                        isRegExp: true,
                        options: {
                            alias: false,
                            multiple: false,
                            override: false
                        }
                    }]
                });
            });

            it('allows renaming multiple times with multiple enabled', async () => {

                const regex = /foobar/i;

                const schema = Joi.object({
                    fooBar: Joi.string()
                }).rename(regex, 'fooBar', { multiple: true });

                const value = await Joi.compile(schema).validate({ FOOBAR: 'a', FooBar: 'b' });
                expect(value.fooBar).to.equal('b');
            });

            it('errors renaming multiple times with multiple disabled', async () => {

                const regex = /foobar/i;

                const schema = Joi.object({
                    fooBar: Joi.string()
                }).rename(regex, 'fooBar').rename(/foobar/i, 'fooBar');

                const err = await expect(Joi.compile(schema).validate({ FOOBAR: 'a', FooBar: 'b' })).to.reject();
                expect(err.message).to.equal('"value" cannot rename children [fooBar] because multiple renames are disabled and another key was already renamed to "fooBar"');
                expect(err.details).to.equal([{
                    message: '"value" cannot rename children [fooBar] because multiple renames are disabled and another key was already renamed to "fooBar"',
                    path: [],
                    type: 'object.rename.regex.multiple',
                    context: { from: ['fooBar'], to: 'fooBar', key: undefined, label: 'value' }
                }]);
            });

            it('errors multiple times when abortEarly is false', async () => {

                const schema = Joi.object().keys({ z: Joi.string() }).rename(/a/i, 'b').rename(/c/i, 'b').rename(/z/i, 'z').options({ abortEarly: false });
                const err = await expect(schema.validate({ a: 1, c: 1, d: 1, z: 1 })).to.reject();
                expect(err.message).to.equal('"value" cannot rename children [c] because multiple renames are disabled and another key was already renamed to "b". "value" cannot rename children [z] because override is disabled and target "z" exists. "d" is not allowed. "b" is not allowed');
                expect(err.details).to.equal([
                    {
                        message: '"value" cannot rename children [c] because multiple renames are disabled and another key was already renamed to "b"',
                        path: [],
                        type: 'object.rename.regex.multiple',
                        context: { from: ['c'], to: 'b', key: undefined, label: 'value' }
                    },
                    {
                        message: '"value" cannot rename children [z] because override is disabled and target "z" exists',
                        path: [],
                        type: 'object.rename.regex.override',
                        context: { from: ['z'], to: 'z', key: undefined, label: 'value' }
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
            expect(err).to.be.an.error('"value" cannot rename child "test2" because multiple renames are disabled and another key was already renamed to "test"');
            expect(err.details).to.equal([{
                message: '"value" cannot rename child "test2" because multiple renames are disabled and another key was already renamed to "test"',
                path: [],
                type: 'object.rename.multiple',
                context: { from: 'test2', to: 'test', label: 'value', key: undefined }
            }]);
        });

        it('errors multiple times when abortEarly is false', async () => {

            const schema = Joi.object().rename('a', 'b').rename('c', 'b').rename('d', 'b').options({ abortEarly: false });
            const err = await expect(schema.validate({ a: 1, c: 1, d: 1 })).to.reject();
            expect(err).to.be.an.error('"value" cannot rename child "c" because multiple renames are disabled and another key was already renamed to "b". "value" cannot rename child "d" because multiple renames are disabled and another key was already renamed to "b"');
            expect(err.details).to.equal([
                {
                    message: '"value" cannot rename child "c" because multiple renames are disabled and another key was already renamed to "b"',
                    path: [],
                    type: 'object.rename.multiple',
                    context: { from: 'c', to: 'b', label: 'value', key: undefined }
                },
                {
                    message: '"value" cannot rename child "d" because multiple renames are disabled and another key was already renamed to "b"',
                    path: [],
                    type: 'object.rename.multiple',
                    context: { from: 'd', to: 'b', label: 'value', key: undefined }
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
            expect(err).to.be.an.error('"value" cannot rename child "test" because override is disabled and target "test1" exists');
            expect(err.details).to.equal([{
                message: '"value" cannot rename child "test" because override is disabled and target "test1" exists',
                path: [],
                type: 'object.rename.override',
                context: { from: 'test', to: 'test1', label: 'value', key: undefined }
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

            const value = await Joi.validate(input, schema);
            expect(value.foo2).to.equal('test');
        });

        it('should be able to rename keys that are empty strings', async () => {

            const schema = Joi.object().rename('', 'notEmpty');
            const input = {
                '': 'something'
            };

            const value = await schema.validate(input);
            expect(value['']).to.not.exist();
            expect(value.notEmpty).to.equal('something');
        });

        it('should not create new keys when they key in question does not exist', async () => {

            const schema = Joi.object().rename('b', '_b');

            const input = {
                a: 'something'
            };

            const value = await schema.validate(input);
            expect(Object.keys(value)).to.include('a');
            expect(value.a).to.equal('something');
        });

        it('should remove a key with override if from does not exist', async () => {

            const schema = Joi.object().rename('b', 'a', { override: true });

            const input = {
                a: 'something'
            };

            const value = await schema.validate(input);
            expect(value).to.equal({});
        });

        it('should ignore a key with ignoredUndefined if from does not exist', async () => {

            const schema = Joi.object().rename('b', 'a', { ignoreUndefined: true });

            const input = {
                a: 'something'
            };

            const value = await schema.validate(input);
            expect(value).to.equal({ a: 'something' });
        });

        it('using regex it should ignore a key with ignoredUndefined if from does not exist', async () => {

            const regex = /^b$/i;

            const schema = Joi.object().rename(regex, 'a', { ignoreUndefined: true });

            const input = {
                a: 'something'
            };

            const value = await schema.validate(input);
            expect(value).to.equal({ a: 'something' });
        });

        it('shouldn\'t delete a key with override and ignoredUndefined if from does not exist', async () => {

            const schema = Joi.object().rename('b', 'a', { ignoreUndefined: true, override: true });

            const input = {
                a: 'something'
            };

            const value = await schema.validate(input);
            expect(value).to.equal({ a: 'something' });
        });

        it('should delete a key with override and ignoredUndefined if from exists', async () => {

            const schema = Joi.object().rename('b', 'a', { ignoreUndefined: true, override: true });

            const input = {
                a: 'something',
                b: 'something else'
            };

            const value = await schema.validate(input);
            expect(value).to.equal({ a: 'something else' });
        });

        it('should fulfill describe() with defaults', () => {

            const schema = Joi.object().rename('b', 'a');
            const desc = schema.describe();

            expect(desc).to.equal({
                type: 'object',
                renames: [{
                    from: 'b',
                    to: 'a',
                    isRegExp: false,
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
                    isRegExp: false,
                    options: {
                        alias: true,
                        multiple: true,
                        override: true
                    }
                }]
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
            }).pattern(Joi.string().uuid('uuidv4'), Joi.boolean());

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
                                arg: 'uuidv4',
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
            }).to.throw('limit must be a positive integer');
        });
    });

    describe('min()', () => {

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.object().min('a');
            }).to.throw('limit must be a positive integer');
        });
    });

    describe('max()', () => {

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.object().max('a');
            }).to.throw('limit must be a positive integer');
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
            }).to.throw(Error, 'Invalid schema content: (a.b.c.d)');

            expect(() => {

                Joi.object().pattern(/.*/, () => {

                });
            }).to.throw(Error, 'Invalid schema content: ');

        });

        it('validates unknown keys using a regex pattern', async () => {

            const schema = Joi.object({
                a: Joi.number()
            }).pattern(/\d+/, Joi.boolean()).pattern(/\w\w+/, 'x');

            const err = await expect(Joi.validate({ bb: 'y', 5: 'x' }, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "5" fails because ["5" must be a boolean]. child "bb" fails because ["bb" must be one of [x]]');
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
                    message: 'child "a" fails because ["a" must be a number]',
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
                    message: 'child "5" fails because ["5" must be a boolean]',
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

            const err = await expect(Joi.validate({ bb: 'y', 5: 'x' }, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "5" fails because ["5" must be a boolean]. child "bb" fails because ["bb" must be one of [x]]');
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
                    message: 'child "a" fails because ["a" must be a number]',
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
                    message: 'child "5" fails because ["5" must be a boolean]',
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
                    message: 'child "a" fails because ["a" must be a string]',
                    details: [{
                        message: '"a" must be a string',
                        path: ['a'],
                        type: 'string.base',
                        context: { label: 'a', key: 'a', value: 5 }
                    }]
                }],
                [{ b: 'x' }, false, null, {
                    message: 'child "b" fails because ["b" must be an object]',
                    details: [{
                        message: '"b" must be an object',
                        path: ['b'],
                        type: 'object.base',
                        context: { label: 'b', key: 'b', value: 'x' }
                    }]
                }],
                [{ b: {} }, true],
                [{ b: { foo: true } }, false, null, {
                    message: 'child "b" fails because ["foo" is not allowed]',
                    details: [{
                        message: '"foo" is not allowed',
                        path: ['b', 'foo'],
                        type: 'object.allowUnknown',
                        context: { child: 'foo', value: true, key: 'foo', label: 'foo' }
                    }]
                }],
                [{ a: 'x', b: { foo: true } }, false, null, {
                    message: 'child "b" fails because ["foo" is not allowed]',
                    details: [{
                        message: '"foo" is not allowed',
                        path: ['b', 'foo'],
                        type: 'object.allowUnknown',
                        context: { child: 'foo', value: true, key: 'foo', label: 'foo' }
                    }]
                }],
                [{ a: 'x', b: { x: 'y' } }, false, null, {
                    message: 'child "b" fails because [child "x" fails because ["x" must be a boolean]]',
                    details: [{
                        message: '"x" must be a boolean',
                        path: ['b', 'x'],
                        type: 'boolean.base',
                        context: { value: 'y', key: 'x', label: 'x' }
                    }]
                }]
            ]);
        });

        it('validates unknown keys using a pattern (nested)', async () => {

            const schema = {
                x: Joi.object({
                    a: Joi.number()
                }).pattern(/\d+/, Joi.boolean()).pattern(/\w\w+/, 'x')
            };

            const err = await expect(Joi.validate({
                x: {
                    bb: 'y',
                    5: 'x'
                }
            }, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "x" fails because [child "5" fails because ["5" must be a boolean], child "bb" fails because ["bb" must be one of [x]]]');
            expect(err.details).to.equal([
                {
                    message: '"5" must be a boolean',
                    path: ['x', '5'],
                    type: 'boolean.base',
                    context: { label: '5', key: '5', value: 'x' }
                },
                {
                    message: '"bb" must be one of [x]',
                    path: ['x', 'bb'],
                    type: 'any.allowOnly',
                    context: { value: 'y', valids: ['x'], label: 'bb', key: 'bb' }
                }
            ]);
        });

        it('validates unknown keys using a pattern (nested)', async () => {

            const schema = {
                x: Joi.object({
                    a: Joi.number()
                }).pattern(Joi.number().positive(), Joi.boolean()).pattern(Joi.string().length(2), 'x')
            };

            const err = await expect(Joi.validate({
                x: {
                    bb: 'y',
                    5: 'x'
                }
            }, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "x" fails because [child "5" fails because ["5" must be a boolean], child "bb" fails because ["bb" must be one of [x]]]');
            expect(err.details).to.equal([
                {
                    message: '"5" must be a boolean',
                    path: ['x', '5'],
                    type: 'boolean.base',
                    context: { label: '5', key: '5', value: 'x' }
                },
                {
                    message: '"bb" must be one of [x]',
                    path: ['x', 'bb'],
                    type: 'any.allowOnly',
                    context: { value: 'y', valids: ['x'], label: 'bb', key: 'bb' }
                }
            ]);
        });

        it('errors when using a pattern on empty schema with unknown(false) and regex pattern mismatch', async () => {

            const schema = Joi.object().pattern(/\d/, Joi.number()).unknown(false);

            const err = await expect(Joi.validate({ a: 5 }, schema, { abortEarly: false })).to.reject('"a" is not allowed');
            expect(err.details).to.equal([{
                message: '"a" is not allowed',
                path: ['a'],
                type: 'object.allowUnknown',
                context: { child: 'a', label: 'a', key: 'a', value: 5 }
            }]);
        });

        it('errors when using a pattern on empty schema with unknown(false) and schema pattern mismatch', async () => {

            const schema = Joi.object().pattern(Joi.number().positive(), Joi.number()).unknown(false);

            const err = await expect(Joi.validate({ a: 5 }, schema, { abortEarly: false })).to.reject('"a" is not allowed');
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

            const value = await Joi.validate({ a1: undefined, a2: null, a3: 'test' }, schema);
            expect(value).to.equal({ a1: undefined, a2: undefined, a3: 'test' });
        });

        it('should throw an error if pattern is not regex or instance of Any', () => {

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

            const value = await Joi.validate({ a: 'test' }, schema, { context: { keys: ['a'] } });
            expect(value).to.equal({ a: 'test' });
        });
    });

    describe('with()', () => {

        it('should throw an error when a parameter is not a string', () => {

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

        it('should throw an error unless 2 parameters are passed', () => {

            const message = 'Invalid number of arguments, expected 2.';

            expect(() => Joi.object().with()).to.throw(message);
            expect(() => Joi.object().with('a')).to.throw(message);
            expect(() => Joi.object().with('a', 'b', 'c')).to.throw(message);

            expect(Joi.object().with('a', 'b')).to.be.an.object().and.contain({ isJoi: true });
        });

        it('should validate correctly when key is an empty string', () => {

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
                    key: 'a'
                }
            }]);
        });

        it('should support nested objects', () => {

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
                            label: 'a'
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
                            label: 'b'
                        }
                    }]
                }]
            ]);
        });

        it('should support nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).with('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: Object.assign(() => {}, { c: 'test2' }) }, true],
                [{ a: 'test', b: Object.assign(() => {}, { d: 80 }) }, false, null, {
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
                            label: 'a'
                        }
                    }]
                }]
            ]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({ c: Joi.string().label('second'), d: Joi.number() })
            }).with('a', ['b.c']);
            const error = schema.validate({ a: 1, b: { d: 2 } }).error;
            expect(error).to.be.an.error('"first" missing required peer "second"');
            expect(error.details).to.equal([{
                message: '"first" missing required peer "second"',
                path: ['a'],
                type: 'object.with',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b.c',
                    peerWithLabel: 'second',
                    label: 'a',
                    key: 'a'
                }
            }]);

            const schema2 = Joi.object({
                a: Joi.object({ b: Joi.string().label('first') }),
                b: Joi.object({ c: Joi.string().label('second') })
            }).with('a.b', ['b.c']);
            const error2 = schema2.validate({ a: { b: 'test' }, b: {} }).error;
            expect(error2).to.be.an.error('"first" missing required peer "second"');
            expect(error2.details).to.equal([{
                message: '"first" missing required peer "second"',
                path: ['a', 'b'],
                type: 'object.with',
                context: {
                    main: 'a.b',
                    mainWithLabel: 'first',
                    peer: 'b.c',
                    peerWithLabel: 'second',
                    label: 'b',
                    key: 'b'
                }
            }]);
        });
    });

    describe('without()', () => {

        it('should throw an error when a parameter is not a string', () => {

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

        it('should throw an error unless 2 parameters are passed', () => {

            const message = 'Invalid number of arguments, expected 2.';

            expect(() => Joi.object().without()).to.throw(message);
            expect(() => Joi.object().without('a')).to.throw(message);
            expect(() => Joi.object().without('a', 'b', 'c')).to.throw(message);

            expect(Joi.object().without('a', 'b')).to.be.an.object().and.contain({ isJoi: true });
        });

        it('should validate correctly when key is an empty string', () => {

            const schema = Joi.object().without('', 'b');
            Helper.validate(schema, [
                [{ a: 'hi', b: 'there' }, true]
            ]);
        });

        it('should validate correctly when key is stripped', () => {

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
                    key: 'a'
                }
            }]);
        });

        it('should support nested objects', () => {

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
                    label: 'a'
                }
            }]);
        });

        it('should support nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).without('a', ['b.c', 'b.d']);

            const sampleObject = { a: 'test', d: 9000 };
            const sampleObject2 = { a: 'test', b: Object.assign(() => {}, { d: 80 }) };

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
                    label: 'a'
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({ c: Joi.string().label('second'), d: Joi.number() })
            }).without('a', ['b.c']);
            const error = schema.validate({ a: 1, b: { c: 'c' } }).error;
            expect(error).to.be.an.error('"first" conflict with forbidden peer "second"');
            expect(error.details).to.equal([{
                message: '"first" conflict with forbidden peer "second"',
                path: ['a'],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b.c',
                    peerWithLabel: 'second',
                    label: 'a',
                    key: 'a'
                }
            }]);
        });
    });

    describe('xor()', () => {

        it('should throw an error when a parameter is not a string', () => {

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
                    key: undefined
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
                    key: undefined
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
                    key: undefined
                }
            }]);
        });

        it('should support nested objects', () => {

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
                    key: undefined,
                    label: 'value'
                }
            }]);
        });

        it('should support nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).xor('a', 'b.c');

            const sampleObject = { a: 'test', b: Object.assign(() => {}, { d: 80 }) };
            const sampleObject2 = { a: 'test', b: Object.assign(() => {}, { c: 'test2' }) };

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
                    key: undefined,
                    label: 'value'
                }
            }]);
        });

        it('should apply labels without any nested peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({ c: Joi.string().label('second'), d: Joi.number() })
            }).xor('a', 'b.c');
            const error = schema.validate({}).error;
            expect(error).to.be.an.error('"value" must contain at least one of [first, second]');
            expect(error.details).to.equal([{
                message: '"value" must contain at least one of [first, second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['first', 'second'],
                    label: 'value',
                    key: undefined
                }
            }]);
        });

        it('should apply labels with too many nested peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({ c: Joi.string().label('second'), d: Joi.number() })
            }).xor('a', 'b.c');
            const error = schema.validate({ a: 1, b: { c: 'c' } }).error;
            expect(error).to.be.an.error('"value" contains a conflict between exclusive peers [first, second]');
            expect(error.details).to.equal([{
                message: '"value" contains a conflict between exclusive peers [first, second]',
                path: [],
                type: 'object.xor',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['first', 'second'],
                    present: ['a', 'b.c'],
                    presentWithLabels: ['first', 'second'],
                    label: 'value',
                    key: undefined
                }
            }]);
        });
    });

    describe('oxor()', () => {

        it('should throw an error when a parameter is not a string', () => {

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
                    key: undefined
                }
            }]);
        });

        it('should support nested objects', () => {

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
                    key: undefined,
                    label: 'value'
                }
            }]);
        });

        it('should support nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).oxor('a', 'b.c');

            const sampleObject = { a: 'test', b: Object.assign(() => {}, { d: 80 }) };
            const sampleObject2 = { a: 'test', b: Object.assign(() => {}, { c: 'test2' }) };

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
                    key: undefined,
                    label: 'value'
                }
            }]);
        });
    });

    describe('or()', () => {

        it('should throw an error when a parameter is not a string', () => {

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
            expect(err).to.be.an.error('child "a" fails because [child "b" fails because ["value" must contain at least one of [x, y]]]');
            expect(err.details).to.equal([{
                message: '"value" must contain at least one of [x, y]',
                path: ['a', 'b'],
                type: 'object.missing',
                context: {
                    peers: ['x', 'y'],
                    peersWithLabels: ['x', 'y'],
                    label: 'value',
                    key: 'b'
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
                    key: undefined
                }
            }]);
        });

        it('should support nested objects', () => {

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
                    key: undefined,
                    label: 'value'
                }
            }]);
        });

        it('should support nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string() }),
                d: Joi.number()
            }).or('a', 'b.c');

            const sampleObject = { b: Object.assign(() => {}, { c: 'bc' }) };
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
                    key: undefined,
                    label: 'value'
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({ c: Joi.string().label('second'), d: Joi.number() })
            }).or('a', 'b.c');
            const error = schema.validate({}).error;
            expect(error).to.be.an.error('"value" must contain at least one of [first, second]');
            expect(error.details).to.equal([{
                message: '"value" must contain at least one of [first, second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['first', 'second'],
                    label: 'value',
                    key: undefined
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
                    key: undefined
                }
            }]);
        });

        it('should support nested objects', () => {

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
                    key: undefined,
                    label: 'value'
                }
            }]);
        });

        it('should support nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).and('a', 'b.c');

            const sampleObject = { a: 'test', b: Object.assign(() => {}, { c: 'test2' }) };
            const sampleObject2 = { a: 'test', b: Object.assign(() => {}, { d: 80 }) };

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
                    key: undefined,
                    label: 'value'
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({ c: Joi.string().label('second'), d: Joi.number() })
            }).and('a', 'b.c');
            const error = schema.validate({ a: 1 }).error;
            expect(error).to.be.an.error('"value" contains [first] without its required peers [second]');
            expect(error.details).to.equal([{
                message: '"value" contains [first] without its required peers [second]',
                path: [],
                type: 'object.and',
                context: {
                    present: ['a'],
                    presentWithLabels: ['first'],
                    missing: ['b.c'],
                    missingWithLabels: ['second'],
                    label: 'value',
                    key: undefined
                }
            }]);
        });

        it('should apply labels with invalid nested peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({ c: Joi.string().label('second'), d: Joi.number() })
            }).and('a', 'c.d');
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
                    key: undefined
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
                    key: undefined
                }
            }]);
        });

        it('should support nested objects', () => {

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
                    key: undefined,
                    label: 'value'
                }
            }]);
        });

        it('should support nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.func().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).nand('a', 'b.c');

            const sampleObject = { a: 'test', b: Object.assign(() => {}, { d: 80 }) };
            const sampleObject2 = { a: 'test', b: Object.assign(() => {}, { c: 'test2' }) };

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
                    key: undefined,
                    label: 'value'
                }
            }]);
        });

        it('should apply labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({ c: Joi.string().label('second'), d: Joi.number() })
            }).nand('a', 'b.c');
            const error = schema.validate({ a: 1, b: { c: 'c' } }).error;
            expect(error).to.be.an.error('"first" must not exist simultaneously with [second]');
            expect(error.details).to.equal([{
                message: '"first" must not exist simultaneously with [second]',
                path: [],
                type: 'object.nand',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peers: ['b.c'],
                    peersWithLabels: ['second'],
                    label: 'value',
                    key: undefined
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
            }).to.throw(Error, 'Invalid schema content: (a.b.c.d)');
        });

        it('shows errors in schema', () => {

            expect(() => {

                Joi.object().assert('a.b', undefined);
            }).to.throw(Error, 'Invalid schema content: ');
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
            expect(err.message).to.equal('"d.e" validation failed because "d.e" failed to equal to a.c');

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
            expect(err).to.be.an.error('"d.e" validation failed because "d.e" failed to equal to a.c');
            expect(err.details).to.equal([{
                message: '"d.e" validation failed because "d.e" failed to equal to a.c',
                path: ['d', 'e'],
                type: 'object.assert',
                context: { ref: 'd.e', message: 'equal to a.c', label: 'e', key: 'e' }
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
            expect(err).to.be.an.error('"d.e" validation failed because "d.e" failed to pass the assertion test');
            expect(err.details).to.equal([{
                message: '"d.e" validation failed because "d.e" failed to pass the assertion test',
                path: ['d', 'e'],
                type: 'object.assert',
                context: {
                    ref: 'd.e',
                    message: 'pass the assertion test',
                    label: 'e',
                    key: 'e'
                }
            }]);
        });
    });

    describe('type()', () => {

        it('uses constructor name for default type name', async () => {

            const Foo = function Foo() {
            };

            const schema = Joi.object().type(Foo);
            const err = await expect(schema.validate({})).to.reject('"value" must be an instance of "Foo"');
            expect(err.details).to.equal([{
                message: '"value" must be an instance of "Foo"',
                path: [],
                type: 'object.type',
                context: { type: 'Foo', label: 'value', key: undefined, value: {} }
            }]);
        });

        it('uses custom type name if supplied', async () => {

            const Foo = function () {
            };

            const schema = Joi.object().type(Foo, 'Bar');
            const err = await expect(schema.validate({})).to.reject('"value" must be an instance of "Bar"');
            expect(err.details).to.equal([{
                message: '"value" must be an instance of "Bar"',
                path: [],
                type: 'object.type',
                context: { type: 'Bar', label: 'value', key: undefined, value: {} }
            }]);
        });

        it('overrides constructor name with custom name', async () => {

            const Foo = function Foo() {
            };

            const schema = Joi.object().type(Foo, 'Bar');
            const err = await expect(schema.validate({})).to.reject('"value" must be an instance of "Bar"');
            expect(err.details).to.equal([{
                message: '"value" must be an instance of "Bar"',
                path: [],
                type: 'object.type',
                context: { type: 'Bar', label: 'value', key: undefined, value: {} }
            }]);
        });

        it('throws when constructor is not a function', () => {

            expect(() => {

                Joi.object().type('');
            }).to.throw('type must be a constructor function');
        });

        it('uses the constructor name in the schema description', () => {

            const description = Joi.object().type(RegExp).describe();

            expect(description.rules).to.include({ name: 'type', arg: { name: 'RegExp', ctor: RegExp } });
        });

        it('uses the constructor reference in the schema description', () => {

            const Foo = function Foo() {
            };

            const description = Joi.object().type(Foo).describe();

            expect(new Foo()).to.be.an.instanceof(description.rules[0].arg.ctor);
        });
    });

    describe('schema()', () => {

        it('should detect joi instances', () => {

            const schema = Joi.object().schema();
            Helper.validate(schema, [
                [{}, false, null, {
                    message: '"value" must be a Joi instance',
                    details: [{
                        message: '"value" must be a Joi instance',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [{ isJoi: true }, false, null, {
                    message: '"value" must be a Joi instance',
                    details: [{
                        message: '"value" must be a Joi instance',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [Joi.number().max(2), true]
            ]);
        });

    });

    describe('requiredKeys()', () => {

        it('should set keys as required', () => {

            const schema = Joi.object({ a: 0, b: 0, c: { d: 0, e: { f: 0 } }, g: { h: 0 } })
                .requiredKeys('a', 'b', 'c.d', 'c.e.f', 'g');
            Helper.validate(schema, [
                [{}, false, null, {
                    message: 'child "a" fails because ["a" is required]',
                    details: [{
                        message: '"a" is required',
                        path: ['a'],
                        type: 'any.required',
                        context: { label: 'a', key: 'a' }
                    }]
                }],
                [{ a: 0 }, false, null, {
                    message: 'child "b" fails because ["b" is required]',
                    details: [{
                        message: '"b" is required',
                        path: ['b'],
                        type: 'any.required',
                        context: { label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 0, b: 0 }, false, null, {
                    message: 'child "g" fails because ["g" is required]',
                    details: [{
                        message: '"g" is required',
                        path: ['g'],
                        type: 'any.required',
                        context: { label: 'g', key: 'g' }
                    }]
                }],
                [{ a: 0, b: 0, g: {} }, true],
                [{ a: 0, b: 0, c: {}, g: {} }, false, null, {
                    message: 'child "c" fails because [child "d" fails because ["d" is required]]',
                    details: [{
                        message: '"d" is required',
                        path: ['c', 'd'],
                        type: 'any.required',
                        context: { label: 'd', key: 'd' }
                    }]
                }],
                [{ a: 0, b: 0, c: { d: 0 }, g: {} }, true],
                [{ a: 0, b: 0, c: { d: 0, e: {} }, g: {} }, false, null, {
                    message: 'child "c" fails because [child "e" fails because [child "f" fails because ["f" is required]]]',
                    details: [{
                        message: '"f" is required',
                        path: ['c', 'e', 'f'],
                        type: 'any.required',
                        context: { label: 'f', key: 'f' }
                    }]
                }],
                [{ a: 0, b: 0, c: { d: 0, e: { f: 0 } }, g: {} }, true]
            ]);
        });

        it('should work on types other than objects', () => {

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

        });

        it('should throw on unknown key', () => {

            expect(() => {

                Joi.object({ a: 0, b: 0 }).requiredKeys('a', 'c', 'b', 'd', 'd.e.f');
            }).to.throw(Error, 'unknown key(s) c, d');

            expect(() => {

                Joi.object({ a: 0, b: 0 }).requiredKeys('a', 'b', 'a.c.d');
            }).to.throw(Error, 'unknown key(s) a.c.d');

        });

        it('should throw on empty object', () => {

            expect(() => {

                Joi.object().requiredKeys('a', 'c', 'b', 'd');
            }).to.throw(Error, 'unknown key(s) a, b, c, d');
        });

        it('should not modify original object', async () => {

            const schema = Joi.object({ a: 0 });
            const requiredSchema = schema.requiredKeys('a');
            await schema.validate({});

            const err = await expect(requiredSchema.validate({})).to.reject('child "a" fails because ["a" is required]');
            expect(err.details).to.equal([{
                message: '"a" is required',
                path: ['a'],
                type: 'any.required',
                context: { label: 'a', key: 'a' }
            }]);
        });
    });

    describe('optionalKeys()', () => {

        it('should set keys as optional', () => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number().required()
            }).optionalKeys('a', 'b');
            Helper.validate(schema, [
                [{}, true],
                [{ a: 0 }, true],
                [{ a: 0, b: 0 }, true]
            ]);
        });
    });

    describe('forbiddenKeys()', () => {

        it('should set keys as forbidden', () => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number().required()
            }).forbiddenKeys('a', 'b');
            Helper.validate(schema, [
                [{}, true],
                [{ a: undefined }, true],
                [{ a: undefined, b: undefined }, true],
                [{ a: 0 }, false, null, {
                    message: 'child "a" fails because ["a" is not allowed]',
                    details: [{
                        message: '"a" is not allowed',
                        path: ['a'],
                        type: 'any.unknown',
                        context: { label: 'a', key: 'a' }
                    }]
                }],
                [{ b: 0 }, false, null, {
                    message: 'child "b" fails because ["b" is not allowed]',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'any.unknown',
                        context: { label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });
    });
});
