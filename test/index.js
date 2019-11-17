'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Joi', () => {

    it('keeps schema immutable', () => {

        const a = Joi.string();
        const b = a.valid('b');

        Helper.validate(a, [
            ['a', true],
            ['b', true],
            [5, false, {
                message: '"value" must be a string',
                path: [],
                type: 'string.base',
                context: { value: 5, label: 'value' }
            }]
        ]);

        Helper.validate(b, [
            ['a', false, {
                message: '"value" must be [b]',
                path: [],
                type: 'any.only',
                context: { value: 'a', valids: ['b'], label: 'value' }
            }],
            ['b', true],
            [5, false, {
                message: '"value" must be [b]',
                path: [],
                type: 'any.only',
                context: { value: 5, valids: ['b'], label: 'value' }
            }]
        ]);
    });

    it('validates a compiled complex literal', () => {

        const schema = Joi.compile(['key', 5, { a: true, b: [/^a/, 'boom'] }]);
        Helper.validate(schema, [
            ['key', true],
            [5, true],
            ['other', false, {
                message: '"value" must be one of [key, 5, object]',
                path: [],
                type: 'alternatives.types',
                context: {
                    label: 'value',
                    types: ['key', 5, 'object'],
                    value: 'other'
                }
            }],
            [6, false, {
                message: '"value" must be one of [key, 5, object]',
                path: [],
                type: 'alternatives.types',
                context: {
                    label: 'value',
                    types: ['key', 5, 'object'],
                    value: 6
                }
            }],
            [{ c: 5 }, false, {
                message: '"c" is not allowed',
                path: ['c'],
                type: 'object.unknown',
                context: { child: 'c', label: 'c', key: 'c', value: 5 }
            }],
            [{}, true],
            [{ b: 'abc' }, true],
            [{ a: true, b: 'boom' }, true],
            [{ a: 5, b: 'a' }, false, {
                message: '"a" must be [true]',
                path: ['a'],
                type: 'any.only',
                context: { label: 'a', key: 'a', value: 5, valids: [true] }
            }]
        ]);
    });

    it('validates regex directly', () => {

        Helper.validate(Joi.compile(/^5$/), [['5', true]]);
        Helper.validate(Joi.compile(/.{2}/), [['6', false, {
            message: '"value" with value "6" fails to match the required pattern: /.{2}/',
            path: [],
            type: 'string.pattern.base',
            context: {
                name: undefined,
                regex: /.{2}/,
                value: '6',
                label: 'value'
            }
        }]]);
    });

    it('validates an array of valid types', () => {

        const schema = Joi.object({
            auth: [
                Joi.object({
                    mode: Joi.string().valid('required', 'optional', 'try').allow(null)
                }).allow(null),
                Joi.string(),
                Joi.boolean()
            ]
        });

        Helper.validate(schema, [
            [{ auth: { mode: 'none' } }, false, '"auth.mode" must be one of [required, optional, try, null]'],
            [{ auth: { mode: 'try' } }, true],
            [{ something: undefined }, false, {
                message: '"something" is not allowed',
                path: ['something'],
                type: 'object.unknown',
                context: { child: 'something', label: 'something', key: 'something' }
            }],
            [{ auth: { something: undefined } }, false, {
                message: '"auth.something" is not allowed',
                path: ['auth', 'something'],
                type: 'object.unknown',
                context: { child: 'something', label: 'auth.something', key: 'something' }
            }],
            [{ auth: null }, true],
            [{ auth: undefined }, true],
            [{}, true],
            [{ auth: true }, true],
            [{ auth: 123 }, false, {
                message: '"auth" must be one of [object, string, boolean]',
                path: ['auth'],
                type: 'alternatives.types',
                context: { types: ['object', 'string', 'boolean'], label: 'auth', key: 'auth', value: 123 }
            }]
        ]);
    });

    it('validates alternatives', () => {

        const schema = Joi.object({
            auth: Joi.alternatives([
                Joi.object({
                    mode: Joi.string().valid('required', 'optional', 'try').allow(null)
                }).allow(null),
                Joi.string(),
                Joi.boolean()
            ])
        });

        const err = schema.validate({ auth: { mode: 'none' } }).error;
        expect(err).to.be.an.error('"auth.mode" must be one of [required, optional, try, null]');

        Helper.validate(schema, [
            [{ auth: { mode: 'try' } }, true],
            [{ something: undefined }, false, {
                message: '"something" is not allowed',
                path: ['something'],
                type: 'object.unknown',
                context: { child: 'something', label: 'something', key: 'something' }
            }],
            [{ auth: { something: undefined } }, false, {
                message: '"auth.something" is not allowed',
                path: ['auth', 'something'],
                type: 'object.unknown',
                context: { child: 'something', label: 'auth.something', key: 'something' }
            }],
            [{ auth: null }, true],
            [{ auth: undefined }, true],
            [{}, true],
            [{ auth: true }, true],
            [{ auth: 123 }, false, {
                message: '"auth" must be one of [object, string, boolean]',
                path: ['auth'],
                type: 'alternatives.types',
                context: { types: ['object', 'string', 'boolean'], label: 'auth', key: 'auth', value: 123 }
            }]
        ]);
    });

    it('validates required alternatives', () => {

        const schema = Joi.object({
            a: Joi.alternatives([
                Joi.string().required(),
                Joi.boolean().required()
            ])
        });

        Helper.validate(schema, [
            [{ a: null }, false, {
                message: '"a" must be one of [string, boolean]',
                path: ['a'],
                type: 'alternatives.types',
                context: { types: ['string', 'boolean'], label: 'a', key: 'a', value: null }
            }],
            [{ a: undefined }, true],
            [{}, true],
            [{ a: true }, true],
            [{ a: 'true' }, true],
            [{ a: 123 }, false, {
                message: '"a" must be one of [string, boolean]',
                path: ['a'],
                type: 'alternatives.types',
                context: { types: ['string', 'boolean'], label: 'a', key: 'a', value: 123 }
            }],
            [{ a: { c: 1 } }, false, {
                message: '"a" must be one of [string, boolean]',
                path: ['a'],
                type: 'alternatives.types',
                context: { types: ['string', 'boolean'], label: 'a', key: 'a', value: { c: 1 } }
            }],
            [{ b: undefined }, false, {
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.unknown',
                context: { child: 'b', label: 'b', key: 'b' }
            }]
        ]);
    });

    it('validates required [] alternatives', () => {

        const schema = Joi.object({
            a: [
                Joi.string().required(),
                Joi.boolean().required()
            ]
        });

        Helper.validate(schema, [
            [{ a: null }, false, {
                message: '"a" must be one of [string, boolean]',
                path: ['a'],
                type: 'alternatives.types',
                context: { types: ['string', 'boolean'], label: 'a', key: 'a', value: null }
            }],
            [{ a: undefined }, true],
            [{}, true],
            [{ a: true }, true],
            [{ a: 'true' }, true],
            [{ a: 123 }, false, {
                message: '"a" must be one of [string, boolean]',
                path: ['a'],
                type: 'alternatives.types',
                context: { types: ['string', 'boolean'], label: 'a', key: 'a', value: 123 }
            }],
            [{ a: { c: 1 } }, false, {
                message: '"a" must be one of [string, boolean]',
                path: ['a'],
                type: 'alternatives.types',
                context: { types: ['string', 'boolean'], label: 'a', key: 'a', value: { c: 1 } }
            }],
            [{ b: undefined }, false, {
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.unknown',
                context: { child: 'b', label: 'b', key: 'b' }
            }]
        ]);
    });

    it('validates an array of string with valid', () => {

        const schema = Joi.object({
            brand: Joi.array().items(Joi.string().valid('amex', 'visa'))
        });

        Helper.validate(schema, [
            [{ brand: ['amex'] }, true],
            [{ brand: ['visa', 'mc'] }, false, {
                message: '"brand[1]" must be one of [amex, visa]',
                path: ['brand', 1],
                type: 'any.only',
                context: { value: 'mc', valids: ['amex', 'visa'], label: 'brand[1]', key: 1 }
            }]
        ]);
    });

    it('validates pre and post convert value', () => {

        const schema = Joi.number().valid(5);

        Helper.validate(schema, [
            [5, true],
            ['5', true, 5]
        ]);
    });

    it('does not change object when validation fails', () => {

        const schema = Joi.object({
            a: Joi.number().valid(2)
        });

        const obj = {
            a: '5'
        };

        const { error, value } = schema.validate(obj);
        expect(error).to.exist();
        expect(value.a).to.equal('5');
    });

    it('does not set optional keys when missing', () => {

        const schema = Joi.object({
            a: Joi.number()
        });

        const obj = {};

        const value = schema.validate(obj).value;
        expect(value.hasOwnProperty('a')).to.equal(false);
    });

    it('invalidates pre and post convert value', () => {

        const schema = Joi.number().invalid(5);

        Helper.validate(schema, [
            [5, false, {
                message: '"value" contains an invalid value',
                path: [],
                type: 'any.invalid',
                context: { value: 5, invalids: [5], label: 'value' }
            }],
            ['5', false, {
                message: '"value" contains an invalid value',
                path: [],
                type: 'any.invalid',
                context: { value: 5, invalids: [5], label: 'value' }
            }]
        ]);
    });

    it('invalidates missing peers', () => {

        const schema = Joi.object({
            username: Joi.string(),
            password: Joi.string()
        }).with('username', 'password').without('password', 'access_token');

        Helper.validate(schema, [[{ username: 'bob' }, false, '"username" missing required peer "password"']]);
    });

    it('validates config where the root item is a joi type', () => {

        Helper.validate(Joi.boolean().allow(null), [[true, true]]);
        Helper.validate(Joi.object(), [[{ auth: { mode: 'try' } }, true]]);
        Helper.validate(Joi.object(), [[true, false, '"value" must be of type object']]);
        Helper.validate(Joi.string(), [[true, false, '"value" must be a string']]);
        Helper.validate(Joi.string().email(), [['test@test.com', true]]);
        Helper.validate(Joi.object({ param: Joi.string().required() }), [[{ param: 'item' }, true]]);
    });

    it('converts string to number', () => {

        const schema = Joi.object({
            a: Joi.number()
        });

        const input = { a: '5' };
        Helper.validate(schema, [[input, true, { a: 5 }]]);
        expect(input.a).to.equal('5');
    });

    it('allows unknown keys in objects if no schema was given', () => {

        Helper.validate(Joi.object(), [[{ foo: 'bar' }, true]]);
    });

    it('fails on unknown keys in objects if a schema was given', () => {

        Helper.validate(Joi.object({}), [[{ foo: 'bar' }, false, {
            message: '"foo" is not allowed',
            path: ['foo'],
            type: 'object.unknown',
            context: { child: 'foo', label: 'foo', key: 'foo', value: 'bar' }
        }]]);

        Helper.validate(Joi.compile({}), [[{ foo: 'bar' }, false, '"foo" is not allowed']]);

        Helper.validate(Joi.compile({ other: Joi.number() }), [[{ foo: 'bar' }, false, '"foo" is not allowed']]);
    });

    it('validates required key with multiple options', () => {

        const config = {
            module: Joi.alternatives([
                Joi.object({
                    compile: Joi.function().required(),
                    execute: Joi.function()
                }),
                Joi.string()
            ]).required()
        };

        Helper.validate(Joi.compile(config), [
            [{}, false, '"module" is required'],
            [{ module: 'test' }, true],
            [{ module: {} }, false, '"module.compile" is required'],
            [{ module: { compile() { } } }, true]
        ]);
    });

    it('validates key with required alternatives', () => {

        const config = {
            module: Joi.alt().try(
                Joi.object({
                    compile: Joi.function().required(),
                    execute: Joi.function()
                }).required(),
                Joi.string().required()
            )
        };

        expect(Joi.compile(config).validate({}).error).to.not.exist();
    });

    it('validates required key with alternatives', () => {

        const config = {
            module: Joi.alt().try(
                Joi.object({
                    compile: Joi.function().required(),
                    execute: Joi.function()
                }),
                Joi.string()
            ).required()
        };

        Helper.validate(Joi.compile(config), [[{}, false, '"module" is required']]);
    });

    it('validates object successfully when config has an array of types', () => {

        const schema = {
            f: [Joi.number(), Joi.boolean()],
            g: [Joi.string(), Joi.object()]
        };

        const obj = {
            f: true,
            g: 'test'
        };

        Helper.validate(Joi.compile(schema), [[obj, true]]);
    });

    it('validates object successfully when config allows for optional key and key is missing', () => {

        const schema = {
            h: Joi.number(),
            i: Joi.string(),
            j: Joi.object()
        };

        const obj = {
            h: 12,
            i: 'test'
        };

        Helper.validate(Joi.compile(schema), [[obj, true]]);
    });

    it('fails validation', () => {

        const schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        const obj = {
            a: 10,
            b: 'a',
            c: 'joe@example.com'
        };

        Helper.validate(Joi.compile(schema), [[obj, false, '"a" must be less than or equal to 3']]);
    });

    it('fails validation when the wrong types are supplied', () => {

        const schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        const obj = {
            a: 'a',
            b: 'a',
            c: 'joe@example.com'
        };

        Helper.validate(Joi.compile(schema), [[obj, false, '"a" must be a number']]);
    });

    it('fails validation when missing a required parameter', () => {

        const obj = {
            c: 10
        };

        Helper.validate(Joi.compile({ a: Joi.string().required() }), [[obj, false, '"a" is required']]);
    });

    it('fails validation when missing a required parameter within an object config', () => {

        const obj = {
            a: {}
        };

        Helper.validate(Joi.compile({ a: Joi.object({ b: Joi.string().required() }) }), [[obj, false, '"a.b" is required']]);
    });

    it('fails validation when parameter is required to be an Array but is given as string', () => {

        const obj = {
            a: 'an array'
        };

        Helper.validate(Joi.object({ a: Joi.array() }), [[obj, false, '"a" must be an array']]);
    });

    it('fails validation when parameter is required to be an Array but is given as a json that is incorrect (object instead of array)', () => {

        const obj = {
            a: '{"b":2}'
        };

        Helper.validate(Joi.object({ a: Joi.object({ b: Joi.string().required() }) }), [[obj, false, '"a" must be of type object']]);
    });

    it('fails validation when config is an array and fails', () => {

        const schema = {
            d: [Joi.string(), Joi.boolean()],
            e: [Joi.number(), Joi.object()]
        };

        const obj = {
            d: 10,
            e: 'a'
        };

        Helper.validate(Joi.compile(schema), [[obj, false, '"d" must be one of [string, boolean]']]);
    });

    it('fails validation when config is an array and fails with extra keys', () => {

        const schema = {
            d: [Joi.string(), Joi.boolean()],
            e: [Joi.number(), Joi.object()]
        };

        const obj = {
            a: 10,
            b: 'a'
        };

        Helper.validate(Joi.compile(schema), [[obj, false, '"a" is not allowed']]);
    });

    it('fails validation with extra keys', () => {

        const schema = {
            a: Joi.number()
        };

        const obj = {
            a: 1,
            b: 'a'
        };

        Helper.validate(Joi.compile(schema), [[obj, false, '"b" is not allowed']]);
    });

    it('validates missing optional key with string condition', () => {

        const schema = {
            key: Joi.string().alphanum(false).min(8)
        };

        Helper.validate(Joi.compile(schema), [[{}, true]]);
    });

    it('validates with extra keys and remove them when stripUnknown is set', () => {

        const schema = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        });

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        Helper.validate(schema, { stripUnknown: true, allowUnknown: true }, [[obj, true, { a: 1, b: 'a' }]]);
    });

    it('validates with extra keys and remove them when stripUnknown (as an object) is set', () => {

        const schema = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        });

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        Helper.validate(schema, { stripUnknown: { arrays: false, objects: true }, allowUnknown: true }, [[obj, true, { a: 1, b: 'a' }]]);
    });

    it('validates dependencies when stripUnknown is set', () => {

        const schema = Joi.object({
            a: Joi.number(),
            b: Joi.string()
        }).and('a', 'b');

        const obj = {
            a: 1,
            foo: 'bar'
        };

        Helper.validate(schema, { stripUnknown: true }, [[obj, false, {
            message: '"value" contains [a] without its required peers [b]',
            path: [],
            type: 'object.and',
            context: {
                present: ['a'],
                presentWithLabels: ['a'],
                missing: ['b'],
                missingWithLabels: ['b'],
                label: 'value',
                value: { a: 1 }
            }
        }]]);
    });

    it('validates dependencies when stripUnknown (as an object) is set', () => {

        const schema = Joi.object({
            a: Joi.number(),
            b: Joi.string()
        })
            .and('a', 'b');

        const obj = {
            a: 1,
            foo: 'bar'
        };

        Helper.validate(schema, { stripUnknown: { arrays: false, objects: true } }, [[obj, false, {
            message: '"value" contains [a] without its required peers [b]',
            path: [],
            type: 'object.and',
            context: {
                present: ['a'],
                presentWithLabels: ['a'],
                missing: ['b'],
                missingWithLabels: ['b'],
                label: 'value',
                value: { a: 1 }
            }
        }]]);
    });

    it('fails to validate with incorrect property when asked to strip unknown keys without aborting early', () => {

        const schema = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        });

        const obj = {
            a: 1,
            b: 'f',
            d: 'c'
        };

        Helper.validate(schema, { stripUnknown: true, abortEarly: false }, [[obj, false, '"b" must be one of [a, b, c]']]);
    });

    it('fails to validate with incorrect property when asked to strip unknown keys (as an object) without aborting early', () => {

        const schema = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        });

        const obj = {
            a: 1,
            b: 'f',
            d: 'c'
        };

        Helper.validate(schema, { stripUnknown: { arrays: false, objects: true }, abortEarly: false }, [[obj, false, '"b" must be one of [a, b, c]']]);
    });

    it('should pass validation with extra keys when allowUnknown is set', () => {

        const schema = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        });

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        Helper.validate(schema, { allowUnknown: true }, [[obj, true, { a: 1, b: 'a', d: 'c' }]]);
    });

    it('should pass validation with extra keys set', () => {

        const localConfig = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c')
        }).prefs({ allowUnknown: true });

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        Helper.validate(localConfig, [[obj, true, { a: 1, b: 'a', d: 'c' }]]);
    });

    it('should pass validation with extra keys and remove them when stripUnknown is set locally', () => {

        const localConfig = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c')
        }).prefs({ stripUnknown: true, allowUnknown: true });

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        Helper.validate(localConfig, [
            [obj, true, { a: 1, b: 'a' }],
            [{ a: 1, b: 'a' }, true, { a: 1, b: 'a' }]
        ]);
    });

    it('should pass validation with extra keys and remove them when stripUnknown (as an object) is set locally', () => {

        const localConfig = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c')
        }).prefs({ stripUnknown: { arrays: false, objects: true }, allowUnknown: true });

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        Helper.validate(localConfig, [
            [obj, true, { a: 1, b: 'a' }],
            [{ a: 1, b: 'a' }, true, { a: 1, b: 'a' }]
        ]);
    });

    it('should work when the skipFunctions setting is enabled', () => {

        const schema = Joi.object({ username: Joi.string() }).prefs({ skipFunctions: true });
        const input = { username: 'test', func() { } };
        Helper.validate(schema, [[input, true]]);
    });

    it('should work when the skipFunctions setting is disabled', () => {

        const schema = Joi.object({ username: Joi.string() });
        const input = { username: 'test', func() { } };

        Helper.validate(schema, { skipFunctions: false }, [[input, false, '"func" is not allowed']]);
    });

    it('should not convert values when convert is false', () => {

        const schema = Joi.object({
            arr: Joi.array().items(Joi.string())
        });

        const input = { arr: 'foo' };
        Helper.validate(schema, { convert: false }, [[input, false, '"arr" must be an array']]);
    });

    it('full errors when abortEarly is false', () => {

        const schema = Joi.object({
            a: Joi.string(),
            b: Joi.string()
        });

        const input = { a: 1, b: 2 };

        const errOne = schema.validate(input).error;
        const errFull = schema.validate(input, { abortEarly: false }).error;
        expect(errFull.details.length).to.be.greaterThan(errOne.details.length);
    });

    it('errors multiple times when abortEarly is false in a complex object', () => {

        const schema = Joi.object({
            test: Joi.array().items(Joi.object().keys({
                foo: Joi.string().required().max(3),
                bar: Joi.string().max(5)
            })),
            test2: Joi.object({
                test3: Joi.array().items(Joi.object().keys({
                    foo: Joi.string().required().max(3),
                    bar: Joi.string().max(5),
                    baz: Joi.object({
                        test4: Joi.array().items(Joi.object().keys({
                            foo: Joi.string().required().max(3),
                            bar: Joi.string().max(5)
                        }))
                    })
                }))
            })
        });

        const input = {
            test: [{
                foo: 'test1',
                bar: 'testfailed'
            }],
            test2: {
                test3: [{
                    foo: '123'
                }, {
                    foo: 'test1',
                    bar: 'testfailed'
                }, {
                    foo: '123',
                    baz: {
                        test4: [{
                            foo: 'test1',
                            baz: '123'
                        }]
                    }
                }]
            }
        };

        Helper.validate(schema, { abortEarly: false }, [[input, false, {
            message: '"test[0].foo" length must be less than or equal to 3 characters long. "test[0].bar" length must be less than or equal to 5 characters long. "test2.test3[1].foo" length must be less than or equal to 3 characters long. "test2.test3[1].bar" length must be less than or equal to 5 characters long. "test2.test3[2].baz.test4[0].foo" length must be less than or equal to 3 characters long. "test2.test3[2].baz.test4[0].baz" is not allowed',
            details: [{
                message: '"test[0].foo" length must be less than or equal to 3 characters long',
                path: ['test', 0, 'foo'],
                type: 'string.max',
                context: { limit: 3, value: 'test1', key: 'foo', label: 'test[0].foo', encoding: undefined }
            }, {
                message: '"test[0].bar" length must be less than or equal to 5 characters long',
                path: ['test', 0, 'bar'],
                type: 'string.max',
                context: { limit: 5, value: 'testfailed', key: 'bar', label: 'test[0].bar', encoding: undefined }
            }, {
                message: '"test2.test3[1].foo" length must be less than or equal to 3 characters long',
                path: ['test2', 'test3', 1, 'foo'],
                type: 'string.max',
                context: { limit: 3, value: 'test1', key: 'foo', label: 'test2.test3[1].foo', encoding: undefined }
            }, {
                message: '"test2.test3[1].bar" length must be less than or equal to 5 characters long',
                path: ['test2', 'test3', 1, 'bar'],
                type: 'string.max',
                context: { limit: 5, value: 'testfailed', key: 'bar', label: 'test2.test3[1].bar', encoding: undefined }
            }, {
                message: '"test2.test3[2].baz.test4[0].foo" length must be less than or equal to 3 characters long',
                path: ['test2', 'test3', 2, 'baz', 'test4', 0, 'foo'],
                type: 'string.max',
                context: {
                    limit: 3,
                    value: 'test1',
                    key: 'foo',
                    label: 'test2.test3[2].baz.test4[0].foo',
                    encoding: undefined
                }
            }, {
                message: '"test2.test3[2].baz.test4[0].baz" is not allowed',
                path: ['test2', 'test3', 2, 'baz', 'test4', 0, 'baz'],
                type: 'object.unknown',
                context: { key: 'baz', label: 'test2.test3[2].baz.test4[0].baz', child: 'baz', value: '123' }
            }]
        }]]);
    });

    it('accepts no options', () => {

        Helper.validate(Joi.string(), [['test', true]]);
        Helper.validate(Joi.number(), { convert: false }, [['5', false, '"value" must be a number']]);
    });

    it('accepts null options', () => {

        Helper.validate(Joi.string(), null, [['test', true]]);
    });

    it('accepts undefined options', () => {

        Helper.validate(Joi.string(), undefined, [['test', true]]);
    });

    describe('assert()', () => {

        it('respects abortEarly option', () => {

            try {
                Joi.assert({}, Joi.object().keys({ a: Joi.required(), b: Joi.required() }), { abortEarly: false });
                throw new Error('should not reach that');
            }
            catch (err) {
                expect(err.details.length).to.equal(2);
            }
        });
    });

    describe('attempt()', () => {

        it('throws on invalid value', () => {

            expect(() => {

                Joi.attempt('x', Joi.number());
            }).to.throw('"value" must be a number');
        });

        it('throws a ValidationError on invalid value', () => {

            expect(() => {

                Joi.attempt('x', Joi.number());
            }).to.throw(Joi.ValidationError);
        });

        it('does not throw on valid value', () => {

            expect(() => {

                Joi.attempt('4', Joi.number());
            }).to.not.throw();
        });

        it('returns validated structure', () => {

            let valid;
            expect(() => {

                valid = Joi.attempt('4', Joi.number());
            }).to.not.throw();
            expect(valid).to.equal(4);
        });

        it('throws on invalid value with message', () => {

            expect(() => {

                Joi.attempt('x', Joi.number(), 'the reason is');
            }).to.throw('the reason is "value" must be a number');
        });

        it('throws on invalid value with message and abortEarly: false', () => {

            const schema = Joi.object({ a: Joi.required(), b: Joi.required() });
            expect(() => Joi.attempt({}, schema, 'the reasons are', { abortEarly: false })).to.throw('the reasons are "a" is required. "b" is required');
        });

        it('throws on invalid value with message as error even with abortEarly: false', () => {

            expect(() => {

                Joi.attempt({}, Joi.object().keys({ a: Joi.required(), b: Joi.required() }), new Error('invalid value'), { abortEarly: false });
            }).to.throw('invalid value');
        });

        it('throws a custom error from the schema if provided', () => {

            expect(() => Joi.attempt('x', Joi.number().error(new Error('Oh noes !')))).to.throw('Oh noes !');
        });

        it('throws an error with combined messages', () => {

            const schema = Joi.number().error(new Error('Oh noes !'));
            expect(() => Joi.attempt('x', schema, 'invalid value')).to.throw('invalid value Oh noes !');
            expect(() => Joi.attempt('x', schema, 'invalid value')).to.throw('invalid value Oh noes !');
        });
    });

    describe('checkPreferences()', () => {

        it('validates preferences', () => {

            expect(() => Joi.checkPreferences({ abortEarly: false })).to.not.throw();
            expect(() => Joi.checkPreferences({ x: 1 })).to.throw();
        });
    });

    describe('compile()', () => {

        it('throws an error on invalid value', () => {

            expect(() => {

                Joi.compile(undefined);
            }).to.throw('Invalid undefined schema');
        });

        it('shows path to errors in object', () => {

            const schema = {
                a: {
                    b: {
                        c: {
                            d: undefined
                        }
                    }
                }
            };

            expect(() => {

                Joi.compile(schema);
            }).to.throw(Error, 'Invalid undefined schema (a.b.c.d)');
        });
    });

    describe('defaults()', () => {

        it('applies defaults to root', () => {

            const custom = Joi.defaults((schema) => schema.required().description('defaulted'));
            const schema = custom.optional();
            expect(schema.describe()).to.equal({
                type: 'any',
                flags: {
                    description: 'defaulted',
                    presence: 'optional'
                }
            });
        });

        it('applies defaults to standard types', () => {

            const custom = Joi.defaults((schema) => schema.required().description('defaulted'));
            const schema = custom.string();
            expect(schema.describe()).to.equal({
                type: 'string',
                flags: {
                    description: 'defaulted',
                    presence: 'required'
                }
            });
        });

        it('applies defaults to types with arguments', () => {

            const custom = Joi.defaults((schema) => schema.required().description('defaulted'));
            const schema = custom.object({ foo: 'bar' });
            expect(schema.describe()).to.equal({
                type: 'object',
                flags: {
                    description: 'defaulted',
                    presence: 'required'
                },
                keys: {
                    foo: {
                        type: 'any',
                        flags: {
                            description: 'defaulted',
                            presence: 'required',
                            only: true
                        },
                        allow: [{ override: true }, 'bar']
                    }
                }
            });
        });

        it('keeps several defaults separated', () => {

            const custom1 = Joi.defaults((schema) => schema.required().description('defaulted'));
            const custom2 = Joi.defaults((schema) => schema.required().description('defaulted2'));

            const schema = custom1.object({
                foo: 'bar',
                baz: custom2.object().keys({
                    qux: 'zorg'
                })
            });

            expect(schema.describe()).to.equal({
                type: 'object',
                flags: {
                    description: 'defaulted',
                    presence: 'required'
                },
                keys: {
                    foo: {
                        type: 'any',
                        flags: {
                            presence: 'required',
                            description: 'defaulted',
                            only: true
                        },
                        allow: [{ override: true }, 'bar']
                    },
                    baz: {
                        keys: {
                            qux: {
                                flags: {
                                    only: true,
                                    description: 'defaulted2',
                                    presence: 'required'
                                },
                                type: 'any',
                                allow: [{ override: true }, 'zorg']
                            }
                        },
                        flags: {
                            description: 'defaulted2',
                            presence: 'required'
                        },
                        type: 'object'
                    }
                }
            });
        });

        it('inherits defaults', () => {

            const custom = Joi
                .defaults((schema) => schema.required().description('defaulted'))
                .defaults((schema) => schema.raw());

            const schema = custom.object({
                foo: 'bar'
            });

            expect(schema.describe()).to.equal({
                type: 'object',
                flags: {
                    description: 'defaulted',
                    presence: 'required',
                    result: 'raw'
                },
                keys: {
                    foo: {
                        type: 'any',
                        flags: {
                            description: 'defaulted',
                            presence: 'required',
                            only: true,
                            result: 'raw'
                        },
                        allow: [{ override: true }, 'bar']
                    }
                }
            });
        });

        it('keeps defaults on extensions', () => {

            const custom = Joi.defaults((schema) => schema.required().description('defaulted'));

            const extended = custom.extend({ type: 'foobar' });
            const schema = extended.foobar();
            expect(schema.describe()).to.equal({
                type: 'foobar',
                flags: {
                    description: 'defaulted',
                    presence: 'required'
                }
            });
        });

        it('applies defaults on extensions', () => {

            const extended = Joi.extend({ type: 'foobar' });
            const custom = extended.defaults((schema) => schema.required().description('defaulted'));
            const schema = custom.foobar();
            expect(schema.describe()).to.equal({
                type: 'foobar',
                flags: {
                    description: 'defaulted',
                    presence: 'required'
                }
            });
        });

        it('errors on missing return value (root)', () => {

            expect(() => {

                Joi.defaults((schema) => {

                    switch (schema.type) {
                        case 'bool':
                            return schema.required();
                    }
                });
            }).to.throw('modifier must return a valid schema object');
        });

        it('errors on missing return for a standard type', () => {

            expect(() => {

                Joi.defaults((schema) => {

                    switch (schema.type) {
                        case 'any':
                            return schema.required();
                    }
                });
            }).to.throw('modifier must return a valid schema object');
        });
    });

    describe('ValidationError', () => {

        it('should be Joi', () => {

            const error = new Joi.ValidationError();
            expect(error.isJoi).to.equal(true);
        });

        it('should be named ValidationError', () => {

            const error = new Joi.ValidationError();
            expect(error.name).to.equal('ValidationError');
        });
    });

    describe('types()', () => {

        it('returns type shortcut methods', () => {

            expect(() => {

                const string = Joi.string;
                string();
            }).to.throw('Must be invoked on a Joi instance.');

            const { string } = Joi.types();
            expect(() => string.allow('x')).to.not.throw();

            Helper.validate(string, [[0, false, '"value" must be a string']]);
        });

        it('returns alias shortcut methods', () => {

            expect(() => {

                const func = Joi.func;
                func();
            }).to.throw('Must be invoked on a Joi instance.');

            const { func } = Joi.types();
            expect(() => func.allow('x')).to.not.throw();

            Helper.validate(func, [[0, false, '"value" must be of type function']]);
        });
    });
});
