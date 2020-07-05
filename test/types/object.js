'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('object', () => {

    it('validates an object', () => {

        const schema = Joi.object().required();
        Helper.validate(schema, [
            [{}, true],
            [{ hi: true }, true],
            ['', false, {
                message: '"value" must be of type object',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: '', type: 'object' }
            }]
        ]);
    });

    it('validates basic object', () => {

        const schema = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        }).without('a', 'none');

        expect(Joi.isSchema(schema)).to.be.true();
        expect(Joi.isSchema({})).to.be.false();

        const obj = {
            a: 1,
            b: 'a',
            c: 'joe@example.com'
        };

        Helper.validate(schema, [[obj, true]]);
    });

    it('returns object reference when no rules specified', () => {

        const schema = Joi.object({
            a: Joi.object()
        });

        const item = { x: 5 };
        Helper.validate(schema, [[{ a: item }, true, { a: item }]]);
    });

    it('retains ignored values', () => {

        const schema = Joi.object();
        Helper.validate(schema, [[{ a: 5 }, true, { a: 5 }]]);
    });

    it('retains skipped values', () => {

        const schema = Joi.object({ b: 5 }).unknown(true);
        Helper.validate(schema, [[{ b: 5, a: 5 }, true, { a: 5, b: 5 }]]);
    });

    it('retains symbols', () => {

        const schema = Joi.object({ a: Joi.number() });

        const symbol = Symbol();
        Helper.validate(schema, [[{ [symbol]: 5, a: 5 }, true, { [symbol]: 5, a: 5 }]]);
    });

    it('retains non-enumerable', () => {

        const schema = Joi.object({ a: Joi.number() });

        const obj = { a: 100 };
        Object.defineProperty(obj, 'test', { value: 42, enumerable: false });
        expect(obj.test).to.equal(42);
        Helper.validate(schema, { nonEnumerables: true }, [[obj, true, { a: 100 }]]);
    });

    it('retains prototype', () => {

        const schema = Joi.object({ a: Joi.number() });

        const Test = class {
            constructor() {

                this.a = 5;
            }
        };

        expect(schema.validate(new Test()).value).to.be.instanceof(Test);
    });

    it('allows any key when schema is undefined', () => {

        Helper.validate(Joi.object(), [[{ a: 4 }, true]]);
        Helper.validate(Joi.object(undefined), [[{ a: 4 }, true]]);
    });

    it('allows any key when schema is null', () => {

        Helper.validate(Joi.object(null), [[{ a: 4 }, true]]);
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

    it('skips conversion when value is undefined', () => {

        Helper.validate(Joi.object({ a: Joi.object() }), [[undefined, true, undefined]]);
    });

    it('errors on array', () => {

        Helper.validate(Joi.object(), [[[1, 2, 3], false, {
            message: '"value" must be of type object',
            path: [],
            type: 'object.base',
            context: { label: 'value', value: [1, 2, 3], type: 'object' }
        }]]);
    });

    it('should prevent extra keys from existing by default', () => {

        const schema = Joi.object({ item: Joi.string().required() }).required();
        Helper.validate(schema, [
            [{ item: 'something' }, true],
            [{ item: 'something', item2: 'something else' }, false, {
                message: '"item2" is not allowed',
                path: ['item2'],
                type: 'object.unknown',
                context: { child: 'item2', label: 'item2', key: 'item2', value: 'something else' }
            }],
            ['', false, {
                message: '"value" must be of type object',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: '', type: 'object' }
            }]
        ]);
    });

    it('validates count when min is set', () => {

        const schema = Joi.object().min(3);
        Helper.validate(schema, [
            [{ item: 'something' }, false, {
                message: '"value" must have at least 3 keys',
                path: [],
                type: 'object.min',
                context: { limit: 3, label: 'value', value: { item: 'something' } }
            }],
            [{ item: 'something', item2: 'something else' }, false, {
                message: '"value" must have at least 3 keys',
                path: [],
                type: 'object.min',
                context: {
                    limit: 3,
                    label: 'value',
                    value: { item: 'something', item2: 'something else' }
                }
            }],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, true],
            ['', false, {
                message: '"value" must be of type object',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: '', type: 'object' }
            }]
        ]);
    });

    it('validates count when max is set', () => {

        const schema = Joi.object().max(2);
        Helper.validate(schema, [
            [{ item: 'something' }, true],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, false, {
                message: '"value" must have less than or equal to 2 keys',
                path: [],
                type: 'object.max',
                context: {
                    limit: 2,
                    label: 'value',
                    value: { item: 'something', item2: 'something else', item3: 'something something else' }
                }
            }],
            ['', false, {
                message: '"value" must be of type object',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: '', type: 'object' }
            }]
        ]);
    });

    it('validates count when min and max is set', () => {

        const schema = Joi.object().max(3).min(2);
        Helper.validate(schema, [
            [{ item: 'something' }, false, {
                message: '"value" must have at least 2 keys',
                path: [],
                type: 'object.min',
                context: { limit: 2, label: 'value', value: { item: 'something' } }
            }],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else', item4: 'item4' }, false, {
                message: '"value" must have less than or equal to 3 keys',
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
            }],
            ['', false, {
                message: '"value" must be of type object',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: '', type: 'object' }
            }]
        ]);
    });

    it('validates count when length is set', () => {

        const schema = Joi.object().length(2);
        Helper.validate(schema, [
            [{ item: 'something' }, false, {
                message: '"value" must have 2 keys',
                path: [],
                type: 'object.length',
                context: { limit: 2, label: 'value', value: { item: 'something' } }
            }],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, false, {
                message: '"value" must have 2 keys',
                path: [],
                type: 'object.length',
                context: {
                    limit: 2,
                    label: 'value',
                    value: { item: 'something', item2: 'something else', item3: 'something something else' }
                }
            }],
            ['', false, {
                message: '"value" must be of type object',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: '', type: 'object' }
            }]
        ]);
    });

    it('validates constructor when type is set', () => {

        const schema = Joi.object().instance(RegExp);
        const d = new Date();
        Helper.validate(schema, [
            [{ item: 'something' }, false, {
                message: '"value" must be an instance of "RegExp"',
                path: [],
                type: 'object.instance',
                context: { type: 'RegExp', label: 'value', value: { item: 'something' } }
            }],
            ['', false, {
                message: '"value" must be of type object',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: '', type: 'object' }
            }],
            [d, false, {
                message: '"value" must be an instance of "RegExp"',
                path: [],
                type: 'object.instance',
                context: { type: 'RegExp', label: 'value', value: d }
            }],
            [/abcd/, true],
            [new RegExp(), true]
        ]);
    });

    it('traverses an object and validate all properties in the top level', () => {

        const schema = Joi.object({
            num: Joi.number()
        });

        Helper.validate(schema, [
            [{ num: 1 }, true],
            [{ num: [1, 2, 3] }, false, {
                message: '"num" must be a number',
                path: ['num'],
                type: 'number.base',
                context: { label: 'num', key: 'num', value: [1, 2, 3] }
            }]
        ]);
    });

    it('traverses an object and child objects and validate all properties', () => {

        const schema = Joi.object({
            num: Joi.number(),
            obj: Joi.object({
                item: Joi.string()
            })
        });

        Helper.validate(schema, [
            [{ num: 1 }, true],
            [{ num: [1, 2, 3] }, false, {
                message: '"num" must be a number',
                path: ['num'],
                type: 'number.base',
                context: { label: 'num', key: 'num', value: [1, 2, 3] }
            }],
            [{ num: 1, obj: { item: 'something' } }, true],
            [{ num: 1, obj: { item: 123 } }, false, {
                message: '"obj.item" must be a string',
                path: ['obj', 'item'],
                type: 'string.base',
                context: { value: 123, label: 'obj.item', key: 'item' }
            }]
        ]);
    });

    it('traverses an object several levels', () => {

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
            [{ num: 1 }, false, {
                message: '"num" is not allowed',
                path: ['num'],
                type: 'object.unknown',
                context: { child: 'num', label: 'num', key: 'num', value: 1 }
            }],
            [{ obj: {} }, true],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, true],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, {
                message: '"obj.obj.obj.item" must be a boolean',
                path: ['obj', 'obj', 'obj', 'item'],
                type: 'boolean.base',
                context: { label: 'obj.obj.obj.item', key: 'item', value: 10 }
            }]
        ]);
    });

    it('traverses an object several levels with required levels', () => {

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
            [null, false, {
                message: '"value" must be of type object',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: null, type: 'object' }
            }],
            [undefined, true],
            [{}, true],
            [{ obj: {} }, false, {
                message: '"obj.obj" is required',
                path: ['obj', 'obj'],
                type: 'any.required',
                context: { label: 'obj.obj', key: 'obj' }
            }],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, true],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, {
                message: '"obj.obj.obj.item" must be a boolean',
                path: ['obj', 'obj', 'obj', 'item'],
                type: 'boolean.base',
                context: { label: 'obj.obj.obj.item', key: 'item', value: 10 }
            }]
        ]);
    });

    it('traverses an object several levels with required levels (without Joi.obj())', () => {

        const schema = Joi.object({
            obj: {
                obj: {
                    obj: {
                        item: Joi.boolean().required()
                    }
                }
            }
        });

        Helper.validate(schema, [
            [null, false, {
                message: '"value" must be of type object',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: null, type: 'object' }
            }],
            [undefined, true],
            [{}, true],
            [{ obj: {} }, true],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, false, {
                message: '"obj.obj.obj.item" is required',
                path: ['obj', 'obj', 'obj', 'item'],
                type: 'any.required',
                context: { label: 'obj.obj.obj.item', key: 'item' }
            }],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, {
                message: '"obj.obj.obj.item" must be a boolean',
                path: ['obj', 'obj', 'obj', 'item'],
                type: 'boolean.base',
                context: { label: 'obj.obj.obj.item', key: 'item', value: 10 }
            }]
        ]);
    });

    it('errors on unknown keys when functions allows', () => {

        const schema = Joi.object({ a: Joi.number() }).prefs({ skipFunctions: true });
        const obj = { a: 5, b: 'value' };
        Helper.validate(schema, [[obj, false, {
            message: '"b" is not allowed',
            path: ['b'],
            type: 'object.unknown',
            context: { child: 'b', label: 'b', key: 'b', value: 'value' }
        }]]);
    });

    it('validates both valid() and with()', () => {

        const schema = Joi.object({
            first: Joi.valid('value'),
            second: Joi.any()
        }).with('first', 'second');

        Helper.validate(schema, [
            [{ first: 'value' }, false, {
                message: '"first" missing required peer "second"',
                path: [],
                type: 'object.with',
                context: {
                    main: 'first',
                    mainWithLabel: 'first',
                    peer: 'second',
                    peerWithLabel: 'second',
                    label: 'value',
                    value: { first: 'value' }
                }
            }]
        ]);
    });

    it('validates referenced arrays in valid()', () => {

        const ref = Joi.in('$x');
        const schema = Joi.object({
            foo: Joi.valid(ref)
        });

        Helper.validate(schema, { context: { x: 'bar' } }, [
            [{ foo: 'bar' }, true]
        ]);

        Helper.validate(schema, { context: { x: ['baz', 'bar'] } }, [
            [{ foo: 'bar' }, true]
        ]);

        Helper.validate(schema, { context: { x: 'baz' } }, [
            [{ foo: 'bar' }, false, {
                message: '"foo" must be [ref:global:x]',
                path: ['foo'],
                type: 'any.only',
                context: { value: 'bar', valids: [ref], label: 'foo', key: 'foo' }
            }]
        ]);

        Helper.validate(schema, { context: { x: ['baz', 'qux'] } }, [
            [{ foo: 'bar' }, false, {
                message: '"foo" must be [ref:global:x]',
                path: ['foo'],
                type: 'any.only',
                context: { value: 'bar', valids: [ref], label: 'foo', key: 'foo' }
            }]
        ]);

        Helper.validate(schema, [
            [{ foo: 'bar' }, false, {
                message: '"foo" must be [ref:global:x]',
                path: ['foo'],
                type: 'any.only',
                context: { value: 'bar', valids: [ref], label: 'foo', key: 'foo' }
            }]
        ]);
    });

    it('errors on unknown nested keys with the correct path', () => {

        const schema = Joi.object({ a: Joi.object().keys({}) });
        const obj = { a: { b: 'value' } };
        Helper.validate(schema, [[obj, false, {
            message: '"a.b" is not allowed',
            path: ['a', 'b'],
            type: 'object.unknown',
            context: { child: 'b', label: 'a.b', key: 'b', value: 'value' }
        }]]);
    });

    it('errors on unknown nested keys with the correct path at the root level', () => {

        const schema = Joi.object({ a: Joi.object().keys({}) });
        const obj = { c: 'hello' };
        Helper.validate(schema, [[obj, false, {
            message: '"c" is not allowed',
            path: ['c'],
            type: 'object.unknown',
            context: { child: 'c', label: 'c', key: 'c', value: 'hello' }
        }]]);
    });

    it('should work on prototype-less objects', () => {

        const input = Object.create(null);
        const schema = Joi.object().keys({
            a: Joi.number()
        });

        input.a = 1337;

        Helper.validate(schema, [[input, true]]);
    });

    it('should be able to use rename safely with a fake hasOwnProperty', () => {

        const schema = Joi.object()
            .rename('b', 'a');

        const input = { b: 2, a: 1, hasOwnProperty: 'foo' };

        Helper.validate(schema, [[input, false, {
            message: '"value" cannot rename "b" because override is disabled and target "a" exists',
            path: [],
            type: 'object.rename.override',
            context: { from: 'b', to: 'a', label: 'value', pattern: false, value: input }
        }]]);
    });

    it('should be able to use object.with() safely with a fake hasOwnProperty', () => {

        const input = { a: 1, hasOwnProperty: 'foo' };
        const schema = Joi.object({ a: 1 }).with('a', 'b');

        Helper.validate(schema, { abortEarly: false }, [[input, false, {
            message: '"hasOwnProperty" is not allowed. "a" missing required peer "b"',
            details: [
                {
                    message: '"hasOwnProperty" is not allowed',
                    path: ['hasOwnProperty'],
                    type: 'object.unknown',
                    context: {
                        child: 'hasOwnProperty',
                        label: 'hasOwnProperty',
                        key: 'hasOwnProperty',
                        value: 'foo'
                    }
                },
                {
                    message: '"a" missing required peer "b"',
                    path: [],
                    type: 'object.with',
                    context: {
                        main: 'a',
                        mainWithLabel: 'a',
                        peer: 'b',
                        peerWithLabel: 'b',
                        label: 'value',
                        value: input
                    }
                }
            ]
        }]]);
    });

    it('aborts early on unknown keys', () => {

        const input = { a: 1, unknown: 2 };
        const schema = Joi.object({ a: 1 }).with('a', 'b');

        Helper.validate(schema, [[input, false, '"unknown" is not allowed']]);
    });

    it('applies labels with nested objects', () => {

        const schema = Joi.object({
            a: Joi.number().label('first'),
            b: Joi.object({
                c: Joi.string().label('second'),
                d: Joi.number()
            })
        })
            .with('a', ['b.c']);

        Helper.validate(schema, [[{ a: 1, b: { d: 2 } }, false, {
            message: '"first" missing required peer "b.second"',
            path: [],
            type: 'object.with',
            context: {
                main: 'a',
                mainWithLabel: 'first',
                peer: 'b.c',
                peerWithLabel: 'b.second',
                label: 'value',
                value: { a: 1, b: { d: 2 } }
            }
        }]]);
    });

    it('errors on unknown key', () => {

        const config = {
            auth: Joi.object({
                mode: Joi.string().valid('required', 'optional', 'try').allow(null)
            }).allow(null)
        };

        Helper.validate(Joi.compile(config), [
            [{ auth: { unknown: true } }, false, '"auth.unknown" is not allowed'],
            [{ something: false }, false, '"something" is not allowed']
        ]);
    });

    describe('and()', () => {

        it('validates and()', () => {

            const schema = Joi.object({
                txt: Joi.string(),
                upc: Joi.string().allow(null, ''),
                code: Joi.number()
            }).and('txt', 'upc', 'code');

            const err = schema.validate({ txt: 'x' }, { abortEarly: false }).error;
            expect(err).to.be.an.error('"value" contains [txt] without its required peers [upc, code]');
            expect(err.details).to.equal([{
                message: '"value" contains [txt] without its required peers [upc, code]',
                path: [],
                type: 'object.and',
                context: {
                    present: ['txt'],
                    presentWithLabels: ['txt'],
                    missing: ['upc', 'code'],
                    missingWithLabels: ['upc', 'code'],
                    label: 'value',
                    value: { txt: 'x' }
                }
            }]);

            Helper.validate(schema, [
                [{}, true],
                [{ upc: null }, false, {
                    message: '"value" contains [upc] without its required peers [txt, code]',
                    path: [],
                    type: 'object.and',
                    context: {
                        present: ['upc'],
                        presentWithLabels: ['upc'],
                        missing: ['txt', 'code'],
                        missingWithLabels: ['txt', 'code'],
                        label: 'value',
                        value: { upc: null }
                    }
                }],
                [{ upc: 'test' }, false, {
                    message: '"value" contains [upc] without its required peers [txt, code]',
                    path: [],
                    type: 'object.and',
                    context: {
                        present: ['upc'],
                        presentWithLabels: ['upc'],
                        missing: ['txt', 'code'],
                        missingWithLabels: ['txt', 'code'],
                        label: 'value',
                        value: { upc: 'test' }
                    }
                }],
                [{ txt: null }, false, {
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }],
                [{ txt: 'test' }, false, {
                    message: '"value" contains [txt] without its required peers [upc, code]',
                    path: [],
                    type: 'object.and',
                    context: {
                        present: ['txt'],
                        presentWithLabels: ['txt'],
                        missing: ['upc', 'code'],
                        missingWithLabels: ['upc', 'code'],
                        label: 'value',
                        value: { txt: 'test' }
                    }
                }],
                [{ code: null }, false, {
                    message: '"code" must be a number',
                    path: ['code'],
                    type: 'number.base',
                    context: { label: 'code', key: 'code', value: null }
                }],
                [{ code: 123 }, false, {
                    message: '"value" contains [code] without its required peers [txt, upc]',
                    path: [],
                    type: 'object.and',
                    context: {
                        present: ['code'],
                        presentWithLabels: ['code'],
                        missing: ['txt', 'upc'],
                        missingWithLabels: ['txt', 'upc'],
                        label: 'value',
                        value: { code: 123 }
                    }
                }],
                [{ txt: 'test', upc: null }, false, {
                    message: '"value" contains [txt, upc] without its required peers [code]',
                    path: [],
                    type: 'object.and',
                    context: {
                        present: ['txt', 'upc'],
                        presentWithLabels: ['txt', 'upc'],
                        missing: ['code'],
                        missingWithLabels: ['code'],
                        label: 'value',
                        value: { txt: 'test', upc: null }
                    }
                }],
                [{ txt: 'test', upc: '' }, false, {
                    message: '"value" contains [txt, upc] without its required peers [code]',
                    path: [],
                    type: 'object.and',
                    context: {
                        present: ['txt', 'upc'],
                        presentWithLabels: ['txt', 'upc'],
                        missing: ['code'],
                        missingWithLabels: ['code'],
                        label: 'value',
                        value: { txt: 'test', upc: '' }
                    }
                }],
                [{ txt: '', upc: 'test' }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: null, upc: 'test' }, false, {
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }],
                [{ txt: undefined, upc: 'test' }, false, {
                    message: '"value" contains [upc] without its required peers [txt, code]',
                    path: [],
                    type: 'object.and',
                    context: {
                        present: ['upc'],
                        presentWithLabels: ['upc'],
                        missing: ['txt', 'code'],
                        missingWithLabels: ['txt', 'code'],
                        label: 'value',
                        value: { txt: undefined, upc: 'test' }
                    }
                }],
                [{ txt: 'test', upc: undefined }, false, {
                    message: '"value" contains [txt] without its required peers [upc, code]',
                    path: [],
                    type: 'object.and',
                    context: {
                        present: ['txt'],
                        presentWithLabels: ['txt'],
                        missing: ['upc', 'code'],
                        missingWithLabels: ['upc', 'code'],
                        label: 'value',
                        value: { txt: 'test', upc: undefined }
                    }
                }],
                [{ txt: 'test', upc: '' }, false, {
                    message: '"value" contains [txt, upc] without its required peers [code]',
                    path: [],
                    type: 'object.and',
                    context: {
                        present: ['txt', 'upc'],
                        presentWithLabels: ['txt', 'upc'],
                        missing: ['code'],
                        missingWithLabels: ['code'],
                        label: 'value',
                        value: { txt: 'test', upc: '' }
                    }
                }],
                [{ txt: 'test', upc: null }, false, {
                    message: '"value" contains [txt, upc] without its required peers [code]',
                    path: [],
                    type: 'object.and',
                    context: {
                        present: ['txt', 'upc'],
                        presentWithLabels: ['txt', 'upc'],
                        missing: ['code'],
                        missingWithLabels: ['code'],
                        label: 'value',
                        value: { txt: 'test', upc: null }
                    }
                }],
                [{ txt: '', upc: undefined }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: '', upc: undefined, code: 999 }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: '', upc: undefined, code: undefined }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: '', upc: '' }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: 'test', upc: 'test' }, false, {
                    message: '"value" contains [txt, upc] without its required peers [code]',
                    path: [],
                    type: 'object.and',
                    context: {
                        present: ['txt', 'upc'],
                        presentWithLabels: ['txt', 'upc'],
                        missing: ['code'],
                        missingWithLabels: ['code'],
                        label: 'value',
                        value: { txt: 'test', upc: 'test' }
                    }
                }],
                [{ txt: 'test', upc: 'test', code: 322 }, true],
                [{ txt: 'test', upc: null, code: 322 }, true]
            ]);
        });

        it('applies labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).and('a', 'b');
            Helper.validate(schema, [[{ a: 1 }, false, {
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
            }]]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).and('a', 'b.c');

            const sampleObject = { a: 'test', b: { c: 'test2' } };
            const sampleObject2 = { a: 'test', b: { d: 80 } };

            Helper.validate(schema, [
                [sampleObject, true],
                [sampleObject2, false, {
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
                }]
            ]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.function().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .and('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: Object.assign(() => { }, { c: 'test2' }) }, true, Helper.skip],
                [{ a: 'test', b: Object.assign(() => { }, { d: 80 }) }, false, '"value" contains [a] without its required peers [b.c]']
            ]);
        });

        it('applies labels with nested objects', () => {

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

        it('applies labels with invalid nested peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .and('a', 'c.d');

            Helper.validate(schema, [[{ a: 1, b: { d: 1 } }, false, {
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
            }]]);
        });
    });

    describe('append()', () => {

        it('should append schema', () => {

            const schema = Joi.object()
                .keys({ a: Joi.string() })
                .append({ b: Joi.string() });

            Helper.validate(schema, [[{ a: 'x', b: 'y' }, true]]);
        });

        it('should not change schema if it is null', () => {

            const schema = Joi.object()
                .keys({ a: Joi.string() })
                .append(null);

            Helper.validate(schema, [[{ a: 'x' }, true]]);
        });

        it('should not change schema if it is undefined', () => {

            const schema = Joi.object()
                .keys({ a: Joi.string() })
                .append(undefined);

            Helper.validate(schema, [[{ a: 'x' }, true]]);
        });

        it('should not change schema if it is empty-object', () => {

            const schema = Joi.object()
                .keys({ a: Joi.string() })
                .append({});

            Helper.validate(schema, [[{ a: 'x' }, true]]);
        });
    });

    describe('assert()', () => {

        it('shows path to errors in schema', () => {

            expect(() => {

                Joi.object().assert('.a.b', {
                    a: {
                        b: {
                            c: {
                                d: undefined
                            }
                        }
                    }
                });
            }).to.throw('Invalid undefined schema (a.b.c.d)');
        });

        it('shows errors in schema', () => {

            expect(() => {

                Joi.object().assert('.a.b', undefined);
            }).to.throw('Invalid undefined schema');
        });

        it('validates upwards reference', () => {

            const schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            })
                .assert(Joi.ref('/d/e', { separator: '/' }), Joi.ref('a.c'), 'equal to a/c');

            Helper.validate(schema, [[{ a: { b: 'x', c: 5 }, d: { e: 6 } }, false, '"value" is invalid because "d/e" failed to equal to a/c']]);

            Helper.validate(schema, [
                [{ a: { b: 'x', c: 5 }, d: { e: 5 } }, true]
            ]);
        });

        it('validates upwards reference with implicit context', () => {

            const ref = Joi.ref('.d.e');
            const schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            })
                .assert(ref, Joi.ref('a.c'), 'equal to a.c');

            Helper.validate(schema, [
                [{ a: { b: 'x', c: 5 }, d: { e: 6 } }, false, {
                    message: '"value" is invalid because "d.e" failed to equal to a.c',
                    path: [],
                    type: 'object.assert',
                    context: {
                        subject: ref,
                        message: 'equal to a.c',
                        label: 'value',
                        value: { a: { b: 'x', c: 5 }, d: { e: 6 } }
                    }
                }],
                [{ a: { b: 'x', c: 5 }, d: { e: 5 } }, true]
            ]);
        });

        it('support own keys', () => {

            const subject = Joi.ref('.a');
            const schema = Joi.object({
                a: Joi.number(),
                d: {
                    e: Joi.any()
                }
            })
                .assert(subject, Joi.ref('d.e'), 'equal to d.e');

            Helper.validate(schema, [
                [{ a: 5, d: { e: 5 } }, true],
                [{ a: 6, d: { e: 5 } }, false, {
                    message: '"value" is invalid because "a" failed to equal to d.e',
                    path: [],
                    type: 'object.assert',
                    context: {
                        subject,
                        message: 'equal to d.e',
                        label: 'value',
                        value: { a: 6, d: { e: 5 } }
                    }
                }]
            ]);
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
                })
                    .assert('$a', Joi.ref('d.e'), 'equal to d.e');
            }).to.not.throw();
        });

        it('provides a default message for failed assertions', () => {

            const ref = Joi.ref('.d.e');
            const schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            }).assert(ref, Joi.boolean());

            Helper.validate(schema, [[{ d: { e: [] } }, false, {
                message: '"value" is invalid because "d.e" failed to pass the assertion test',
                path: [],
                type: 'object.assert',
                context: {
                    subject: ref,
                    message: undefined,
                    label: 'value',
                    value: { d: { e: [] } }
                }
            }]]);
        });

        it('works with keys()', () => {

            const schema = Joi.object({ a: { b: Joi.any() } })
                .min(2)
                .assert('.a.b', Joi.number())
                .keys({ b: { c: Joi.any() } })
                .assert('.b.c', Joi.number());

            Helper.validate(schema, [[{ a: { b: 1 }, b: { c: 2 } }, true]]);
        });

        it('uses templates', () => {

            const subject = Joi.x('{.a || .b || .c}');
            const schema = Joi.object({
                a: Joi.boolean(),
                b: Joi.boolean(),
                c: Joi.boolean()
            })
                .assert(subject, true, 'at least one key must be true');

            Helper.validate(schema, [
                [undefined, true],
                [{ a: true, b: true, c: true }, true],
                [{ a: true, b: false, c: false }, true],
                [{ a: false, b: true, c: false }, true],
                [{ a: false, b: false, c: true }, true],
                [{ a: false, b: false, c: false }, false, {
                    message: '"value" is invalid because at least one key must be true',
                    path: [],
                    type: 'object.assert',
                    context: {
                        subject,
                        message: 'at least one key must be true',
                        label: 'value',
                        value: { a: false, b: false, c: false }
                    }
                }]
            ]);
        });
    });

    describe('cast()', () => {

        it('casts value to map', () => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number() }).cast('map');
            expect(schema.validate({ a: '1', b: '2' }).value).to.equal(new Map([['a', 1], ['b', 2]]));
        });

        it('ignores null', () => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number() }).allow(null).cast('map');
            Helper.validate(schema, [[null, true, null]]);
        });

        it('ignores string', () => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number() }).allow('x').cast('map');
            Helper.validate(schema, [['x', true, 'x']]);
        });

        it('does not leak casts to any', () => {

            expect(() => Joi.any().cast('map')).to.throw('Type any does not support casting to map');
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

        it('describes patterns', () => {

            const schema = Joi.object({
                a: Joi.string()
            }).pattern(/\w\d/i, Joi.boolean());

            expect(schema.describe()).to.equal({
                type: 'object',
                keys: {
                    a: {
                        type: 'string'
                    }
                },
                patterns: [
                    {
                        regex: '/\\w\\d/i',
                        rule: {
                            type: 'boolean'
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
                keys: {
                    a: {
                        type: 'string'
                    }
                },
                patterns: [
                    {
                        schema: {
                            rules: [{
                                args: { options: { version: 'uuidv4' } },
                                name: 'guid'
                            }],
                            type: 'string'
                        },
                        rule: {
                            type: 'boolean'
                        }
                    }
                ]
            });
        });
    });

    describe('instance()', () => {

        it('uses constructor name for default type name', () => {

            const Foo = function Foo() {
            };

            const schema = Joi.object().instance(Foo);
            Helper.validate(schema, [[{}, false, {
                message: '"value" must be an instance of "Foo"',
                path: [],
                type: 'object.instance',
                context: { type: 'Foo', label: 'value', value: {} }
            }]]);
        });

        it('uses custom type name if supplied', () => {

            const Foo = function () {
            };

            const schema = Joi.object().instance(Foo, 'Bar');
            Helper.validate(schema, [[{}, false, {
                message: '"value" must be an instance of "Bar"',
                path: [],
                type: 'object.instance',
                context: { type: 'Bar', label: 'value', value: {} }
            }]]);
        });

        it('overrides constructor name with custom name', () => {

            const Foo = function Foo() {
            };

            const schema = Joi.object().instance(Foo, 'Bar');
            Helper.validate(schema, [[{}, false, {
                message: '"value" must be an instance of "Bar"',
                path: [],
                type: 'object.instance',
                context: { type: 'Bar', label: 'value', value: {} }
            }]]);
        });

        it('throws when constructor is not a function', () => {

            expect(() => Joi.object().instance('')).to.throw('constructor must be a function');
        });

        it('uses the constructor name in the schema description', () => {

            const description = Joi.object().instance(RegExp).describe();

            expect(description.rules[0]).to.equal({ name: 'instance', args: { name: 'RegExp', constructor: RegExp } });
        });

        it('uses the constructor reference in the schema description', () => {

            const Foo = function Foo() { };

            const description = Joi.object().instance(Foo).describe();

            expect(new Foo()).to.be.an.instanceof(description.rules[0].args.constructor);
        });
    });

    describe('keys()', () => {

        it('allows any key', () => {

            const a = Joi.object({ a: 4 });
            const b = a.keys();
            Helper.validate(a, [[{ b: 3 }, false, {
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.unknown',
                context: { child: 'b', label: 'b', key: 'b', value: 3 }
            }]]);

            Helper.validate(b, [[{ b: 3 }, true]]);
        });

        it('forbids all keys', () => {

            const a = Joi.object();
            const b = a.keys({});
            Helper.validate(a, [[{ b: 3 }, true]]);
            Helper.validate(b, [[{ b: 3 }, false, {
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.unknown',
                context: { child: 'b', label: 'b', key: 'b', value: 3 }
            }]]);
        });

        it('adds to existing keys', () => {

            const a = Joi.object({ a: 1 });
            const b = a.keys({ b: 2 });
            Helper.validate(a, [[{ a: 1, b: 2 }, false, {
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.unknown',
                context: { child: 'b', label: 'b', key: 'b', value: 2 }
            }]]);

            Helper.validate(b, [[{ a: 1, b: 2 }, true]]);
        });

        it('overrides existing keys', () => {

            const a = Joi.object({ a: Joi.number().valid(1) });
            const b = a.keys({ a: Joi.string() });

            Helper.validate(a, [
                [{ a: 1 }, true, { a: 1 }],
                [{ a: '1' }, true, { a: 1 }],
                [{ a: '2' }, false, {
                    message: '"a" must be [1]',
                    path: ['a'],
                    type: 'any.only',
                    context: { value: 2, valids: [1], label: 'a', key: 'a' }
                }]
            ]);

            Helper.validate(b, [
                [{ a: 1 }, false, {
                    message: '"a" must be a string',
                    path: ['a'],
                    type: 'string.base',
                    context: { value: 1, label: 'a', key: 'a' }
                }],
                [{ a: '1' }, true, { a: '1' }]
            ]);
        });

        it('strips keys flagged with strip', () => {

            const schema = Joi.object({
                a: Joi.string().strip(),
                b: Joi.string()
            });

            Helper.validate(schema, [[{ a: 'test', b: 'test' }, true, { b: 'test' }]]);
        });

        it('strips keys after validation', () => {

            const schema = Joi.object({
                a: Joi.string().strip(),
                b: Joi.string().default(Joi.ref('a'))
            });

            Helper.validate(schema, [[{ a: 'test' }, true, { b: 'test' }]]);
        });

        it('strips keys while preserving transformed values', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({
                a: Joi.number().strip(),
                b: Joi.number().min(ref)
            });

            Helper.validate(schema, [
                [{ a: '1', b: '2' }, true, { b: 2 }],
                [{ a: '1', b: '0' }, false, {
                    message: '"b" must be greater than or equal to ref:a',
                    path: ['b'],
                    type: 'number.min',
                    context: { limit: ref, value: 0, label: 'b', key: 'b' }
                }]
            ]);
        });

        it('does not alter the original object when stripping keys', () => {

            const schema = Joi.object({
                a: Joi.string().strip(),
                b: Joi.string()
            });

            const valid = {
                a: 'test',
                b: 'test'
            };

            expect(schema.validate(valid)).to.equal({ value: { b: 'test' } });
            expect(valid.a).to.equal('test');
            expect(valid.b).to.equal('test');
        });

        it('should strip from an alternative', () => {

            const schema = Joi.object({
                a: [Joi.boolean().strip()]
            });

            Helper.validate(schema, [[{ a: true }, true, {}]]);
        });

        it('keeps keys in ref order', () => {

            const schema = Joi.object({
                type: Joi.string().required(),

                set: Joi.boolean()
                    .when('flag', { is: true, then: false }),

                flag: Joi.boolean()
            })
                .when('.type', [
                    { is: 'a', then: Joi.object({ flag: false }) }
                ]);

            Helper.validate(schema, [
                [{ flag: true }, false, '"type" is required'],
                [{ flag: true }, false, '"type" is required'],
                [{ type: 'a', flag: true }, false, '"flag" must be [false]'],
                [{ type: 'a', set: true, flag: true }, false, '"flag" must be [false]']
            ]);
        });
    });

    describe('length()', () => {

        it('throws when length is not a number', () => {

            expect(() => {

                Joi.object().length('a');
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

    describe('min()', () => {

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.object().min('a');
            }).to.throw('limit must be a positive integer or reference');
        });
    });

    describe('nand()', () => {

        it('validates nand()', () => {

            const schema = Joi.object({
                txt: Joi.string(),
                upc: Joi.string().allow(null, ''),
                code: Joi.number()
            })
                .nand('txt', 'upc', 'code');

            Helper.validate(schema, { abortEarly: false }, [[{ txt: 'x', upc: 'y', code: 123 }, false, {
                message: '"txt" must not exist simultaneously with [upc, code]',
                details: [{
                    message: '"txt" must not exist simultaneously with [upc, code]',
                    path: [],
                    type: 'object.nand',
                    context: {
                        main: 'txt',
                        mainWithLabel: 'txt',
                        peers: ['upc', 'code'],
                        peersWithLabels: ['upc', 'code'],
                        label: 'value',
                        value: { txt: 'x', upc: 'y', code: 123 }
                    }
                }]
            }]]);

            Helper.validate(schema, [
                [{}, true],
                [{ upc: null }, true],
                [{ upc: 'test' }, true],
                [{ txt: 'test' }, true],
                [{ code: 123 }, true],
                [{ txt: 'test', upc: null }, true],
                [{ txt: 'test', upc: '' }, true],
                [{ txt: undefined, upc: 'test' }, true],
                [{ txt: 'test', upc: undefined }, true],
                [{ txt: 'test', upc: '' }, true],
                [{ txt: 'test', upc: null }, true],
                [{ txt: 'test', upc: undefined, code: 999 }, true],
                [{ txt: 'test', upc: 'test' }, true],
                [{ txt: 'test', upc: 'test', code: 322 }, false, {
                    message: '"txt" must not exist simultaneously with [upc, code]',
                    path: [],
                    type: 'object.nand',
                    context: {
                        main: 'txt',
                        mainWithLabel: 'txt',
                        peers: ['upc', 'code'],
                        peersWithLabels: ['upc', 'code'],
                        label: 'value',
                        value: { txt: 'test', upc: 'test', code: 322 }
                    }
                }],
                [{ txt: 'test', upc: null, code: 322 }, false, {
                    message: '"txt" must not exist simultaneously with [upc, code]',
                    path: [],
                    type: 'object.nand',
                    context: {
                        main: 'txt',
                        mainWithLabel: 'txt',
                        peers: ['upc', 'code'],
                        peersWithLabels: ['upc', 'code'],
                        label: 'value',
                        value: { txt: 'test', upc: null, code: 322 }
                    }
                }]
            ]);
        });

        it('applies labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            })
                .nand('a', 'b');

            Helper.validate(schema, [[{ a: 1, b: 'b' }, false, {
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
            }]]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .nand('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: { d: 80 } }, true],
                [{ a: 'test', b: { c: 'test2' } }, false, {
                    message: '"a" must not exist simultaneously with [b.c]',
                    path: [],
                    type: 'object.nand',
                    context: {
                        main: 'a',
                        mainWithLabel: 'a',
                        peers: ['b.c'],
                        peersWithLabels: ['b.c'],
                        label: 'value',
                        value: { a: 'test', b: { c: 'test2' } }
                    }
                }]
            ]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.function().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .nand('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: Object.assign(() => { }, { d: 80 }) }, true, Helper.skip],
                [{ a: 'test', b: Object.assign(() => { }, { c: 'test2' }) }, false, '"a" must not exist simultaneously with [b.c]']
            ]);
        });

        it('applies labels with nested objects', () => {

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

    describe('optional()', () => {

        it('does not require optional numbers', () => {

            const config = {
                position: Joi.number(),
                suggestion: Joi.string()
            };

            Helper.validate(Joi.compile(config), [
                [{ suggestion: 'something' }, true],
                [{ position: 1 }, true]
            ]);
        });

        it('does not require optional objects', () => {

            const config = {
                position: Joi.number(),
                suggestion: Joi.object()
            };

            Helper.validate(Joi.compile(config), [
                [{ suggestion: {} }, true],
                [{ position: 1 }, true]
            ]);
        });
    });

    describe('or()', () => {

        it('validates or()', () => {

            const schema = Joi.object({
                txt: Joi.string(),
                upc: Joi.string().allow(null, ''),
                code: Joi.number()
            }).or('txt', 'upc', 'code');

            Helper.validate(schema, { abortEarly: false }, [[{}, false, {
                message: '"value" must contain at least one of [txt, upc, code]',
                details: [{
                    message: '"value" must contain at least one of [txt, upc, code]',
                    path: [],
                    type: 'object.missing',
                    context: {
                        peers: ['txt', 'upc', 'code'],
                        peersWithLabels: ['txt', 'upc', 'code'],
                        label: 'value',
                        value: {}
                    }
                }]
            }]]);

            Helper.validate(schema, [
                [{ upc: null }, true],
                [{ upc: 'test' }, true],
                [{ txt: null }, false, {
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }],
                [{ txt: 'test' }, true],
                [{ code: null }, false, {
                    message: '"code" must be a number',
                    path: ['code'],
                    type: 'number.base',
                    context: { label: 'code', key: 'code', value: null }
                }],
                [{ code: 123 }, true],
                [{ txt: 'test', upc: null }, true],
                [{ txt: 'test', upc: '' }, true],
                [{ txt: '', upc: 'test' }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: null, upc: 'test' }, false, {
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }],
                [{ txt: undefined, upc: 'test' }, true],
                [{ txt: 'test', upc: undefined }, true],
                [{ txt: 'test', upc: '' }, true],
                [{ txt: 'test', upc: null }, true],
                [{ txt: '', upc: undefined }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: '', upc: undefined, code: 999 }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: '', upc: undefined, code: undefined }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: '', upc: '' }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: 'test', upc: 'test' }, true],
                [{ txt: 'test', upc: 'test', code: 322 }, true]
            ]);
        });

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

        it('errors multiple levels deep', () => {

            const schema = Joi.object({
                a: {
                    b: Joi.object().or('x', 'y')
                }
            });

            Helper.validate(schema, [[{ a: { b: { c: 1 } } }, false, {
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
            }]]);
        });

        it('applies labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).or('a', 'b');
            Helper.validate(schema, [[{}, false, {
                message: '"value" must contain at least one of [first, second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b'],
                    peersWithLabels: ['first', 'second'],
                    label: 'value',
                    value: {}
                }
            }]]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string() }),
                d: Joi.number()
            }).or('a', 'b.c');

            const sampleObject = { b: { c: 'bc' } };
            const sampleObject2 = { d: 90 };

            Helper.validate(schema, [
                [sampleObject, true],
                [sampleObject2, false, {
                    message: '"value" must contain at least one of [a, b.c]',
                    path: [],
                    type: 'object.missing',
                    context: {
                        peers: ['a', 'b.c'],
                        peersWithLabels: ['a', 'b.c'],
                        label: 'value',
                        value: sampleObject2
                    }
                }]
            ]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.function().keys({ c: Joi.string() }),
                d: Joi.number()
            })
                .or('a', 'b.c');

            Helper.validate(schema, [
                [{ b: Object.assign(() => { }, { c: 'bc' }) }, true, Helper.skip],
                [{ d: 90 }, false, {
                    message: '"value" must contain at least one of [a, b.c]',
                    path: [],
                    type: 'object.missing',
                    context: {
                        peers: ['a', 'b.c'],
                        peersWithLabels: ['a', 'b.c'],
                        label: 'value',
                        value: { d: 90 }
                    }
                }]
            ]);
        });

        it('applies labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .or('a', 'b.c');

            Helper.validate(schema, [[{}, false, {
                message: '"value" must contain at least one of [first, b.second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['first', 'b.second'],
                    label: 'value',
                    value: {}
                }
            }]]);
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

            Helper.validate(schema, [[{}, true]]);
        });

        it('applies labels with too many peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            })
                .oxor('a', 'b');

            Helper.validate(schema, [[{ a: 1, b: 'b' }, false, {
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
            }]]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .oxor('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: { d: 80 } }, true],
                [{ a: 'test', b: { c: 'test2' } }, false, {
                    message: '"value" contains a conflict between optional exclusive peers [a, b.c]',
                    path: [],
                    type: 'object.oxor',
                    context: {
                        peers: ['a', 'b.c'],
                        peersWithLabels: ['a', 'b.c'],
                        present: ['a', 'b.c'],
                        presentWithLabels: ['a', 'b.c'],
                        label: 'value',
                        value: { a: 'test', b: { c: 'test2' } }
                    }
                }]
            ]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.function().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .oxor('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: Object.assign(() => { }, { d: 80 }) }, true, Helper.skip],
                [{ a: 'test', b: Object.assign(() => { }, { c: 'test2' }) }, false, '"value" contains a conflict between optional exclusive peers [a, b.c]']
            ]);
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
            }).to.throw('Invalid undefined schema (a.b.c.d)');

            expect(() => {

                Joi.object().pattern(/.*/, Symbol('x'));
            }).to.throw('Invalid schema content: symbol');

        });

        it('validates unknown keys using a regex pattern', () => {

            const schema = Joi.object({
                a: Joi.number()
            }).pattern(/\d+/, Joi.boolean()).pattern(/\w\w+/, 'x');

            Helper.validate(schema, { abortEarly: false }, [[{ bb: 'y', 5: 'x' }, false, {
                message: '"5" must be a boolean. "bb" must be [x]',
                details: [
                    {
                        message: '"5" must be a boolean',
                        path: ['5'],
                        type: 'boolean.base',
                        context: { label: '5', key: '5', value: 'x' }
                    },
                    {
                        message: '"bb" must be [x]',
                        path: ['bb'],
                        type: 'any.only',
                        context: { value: 'y', valids: ['x'], label: 'bb', key: 'bb' }
                    }
                ]
            }]]);

            Helper.validate(schema, [
                [{ a: 5 }, true],
                [{ a: 'x' }, false, {
                    message: '"a" must be a number',
                    path: ['a'],
                    type: 'number.base',
                    context: { label: 'a', key: 'a', value: 'x' }
                }],
                [{ b: 'x' }, false, {
                    message: '"b" is not allowed',
                    path: ['b'],
                    type: 'object.unknown',
                    context: { child: 'b', label: 'b', key: 'b', value: 'x' }
                }],
                [{ bb: 'x' }, true],
                [{ 5: 'x' }, false, {
                    message: '"5" must be a boolean',
                    path: ['5'],
                    type: 'boolean.base',
                    context: { label: '5', key: '5', value: 'x' }
                }],
                [{ 5: false }, true],
                [{ 5: undefined }, true]
            ]);
        });

        it('validates unknown keys using a schema pattern', () => {

            const schema = Joi.object({
                a: Joi.number()
            }).pattern(Joi.number().positive(), Joi.boolean())
                .pattern(Joi.string().length(2), 'x');

            Helper.validate(schema, { abortEarly: false }, [[{ bb: 'y', 5: 'x' }, false, {
                message: '"5" must be a boolean. "bb" must be [x]',
                details: [
                    {
                        message: '"5" must be a boolean',
                        path: ['5'],
                        type: 'boolean.base',
                        context: { label: '5', key: '5', value: 'x' }
                    },
                    {
                        message: '"bb" must be [x]',
                        path: ['bb'],
                        type: 'any.only',
                        context: { value: 'y', valids: ['x'], label: 'bb', key: 'bb' }
                    }
                ]
            }]]);

            Helper.validate(schema, [
                [{ a: 5 }, true],
                [{ a: 'x' }, false, {
                    message: '"a" must be a number',
                    path: ['a'],
                    type: 'number.base',
                    context: { label: 'a', key: 'a', value: 'x' }
                }],
                [{ b: 'x' }, false, {
                    message: '"b" is not allowed',
                    path: ['b'],
                    type: 'object.unknown',
                    context: { child: 'b', label: 'b', key: 'b', value: 'x' }
                }],
                [{ bb: 'x' }, true],
                [{ 5: 'x' }, false, {
                    message: '"5" must be a boolean',
                    path: ['5'],
                    type: 'boolean.base',
                    context: { label: '5', key: '5', value: 'x' }
                }],
                [{ 5: false }, true],
                [{ 5: undefined }, true]
            ]);
        });

        it('validates unknown keys using a schema pattern with a reference', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object().pattern(Joi.valid(Joi.ref('a')), Joi.boolean())
            });

            Helper.validate(schema, [
                [{ a: 'x' }, true],
                [{ a: 5 }, false, {
                    message: '"a" must be a string',
                    path: ['a'],
                    type: 'string.base',
                    context: { label: 'a', key: 'a', value: 5 }
                }],
                [{ b: 'x' }, false, {
                    message: '"b" must be of type object',
                    path: ['b'],
                    type: 'object.base',
                    context: { label: 'b', key: 'b', value: 'x', type: 'object' }
                }],
                [{ b: {} }, true],
                [{ b: { foo: true } }, false, {
                    message: '"b.foo" is not allowed',
                    path: ['b', 'foo'],
                    type: 'object.unknown',
                    context: { child: 'foo', value: true, key: 'foo', label: 'b.foo' }
                }],
                [{ a: 'x', b: { foo: true } }, false, {
                    message: '"b.foo" is not allowed',
                    path: ['b', 'foo'],
                    type: 'object.unknown',
                    context: { child: 'foo', value: true, key: 'foo', label: 'b.foo' }
                }],
                [{ a: 'x', b: { x: 'y' } }, false, {
                    message: '"b.x" must be a boolean',
                    path: ['b', 'x'],
                    type: 'boolean.base',
                    context: { value: 'y', key: 'x', label: 'b.x' }
                }]
            ]);
        });

        it('validates unknown keys using a pattern (nested)', () => {

            const schema = Joi.object({
                x: Joi.object({
                    a: Joi.number()
                }).pattern(/\d+/, Joi.boolean()).pattern(/\w\w+/, 'x')
            });

            Helper.validate(schema, { abortEarly: false }, [[{ x: { bb: 'y', 5: 'x' } }, false, {
                message: '"x.5" must be a boolean. "x.bb" must be [x]',
                details: [
                    {
                        message: '"x.5" must be a boolean',
                        path: ['x', '5'],
                        type: 'boolean.base',
                        context: { label: 'x.5', key: '5', value: 'x' }
                    },
                    {
                        message: '"x.bb" must be [x]',
                        path: ['x', 'bb'],
                        type: 'any.only',
                        context: { value: 'y', valids: ['x'], label: 'x.bb', key: 'bb' }
                    }
                ]
            }]]);
        });

        it('validates unknown keys using a pattern (nested)', () => {

            const schema = Joi.object({
                x: Joi.object({
                    a: Joi.number()
                }).pattern(Joi.number().positive(), Joi.boolean()).pattern(Joi.string().length(2), 'x')
            });

            Helper.validate(schema, { abortEarly: false }, [[{
                x: {
                    bb: 'y',
                    5: 'x'
                }
            }, false, {
                message: '"x.5" must be a boolean. "x.bb" must be [x]',
                details: [
                    {
                        message: '"x.5" must be a boolean',
                        path: ['x', '5'],
                        type: 'boolean.base',
                        context: { label: 'x.5', key: '5', value: 'x' }
                    },
                    {
                        message: '"x.bb" must be [x]',
                        path: ['x', 'bb'],
                        type: 'any.only',
                        context: { value: 'y', valids: ['x'], label: 'x.bb', key: 'bb' }
                    }
                ]
            }]]);
        });

        it('ensures keys are also present in another object', () => {

            const matches = Joi.in('....b');    // .match .matches .a .object
            const schema = Joi.object({
                a: Joi.object()
                    .pattern(/.*/, Joi.number(), { matches }),
                b: Joi.object()
                    .pattern(/.*/, Joi.string())
            });

            Helper.validate(schema, [
                [{ a: { x: 1 }, b: { x: 'a' } }, true],
                [{ a: { v: 1 }, b: { x: 'a', v: 'b' } }, true],
                [{ a: { x: 1 }, b: { y: 'a' } }, false, {
                    message: '"a" keys failed to match pattern requirements',
                    path: ['a'],
                    type: 'object.pattern.match',
                    context: {
                        details: [
                            {
                                message: '"a[0]" must be [ref:....b]',
                                path: ['a', 0],
                                type: 'any.only',
                                context: {
                                    key: 0,
                                    label: 'a[0]',
                                    valids: [matches],
                                    value: 'x'
                                }
                            }
                        ],
                        key: 'a',
                        label: 'a',
                        matches: ['x'],
                        message: '"a[0]" must be [ref:....b]',
                        value: { x: 1 }
                    }
                }]
            ]);
        });

        it('errors when using a pattern on empty schema with unknown(false) and regex pattern mismatch', () => {

            const schema = Joi.object().pattern(/\d/, Joi.number()).unknown(false);

            Helper.validate(schema, { abortEarly: false }, [[{ a: 5 }, false, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'object.unknown',
                    context: { child: 'a', label: 'a', key: 'a', value: 5 }
                }]
            }]]);
        });

        it('errors when using a pattern on empty schema with unknown(false) and schema pattern mismatch', () => {

            const schema = Joi.object().pattern(Joi.number().positive(), Joi.number()).unknown(false);

            Helper.validate(schema, { abortEarly: false }, [[{ a: 5 }, false, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'object.unknown',
                    context: { child: 'a', label: 'a', key: 'a', value: 5 }
                }]
            }]]);
        });

        it('reject global and sticky flags from patterns', () => {

            expect(() => Joi.object().pattern(/a/g, Joi.number())).to.throw('pattern should not use global or sticky mode');
            expect(() => Joi.object().pattern(/a/y, Joi.number())).to.throw('pattern should not use global or sticky mode');
        });

        it('allows using empty() on values', () => {

            const schema = Joi.object().pattern(/a/, Joi.any().empty(null));
            Helper.validate(schema, [[{ a1: undefined, a2: null, a3: 'test' }, true, { a1: undefined, a2: undefined, a3: 'test' }]]);
        });

        it('compiles if pattern is not regex or schema', () => {

            const schema = Joi.object().pattern('x', Joi.boolean());
            Helper.validate(schema, [
                [{ x: true }, true],
                [{ y: true }, false, '"y" is not allowed']
            ]);
        });

        it('allows using refs in .valid() schema pattern', () => {

            const schema = Joi.object().pattern(Joi.string().valid(Joi.in('$keys')), Joi.any());
            expect(schema.validate({ a: 'test' }, { context: { keys: ['a'] } })).to.equal({ value: { a: 'test' } });
        });

        it('enforces pattern matches rule', () => {

            const ref1 = Joi.ref('a');              // .matches ..object
            const ref2 = Joi.x('{a - 1}');

            const schema = Joi.object({
                a: Joi.number().required()
            })
                .pattern(/^x\d+$/, Joi.boolean(), { matches: Joi.array().length(ref1) })
                .pattern(/^z\w+$/, Joi.number())
                .pattern(/^x\w+$/, Joi.number(), { matches: Joi.array().max(ref2) });

            Helper.validate(schema, [
                [{ a: 1, x1: true }, true],
                [{ a: 2, x1: true, x2: true, xx: 1 }, true],
                [{ a: 3, x1: true, x2: true, x3: false, xx: 1 }, true],
                [{ a: 0, x1: true }, false, {
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
                }],
                [{ a: 1 }, false, '"value" keys failed to match pattern requirements']
            ]);

            const description = schema.describe();
            expect(description).to.equal({
                type: 'object',
                keys: {
                    a: {
                        type: 'number',
                        flags: {
                            presence: 'required'
                        }
                    }
                },
                patterns: [
                    {
                        rule: {
                            type: 'boolean'
                        },
                        regex: '/^x\\d+$/',
                        matches: {
                            type: 'array',
                            rules: [
                                {
                                    name: 'length',
                                    args: {
                                        limit: {
                                            ref: {
                                                path: ['a']
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        rule: {
                            type: 'number'
                        },
                        regex: '/^z\\w+$/'
                    },
                    {
                        rule: {
                            type: 'number'
                        },
                        regex: '/^x\\w+$/',
                        matches: {
                            type: 'array',
                            rules: [
                                {
                                    name: 'max',
                                    args: {
                                        limit: {
                                            template: '{a - 1}'
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            });
        });

        it('enforces pattern matches rule (abortEarly false)', () => {

            const schema = Joi.object({
                a: Joi.number().required()
            })
                .pattern(/^x\d+$/, Joi.boolean(), { matches: Joi.array().length(Joi.ref('a')) })
                .pattern(/^x\w+$/, Joi.number(), { matches: Joi.array().max(Joi.x('{a - 1}')) });

            const err = schema.validate({ a: 0, x1: true, xx: 1 }, { abortEarly: false }).error;
            expect(err).to.be.an.error('"value" keys failed to match pattern requirements');
            expect(err.details).to.have.length(2);
        });

        it('matches matching keys to grandparents', () => {

            const hasMatchingGrandparent = (value, { message, state }) => {

                // 0: [ 'b' ]
                // 1: { b: true }
                // 2: { match: { b: true } }
                // 3: { a: { match: { b: true } }, b: { match: { a: true } } }

                if (state.ancestors[3][value] === undefined) {
                    return message('{{#label}} does not have a matching grandparent');
                }

                return value;
            };

            const schema = Joi.object()
                .pattern(/.*/, Joi.object({
                    match: Joi.object()
                        .pattern(/.*/, Joi.boolean(), { matches: hasMatchingGrandparent })
                }));

            Helper.validate(schema, [
                [{ a: { match: { b: true } }, b: { match: { a: true } } }, true],
                [{ a: { match: { b: true } } }, false, {
                    message: '"a.match" keys failed to match pattern requirements',
                    path: ['a', 'match'],
                    type: 'object.pattern.match',
                    context: {
                        key: 'match',
                        label: 'a.match',
                        matches: ['b'],
                        message: '"a.match[0]" does not have a matching grandparent',
                        value: { b: true },
                        details: [
                            {
                                context: { key: 0, label: 'a.match[0]', value: 'b' },
                                message: '"a.match[0]" does not have a matching grandparent',
                                path: ['a', 'match', 0],
                                type: 'custom'
                            }
                        ]
                    }
                }]
            ]);
        });

        it('works with keys()', () => {

            const schema = Joi.object()
                .pattern(/a/, Joi.any())
                .keys({ b: Joi.any() });

            expect(schema.validate({ a: { b: 1 }, b: { c: 2 } }).error).to.not.exist();
        });

        it('supports overlapping patterns', () => {

            const schema = Joi.object()
                .pattern(/^x/, Joi.number().min(1), { fallthrough: true })
                .pattern(/^x/, Joi.number().max(10));

            Helper.validate(schema, [
                [{ x1: 1, x2: 2 }, true],
                [{ x1: 11 }, false, {
                    message: '"x1" must be less than or equal to 10',
                    path: ['x1'],
                    type: 'number.max',
                    context: { limit: 10, value: 11, label: 'x1', key: 'x1' }
                }]
            ]);
        });

        it('ignores overlapping patterns', () => {

            const schema = Joi.object()
                .pattern(/^x/, Joi.number().min(1))
                .pattern(/^x/, Joi.number().max(10));

            Helper.validate(schema, [
                [{ x1: 1, x2: 2 }, true],
                [{ x1: 11 }, true]
            ]);
        });
    });

    describe('ref()', () => {

        it('validates references', () => {

            const schema = Joi.object().ref();

            Helper.validate(schema, [
                [{}, false, {
                    message: '"value" must be a Joi reference',
                    path: [],
                    type: 'object.refType',
                    context: { label: 'value', value: {} }
                }],
                [Joi.ref('a.b'), true]
            ]);
        });
    });

    describe('regex()', () => {

        it('validates regular expressions', () => {

            const schema = Joi.object().regex();

            Helper.validate(schema, [
                [{}, false, {
                    message: '"value" must be a RegExp object',
                    path: [],
                    type: 'object.regex',
                    context: { label: 'value', value: {} }
                }],
                [/a/, true]
            ]);
        });
    });

    describe('rename()', () => {

        it('allows renaming multiple times with multiple enabled', () => {

            const schema = Joi.object({
                test: Joi.string()
            }).rename('test1', 'test').rename('test2', 'test', { multiple: true });

            expect(Joi.compile(schema).validate({ test1: 'a', test2: 'b' }).error).to.not.exist();
        });

        it('errors renaming multiple times with multiple disabled', () => {

            const schema = Joi.object({
                test: Joi.string()
            }).rename('test1', 'test').rename('test2', 'test');

            Helper.validate(Joi.compile(schema), [[{ test1: 'a', test2: 'b' }, false, {
                message: '"value" cannot rename "test2" because multiple renames are disabled and another key was already renamed to "test"',
                path: [],
                type: 'object.rename.multiple',
                context: { from: 'test2', to: 'test', label: 'value', pattern: false, value: { test: 'a', test2: 'b' } }
            }]]);
        });

        it('errors multiple times when abortEarly is false', () => {

            const schema = Joi.object()
                .rename('a', 'b')
                .rename('c', 'b')
                .rename('d', 'b')
                .prefs({ abortEarly: false });

            Helper.validate(schema, [[{ a: 1, c: 1, d: 1 }, false, {
                message: '"value" cannot rename "c" because multiple renames are disabled and another key was already renamed to "b". "value" cannot rename "d" because multiple renames are disabled and another key was already renamed to "b"',
                details: [
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
                ]
            }]]);
        });

        it('aliases a key', () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.number()
            }).rename('a', 'b', { alias: true });

            const obj = { a: 10 };
            Helper.validate(Joi.compile(schema), [[obj, true, { a: 10, b: 10 }]]);
        });

        it('with override disabled should not allow overwriting existing value', () => {

            const schema = Joi.object({
                test1: Joi.string()
            }).rename('test', 'test1');

            Helper.validate(schema, [[{ test: 'b', test1: 'a' }, false, {
                message: '"value" cannot rename "test" because override is disabled and target "test1" exists',
                path: [],
                type: 'object.rename.override',
                context: { from: 'test', to: 'test1', label: 'value', pattern: false, value: { test: 'b', test1: 'a' } }
            }]]);
        });

        it('with override enabled should allow overwriting existing value', () => {

            const schema = Joi.object({
                test1: Joi.string()
            }).rename('test', 'test1', { override: true });

            Helper.validate(schema, [
                [{ test: 'b', test1: 'a' }, true, { test1: 'b' }]
            ]);
        });

        it('renames when data is nested in an array via items', () => {

            const schema = {
                arr: Joi.array().items(Joi.object({
                    one: Joi.string(),
                    two: Joi.string()
                }).rename('uno', 'one').rename('dos', 'two'))
            };

            const data = { arr: [{ uno: '1', dos: '2' }] };
            Helper.validate(Joi.object(schema), [[data, true, { arr: [{ one: '1', two: '2' }] }]]);
        });

        it('applies rename and validation in the correct order regardless of key order', () => {

            const schema1 = Joi.object({
                a: Joi.number()
            }).rename('b', 'a');

            const input1 = { b: '5' };
            Helper.validate(schema1, [[input1, true, { a: 5 }]]);

            const schema2 = Joi.object({ a: Joi.number(), b: Joi.any() }).rename('b', 'a');
            const input2 = { b: '5' };
            Helper.validate(schema2, [[input2, true, { a: 5 }]]);
        });

        it('sets the default value after key is renamed', () => {

            const schema = Joi.object({
                foo2: Joi.string().default('test')
            }).rename('foo', 'foo2');

            const input = {};
            Helper.validate(schema, [[input, true, { foo2: 'test' }]]);
        });

        it('renames keys that are empty strings', () => {

            const schema = Joi.object().rename('', 'notEmpty');
            const input = {
                '': 'something'
            };

            Helper.validate(schema, [[input, true, { notEmpty: 'something' }]]);
        });

        it('should not create new keys when the key in question does not exist', () => {

            const schema = Joi.object()
                .rename('b', '_b');

            const input = {
                a: 'something'
            };

            Helper.validate(schema, [[input, true, input]]);
        });

        it('ignores a key with ignoredUndefined if from does not exist', () => {

            const schema = Joi.object().rename('b', 'a', { ignoreUndefined: true });

            const input = {
                a: 'something'
            };

            Helper.validate(schema, [[input, true, { a: 'something' }]]);
        });

        it('deletes a key with override and ignoredUndefined if from exists', () => {

            const schema = Joi.object()
                .rename('b', 'a', { ignoreUndefined: true, override: true });

            const input = {
                a: 'something',
                b: 'something else'
            };

            Helper.validate(schema, [[input, true, { a: 'something else' }]]);
        });

        it('deletes a key with override if present and undefined', () => {

            const schema = Joi.object()
                .rename('b', 'a', { override: true });

            const input = {
                a: 'something',
                b: undefined
            };

            Helper.validate(schema, [[input, true, {}]]);
        });

        it('leaves target if source is present and undefined and ignoreUndefined is set', () => {

            const schema = Joi.object()
                .rename('b', 'a', { override: true, ignoreUndefined: true });

            const input = {
                a: 'something',
                b: undefined
            };

            Helper.validate(schema, [[input, true, input]]);
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

        it('should leave key if from does not exist regardless of override', () => {

            const schema = Joi.object()
                .rename('b', 'a', { override: true });

            const input = {
                a: 'something'
            };

            Helper.validate(schema, [[input, true, input]]);
        });

        describe('using regex', () => {

            it('renames using a regular expression', () => {

                const regex = /foobar/i;

                const schema = Joi.object({
                    fooBar: Joi.string()
                }).rename(regex, 'fooBar');

                Helper.validate(Joi.compile(schema), [[{ FOOBAR: 'a' }, true, { fooBar: 'a' }]]);
            });

            it('aliases a key', () => {

                const regex = /^a$/i;

                const schema = Joi.object({
                    other: Joi.any(),
                    A: Joi.number(),
                    b: Joi.number(),
                    c: Joi.number()
                }).rename(regex, 'b', { alias: true });

                Helper.validate(Joi.compile(schema), [[{ other: 'here', A: 100, c: 50 }, true, { other: 'here', A: 100, b: 100, c: 50 }]]);
            });

            it('uses template', () => {

                const schema = Joi.object()
                    .rename(/^(\d+)$/, Joi.x('x{#1}x'))
                    .pattern(/^x\d+x$/, Joi.any());

                const input = {
                    123: 'x',
                    1: 'y',
                    0: 'z',
                    x4x: 'test'
                };

                Helper.validate(Joi.compile(schema), [[input, true, {
                    x123x: 'x',
                    x1x: 'y',
                    x0x: 'z',
                    x4x: 'test'
                }]]);

                expect(schema.describe()).to.equal({
                    type: 'object',
                    patterns: [{
                        regex: '/^x\\d+x$/',
                        rule: { type: 'any' }
                    }],
                    renames: [{
                        from: { regex: '/^(\\d+)$/' },
                        to: {
                            template: 'x{#1}x'
                        },
                        options: {
                            alias: false,
                            multiple: false,
                            override: false
                        }
                    }]
                });
            });

            it('uses template with prefix override', () => {

                const schema = Joi.object()
                    .rename(/^(\d+)$/, Joi.x('x{@1}x', { prefix: { local: '@' } }))
                    .pattern(/^x\d+x$/, Joi.any());

                const input = {
                    123: 'x',
                    1: 'y',
                    0: 'z',
                    x4x: 'test'
                };

                Helper.validate(Joi.compile(schema), [[input, true, {
                    x123x: 'x',
                    x1x: 'y',
                    x0x: 'z',
                    x4x: 'test'
                }]]);

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

            it('uses template that references another sibling key', () => {

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

                Helper.validate(Joi.compile(schema), [[input, true, {
                    TEST123: 'x',
                    TEST1: 'y',
                    TEST0: 'z',
                    prefix: 'test'
                }]]);
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
                    [{ a: { 5: 'x' }, b: { prefix: 'p' } }, true, { a: { p5: 'x' }, b: { prefix: 'p' } }],
                    [{ a: { 5: 'x' }, b: { prefix: 'P' } }, true, { a: { p5: 'x' }, b: { prefix: 'p' } }],
                    [{ b: { prefix: 'P' }, a: { 5: 'x' } }, true, { a: { p5: 'x' }, b: { prefix: 'p' } }],
                    [{ b: {}, a: { 5: 'x' } }, true, { a: { 5: 'x' }, b: {} }],
                    [{ a: { 5: 'x' } }, true, { a: { 5: 'x' } }]
                ]);
            });

            it('uses template without refs', () => {

                const schema = Joi.object()
                    .rename(/^(\d+)$/, Joi.x('x'))
                    .unknown();

                Helper.validate(Joi.compile(schema), [[{ 1: 'x' }, true, { x: 'x' }]]);
            });

            it('deletes a key with override if present and undefined', () => {

                const schema = Joi.object()
                    .rename(/b/, 'a', { override: true });

                const input = {
                    a: 'something',
                    b: undefined
                };

                Helper.validate(schema, [[input, true, {}]]);
            });

            it('with override disabled it should not allow overwriting existing value', () => {

                const schema = Joi.object({
                    test1: Joi.string()
                })
                    .rename(/^test1$/i, 'test');

                const item = {
                    test: 'b',
                    test1: 'a'
                };

                Helper.validate(Joi.compile(schema), [[item, false, {
                    message: '"value" cannot rename "test1" because override is disabled and target "test" exists',
                    path: [],
                    type: 'object.rename.override',
                    context: { from: 'test1', to: 'test', label: 'value', pattern: true, value: item }
                }]]);
            });

            it('with override enabled should allow overwriting existing value', () => {

                const regex = /^test$/i;

                const schema = Joi.object({
                    test1: Joi.string()
                }).rename(regex, 'test1', { override: true });

                Helper.validate(schema, [[{ test: 'b', test1: 'a' }, true, { test1: 'b' }]]);
            });

            it('renames when data is nested in an array via items', () => {

                const regex1 = /^uno$/i;
                const regex2 = /^dos$/i;

                const schema = {
                    arr: Joi.array().items(Joi.object({
                        one: Joi.string(),
                        two: Joi.string()
                    }).rename(regex1, 'one').rename(regex2, 'two'))
                };

                const data = { arr: [{ uno: '1', dos: '2' }] };
                Helper.validate(Joi.object(schema), [[data, true, { arr: [{ one: '1', two: '2' }] }]]);
            });

            it('skips when existing name matches', () => {

                const regex = /^abc$/i;

                const schema = Joi.object({ abc: Joi.string() }).rename(regex, 'abc', { override: true });

                Helper.validate(schema, [
                    [{ ABC: 'x' }, true, { abc: 'x' }],
                    [{ abc: 'x' }, true, { abc: 'x' }]
                ]);
            });

            it('applies rename and validation in the correct order regardless of key order', () => {

                const regex = /^b$/i;

                const schema1 = Joi.object({
                    a: Joi.number()
                }).rename(regex, 'a');

                const input1 = { b: '5' };
                Helper.validate(schema1, [[input1, true, { a: 5 }]]);

                const schema2 = Joi.object({ a: Joi.number(), b: Joi.any() }).rename('b', 'a');
                const input2 = { b: '5' };
                Helper.validate(schema2, [[input2, true, { a: 5 }]]);
            });

            it('sets the default value after key is renamed', () => {

                const regex = /^foo$/i;

                const schema = Joi.object({
                    foo2: Joi.string().default('test')
                }).rename(regex, 'foo2');

                const input = {};
                Helper.validate(schema, [[input, true, { foo2: 'test' }]]);
            });

            it('should not create new keys when the key in question does not exist', () => {

                const schema = Joi.object()
                    .rename(/^b$/i, '_b');

                const input = {
                    a: 'something'
                };

                Helper.validate(schema, [[input, true, { a: 'something' }]]);
            });

            it('should leave key if from does not exist regardless of override', () => {

                const schema = Joi.object()
                    .rename(/^b$/i, 'a', { override: true });

                const input = {
                    a: 'something'
                };

                Helper.validate(schema, [[input, true, input]]);
            });

            it('skips when all matches are undefined and ignoredUndefined is true', () => {

                const schema = Joi.object().keys({
                    a: Joi.any(),
                    b: Joi.any()
                })
                    .rename(/^b$/i, 'a', { ignoreUndefined: true });

                const input = {
                    b: undefined
                };

                Helper.validate(schema, [[input, true, { b: undefined }]]);
            });

            it('deletes a key with override and ignoredUndefined if from exists', () => {

                const schema = Joi.object().keys({
                    c: Joi.any(),
                    a: Joi.any()
                })
                    .rename(/^b$/, 'a', { ignoreUndefined: true, override: true });

                const input = {
                    a: 'something',
                    b: 'something else'
                };

                Helper.validate(schema, [[input, true, { a: 'something else' }]]);
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

            it('allows renaming multiple times with multiple enabled', () => {

                const schema = Joi.object({
                    fooBar: Joi.string()
                }).rename(/foobar/i, 'fooBar', { multiple: true });

                Helper.validate(Joi.compile(schema), [[{ FOOBAR: 'a', FooBar: 'b' }, true, { fooBar: 'b' }]]);
            });

            it('errors renaming multiple times with multiple disabled', () => {

                const schema = Joi.object({
                    fooBar: Joi.string()
                })
                    .rename(/foobar/i, 'fooBar')
                    .rename(/foobar/i, 'fooBar');

                Helper.validate(Joi.compile(schema), [[{ FOOBAR: 'a', FooBar: 'b' }, false, {
                    message: '"value" cannot rename "FooBar" because multiple renames are disabled and another key was already renamed to "fooBar"',
                    path: [],
                    type: 'object.rename.multiple',
                    context: { from: 'FooBar', to: 'fooBar', label: 'value', pattern: true, value: { FooBar: 'b', fooBar: 'a' } }
                }]]);
            });

            it('errors multiple times when abortEarly is false', () => {

                const schema = Joi.object({
                    z: Joi.string()
                })
                    .rename(/a/i, 'b')
                    .rename(/c/i, 'b')
                    .rename(/z/i, 'z')
                    .prefs({ abortEarly: false });

                Helper.validate(schema, [[{ a: 1, c: 1, d: 1, z: 1 }, false, {
                    message: '"value" cannot rename "c" because multiple renames are disabled and another key was already renamed to "b". "z" must be a string. "d" is not allowed. "b" is not allowed',
                    details: [
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
                            type: 'object.unknown',
                            context: { child: 'd', key: 'd', label: 'd', value: 1 }
                        },
                        {
                            message: '"b" is not allowed',
                            path: ['b'],
                            type: 'object.unknown',
                            context: { child: 'b', key: 'b', label: 'b', value: 1 }
                        }
                    ]
                }]]);
            });
        });
    });

    describe('schema()', () => {

        it('should detect joi instances', () => {

            const schema = Joi.object().schema();
            Helper.validate(schema, [
                [{}, false, {
                    message: '"value" must be a Joi schema of any type',
                    path: [],
                    type: 'object.schema',
                    context: { label: 'value', type: 'any', value: {} }
                }],
                [{ isJoi: true }, false, {
                    message: '"value" must be a Joi schema of any type',
                    path: [],
                    type: 'object.schema',
                    context: { label: 'value', type: 'any', value: { isJoi: true } }
                }],
                [Joi.number().max(2), true]
            ]);
        });

        it('validated schema type', () => {

            const schema = Joi.object().schema('number');
            Helper.validate(schema, [
                [Joi.number().max(2), true],
                [{}, false, {
                    message: '"value" must be a Joi schema of number type',
                    path: [],
                    type: 'object.schema',
                    context: { label: 'value', type: 'number', value: {} }
                }],
                [{ isJoi: true }, false, {
                    message: '"value" must be a Joi schema of number type',
                    path: [],
                    type: 'object.schema',
                    context: { label: 'value', type: 'number', value: { isJoi: true } }
                }],
                [Joi.string(), false, {
                    message: '"value" must be a Joi schema of number type',
                    path: [],
                    type: 'object.schema',
                    context: { label: 'value', type: 'number', value: Joi.string() }
                }]
            ]);
        });
    });

    describe('tailor()', () => {

        it('customizes schema', () => {

            const alterations = {
                x: (s) => s.min(10),
                y: (s) => s.max(50),
                z: (s) => s.integer()
            };

            const before = Joi.object({
                a: {
                    b: Joi.number().alter(alterations)
                },
                b: Joi.object()
                    .pattern(/.*/, Joi.number().alter(alterations)),
                c: Joi.object({
                    x: Joi.number(),
                    y: Joi.number()
                })
                    .assert('.c.x', Joi.number().alter(alterations))
            });

            const bd = before.describe();

            const first = before.tailor('x');

            const c = Joi.object({
                x: Joi.number(),
                y: Joi.number()
            })
                .assert('.c.x', Joi.number().min(10).alter(alterations));

            const after1 = Joi.object({
                a: {
                    b: Joi.number().min(10).alter(alterations)
                },
                b: Joi.object()
                    .pattern(/.*/, Joi.number().min(10).alter(alterations)),
                c
            });

            expect(first.describe()).to.equal(after1.describe());
            expect(before.describe()).to.equal(bd);
        });

        it('customizes schema on object and keys', () => {

            const alterations = {
                x: (s) => s.min(10),
                y: (s) => s.max(50),
                z: (s) => s.integer()
            };

            const before = Joi.object({
                a: {
                    b: Joi.number().alter(alterations)
                },
                b: Joi.object()
                    .pattern(/.*/, Joi.number().alter(alterations)),
                c: Joi.object({
                    x: Joi.number(),
                    y: Joi.number()
                })
                    .assert('.c.x', Joi.number().alter(alterations))
                    .alter(alterations)
            });

            const bd = before.describe();

            const first = before.tailor('x');

            const after1 = Joi.object({
                a: {
                    b: Joi.number().min(10).alter(alterations)
                },
                b: Joi.object()
                    .pattern(/.*/, Joi.number().min(10).alter(alterations)),
                c: Joi.object({
                    x: Joi.number(),
                    y: Joi.number()
                })
                    .alter(alterations)
                    .assert('.c.x', Joi.number().min(10).alter(alterations))
                    .min(10)
            });

            expect(first.describe()).to.equal(after1.describe());
            Helper.equal(first, after1);
            expect(before.describe()).to.equal(bd);
        });
    });

    describe('unknown()', () => {

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.object().unknown();
            expect(schema.unknown()).to.shallow.equal(schema);
        });

        it('allows local unknown without applying to keys', () => {

            const schema = Joi.object({
                a: {
                    b: Joi.number()
                }
            }).unknown();

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true],
                [{ a: { b: 'x' } }, false, {
                    message: '"a.b" must be a number',
                    path: ['a', 'b'],
                    type: 'number.base',
                    context: { label: 'a.b', key: 'b', value: 'x' }
                }],
                [{ a: { b: 5 }, c: 'ignore' }, true],
                [{ a: { b: 5, c: 'ignore' } }, false, {
                    message: '"a.c" is not allowed',
                    path: ['a', 'c'],
                    type: 'object.unknown',
                    context: { child: 'c', label: 'a.c', key: 'c', value: 'ignore' }
                }]
            ]);
        });

        it('forbids local unknown without applying to keys', () => {

            const schema = Joi.object({
                a: Joi.object({
                    b: Joi.number()
                }).unknown()
            }).prefs({ allowUnknown: false });

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true],
                [{ a: { b: 'x' } }, false, {
                    message: '"a.b" must be a number',
                    path: ['a', 'b'],
                    type: 'number.base',
                    context: { label: 'a.b', key: 'b', value: 'x' }
                }],
                [{ a: { b: 5 }, c: 'ignore' }, false, {
                    message: '"c" is not allowed',
                    path: ['c'],
                    type: 'object.unknown',
                    context: { child: 'c', label: 'c', key: 'c', value: 'ignore' }
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
                [{ a: { b: 5 } }, true, { a: { b: 5 } }],
                [{ a: { b: 'x' } }, false, {
                    message: '"a.b" must be a number',
                    path: ['a', 'b'],
                    type: 'number.base',
                    context: { label: 'a.b', key: 'b', value: 'x' }
                }],
                [{ a: { b: 5 }, d: 'ignore' }, true, { a: { b: 5 } }],
                [{ a: { b: 5, d: 'ignore' } }, true, { a: { b: 5, d: 'ignore' } }],
                [{ a: { b: 5, c: { e: 'ignore' } } }, true, { a: { b: 5, c: {} } }]
            ]);
        });
    });

    describe('with()', () => {

        it('validated with', () => {

            const schema = Joi.object({
                txt: Joi.string(),
                upc: Joi.string()
            }).with('txt', 'upc');

            Helper.validate(schema, { abortEarly: false }, [[{ txt: 'a' }, false, {
                message: '"txt" missing required peer "upc"',
                details: [{
                    message: '"txt" missing required peer "upc"',
                    path: [],
                    type: 'object.with',
                    context: {
                        main: 'txt',
                        mainWithLabel: 'txt',
                        peer: 'upc',
                        peerWithLabel: 'upc',
                        label: 'value',
                        value: { txt: 'a' }
                    }
                }]
            }]]);

            Helper.validate(schema, [
                [{ upc: 'test' }, true],
                [{ txt: 'test' }, false, {
                    message: '"txt" missing required peer "upc"',
                    path: [],
                    type: 'object.with',
                    context: {
                        main: 'txt',
                        mainWithLabel: 'txt',
                        peer: 'upc',
                        peerWithLabel: 'upc',
                        label: 'value',
                        value: { txt: 'test' }
                    }
                }],
                [{ txt: 'test', upc: null }, false, {
                    message: '"upc" must be a string',
                    path: ['upc'],
                    type: 'string.base',
                    context: { value: null, label: 'upc', key: 'upc' }
                }],
                [{ txt: 'test', upc: '' }, false, {
                    message: '"upc" is not allowed to be empty',
                    path: ['upc'],
                    type: 'string.empty',
                    context: { value: '', label: 'upc', key: 'upc' }
                }],
                [{ txt: 'test', upc: undefined }, false, {
                    message: '"txt" missing required peer "upc"',
                    path: [],
                    type: 'object.with',
                    context: {
                        main: 'txt',
                        mainWithLabel: 'txt',
                        peer: 'upc',
                        peerWithLabel: 'upc',
                        label: 'value',
                        value: { txt: 'test', upc: undefined }
                    }
                }],
                [{ txt: 'test', upc: 'test' }, true]
            ]);
        });

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

        it('validates when key is an empty string', () => {

            const schema = Joi.object().with('', 'b');
            Helper.validate(schema, [
                [{ c: 'hi', d: 'there' }, true]
            ]);
        });

        it('applies labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).with('a', ['b']);
            Helper.validate(schema, [[{ a: 1 }, false, {
                message: '"first" missing required peer "second"',
                path: [],
                type: 'object.with',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b',
                    peerWithLabel: 'second',
                    label: 'value',
                    value: { a: 1 }
                }
            }]]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).with('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: { c: 'test2' } }, true],
                [{ a: 'test', b: { d: 80 } }, false, {
                    message: '"a" missing required peer "b.c"',
                    path: [],
                    type: 'object.with',
                    context: {
                        main: 'a',
                        mainWithLabel: 'a',
                        peer: 'b.c',
                        peerWithLabel: 'b.c',
                        label: 'value',
                        value: { a: 'test', b: { d: 80 } }
                    }
                }]
            ]);

            const schema2 = Joi.object({
                a: Joi.object({ b: Joi.string() }),
                b: Joi.object({ c: Joi.string() })
            }).with('a.b', 'b.c');

            Helper.validate(schema2, [
                [{ a: { b: 'test' }, b: { c: 'test2' } }, true],
                [{ a: { b: 'test' }, b: {} }, false, {
                    message: '"a.b" missing required peer "b.c"',
                    path: [],
                    type: 'object.with',
                    context: {
                        main: 'a.b',
                        mainWithLabel: 'a.b',
                        peer: 'b.c',
                        peerWithLabel: 'b.c',
                        label: 'value',
                        value: { a: { b: 'test' }, b: {} }
                    }
                }]
            ]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.function().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .with('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: Object.assign(() => { }, { c: 'test2' }) }, true, Helper.skip],
                [{ a: 'test', b: Object.assign(() => { }, { d: 80 }) }, false, '"a" missing required peer "b.c"']
            ]);
        });

        it('applies labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .with('a', ['b.c']);

            Helper.validate(schema, [[{ a: 1, b: { d: 2 } }, false, {
                message: '"first" missing required peer "b.second"',
                path: [],
                type: 'object.with',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b.c',
                    peerWithLabel: 'b.second',
                    label: 'value',
                    value: { a: 1, b: { d: 2 } }
                }
            }]]);

            const schema2 = Joi.object({
                a: Joi.object({
                    b: Joi.string().label('first')
                }),
                b: Joi.object({
                    c: Joi.string().label('second')
                })
            })
                .with('a.b', ['b.c']);

            Helper.validate(schema2, [[{ a: { b: 'test' }, b: {} }, false, {
                message: '"a.first" missing required peer "b.second"',
                path: [],
                type: 'object.with',
                context: {
                    main: 'a.b',
                    mainWithLabel: 'a.first',
                    peer: 'b.c',
                    peerWithLabel: 'b.second',
                    label: 'value',
                    value: { a: { b: 'test' }, b: {} }
                }
            }]]);
        });

        it('handles period in key names', () => {

            const schema = Joi.object({
                'x.from': Joi.string().lowercase().email(),
                'x.url': Joi.string().uri({ scheme: ['https'] })
            })
                .with('x.from', 'x.url', { separator: false });

            const test = { 'x.url': 'https://example.com', 'x.from': 'test@example.com' };
            Helper.validate(schema, [[test, true, test]]);
        });
    });

    describe('without()', () => {

        it('validated without', () => {

            const schema = Joi.object({
                txt: Joi.string(),
                upc: Joi.string()
            }).without('txt', 'upc');

            Helper.validate(schema, { abortEarly: false }, [[{ txt: 'a', upc: 'b' }, false, {
                message: '"txt" conflict with forbidden peer "upc"',
                details: [{
                    message: '"txt" conflict with forbidden peer "upc"',
                    path: [],
                    type: 'object.without',
                    context: {
                        main: 'txt',
                        mainWithLabel: 'txt',
                        peer: 'upc',
                        peerWithLabel: 'upc',
                        label: 'value',
                        value: { txt: 'a', upc: 'b' }
                    }
                }]
            }]]);

            Helper.validate(schema, [
                [{ upc: 'test' }, true],
                [{ txt: 'test' }, true],
                [{ txt: 'test', upc: null }, false, {
                    message: '"upc" must be a string',
                    path: ['upc'],
                    type: 'string.base',
                    context: { value: null, label: 'upc', key: 'upc' }
                }],
                [{ txt: 'test', upc: '' }, false, {
                    message: '"upc" is not allowed to be empty',
                    path: ['upc'],
                    type: 'string.empty',
                    context: { value: '', label: 'upc', key: 'upc' }
                }],
                [{ txt: 'test', upc: undefined }, true],
                [{ txt: 'test', upc: 'test' }, false, {
                    message: '"txt" conflict with forbidden peer "upc"',
                    path: [],
                    type: 'object.without',
                    context: {
                        main: 'txt',
                        mainWithLabel: 'txt',
                        peer: 'upc',
                        peerWithLabel: 'upc',
                        label: 'value',
                        value: { txt: 'test', upc: 'test' }
                    }
                }]
            ]);
        });

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

        it('validates when key is an empty string', () => {

            const schema = Joi.object().without('', 'b');
            Helper.validate(schema, [
                [{ a: 'hi', b: 'there' }, true]
            ]);
        });

        it('validates when key is stripped', () => {

            const schema = Joi.object({
                a: Joi.any().strip(),
                b: Joi.any()
            }).without('a', 'b');

            Helper.validate(schema, [
                [{ a: 'hi', b: 'there' }, true, { b: 'there' }]
            ]);
        });

        it('applies labels', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).without('a', ['b']);
            Helper.validate(schema, [[{ a: 1, b: 'b' }, false, {
                message: '"first" conflict with forbidden peer "second"',
                path: [],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b',
                    peerWithLabel: 'second',
                    label: 'value',
                    value: { a: 1, b: 'b' }
                }
            }]]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            }).without('a', ['b.c', 'b.d']);

            const sampleObject = { a: 'test', d: 9000 };
            const sampleObject2 = { a: 'test', b: { d: 80 } };

            Helper.validate(schema, [
                [sampleObject, true],
                [sampleObject2, false, {
                    message: '"a" conflict with forbidden peer "b.d"',
                    path: [],
                    type: 'object.without',
                    context: {
                        main: 'a',
                        mainWithLabel: 'a',
                        peer: 'b.d',
                        peerWithLabel: 'b.d',
                        label: 'value',
                        value: sampleObject2
                    }
                }]
            ]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.function().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .without('a', ['b.c', 'b.d']);

            const sampleObject = { a: 'test', d: 9000 };
            const sampleObject2 = { a: 'test', b: Object.assign(() => { }, { d: 80 }) };

            Helper.validate(schema, [[sampleObject, true]]);

            const error2 = schema.validate(sampleObject2).error;
            expect(error2).to.be.an.error('"a" conflict with forbidden peer "b.d"');
            expect(error2.details).to.equal([{
                message: '"a" conflict with forbidden peer "b.d"',
                path: [],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'a',
                    peer: 'b.d',
                    peerWithLabel: 'b.d',
                    label: 'value',
                    value: error2.details[0].context.value
                }
            }]);
        });

        it('applies labels with nested objects', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .without('a', ['b.c']);

            Helper.validate(schema, [[{ a: 1, b: { c: 'c' } }, false, {
                message: '"first" conflict with forbidden peer "b.second"',
                path: [],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b.c',
                    peerWithLabel: 'b.second',
                    label: 'value',
                    value: { a: 1, b: { c: 'c' } }
                }
            }]]);
        });

        it('validates keys with prefix characters', () => {

            const schema = Joi.object({
                $a: Joi.number(),
                '#b': Joi.number(),
                '/c': Joi.number()
            })
                .without('$a', ['#b', '/c']);

            Helper.validate(schema, [
                [{ $a: 1 }, true],
                [{ '#b': 1 }, true],
                [{ '/c': 1 }, true],
                [{ $a: 1, '/c': 1 }, false, '"$a" conflict with forbidden peer "/c"']
            ]);
        });
    });

    describe('xor()', () => {

        it('validates xor', () => {

            const schema = Joi.object({
                txt: Joi.string(),
                upc: Joi.string()
            }).xor('txt', 'upc');

            Helper.validate(schema, { abortEarly: false }, [[{}, false, {
                message: '"value" must contain at least one of [txt, upc]',
                details: [{
                    message: '"value" must contain at least one of [txt, upc]',
                    path: [],
                    type: 'object.missing',
                    context: {
                        peers: ['txt', 'upc'],
                        peersWithLabels: ['txt', 'upc'],
                        label: 'value',
                        value: {}
                    }
                }]
            }]]);

            Helper.validate(schema, [
                [{ upc: null }, false, {
                    message: '"upc" must be a string',
                    path: ['upc'],
                    type: 'string.base',
                    context: { value: null, label: 'upc', key: 'upc' }
                }],
                [{ upc: 'test' }, true],
                [{ txt: null }, false, {
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }],
                [{ txt: 'test' }, true],
                [{ txt: 'test', upc: null }, false, {
                    message: '"upc" must be a string',
                    path: ['upc'],
                    type: 'string.base',
                    context: { value: null, label: 'upc', key: 'upc' }
                }],
                [{ txt: 'test', upc: '' }, false, {
                    message: '"upc" is not allowed to be empty',
                    path: ['upc'],
                    type: 'string.empty',
                    context: { value: '', label: 'upc', key: 'upc' }
                }],
                [{ txt: '', upc: 'test' }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: null, upc: 'test' }, false, {
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }],
                [{ txt: undefined, upc: 'test' }, true],
                [{ txt: 'test', upc: undefined }, true],
                [{ txt: '', upc: undefined }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: '', upc: '' }, false, {
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }],
                [{ txt: 'test', upc: 'test' }, false, {
                    message: '"value" contains a conflict between exclusive peers [txt, upc]',
                    path: [],
                    type: 'object.xor',
                    context: {
                        peers: ['txt', 'upc'],
                        peersWithLabels: ['txt', 'upc'],
                        present: ['txt', 'upc'],
                        presentWithLabels: ['txt', 'upc'],
                        label: 'value',
                        value: { txt: 'test', upc: 'test' }
                    }
                }]
            ]);
        });

        it('validates multiple peers xor', () => {

            const schema = Joi.object({
                txt: Joi.string(),
                upc: Joi.string(),
                code: Joi.string()
            }).xor('txt', 'upc', 'code');

            Helper.validate(schema, [
                [{ upc: 'test' }, true],
                [{ txt: 'test' }, true],
                [{}, false, {
                    message: '"value" must contain at least one of [txt, upc, code]',
                    path: [],
                    type: 'object.missing',
                    context: {
                        peers: ['txt', 'upc', 'code'],
                        peersWithLabels: ['txt', 'upc', 'code'],
                        label: 'value',
                        value: {}
                    }
                }]
            ]);
        });

        it('validates xor with number types', () => {

            const schema = Joi.object({
                code: Joi.number(),
                upc: Joi.number()
            }).xor('code', 'upc');

            Helper.validate(schema, [
                [{ upc: 123 }, true],
                [{ code: 456 }, true],
                [{ code: 456, upc: 123 }, false, {
                    message: '"value" contains a conflict between exclusive peers [code, upc]',
                    path: [],
                    type: 'object.xor',
                    context: {
                        peers: ['code', 'upc'],
                        peersWithLabels: ['code', 'upc'],
                        present: ['code', 'upc'],
                        presentWithLabels: ['code', 'upc'],
                        label: 'value',
                        value: { code: 456, upc: 123 }
                    }
                }],
                [{}, false, {
                    message: '"value" must contain at least one of [code, upc]',
                    path: [],
                    type: 'object.missing',
                    context: {
                        peers: ['code', 'upc'],
                        peersWithLabels: ['code', 'upc'],
                        label: 'value',
                        value: {}
                    }
                }]
            ]);
        });

        it('validates xor when empty value of peer allowed', () => {

            const schema = Joi.object({
                code: Joi.string(),
                upc: Joi.string().allow('')
            })
                .xor('code', 'upc');

            Helper.validate(schema, [
                [{ upc: '' }, true],
                [{ upc: '123' }, true],
                [{ code: '456' }, true],
                [{ code: '456', upc: '' }, false, {
                    message: '"value" contains a conflict between exclusive peers [code, upc]',
                    path: [],
                    type: 'object.xor',
                    context: {
                        peers: ['code', 'upc'],
                        peersWithLabels: ['code', 'upc'],
                        present: ['code', 'upc'],
                        presentWithLabels: ['code', 'upc'],
                        label: 'value',
                        value: { code: '456', upc: '' }
                    }
                }],
                [{}, false, {
                    message: '"value" must contain at least one of [code, upc]',
                    path: [],
                    type: 'object.missing',
                    context: {
                        peers: ['code', 'upc'],
                        peersWithLabels: ['code', 'upc'],
                        label: 'value',
                        value: {}
                    }
                }]
            ]);
        });

        it('errors when a parameter is not a string', () => {

            expect(() => Joi.object().xor({})).to.throw();
            expect(() => Joi.object().xor(123)).to.throw();
        });

        it('applies labels without any peer', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            })
                .xor('a', 'b');

            Helper.validate(schema, [[{}, false, {
                message: '"value" must contain at least one of [first, second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b'],
                    peersWithLabels: ['first', 'second'],
                    label: 'value',
                    value: {}
                }
            }]]);
        });

        it('applies labels with too many peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            })
                .xor('a', 'b');

            Helper.validate(schema, [[{ a: 1, b: 'b' }, false, {
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
            }]]);
        });

        it('applies labels with too many peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second'),
                c: Joi.string().label('third'),
                d: Joi.string().label('fourth')
            })
                .xor('a', 'b', 'c', 'd');

            Helper.validate(schema, [[{ a: 1, b: 'b', d: 'd' }, false, {
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
            }]]);
        });

        it('allows nested objects', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.object({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .xor('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: { d: 80 } }, true],
                [{ a: 'test', b: { c: 'test2' } }, false, '"value" contains a conflict between exclusive peers [a, b.c]']
            ]);
        });

        it('allows nested keys in functions', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.function().keys({ c: Joi.string(), d: Joi.number() }),
                d: Joi.number()
            })
                .xor('a', 'b.c');

            Helper.validate(schema, [
                [{ a: 'test', b: Object.assign(() => { }, { d: 80 }) }, true, Helper.skip],
                [{ a: 'test', b: Object.assign(() => { }, { c: 'test2' }) }, false, '"value" contains a conflict between exclusive peers [a, b.c]']
            ]);
        });

        it('applies labels without any nested peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .xor('a', 'b.c');

            Helper.validate(schema, [[{}, false, {
                message: '"value" must contain at least one of [first, b.second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b.c'],
                    peersWithLabels: ['first', 'b.second'],
                    label: 'value',
                    value: {}
                }
            }]]);
        });

        it('applies labels with too many nested peers', () => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.object({
                    c: Joi.string().label('second'),
                    d: Joi.number()
                })
            })
                .xor('a', 'b.c');

            Helper.validate(schema, [[{ a: 1, b: { c: 'c' } }, false, {
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
            }]]);
        });

        it('handles period in key names', () => {

            const schema = Joi.object({
                'x.from': Joi.string().lowercase().email(),
                'x.url': Joi.string().uri({ scheme: ['https'] })
            })
                .xor('x.from', 'x.url', { separator: false });

            const test = { 'x.url': 'https://example.com' };
            Helper.validate(schema, [[test, true, test]]);
        });
    });
});
