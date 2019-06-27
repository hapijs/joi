'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Joi', () => {

    it('validates object', async () => {

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

        await schema.validate(obj);
    });

    it('keeps schema immutable', () => {

        const a = Joi.string();
        const b = a.valid('b');

        Helper.validate(a, [
            ['a', true],
            ['b', true],
            [5, false, null, {
                message: '"value" must be a string',
                details: [{
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 5, label: 'value' }
                }]
            }]
        ]);

        Helper.validate(b, [
            ['a', false, null, {
                message: '"value" must be one of [b]',
                details: [{
                    message: '"value" must be one of [b]',
                    path: [],
                    type: 'any.allowOnly',
                    context: { value: 'a', valids: ['b'], label: 'value' }
                }]
            }],
            ['b', true],
            [5, false, null, {
                message: '"value" must be one of [b]',
                details: [{
                    message: '"value" must be one of [b]',
                    path: [],
                    type: 'any.allowOnly',
                    context: { value: 5, valids: ['b'], label: 'value' }
                }]
            }]
        ]);
    });

    it('validates null', async () => {

        const err = await expect(Joi.string().validate(null)).to.reject();
        expect(err).to.be.an.error('"value" must be a string');
        expect(err.details).to.equal([{
            message: '"value" must be a string',
            path: [],
            type: 'string.base',
            context: { value: null, label: 'value' }
        }]);

        expect(err.annotate()).to.equal('"value" must be a string');
    });

    it('validates null schema', () => {

        Helper.validate(null, [
            ['a', false, null, {
                message: '"value" must be one of [null]',
                details: [{
                    message: '"value" must be one of [null]',
                    path: [],
                    type: 'any.allowOnly',
                    context: { value: 'a', valids: [null], label: 'value' }
                }]
            }],
            [null, true]
        ]);
    });

    it('validates number literal', () => {

        Helper.validate(5, [
            [6, false, null, {
                message: '"value" must be one of [5]',
                details: [{
                    message: '"value" must be one of [5]',
                    path: [],
                    type: 'any.allowOnly',
                    context: { value: 6, valids: [5], label: 'value' }
                }]
            }],
            [5, true]
        ]);
    });

    it('validates string literal', () => {

        Helper.validate('5', [
            ['6', false, null, {
                message: '"value" must be one of [5]',
                details: [{
                    message: '"value" must be one of [5]',
                    path: [],
                    type: 'any.allowOnly',
                    context: { value: '6', valids: ['5'], label: 'value' }
                }]
            }],
            ['5', true]
        ]);
    });

    it('validates boolean literal', () => {

        Helper.validate(true, [
            [false, false, null, {
                message: '"value" must be one of [true]',
                details: [{
                    message: '"value" must be one of [true]',
                    path: [],
                    type: 'any.allowOnly',
                    context: { value: false, valids: [true], label: 'value' }
                }]
            }],
            [true, true]
        ]);
    });

    it('validates date literal', () => {

        const now = Date.now();
        const dnow = new Date(now);
        Helper.validate(dnow, [
            [new Date(now), true],
            [now, true],
            [now * 2, false, null, {
                message: `"value" must be one of [${dnow.toISOString()}]`,
                details: [{
                    message: `"value" must be one of [${dnow.toISOString()}]`,
                    path: [],
                    type: 'any.allowOnly',
                    context: { value: new Date(now * 2), valids: [dnow], label: 'value' }
                }]
            }]
        ]);
    });

    it('validates complex literal', () => {

        const schema = ['key', 5, { a: true, b: [/^a/, 'boom'] }];
        Helper.validate(schema, [
            ['key', true],
            [5, true],
            ['other', false, null, {
                message: '"value" does not match any of the allowed types',
                details: [
                    {
                        message: '"value" does not match any of the allowed types',
                        path: [],
                        type: 'alternatives.match',
                        context: {
                            message: '"value" must be one of [key]. "value" must be one of [5]. "value" must be an object',
                            label: 'value',
                            value: 'other',
                            details: [
                                {
                                    message: '"value" must be one of [key]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: 'other', valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: 'other', valids: [5], label: 'value' }
                                },
                                {
                                    message: '"value" must be an object',
                                    path: [],
                                    type: 'object.base',
                                    context: { label: 'value', value: 'other' }
                                }
                            ]
                        }
                    }
                ]
            }],
            [6, false, null, {
                message: '"value" does not match any of the allowed types',
                details: [
                    {
                        message: '"value" does not match any of the allowed types',
                        path: [],
                        type: 'alternatives.match',
                        context: {
                            message: '"value" must be one of [key]. "value" must be one of [5]. "value" must be an object',
                            label: 'value',
                            value: 6,
                            details: [
                                {
                                    message: '"value" must be one of [key]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: 6, valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: 6, valids: [5], label: 'value' }
                                },
                                {
                                    message: '"value" must be an object',
                                    path: [],
                                    type: 'object.base',
                                    context: { label: 'value', value: 6 }
                                }
                            ]
                        }
                    }
                ]
            }],
            [{ c: 5 }, false, null, {
                message: '"value" does not match any of the allowed types',
                details: [
                    {
                        message: '"value" does not match any of the allowed types',
                        path: [],
                        type: 'alternatives.match',
                        context: {
                            message: '"value" must be one of [key]. "value" must be one of [5]. "c" is not allowed',
                            label: 'value',
                            value: { c: 5 },
                            details: [
                                {
                                    message: '"value" must be one of [key]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: { c: 5 }, valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: { c: 5 }, valids: [5], label: 'value' }
                                },
                                {
                                    message: '"c" is not allowed',
                                    path: ['c'],
                                    type: 'object.allowUnknown',
                                    context: { child: 'c', label: 'c', key: 'c', value: 5 }
                                }
                            ]
                        }
                    }
                ]
            }],
            [{}, true],
            [{ b: 'abc' }, true],
            [{ a: true, b: 'boom' }, true],
            [{ a: 5, b: 'a' }, false, null, {
                message: '"value" does not match any of the allowed types',
                details: [
                    {
                        message: '"value" does not match any of the allowed types',
                        path: [],
                        type: 'alternatives.match',
                        context: {
                            label: 'value',
                            message: '"value" must be one of [key]. "value" must be one of [5]. "a" must be one of [true]',
                            value: { a: 5, b: 'a' },
                            details: [
                                {
                                    message: '"value" must be one of [key]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: { a: 5, b: 'a' }, valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: { a: 5, b: 'a' }, valids: [5], label: 'value' }
                                },
                                {
                                    message: '"a" must be one of [true]',
                                    path: ['a'],
                                    type: 'any.allowOnly',
                                    context: { label: 'a', key: 'a', value: 5, valids: [true] }
                                }
                            ]
                        }
                    }
                ]
            }]
        ]);
    });

    it('validates a compiled complex literal', () => {

        const schema = Joi.compile(['key', 5, { a: true, b: [/^a/, 'boom'] }]);
        Helper.validate(schema, [
            ['key', true],
            [5, true],
            ['other', false, null, {
                message: '"value" does not match any of the allowed types',
                details: [
                    {
                        message: '"value" does not match any of the allowed types',
                        path: [],
                        type: 'alternatives.match',
                        context: {
                            message: '"value" must be one of [key]. "value" must be one of [5]. "value" must be an object',
                            label: 'value',
                            value: 'other',
                            details: [
                                {
                                    message: '"value" must be one of [key]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: 'other', valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: 'other', valids: [5], label: 'value' }
                                },
                                {
                                    message: '"value" must be an object',
                                    path: [],
                                    type: 'object.base',
                                    context: { label: 'value', value: 'other' }
                                }
                            ]
                        }
                    }
                ]
            }],
            [6, false, null, {
                message: '"value" does not match any of the allowed types',
                details: [
                    {
                        message: '"value" does not match any of the allowed types',
                        path: [],
                        type: 'alternatives.match',
                        context: {
                            message: '"value" must be one of [key]. "value" must be one of [5]. "value" must be an object',
                            label: 'value',
                            value: 6,
                            details: [
                                {
                                    message: '"value" must be one of [key]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: 6, valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: 6, valids: [5], label: 'value' }
                                },
                                {
                                    message: '"value" must be an object',
                                    path: [],
                                    type: 'object.base',
                                    context: { label: 'value', value: 6 }
                                }
                            ]
                        }
                    }
                ]
            }],
            [{ c: 5 }, false, null, {
                message: '"value" does not match any of the allowed types',
                details: [
                    {
                        message: '"value" does not match any of the allowed types',
                        path: [],
                        type: 'alternatives.match',
                        context: {
                            message: '"value" must be one of [key]. "value" must be one of [5]. "c" is not allowed',
                            label: 'value',
                            value: { c: 5 },
                            details: [
                                {
                                    message: '"value" must be one of [key]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: { c: 5 }, valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: { c: 5 }, valids: [5], label: 'value' }
                                },
                                {
                                    message: '"c" is not allowed',
                                    path: ['c'],
                                    type: 'object.allowUnknown',
                                    context: { child: 'c', label: 'c', key: 'c', value: 5 }
                                }
                            ]
                        }
                    }
                ]
            }],
            [{}, true],
            [{ b: 'abc' }, true],
            [{ a: true, b: 'boom' }, true],
            [{ a: 5, b: 'a' }, false, null, {
                message: '"value" does not match any of the allowed types',
                details: [
                    {
                        message: '"value" does not match any of the allowed types',
                        path: [],
                        type: 'alternatives.match',
                        context: {
                            message: '"value" must be one of [key]. "value" must be one of [5]. "a" must be one of [true]',
                            label: 'value',
                            value: { a: 5, b: 'a' },
                            details: [
                                {
                                    message: '"value" must be one of [key]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: { a: 5, b: 'a' }, valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.allowOnly',
                                    context: { value: { a: 5, b: 'a' }, valids: [5], label: 'value' }
                                },
                                {
                                    message: '"a" must be one of [true]',
                                    path: ['a'],
                                    type: 'any.allowOnly',
                                    context: { label: 'a', key: 'a', value: 5, valids: [true] }
                                }
                            ]
                        }
                    }
                ]
            }]
        ]);
    });

    it('validates regex directly', async () => {

        await Joi.compile(/^5$/).validate('5');
        const err = await expect(Joi.compile(/.{2}/).validate('6')).to.reject();
        expect(err).to.be.an.error('"value" with value "6" fails to match the required pattern: /.{2}/');
        expect(err.details).to.equal([{
            message: '"value" with value "6" fails to match the required pattern: /.{2}/',
            path: [],
            type: 'string.regex.base',
            context: {
                name: undefined,
                pattern: /.{2}/,
                value: '6',
                label: 'value'
            }
        }]);
    });

    it('validated with', async () => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string()
        }).with('txt', 'upc');

        const err = await expect(schema.validate({ txt: 'a' }, { abortEarly: false })).to.reject();
        expect(err).to.be.an.error('"txt" missing required peer "upc"');
        expect(err.details).to.equal([{
            message: '"txt" missing required peer "upc"',
            path: ['txt'],
            type: 'object.with',
            context: {
                main: 'txt',
                mainWithLabel: 'txt',
                peer: 'upc',
                peerWithLabel: 'upc',
                label: 'txt',
                key: 'txt',
                value: { txt: 'a' }
            }
        }]);

        Helper.validate(schema, [
            [{ upc: 'test' }, true],
            [{ txt: 'test' }, false, null, {
                message: '"txt" missing required peer "upc"',
                details: [{
                    message: '"txt" missing required peer "upc"',
                    path: ['txt'],
                    type: 'object.with',
                    context: {
                        main: 'txt',
                        mainWithLabel: 'txt',
                        peer: 'upc',
                        peerWithLabel: 'upc',
                        label: 'txt',
                        key: 'txt',
                        value: { txt: 'test' }
                    }
                }]
            }],
            [{ txt: 'test', upc: null }, false, null, {
                message: '"upc" must be a string',
                details: [{
                    message: '"upc" must be a string',
                    path: ['upc'],
                    type: 'string.base',
                    context: { value: null, label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: 'test', upc: '' }, false, null, {
                message: '"upc" is not allowed to be empty',
                details: [{
                    message: '"upc" is not allowed to be empty',
                    path: ['upc'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: 'test', upc: undefined }, false, null, {
                message: '"txt" missing required peer "upc"',
                details: [{
                    message: '"txt" missing required peer "upc"',
                    path: ['txt'],
                    type: 'object.with',
                    context: {
                        main: 'txt',
                        mainWithLabel: 'txt',
                        peer: 'upc',
                        peerWithLabel: 'upc',
                        label: 'txt',
                        key: 'txt',
                        value: { txt: 'test', upc: undefined }
                    }
                }]
            }],
            [{ txt: 'test', upc: 'test' }, true]
        ]);
    });

    it('validated without', async () => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string()
        }).without('txt', 'upc');

        const err = await expect(schema.validate({ txt: 'a', upc: 'b' }, { abortEarly: false })).to.reject();
        expect(err).to.be.an.error('"txt" conflict with forbidden peer "upc"');
        expect(err.details).to.equal([{
            message: '"txt" conflict with forbidden peer "upc"',
            path: ['txt'],
            type: 'object.without',
            context: {
                main: 'txt',
                mainWithLabel: 'txt',
                peer: 'upc',
                peerWithLabel: 'upc',
                label: 'txt',
                key: 'txt',
                value: { txt: 'a', upc: 'b' }
            }
        }]);

        Helper.validate(schema, [
            [{ upc: 'test' }, true],
            [{ txt: 'test' }, true],
            [{ txt: 'test', upc: null }, false, null, {
                message: '"upc" must be a string',
                details: [{
                    message: '"upc" must be a string',
                    path: ['upc'],
                    type: 'string.base',
                    context: { value: null, label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: 'test', upc: '' }, false, null, {
                message: '"upc" is not allowed to be empty',
                details: [{
                    message: '"upc" is not allowed to be empty',
                    path: ['upc'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: 'test', upc: undefined }, true],
            [{ txt: 'test', upc: 'test' }, false, null, {
                message: '"txt" conflict with forbidden peer "upc"',
                details: [{
                    message: '"txt" conflict with forbidden peer "upc"',
                    path: ['txt'],
                    type: 'object.without',
                    context: {
                        main: 'txt',
                        mainWithLabel: 'txt',
                        peer: 'upc',
                        peerWithLabel: 'upc',
                        label: 'txt',
                        key: 'txt',
                        value: { txt: 'test', upc: 'test' }
                    }
                }]
            }]
        ]);
    });

    it('validates xor', async () => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string()
        }).xor('txt', 'upc');

        const err = await expect(schema.validate({}, { abortEarly: false })).to.reject();
        expect(err).to.be.an.error('"value" must contain at least one of [txt, upc]');
        expect(err.details).to.equal([{
            message: '"value" must contain at least one of [txt, upc]',
            path: [],
            type: 'object.missing',
            context: {
                peers: ['txt', 'upc'],
                peersWithLabels: ['txt', 'upc'],
                label: 'value',
                value: {}
            }
        }]);

        Helper.validate(schema, [
            [{ upc: null }, false, null, {
                message: '"upc" must be a string',
                details: [{
                    message: '"upc" must be a string',
                    path: ['upc'],
                    type: 'string.base',
                    context: { value: null, label: 'upc', key: 'upc' }
                }]
            }],
            [{ upc: 'test' }, true],
            [{ txt: null }, false, null, {
                message: '"txt" must be a string',
                details: [{
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: 'test' }, true],
            [{ txt: 'test', upc: null }, false, null, {
                message: '"upc" must be a string',
                details: [{
                    message: '"upc" must be a string',
                    path: ['upc'],
                    type: 'string.base',
                    context: { value: null, label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: 'test', upc: '' }, false, null, {
                message: '"upc" is not allowed to be empty',
                details: [{
                    message: '"upc" is not allowed to be empty',
                    path: ['upc'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: '', upc: 'test' }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: null, upc: 'test' }, false, null, {
                message: '"txt" must be a string',
                details: [{
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: undefined, upc: 'test' }, true],
            [{ txt: 'test', upc: undefined }, true],
            [{ txt: '', upc: undefined }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: '' }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: 'test', upc: 'test' }, false, null, {
                message: '"value" contains a conflict between exclusive peers [txt, upc]',
                details: [{
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
            [{}, false, null, {
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
            [{ code: 456, upc: 123 }, false, null, {
                message: '"value" contains a conflict between exclusive peers [code, upc]',
                details: [{
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
                }]
            }],
            [{}, false, null, {
                message: '"value" must contain at least one of [code, upc]',
                details: [{
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
            }]
        ]);
    });

    it('validates xor when empty value of peer allowed', () => {

        const schema = Joi.object({
            code: Joi.string(),
            upc: Joi.string().allow('')
        }).xor('code', 'upc');

        Helper.validate(schema, [
            [{ upc: '' }, true],
            [{ upc: '123' }, true],
            [{ code: '456' }, true],
            [{ code: '456', upc: '' }, false, null, {
                message: '"value" contains a conflict between exclusive peers [code, upc]',
                details: [{
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
                }]
            }],
            [{}, false, null, {
                message: '"value" must contain at least one of [code, upc]',
                details: [{
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
            }]
        ]);
    });

    it('validates or()', async () => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string().allow(null, ''),
            code: Joi.number()
        }).or('txt', 'upc', 'code');

        const err = await expect(schema.validate({}, { abortEarly: false })).to.reject();
        expect(err).to.be.an.error('"value" must contain at least one of [txt, upc, code]');
        expect(err.details).to.equal([{
            message: '"value" must contain at least one of [txt, upc, code]',
            path: [],
            type: 'object.missing',
            context: {
                peers: ['txt', 'upc', 'code'],
                peersWithLabels: ['txt', 'upc', 'code'],
                label: 'value',
                value: {}
            }
        }]);

        Helper.validate(schema, [
            [{ upc: null }, true],
            [{ upc: 'test' }, true],
            [{ txt: null }, false, null, {
                message: '"txt" must be a string',
                details: [{
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: 'test' }, true],
            [{ code: null }, false, null, {
                message: '"code" must be a number',
                details: [{
                    message: '"code" must be a number',
                    path: ['code'],
                    type: 'number.base',
                    context: { label: 'code', key: 'code', value: null }
                }]
            }],
            [{ code: 123 }, true],
            [{ txt: 'test', upc: null }, true],
            [{ txt: 'test', upc: '' }, true],
            [{ txt: '', upc: 'test' }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: null, upc: 'test' }, false, null, {
                message: '"txt" must be a string',
                details: [{
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: undefined, upc: 'test' }, true],
            [{ txt: 'test', upc: undefined }, true],
            [{ txt: 'test', upc: '' }, true],
            [{ txt: 'test', upc: null }, true],
            [{ txt: '', upc: undefined }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: undefined, code: 999 }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: undefined, code: undefined }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: '' }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: 'test', upc: 'test' }, true],
            [{ txt: 'test', upc: 'test', code: 322 }, true]
        ]);
    });

    it('validates and()', async () => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string().allow(null, ''),
            code: Joi.number()
        }).and('txt', 'upc', 'code');

        const err = await expect(schema.validate({ txt: 'x' }, { abortEarly: false })).to.reject();
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
            [{ upc: null }, false, null, {
                message: '"value" contains [upc] without its required peers [txt, code]',
                details: [{
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
                }]
            }],
            [{ upc: 'test' }, false, null, {
                message: '"value" contains [upc] without its required peers [txt, code]',
                details: [{
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
                }]
            }],
            [{ txt: null }, false, null, {
                message: '"txt" must be a string',
                details: [{
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: 'test' }, false, null, {
                message: '"value" contains [txt] without its required peers [upc, code]',
                details: [{
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
                }]
            }],
            [{ code: null }, false, null, {
                message: '"code" must be a number',
                details: [{
                    message: '"code" must be a number',
                    path: ['code'],
                    type: 'number.base',
                    context: { label: 'code', key: 'code', value: null }
                }]
            }],
            [{ code: 123 }, false, null, {
                message: '"value" contains [code] without its required peers [txt, upc]',
                details: [{
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
                }]
            }],
            [{ txt: 'test', upc: null }, false, null, {
                message: '"value" contains [txt, upc] without its required peers [code]',
                details: [{
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
                }]
            }],
            [{ txt: 'test', upc: '' }, false, null, {
                message: '"value" contains [txt, upc] without its required peers [code]',
                details: [{
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
                }]
            }],
            [{ txt: '', upc: 'test' }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: null, upc: 'test' }, false, null, {
                message: '"txt" must be a string',
                details: [{
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: undefined, upc: 'test' }, false, null, {
                message: '"value" contains [upc] without its required peers [txt, code]',
                details: [{
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
                }]
            }],
            [{ txt: 'test', upc: undefined }, false, null, {
                message: '"value" contains [txt] without its required peers [upc, code]',
                details: [{
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
                }]
            }],
            [{ txt: 'test', upc: '' }, false, null, {
                message: '"value" contains [txt, upc] without its required peers [code]',
                details: [{
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
                }]
            }],
            [{ txt: 'test', upc: null }, false, null, {
                message: '"value" contains [txt, upc] without its required peers [code]',
                details: [{
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
                }]
            }],
            [{ txt: '', upc: undefined }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: undefined, code: 999 }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: undefined, code: undefined }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: '' }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: 'test', upc: 'test' }, false, null, {
                message: '"value" contains [txt, upc] without its required peers [code]',
                details: [{
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
                }]
            }],
            [{ txt: 'test', upc: 'test', code: 322 }, true],
            [{ txt: 'test', upc: null, code: 322 }, true]
        ]);
    });

    it('validates nand()', async () => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string().allow(null, ''),
            code: Joi.number()
        }).nand('txt', 'upc', 'code');

        const err = await expect(schema.validate({ txt: 'x', upc: 'y', code: 123 }, { abortEarly: false })).to.reject();
        expect(err).to.be.an.error('"txt" must not exist simultaneously with [upc, code]');
        expect(err.details).to.equal([{
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
        }]);

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
            [{ txt: 'test', upc: 'test', code: 322 }, false, null, {
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
                        value: { txt: 'test', upc: 'test', code: 322 }
                    }
                }]
            }],
            [{ txt: 'test', upc: null, code: 322 }, false, null, {
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
                        value: { txt: 'test', upc: null, code: 322 }
                    }
                }]
            }]
        ]);
    });

    it('validates an array of valid types', async () => {

        const schema = Joi.object({
            auth: [
                Joi.object({
                    mode: Joi.string().valid('required', 'optional', 'try').allow(null)
                }).allow(null),
                Joi.string(),
                Joi.boolean()
            ]
        });

        const err = await expect(schema.validate({ auth: { mode: 'none' } })).to.reject('"auth" does not match any of the allowed types');
        expect(err.details[0].context.details).to.equal([
            {
                message: '"auth.mode" must be one of [required, optional, try, null]',
                path: ['auth', 'mode'],
                type: 'any.allowOnly',
                context: { value: 'none', valids: ['required', 'optional', 'try', null], label: 'auth.mode', key: 'mode' }
            },
            {
                message: '"auth" must be a string',
                path: ['auth'],
                type: 'string.base',
                context: { value: { mode: 'none' }, label: 'auth', key: 'auth' }
            },
            {
                message: '"auth" must be a boolean',
                path: ['auth'],
                type: 'boolean.base',
                context: { label: 'auth', key: 'auth', value: { mode: 'none' } }
            }
        ]);

        Helper.validate(schema, [
            [{ auth: { mode: 'try' } }, true],
            [{ something: undefined }, false, null, {
                message: '"something" is not allowed',
                details: [{
                    message: '"something" is not allowed',
                    path: ['something'],
                    type: 'object.allowUnknown',
                    context: { child: 'something', label: 'something', key: 'something' }
                }]
            }],
            [{ auth: { something: undefined } }, false, null, {
                message: '"auth" does not match any of the allowed types',
                details: [
                    {
                        message: '"auth" does not match any of the allowed types',
                        path: ['auth'],
                        type: 'alternatives.match',
                        context: {
                            message: '"auth.something" is not allowed. "auth" must be a string. "auth" must be a boolean',
                            label: 'auth',
                            key: 'auth',
                            value: { something: undefined },
                            details: [
                                {
                                    message: '"auth.something" is not allowed',
                                    path: ['auth', 'something'],
                                    type: 'object.allowUnknown',
                                    context: { child: 'something', label: 'auth.something', key: 'something' }
                                },
                                {
                                    message: '"auth" must be a string',
                                    path: ['auth'],
                                    type: 'string.base',
                                    context: { value: { something: undefined }, label: 'auth', key: 'auth' }
                                },
                                {
                                    message: '"auth" must be a boolean',
                                    path: ['auth'],
                                    type: 'boolean.base',
                                    context: { label: 'auth', key: 'auth', value: { something: undefined } }
                                }
                            ]
                        }
                    }
                ]
            }],
            [{ auth: null }, true],
            [{ auth: undefined }, true],
            [{}, true],
            [{ auth: true }, true],
            [{ auth: 123 }, false, null, {
                message: '"auth" must be one of [object, string, boolean]',
                details: [
                    {
                        message: '"auth" must be one of [object, string, boolean]',
                        path: ['auth'],
                        type: 'alternatives.types',
                        context: { types: ['object', 'string', 'boolean'], label: 'auth', key: 'auth', value: 123 }
                    }
                ]
            }]
        ]);
    });

    it('validates alternatives', async () => {

        const schema = Joi.object({
            auth: Joi.alternatives([
                Joi.object({
                    mode: Joi.string().valid('required', 'optional', 'try').allow(null)
                }).allow(null),
                Joi.string(),
                Joi.boolean()
            ])
        });

        const err = await expect(schema.validate({ auth: { mode: 'none' } })).to.reject('"auth" does not match any of the allowed types');
        expect(err.details[0].context.details).to.equal([
            {
                message: '"auth.mode" must be one of [required, optional, try, null]',
                path: ['auth', 'mode'],
                type: 'any.allowOnly',
                context: { value: 'none', valids: ['required', 'optional', 'try', null], label: 'auth.mode', key: 'mode' }
            },
            {
                message: '"auth" must be a string',
                path: ['auth'],
                type: 'string.base',
                context: { value: { mode: 'none' }, label: 'auth', key: 'auth' }
            },
            {
                message: '"auth" must be a boolean',
                path: ['auth'],
                type: 'boolean.base',
                context: { label: 'auth', key: 'auth', value: { mode: 'none' } }
            }
        ]);

        Helper.validate(schema, [
            [{ auth: { mode: 'try' } }, true],
            [{ something: undefined }, false, null, {
                message: '"something" is not allowed',
                details: [{
                    message: '"something" is not allowed',
                    path: ['something'],
                    type: 'object.allowUnknown',
                    context: { child: 'something', label: 'something', key: 'something' }
                }]
            }],
            [{ auth: { something: undefined } }, false, null, {
                message: '"auth" does not match any of the allowed types',
                details: [
                    {
                        message: '"auth" does not match any of the allowed types',
                        path: ['auth'],
                        type: 'alternatives.match',
                        context: {
                            message: '"auth.something" is not allowed. "auth" must be a string. "auth" must be a boolean',
                            key: 'auth',
                            label: 'auth',
                            value: { something: undefined },
                            details: [
                                {
                                    message: '"auth.something" is not allowed',
                                    path: ['auth', 'something'],
                                    type: 'object.allowUnknown',
                                    context: { child: 'something', label: 'auth.something', key: 'something' }
                                },
                                {
                                    message: '"auth" must be a string',
                                    path: ['auth'],
                                    type: 'string.base',
                                    context: { value: { something: undefined }, label: 'auth', key: 'auth' }
                                },
                                {
                                    message: '"auth" must be a boolean',
                                    path: ['auth'],
                                    type: 'boolean.base',
                                    context: { label: 'auth', key: 'auth', value: { something: undefined } }
                                }
                            ]
                        }
                    }
                ]
            }],
            [{ auth: null }, true],
            [{ auth: undefined }, true],
            [{}, true],
            [{ auth: true }, true],
            [{ auth: 123 }, false, null, {
                message: '"auth" must be one of [object, string, boolean]',
                details: [
                    {
                        message: '"auth" must be one of [object, string, boolean]',
                        path: ['auth'],
                        type: 'alternatives.types',
                        context: { types: ['object', 'string', 'boolean'], label: 'auth', key: 'auth', value: 123 }
                    }
                ]
            }]
        ]);
    });

    it('validates required alternatives', () => {

        const schema = {
            a: Joi.alternatives([
                Joi.string().required(),
                Joi.boolean().required()
            ])
        };

        Helper.validate(schema, [
            [{ a: null }, false, null, {
                message: '"a" must be one of [string, boolean]',
                details: [
                    {
                        message: '"a" must be one of [string, boolean]',
                        path: ['a'],
                        type: 'alternatives.types',
                        context: { types: ['string', 'boolean'], label: 'a', key: 'a', value: null }
                    }
                ]
            }],
            [{ a: undefined }, true],
            [{}, true],
            [{ a: true }, true],
            [{ a: 'true' }, true],
            [{ a: 123 }, false, null, {
                message: '"a" must be one of [string, boolean]',
                details: [
                    {
                        message: '"a" must be one of [string, boolean]',
                        path: ['a'],
                        type: 'alternatives.types',
                        context: { types: ['string', 'boolean'], label: 'a', key: 'a', value: 123 }
                    }
                ]
            }],
            [{ a: { c: 1 } }, false, null, {
                message: '"a" must be one of [string, boolean]',
                details: [
                    {
                        message: '"a" must be one of [string, boolean]',
                        path: ['a'],
                        type: 'alternatives.types',
                        context: { types: ['string', 'boolean'], label: 'a', key: 'a', value: { c: 1 } }
                    }
                ]
            }],
            [{ b: undefined }, false, null, {
                message: '"b" is not allowed',
                details: [{
                    message: '"b" is not allowed',
                    path: ['b'],
                    type: 'object.allowUnknown',
                    context: { child: 'b', label: 'b', key: 'b' }
                }]
            }]
        ]);
    });

    it('validates required [] alternatives', () => {

        const schema = {
            a: [
                Joi.string().required(),
                Joi.boolean().required()
            ]
        };

        Helper.validate(schema, [
            [{ a: null }, false, null, {
                message: '"a" must be one of [string, boolean]',
                details: [
                    {
                        message: '"a" must be one of [string, boolean]',
                        path: ['a'],
                        type: 'alternatives.types',
                        context: { types: ['string', 'boolean'], label: 'a', key: 'a', value: null }
                    }
                ]
            }],
            [{ a: undefined }, true],
            [{}, true],
            [{ a: true }, true],
            [{ a: 'true' }, true],
            [{ a: 123 }, false, null, {
                message: '"a" must be one of [string, boolean]',
                details: [
                    {
                        message: '"a" must be one of [string, boolean]',
                        path: ['a'],
                        type: 'alternatives.types',
                        context: { types: ['string', 'boolean'], label: 'a', key: 'a', value: 123 }
                    }
                ]
            }],
            [{ a: { c: 1 } }, false, null, {
                message: '"a" must be one of [string, boolean]',
                details: [
                    {
                        message: '"a" must be one of [string, boolean]',
                        path: ['a'],
                        type: 'alternatives.types',
                        context: { types: ['string', 'boolean'], label: 'a', key: 'a', value: { c: 1 } }
                    }
                ]
            }],
            [{ b: undefined }, false, null, {
                message: '"b" is not allowed',
                details: [{
                    message: '"b" is not allowed',
                    path: ['b'],
                    type: 'object.allowUnknown',
                    context: { child: 'b', label: 'b', key: 'b' }
                }]
            }]
        ]);
    });

    it('validates an array of string with valid', () => {

        const schema = {
            brand: Joi.array().items(Joi.string().valid('amex', 'visa'))
        };

        Helper.validate(schema, [
            [{ brand: ['amex'] }, true],
            [{ brand: ['visa', 'mc'] }, false, null, {
                message: '"brand[1]" must be one of [amex, visa]',
                details: [{
                    message: '"brand[1]" must be one of [amex, visa]',
                    path: ['brand', 1],
                    type: 'any.allowOnly',
                    context: { value: 'mc', valids: ['amex', 'visa'], label: 'brand[1]', key: 1 }
                }]
            }]
        ]);
    });

    it('validates pre and post convert value', () => {

        const schema = Joi.number().valid(5);

        Helper.validate(schema, [
            [5, true],
            ['5', true]
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

    it('does not set optional keys when missing', async () => {

        const schema = Joi.object({
            a: Joi.number()
        });

        const obj = {};

        const value = await schema.validate(obj);
        expect(value.hasOwnProperty('a')).to.equal(false);
    });

    it('invalidates pre and post convert value', () => {

        const schema = Joi.number().invalid(5);

        Helper.validate(schema, [
            [5, false, null, {
                message: '"value" contains an invalid value',
                details: [{
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 5, invalids: [Infinity, -Infinity, 5], label: 'value' }
                }]
            }],
            ['5', false, null, {
                message: '"value" contains an invalid value',
                details: [{
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 5, invalids: [Infinity, -Infinity, 5], label: 'value' }
                }]
            }]
        ]);
    });

    it('invalidates missing peers', async () => {

        const schema = Joi.object({
            username: Joi.string(),
            password: Joi.string()
        }).with('username', 'password').without('password', 'access_token');

        await expect(schema.validate({ username: 'bob' })).to.reject();
    });

    it('validates config where the root item is a joi type', async () => {

        await Joi.boolean().allow(null).validate(true);
        await Joi.object().validate({ auth: { mode: 'try' } });
        await expect(Joi.object().validate(true)).to.reject('"value" must be an object');
        await expect(Joi.string().validate(true)).to.reject('"value" must be a string');
        await Joi.string().email().validate('test@test.com');
        await Joi.object({ param: Joi.string().required() }).validate({ param: 'item' });
    });

    it('converts string to number', async () => {

        const schema = Joi.object({
            a: Joi.number()
        });

        const input = { a: '5' };
        const value = await schema.validate(input);
        expect(value.a).to.equal(5);
        expect(input.a).to.equal('5');
    });

    it('allows unknown keys in objects if no schema was given', async () => {

        await Joi.object().validate({ foo: 'bar' });
    });

    it('fails on unknown keys in objects if a schema was given', async () => {

        const err = await expect(Joi.object({}).validate({ foo: 'bar' })).to.reject();
        expect(err).to.be.an.error('"foo" is not allowed');
        expect(err.details).to.equal([{
            message: '"foo" is not allowed',
            path: ['foo'],
            type: 'object.allowUnknown',
            context: { child: 'foo', label: 'foo', key: 'foo', value: 'bar' }
        }]);

        const err2 = await expect(Joi.compile({}).validate({ foo: 'bar' })).to.reject();
        expect(err2.message).to.equal('"foo" is not allowed');

        const err3 = await expect(Joi.compile({ other: Joi.number() }).validate({ foo: 'bar' })).to.reject();
        expect(err3.message).to.equal('"foo" is not allowed');
    });

    it('validates an unknown option', async () => {

        const config = {
            auth: Joi.object({
                mode: Joi.string().valid('required', 'optional', 'try').allow(null)
            }).allow(null)
        };

        const err = await expect(Joi.compile(config).validate({ auth: { unknown: true } })).to.reject();
        expect(err.message).to.contain('"auth.unknown" is not allowed');

        const err2 = await expect(Joi.compile(config).validate({ something: false })).to.reject();
        expect(err2.message).to.contain('"something" is not allowed');
    });

    it('validates required key with multiple options', async () => {

        const config = {
            module: Joi.alternatives([
                Joi.object({
                    compile: Joi.func().required(),
                    execute: Joi.func()
                }),
                Joi.string()
            ]).required()
        };

        const err = await expect(Joi.compile(config).validate({})).to.reject();
        expect(err.message).to.contain('"module" is required');

        await Joi.compile(config).validate({ module: 'test' });

        const err2 = await expect(Joi.compile(config).validate({ module: {} })).to.reject('"module" does not match any of the allowed types');
        expect(err2.details[0].context.message).to.equal('"module.compile" is required. "module" must be a string');

        await Joi.compile(config).validate({ module: { compile: function () { } } });
    });

    it('validates key with required alternatives', async () => {

        const config = {
            module: Joi.alt().try(
                Joi.object({
                    compile: Joi.func().required(),
                    execute: Joi.func()
                }).required(),
                Joi.string().required()
            )
        };

        await Joi.compile(config).validate({});
    });

    it('validates required key with alternatives', async () => {

        const config = {
            module: Joi.alt().try([
                Joi.object({
                    compile: Joi.func().required(),
                    execute: Joi.func()
                }),
                Joi.string()
            ]).required()
        };

        const err = await expect(Joi.compile(config).validate({})).to.reject();
        expect(err.message).to.contain('"module" is required');
    });

    it('does not require optional numbers', async () => {

        const config = {
            position: Joi.number(),
            suggestion: Joi.string()
        };

        await Joi.compile(config).validate({ suggestion: 'something' });
        await Joi.compile(config).validate({ position: 1 });
    });

    it('does not require optional objects', async () => {

        const config = {
            position: Joi.number(),
            suggestion: Joi.object()
        };

        await Joi.compile(config).validate({ suggestion: {} });
        await Joi.compile(config).validate({ position: 1 });
    });

    it('validates object successfully when config has an array of types', async () => {

        const schema = {
            f: [Joi.number(), Joi.boolean()],
            g: [Joi.string(), Joi.object()]
        };

        const obj = {
            f: true,
            g: 'test'
        };

        await Joi.compile(schema).validate(obj);
    });

    it('validates object successfully when config allows for optional key and key is missing', async () => {

        const schema = {
            h: Joi.number(),
            i: Joi.string(),
            j: Joi.object()
        };

        const obj = {
            h: 12,
            i: 'test'
        };

        await Joi.compile(schema).validate(obj);
    });

    it('fails validation', async () => {

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

        await expect(Joi.compile(schema).validate(obj)).to.reject();
    });

    it('fails validation when the wrong types are supplied', async () => {

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

        await expect(Joi.compile(schema).validate(obj)).to.reject();
    });

    it('fails validation when missing a required parameter', async () => {

        const obj = {
            c: 10
        };

        await expect(Joi.compile({ a: Joi.string().required() }).validate(obj)).to.reject();
    });

    it('fails validation when missing a required parameter within an object config', async () => {

        const obj = {
            a: {}
        };

        await expect(Joi.compile({ a: Joi.object({ b: Joi.string().required() }) }).validate(obj)).to.reject();
    });

    it('fails validation when parameter is required to be an object but is given as string', async () => {

        const obj = {
            a: 'a string'
        };

        await expect(Joi.compile({ a: Joi.object({ b: Joi.string().required() }) }).validate(obj)).to.reject();
    });

    it('validates when parameter is required to be an object and is given correctly as a json string', async () => {

        const schema = Joi.object({
            a: Joi.object({
                b: Joi.string().required()
            })
        });

        const input = {
            a: '{"b":"string"}'
        };

        const value = await schema.validate(input);
        expect(input.a).to.equal('{"b":"string"}');
        expect(value.a.b).to.equal('string');
    });

    it('fails validation when parameter is required to be an object but is given as a json string that is incorrect (number instead of string)', async () => {

        const obj = {
            a: '{"b":2}'
        };

        await expect(Joi.object({ a: Joi.object({ b: Joi.string().required() }) }).validate(obj)).to.reject();
    });

    it('fails validation when parameter is required to be an Array but is given as string', async () => {

        const obj = {
            a: 'an array'
        };

        await expect(Joi.object({ a: Joi.array() }).validate(obj)).to.reject();
    });

    it('validates when parameter is required to be an Array and is given correctly as a json string', async () => {

        const obj = {
            a: '[1,2]'
        };

        await Joi.object({ a: Joi.array() }).validate(obj);
    });

    it('fails validation when parameter is required to be an Array but is given as a json that is incorrect (object instead of array)', async () => {

        const obj = {
            a: '{"b":2}'
        };

        await expect(Joi.object({ a: Joi.object({ b: Joi.string().required() }) }).validate(obj)).to.reject();
    });

    it('fails validation when config is an array and fails', async () => {

        const schema = {
            d: [Joi.string(), Joi.boolean()],
            e: [Joi.number(), Joi.object()]
        };

        const obj = {
            d: 10,
            e: 'a'
        };

        await expect(Joi.compile(schema).validate(obj)).to.reject();
    });

    it('fails validation when config is an array and fails with extra keys', async () => {

        const schema = {
            d: [Joi.string(), Joi.boolean()],
            e: [Joi.number(), Joi.object()]
        };

        const obj = {
            a: 10,
            b: 'a'
        };

        await expect(Joi.compile(schema).validate(obj)).to.reject();
    });

    it('fails validation with extra keys', async () => {

        const schema = {
            a: Joi.number()
        };

        const obj = {
            a: 1,
            b: 'a'
        };

        await expect(Joi.compile(schema).validate(obj)).to.reject();
    });

    it('validates missing optional key with string condition', async () => {

        const schema = {
            key: Joi.string().alphanum(false).min(8)
        };

        await Joi.compile(schema).validate({});
    });

    it('validates with extra keys and remove them when stripUnknown is set', async () => {

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

        const value = await schema.validate(obj, { stripUnknown: true, allowUnknown: true });
        expect(value).to.equal({ a: 1, b: 'a' });
    });

    it('validates with extra keys and remove them when stripUnknown (as an object) is set', async () => {

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

        const value = await schema.validate(obj, { stripUnknown: { arrays: false, objects: true }, allowUnknown: true });
        expect(value).to.equal({ a: 1, b: 'a' });
    });

    it('validates dependencies when stripUnknown is set', async () => {

        const schema = Joi.object({
            a: Joi.number(),
            b: Joi.string()
        }).and('a', 'b');

        const obj = {
            a: 1,
            foo: 'bar'
        };

        const err = await expect(schema.validate(obj, { stripUnknown: true })).to.reject();
        expect(err).to.be.an.error('"value" contains [a] without its required peers [b]');
        expect(err.details).to.equal([{
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
        }]);
    });

    it('validates dependencies when stripUnknown (as an object) is set', async () => {

        const schema = Joi.object({
            a: Joi.number(),
            b: Joi.string()
        })
            .and('a', 'b');

        const obj = {
            a: 1,
            foo: 'bar'
        };

        const err = await expect(schema.validate(obj, { stripUnknown: { arrays: false, objects: true } })).to.reject();
        expect(err).to.be.an.error('"value" contains [a] without its required peers [b]');
        expect(err.details).to.equal([{
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
        }]);
    });

    it('fails to validate with incorrect property when asked to strip unknown keys without aborting early', async () => {

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

        await expect(schema.validate(obj, { stripUnknown: true, abortEarly: false })).to.reject();
    });

    it('fails to validate with incorrect property when asked to strip unknown keys (as an object) without aborting early', async () => {

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

        await expect(schema.validate(obj, { stripUnknown: { arrays: false, objects: true }, abortEarly: false })).to.reject();
    });

    it('should pass validation with extra keys when allowUnknown is set', async () => {

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

        const value = await schema.validate(obj, { allowUnknown: true });
        expect(value).to.equal({ a: 1, b: 'a', d: 'c' });
    });

    it('should pass validation with extra keys set', async () => {

        const localConfig = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c')
        }).prefs({ allowUnknown: true });

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        const value = await localConfig.validate(obj);
        expect(value).to.equal({ a: 1, b: 'a', d: 'c' });

        const value2 = await localConfig.validate(value);
        expect(value2).to.equal({ a: 1, b: 'a', d: 'c' });
    });

    it('should pass validation with extra keys and remove them when stripUnknown is set locally', async () => {

        const localConfig = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c')
        }).prefs({ stripUnknown: true, allowUnknown: true });

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        const value = await localConfig.validate(obj);
        expect(value).to.equal({ a: 1, b: 'a' });

        const value2 = await localConfig.validate(value);
        expect(value2).to.equal({ a: 1, b: 'a' });
    });

    it('should pass validation with extra keys and remove them when stripUnknown (as an object) is set locally', async () => {

        const localConfig = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c')
        }).prefs({ stripUnknown: { arrays: false, objects: true }, allowUnknown: true });

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        const value = await localConfig.validate(obj);
        expect(value).to.equal({ a: 1, b: 'a' });

        const value2 = await localConfig.validate(value);
        expect(value2).to.equal({ a: 1, b: 'a' });
    });

    it('should work when the skipFunctions setting is enabled', async () => {

        const schema = Joi.object({ username: Joi.string() }).prefs({ skipFunctions: true });
        const input = { username: 'test', func: function () { } };
        await schema.validate(input);
    });

    it('should work when the skipFunctions setting is disabled', async () => {

        const schema = Joi.object({ username: Joi.string() });
        const input = { username: 'test', func: function () { } };

        const err = await expect(schema.validate(input, { skipFunctions: false })).to.reject();
        expect(err.message).to.contain('"func" is not allowed');
    });

    it('should not convert values when convert is false', async () => {

        const schema = Joi.object({
            arr: Joi.array().items(Joi.string())
        });

        const input = { arr: 'foo' };
        await expect(schema.validate(input, { convert: false })).to.reject();
    });

    it('full errors when abortEarly is false', async () => {

        const schema = Joi.object({
            a: Joi.string(),
            b: Joi.string()
        });

        const input = { a: 1, b: 2 };

        const errOne = await expect(schema.validate(input)).to.reject();
        const errFull = await expect(schema.validate(input, { abortEarly: false })).to.reject();
        expect(errFull.details.length).to.be.greaterThan(errOne.details.length);
    });

    it('errors multiple times when abortEarly is false in a complex object', async () => {

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

        const err = await expect(schema.validate(input, { abortEarly: false })).to.reject();
        expect(err.details).to.have.length(6);
        expect(err.details).to.equal([{
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
            context: { limit: 3, value: 'test1', key: 'foo', label: 'test2.test3[2].baz.test4[0].foo', encoding: undefined }
        }, {
            message: '"test2.test3[2].baz.test4[0].baz" is not allowed',
            path: ['test2', 'test3', 2, 'baz', 'test4', 0, 'baz'],
            type: 'object.allowUnknown',
            context: { key: 'baz', label: 'test2.test3[2].baz.test4[0].baz', child: 'baz', value: '123' }
        }]);
    });

    it('validates using the root any object', () => {

        const result = Joi.validate('abc');
        expect(result.error).to.not.exist();
        expect(result.value).to.equal('abc');
    });

    it('accepts no options', async () => {

        await Joi.string().validate('test');

        const result = Joi.string().validate('test');
        expect(result.error).to.not.exist();
        expect(result.value).to.equal('test');

        await expect(Joi.number().validate('5', { convert: false })).to.reject();
        expect(Joi.number().validate('5', { convert: false }).error).to.exist();
    });

    it('accepts null options', async () => {

        await Joi.string().validate('test', null);
    });

    it('accepts undefined options', async () => {

        await Joi.string().validate('test', undefined);
    });

    describe('describe()', () => {

        const defaultFn = function () {

            return 'test';
        };

        defaultFn.description = 'testing';

        const defaultDescribedFn = function () {

            return 'test';
        };

        const defaultRef = Joi.ref('xor');

        const schema = Joi.object({
            sub: {
                email: Joi.string().email(),
                domain: Joi.string().domain(),
                date: Joi.date(),
                child: Joi.object({
                    alphanum: Joi.string().alphanum()
                })
            },
            min: [Joi.number(), Joi.string().min(3)],
            max: Joi.string().max(3).default(0).failover(1),
            required: Joi.string().required(),
            xor: Joi.string(),
            renamed: Joi.string().valid('456'),
            notEmpty: Joi.string().required().description('a').notes('b').tags('c'),
            empty: Joi.string().empty('').strip(),
            defaultRef: Joi.string().default(defaultRef, 'not here'),
            defaultFn: Joi.string().default(defaultFn, 'not here'),
            defaultDescribedFn: Joi.string().default(defaultDescribedFn, 'described test')
        })
            .prefs({ abortEarly: false, convert: false })
            .rename('renamed', 'required')
            .without('required', 'xor')
            .without('xor', 'required');

        const result = {
            type: 'object',
            children: {
                sub: {
                    type: 'object',
                    children: {
                        email: {
                            type: 'string',
                            invalids: [''],
                            rules: [{ name: 'email', arg: {} }]
                        },
                        domain: {
                            type: 'string',
                            invalids: [''],
                            rules: [{ name: 'domain' }]
                        },
                        date: {
                            type: 'date'
                        },
                        child: {
                            type: 'object',
                            children: {
                                alphanum: {
                                    type: 'string',
                                    invalids: [''],
                                    rules: [{ name: 'alphanum' }]
                                }
                            }
                        }
                    }
                },
                min: {
                    type: 'alternatives',
                    alternatives: [
                        {
                            type: 'number',
                            invalids: [Infinity, -Infinity],
                            flags: { unsafe: false }
                        },
                        {
                            type: 'string',
                            invalids: [''],
                            rules: [{ name: 'min', arg: { limit: 3 } }]
                        }
                    ]
                },
                max: {
                    type: 'string',
                    flags: {
                        default: 0,
                        failover: 1
                    },
                    invalids: [''],
                    rules: [{ name: 'max', arg: { limit: 3 } }]
                },
                required: {
                    type: 'string',
                    flags: {
                        presence: 'required'
                    },
                    invalids: ['']
                },
                xor: {
                    type: 'string',
                    invalids: ['']
                },
                renamed: {
                    type: 'string',
                    flags: {
                        allowOnly: true
                    },
                    valids: ['456'],
                    invalids: ['']
                },
                notEmpty: {
                    type: 'string',
                    flags: {
                        presence: 'required'
                    },
                    description: 'a',
                    notes: ['b'],
                    tags: ['c'],
                    invalids: ['']
                },
                empty: {
                    type: 'string',
                    flags: {
                        empty: {
                            type: 'string',
                            flags: {
                                allowOnly: true
                            },
                            valids: ['']
                        },
                        strip: true
                    },
                    invalids: ['']
                },
                defaultRef: {
                    type: 'string',
                    flags: {
                        default: {
                            ref: 'value',
                            key: 'xor',
                            path: ['xor']
                        }
                    },
                    invalids: ['']
                },
                defaultFn: {
                    type: 'string',
                    flags: {
                        default: {
                            description: 'testing',
                            function: defaultFn
                        }
                    },
                    invalids: ['']
                },
                defaultDescribedFn: {
                    type: 'string',
                    flags: {
                        default: {
                            description: 'described test',
                            function: defaultDescribedFn
                        }
                    },
                    invalids: ['']
                }
            },
            dependencies: [
                {
                    type: 'without',
                    key: 'required',
                    peers: ['xor']
                },
                {
                    type: 'without',
                    key: 'xor',
                    peers: ['required']
                }
            ],
            renames: [
                {
                    from: 'renamed',
                    to: 'required',
                    options: {
                        alias: false,
                        multiple: false,
                        override: false
                    }
                }
            ],
            options: {
                abortEarly: false,
                convert: false
            }
        };

        it('describes schema (direct)', () => {

            const description = schema.describe();
            expect(description).to.equal(result);
            expect(description.children.defaultRef.flags.default).to.equal({ ref: 'value', key: 'xor', path: ['xor'] });
            expect(description.children.defaultFn.flags.default.description).to.equal('testing');
            expect(description.children.defaultDescribedFn.flags.default.description).to.equal('described test');
        });

        it('describes schema (root)', () => {

            const description = schema.describe();
            expect(description).to.equal(result);
        });

        it('describes schema (any)', () => {

            const any = Joi;
            const description = any.describe();
            expect(description).to.equal({
                type: 'any'
            });
        });

        it('describes schema without invalids', () => {

            const description = Joi.allow(null).describe();
            expect(description.invalids).to.not.exist();
        });

        it('includes schemas in description)', () => {

            const description = schema.describe();
            expect(description).to.equal(result);
            expect(description[Joi.schema]).to.equal(schema);
        });
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

            try {
                Joi.attempt({}, Joi.object().keys({ a: Joi.required(), b: Joi.required() }), 'the reasons are', { abortEarly: false });
                throw new Error('should not reach that');
            }
            catch (err) {
                expect(err.message.match(/the reasons are/)).to.not.equal(null);
                expect(err.details.length).to.equal(2);
            }
        });

        it('throws on invalid value with message as error even with abortEarly: false', () => {

            expect(() => {

                Joi.attempt({}, Joi.object().keys({ a: Joi.required(), b: Joi.required() }), new Error('invalid value'), { abortEarly: false });
            }).to.throw('invalid value');
        });

        it('throws a validation error and not a TypeError when parameter is given as a json string with incorrect property', () => {

            const schema = Joi.object({
                a: Joi.object({
                    b: Joi.string()
                })
            });

            const input = {
                a: '{"c":"string"}'
            };

            expect(() => Joi.attempt(input, schema)).to.throw(/\"a.c\" is not allowed/);
        });

        it('throws a custom error from the schema if provided', () => {

            expect(() => Joi.attempt('x', Joi.number().error(new Error('Oh noes !')))).to.throw('Oh noes !');
        });

        it('throws an error with combined messages', () => {

            const schema = Joi.number().error(new Error('Oh noes !'));
            expect(() => Joi.attempt('x', schema, 'invalid value')).to.throw('Oh noes !');
            expect(() => Joi.attempt('x', schema, 'invalid value')).to.throw('Oh noes !');
        });
    });

    describe('compile()', () => {

        it('throws an error on invalid value', () => {

            expect(() => {

                Joi.compile(undefined);
            }).to.throw(Error, 'Invalid schema content: ');
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
            }).to.throw(Error, 'Invalid schema content: (a.b.c.d)');
        });
    });

    describe('defaults()', () => {

        it('should apply defaults to joi itself', () => {

            const defaultJoi = Joi.defaults((schema) => schema.required().description('defaulted'));
            const schema = defaultJoi.optional();
            expect(schema.describe()).to.equal({
                type: 'any',
                description: 'defaulted',
                flags: {
                    presence: 'optional'
                }
            });
        });

        it('should apply defaults to standard types', () => {

            const defaultJoi = Joi.defaults((schema) => schema.required().description('defaulted'));
            const schema = defaultJoi.string();
            expect(schema.describe()).to.equal({
                type: 'string',
                invalids: [''],
                description: 'defaulted',
                flags: {
                    presence: 'required'
                }
            });
        });

        it('should apply defaults to types with arguments', () => {

            const defaultJoi = Joi.defaults((schema) => schema.required().description('defaulted'));
            const schema = defaultJoi.object({ foo: 'bar' });
            expect(schema.describe()).to.equal({
                type: 'object',
                description: 'defaulted',
                flags: {
                    presence: 'required'
                },
                children: {
                    foo: {
                        type: 'string',
                        description: 'defaulted',
                        flags: {
                            presence: 'required',
                            allowOnly: true
                        },
                        invalids: [''],
                        valids: ['bar']
                    }
                }
            });
        });

        it('should keep several defaults separated', () => {

            const defaultJoi = Joi.defaults((schema) => schema.required().description('defaulted'));
            const defaultJoi2 = Joi.defaults((schema) => schema.required().description('defaulted2'));
            const schema = defaultJoi.object({
                foo: 'bar',
                baz: defaultJoi2.object().keys({
                    qux: 'zorg'
                })
            });
            expect(schema.describe()).to.equal({
                type: 'object',
                description: 'defaulted',
                flags: {
                    presence: 'required'
                },
                children: {
                    foo: {
                        type: 'string',
                        description: 'defaulted',
                        flags: {
                            presence: 'required',
                            allowOnly: true
                        },
                        invalids: [''],
                        valids: ['bar']
                    },
                    baz: {
                        children: {
                            qux: {
                                description: 'defaulted2',
                                flags: {
                                    allowOnly: true,
                                    presence: 'required'
                                },
                                invalids: [''],
                                type: 'string',
                                valids: ['zorg']
                            }
                        },
                        description: 'defaulted2',
                        flags: {
                            presence: 'required'
                        },
                        type: 'object'
                    }

                }
            });
        });

        it('should deal with inherited defaults', () => {

            const defaultJoi = Joi
                .defaults((schema) => schema.required().description('defaulted'))
                .defaults((schema) => schema.raw());

            const schema = defaultJoi.object({
                foo: 'bar'
            });

            expect(schema.describe()).to.equal({
                type: 'object',
                description: 'defaulted',
                flags: {
                    presence: 'required',
                    cast: 'raw'
                },
                children: {
                    foo: {
                        type: 'string',
                        description: 'defaulted',
                        flags: {
                            presence: 'required',
                            allowOnly: true,
                            cast: 'raw'
                        },
                        invalids: [''],
                        valids: ['bar']
                    }
                }
            });
        });

        it('should keep defaults on an extended joi', () => {

            const defaultJoi = Joi.defaults((schema) => schema.required().description('defaulted'));
            const extendedJoi = defaultJoi.extend({ name: 'foobar' });
            const schema = extendedJoi.foobar();
            expect(schema.describe()).to.equal({
                type: 'foobar',
                description: 'defaulted',
                flags: {
                    presence: 'required'
                }
            });
        });

        it('should apply defaults on an extended joi', () => {

            const extendedJoi = Joi.extend({ name: 'foobar' });
            const defaultJoi = extendedJoi.defaults((schema) => schema.required().description('defaulted'));
            const schema = defaultJoi.foobar();
            expect(schema.describe()).to.equal({
                type: 'foobar',
                description: 'defaulted',
                flags: {
                    presence: 'required'
                }
            });
        });

        it('should fail on missing return for any', () => {

            expect(() => {

                return Joi.defaults((schema) => {

                    switch (schema.type) {
                        case 'bool':
                            return schema.required();
                    }
                });
            }).to.throw('defaults() must return a schema');
        });

        it('should fail on missing return for a standard type', () => {

            const defaultJoi = Joi.defaults((schema) => {

                switch (schema.type) {
                    case 'any':
                        return schema.required();
                }
            });
            expect(() => defaultJoi.string()).to.throw('defaults() must return a schema');
        });

        it('should fail on missing return for a standard type on an inherited default', () => {

            const defaultJoi = Joi.defaults((schema) => {

                switch (schema.type) {
                    case 'any':
                        return schema.required();
                }
            });
            const defaultJoi2 = defaultJoi.defaults((schema) => schema.required());
            expect(() => defaultJoi2.string()).to.throw('defaults() must return a schema');
        });
    });

    describe('validate()', () => {

        it('should work with a successful promise', () => {

            const promise = Joi.string().validate('foo');

            return promise.then((value) => {

                expect(value).to.equal('foo');
            }, () => {

                throw new Error('Should not go here');
            });
        });

        it('should work with a successful promise and a catch in between', () => {

            const promise = Joi.string().validate('foo');

            return promise
                .catch(() => {

                    throw new Error('Should not go here');
                })
                .then((value) => {

                    expect(value).to.equal('foo');
                }, () => {

                    throw new Error('Should not go here');
                });
        });

        it('should work with a failing promise', () => {

            const promise = Joi.string().validate(0);

            return promise.then((value) => {

                throw new Error('Should not go here');
            }, (err) => {

                expect(err).to.be.an.error('"value" must be a string');
                expect(err.details).to.equal([{
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 0, label: 'value' }
                }]);
            });
        });

        it('should work with a failing promise and a then in between', () => {

            const promise = Joi.string().validate(0);

            return promise
                .then((value) => {

                    throw new Error('Should not go here');
                })
                .catch((err) => {

                    expect(err).to.be.an.error('"value" must be a string');
                    expect(err.details).to.equal([{
                        message: '"value" must be a string',
                        path: [],
                        type: 'string.base',
                        context: { value: 0, label: 'value' }
                    }]);
                });
        });

        it('should work with a failing promise (with catch)', () => {

            const promise = Joi.string().validate(0);

            return promise.catch((err) => {

                expect(err).to.be.an.error('"value" must be a string');
                expect(err.details).to.equal([{
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 0, label: 'value' }
                }]);
            });
        });

        it('should catch errors in a successful promise callback', () => {

            const promise = Joi.string().validate('foo');

            return promise.then((value) => {

                throw new Error('oops');
            }).then(() => {

                throw new Error('Should not go here');
            }, (err) => {

                expect(err).to.be.an.error('oops');
            });
        });

        it('should catch errors in a failing promise callback', () => {

            const promise = Joi.string().validate(0);

            return promise.then((value) => {

                throw new Error('Should not go here');
            }, () => {

                throw new Error('oops');
            }).then(() => {

                throw new Error('Should not go here');
            }, (err) => {

                expect(err).to.be.an.error('oops');
            });
        });

        it('should catch errors in a failing promise callback (with catch)', () => {

            const promise = Joi.string().validate(0);

            return promise.catch(() => {

                throw new Error('oops');
            }).then(() => {

                throw new Error('Should not go here');
            }, (err) => {

                expect(err).to.be.an.error('oops');
            });
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

    describe('bind()', () => {

        it('binds functions', () => {

            expect(() => {

                const string = Joi.string;
                string();
            }).to.throw('Must be invoked on a Joi instance.');

            const { string } = Joi.bind();
            expect(() => string()).to.not.throw();

            const { error } = string().validate(0);
            expect(error).to.be.an.error('"value" must be a string');
        });

        it('binds functions on an extended joi', () => {

            const customJoi = Joi.extend({
                base: Joi.string(),
                name: 'myType'
            });

            expect(() => {

                const string = customJoi.string;
                string();
            }).to.throw('Must be invoked on a Joi instance.');

            const { string, myType } = customJoi.bind();
            expect(() => string()).to.not.throw();
            expect(string().validate(0).error).to.be.an.error('"value" must be a string');

            expect(() => myType()).to.not.throw();
            expect(myType().validate(0).error).to.be.an.error('"value" must be a string');

            expect(customJoi._binds.size).to.equal(Joi._binds.size + 1);
        });
    });
});
