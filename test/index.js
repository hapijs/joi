'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Joi', () => {

    it('validates object', () => {

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

        expect(schema.validate(obj).error).to.not.exist();
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
                    type: 'any.only',
                    context: { value: 'a', valids: ['b'], label: 'value' }
                }]
            }],
            ['b', true],
            [5, false, null, {
                message: '"value" must be one of [b]',
                details: [{
                    message: '"value" must be one of [b]',
                    path: [],
                    type: 'any.only',
                    context: { value: 5, valids: ['b'], label: 'value' }
                }]
            }]
        ]);
    });

    it('validates null', () => {

        const err = Joi.string().validate(null).error;
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
                    type: 'any.only',
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
                    type: 'any.only',
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
                    type: 'any.only',
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
                    type: 'any.only',
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
                    type: 'any.only',
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
                                    type: 'any.only',
                                    context: { value: 'other', valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.only',
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
                                    type: 'any.only',
                                    context: { value: 6, valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.only',
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
                                    type: 'any.only',
                                    context: { value: { c: 5 }, valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.only',
                                    context: { value: { c: 5 }, valids: [5], label: 'value' }
                                },
                                {
                                    message: '"c" is not allowed',
                                    path: ['c'],
                                    type: 'object.unknown',
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
                                    type: 'any.only',
                                    context: { value: { a: 5, b: 'a' }, valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.only',
                                    context: { value: { a: 5, b: 'a' }, valids: [5], label: 'value' }
                                },
                                {
                                    message: '"a" must be one of [true]',
                                    path: ['a'],
                                    type: 'any.only',
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
                                    type: 'any.only',
                                    context: { value: 'other', valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.only',
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
                                    type: 'any.only',
                                    context: { value: 6, valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.only',
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
                                    type: 'any.only',
                                    context: { value: { c: 5 }, valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.only',
                                    context: { value: { c: 5 }, valids: [5], label: 'value' }
                                },
                                {
                                    message: '"c" is not allowed',
                                    path: ['c'],
                                    type: 'object.unknown',
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
                                    type: 'any.only',
                                    context: { value: { a: 5, b: 'a' }, valids: ['key'], label: 'value' }
                                },
                                {
                                    message: '"value" must be one of [5]',
                                    path: [],
                                    type: 'any.only',
                                    context: { value: { a: 5, b: 'a' }, valids: [5], label: 'value' }
                                },
                                {
                                    message: '"a" must be one of [true]',
                                    path: ['a'],
                                    type: 'any.only',
                                    context: { label: 'a', key: 'a', value: 5, valids: [true] }
                                }
                            ]
                        }
                    }
                ]
            }]
        ]);
    });

    it('validates regex directly', () => {

        expect(Joi.compile(/^5$/).validate('5').error).to.not.exist();
        const err = Joi.compile(/.{2}/).validate('6').error;
        expect(err).to.be.an.error('"value" with value "6" fails to match the required pattern: /.{2}/');
        expect(err.details).to.equal([{
            message: '"value" with value "6" fails to match the required pattern: /.{2}/',
            path: [],
            type: 'string.pattern.base',
            context: {
                name: undefined,
                regex: /.{2}/,
                value: '6',
                label: 'value'
            }
        }]);
    });

    it('validated with', () => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string()
        }).with('txt', 'upc');

        const err = schema.validate({ txt: 'a' }, { abortEarly: false }).error;
        expect(err).to.be.an.error('"txt" missing required peer "upc"');
        expect(err.details).to.equal([{
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
        }]);

        Helper.validate(schema, [
            [{ upc: 'test' }, true],
            [{ txt: 'test' }, false, null, {
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
                    type: 'string.empty',
                    context: { value: '', label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: 'test', upc: undefined }, false, null, {
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
                        value: { txt: 'test', upc: undefined }
                    }
                }]
            }],
            [{ txt: 'test', upc: 'test' }, true]
        ]);
    });

    it('validated without', () => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string()
        }).without('txt', 'upc');

        const err = schema.validate({ txt: 'a', upc: 'b' }, { abortEarly: false }).error;
        expect(err).to.be.an.error('"txt" conflict with forbidden peer "upc"');
        expect(err.details).to.equal([{
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
                    type: 'string.empty',
                    context: { value: '', label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: 'test', upc: undefined }, true],
            [{ txt: 'test', upc: 'test' }, false, null, {
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
                        value: { txt: 'test', upc: 'test' }
                    }
                }]
            }]
        ]);
    });

    it('validates xor', () => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string()
        }).xor('txt', 'upc');

        const err = schema.validate({}, { abortEarly: false }).error;
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
                    type: 'string.empty',
                    context: { value: '', label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: '', upc: 'test' }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
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
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: '' }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
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

    it('validates or()', () => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string().allow(null, ''),
            code: Joi.number()
        }).or('txt', 'upc', 'code');

        const err = schema.validate({}, { abortEarly: false }).error;
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
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
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
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: undefined, code: 999 }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: undefined, code: undefined }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: '' }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: 'test', upc: 'test' }, true],
            [{ txt: 'test', upc: 'test', code: 322 }, true]
        ]);
    });

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
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
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
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: undefined, code: 999 }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: undefined, code: undefined }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: '' }, false, null, {
                message: '"txt" is not allowed to be empty',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'string.empty',
                    context: { value: '', label: 'txt', key: 'txt' }
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

    it('validates nand()', () => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string().allow(null, ''),
            code: Joi.number()
        }).nand('txt', 'upc', 'code');

        const err = schema.validate({ txt: 'x', upc: 'y', code: 123 }, { abortEarly: false }).error;
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

        const err = schema.validate({ auth: { mode: 'none' } }).error;
        expect(err).to.be.an.error('"auth" does not match any of the allowed types');
        expect(err.details[0].context.details).to.equal([
            {
                message: '"auth.mode" must be one of [required, optional, try, null]',
                path: ['auth', 'mode'],
                type: 'any.only',
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
                    type: 'object.unknown',
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
                                    type: 'object.unknown',
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
        expect(err).to.be.an.error('"auth" does not match any of the allowed types');
        expect(err.details[0].context.details).to.equal([
            {
                message: '"auth.mode" must be one of [required, optional, try, null]',
                path: ['auth', 'mode'],
                type: 'any.only',
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
                    type: 'object.unknown',
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
                                    type: 'object.unknown',
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
                    type: 'object.unknown',
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
                    type: 'object.unknown',
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
                    type: 'any.only',
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
            [5, false, null, {
                message: '"value" contains an invalid value',
                details: [{
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 5, invalids: [5], label: 'value' }
                }]
            }],
            ['5', false, null, {
                message: '"value" contains an invalid value',
                details: [{
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 5, invalids: [5], label: 'value' }
                }]
            }]
        ]);
    });

    it('invalidates missing peers', () => {

        const schema = Joi.object({
            username: Joi.string(),
            password: Joi.string()
        }).with('username', 'password').without('password', 'access_token');

        expect(schema.validate({ username: 'bob' }).error).to.be.an.error();
    });

    it('validates config where the root item is a joi type', () => {

        expect(Joi.boolean().allow(null).validate(true).error).to.not.exist();
        expect(Joi.object().validate({ auth: { mode: 'try' } }).error).to.not.exist();
        expect(Joi.object().validate(true).error).to.be.an.error('"value" must be an object');
        expect(Joi.string().validate(true).error).to.be.an.error('"value" must be a string');
        expect(Joi.string().email().validate('test@test.com').error).to.not.exist();
        expect(Joi.object({ param: Joi.string().required() }).validate({ param: 'item' }).error).to.not.exist();
    });

    it('converts string to number', () => {

        const schema = Joi.object({
            a: Joi.number()
        });

        const input = { a: '5' };
        expect(schema.validate(input)).to.equal({ value: { a: 5 } });
        expect(input.a).to.equal('5');
    });

    it('allows unknown keys in objects if no schema was given', () => {

        expect(Joi.object().validate({ foo: 'bar' }).error).to.not.exist();
    });

    it('fails on unknown keys in objects if a schema was given', () => {

        const err = Joi.object({}).validate({ foo: 'bar' }).error;
        expect(err).to.be.an.error('"foo" is not allowed');
        expect(err.details).to.equal([{
            message: '"foo" is not allowed',
            path: ['foo'],
            type: 'object.unknown',
            context: { child: 'foo', label: 'foo', key: 'foo', value: 'bar' }
        }]);

        const err2 = Joi.compile({}).validate({ foo: 'bar' }).error;
        expect(err2.message).to.equal('"foo" is not allowed');

        const err3 = Joi.compile({ other: Joi.number() }).validate({ foo: 'bar' }).error;
        expect(err3.message).to.equal('"foo" is not allowed');
    });

    it('validates an unknown option', () => {

        const config = {
            auth: Joi.object({
                mode: Joi.string().valid('required', 'optional', 'try').allow(null)
            }).allow(null)
        };

        const err = Joi.compile(config).validate({ auth: { unknown: true } }).error;
        expect(err.message).to.contain('"auth.unknown" is not allowed');

        const err2 = Joi.compile(config).validate({ something: false }).error;
        expect(err2.message).to.contain('"something" is not allowed');
    });

    it('validates required key with multiple options', () => {

        const config = {
            module: Joi.alternatives([
                Joi.object({
                    compile: Joi.func().required(),
                    execute: Joi.func()
                }),
                Joi.string()
            ]).required()
        };

        const err = Joi.compile(config).validate({}).error;
        expect(err.message).to.contain('"module" is required');

        expect(Joi.compile(config).validate({ module: 'test' }).error).to.not.exist();

        const err2 = Joi.compile(config).validate({ module: {} }).error;
        expect(err2).to.be.an.error('"module" does not match any of the allowed types');
        expect(err2.details[0].context.message).to.equal('"module.compile" is required. "module" must be a string');

        expect(Joi.compile(config).validate({ module: { compile: function () { } } }).error).to.not.exist();
    });

    it('validates key with required alternatives', () => {

        const config = {
            module: Joi.alt().try(
                Joi.object({
                    compile: Joi.func().required(),
                    execute: Joi.func()
                }).required(),
                Joi.string().required()
            )
        };

        expect(Joi.compile(config).validate({}).error).to.not.exist();
    });

    it('validates required key with alternatives', () => {

        const config = {
            module: Joi.alt().try([
                Joi.object({
                    compile: Joi.func().required(),
                    execute: Joi.func()
                }),
                Joi.string()
            ]).required()
        };

        const err = Joi.compile(config).validate({}).error;
        expect(err.message).to.contain('"module" is required');
    });

    it('does not require optional numbers', () => {

        const config = {
            position: Joi.number(),
            suggestion: Joi.string()
        };

        expect(Joi.compile(config).validate({ suggestion: 'something' }).error).to.not.exist();
        expect(Joi.compile(config).validate({ position: 1 }).error).to.not.exist();
    });

    it('does not require optional objects', () => {

        const config = {
            position: Joi.number(),
            suggestion: Joi.object()
        };

        expect(Joi.compile(config).validate({ suggestion: {} }).error).to.not.exist();
        expect(Joi.compile(config).validate({ position: 1 }).error).to.not.exist();
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

        expect(Joi.compile(schema).validate(obj).error).to.not.exist();
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

        expect(Joi.compile(schema).validate(obj).error).to.not.exist();
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

        expect(Joi.compile(schema).validate(obj).error).to.be.an.error();
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

        expect(Joi.compile(schema).validate(obj).error).to.be.an.error();
    });

    it('fails validation when missing a required parameter', () => {

        const obj = {
            c: 10
        };

        expect(Joi.compile({ a: Joi.string().required() }).validate(obj).error).to.be.an.error();
    });

    it('fails validation when missing a required parameter within an object config', () => {

        const obj = {
            a: {}
        };

        expect(Joi.compile({ a: Joi.object({ b: Joi.string().required() }) }).validate(obj).error).to.be.an.error();
    });

    it('fails validation when parameter is required to be an object but is given as string', () => {

        const obj = {
            a: 'a string'
        };

        expect(Joi.compile({ a: Joi.object({ b: Joi.string().required() }) }).validate(obj).error).to.be.an.error();
    });

    it('validates when parameter is required to be an object and is given correctly as a json string', () => {

        const schema = Joi.object({
            a: Joi.object({
                b: Joi.string().required()
            })
        });

        const input = {
            a: '{"b":"string"}'
        };

        expect(schema.validate(input)).to.equal({ value: { a: { b: 'string' } } });
        expect(input.a).to.equal('{"b":"string"}');
    });

    it('fails validation when parameter is required to be an object but is given as a json string that is incorrect (number instead of string)', () => {

        const obj = {
            a: '{"b":2}'
        };

        expect(Joi.object({ a: Joi.object({ b: Joi.string().required() }) }).validate(obj).error).to.be.an.error();
    });

    it('fails validation when parameter is required to be an Array but is given as string', () => {

        const obj = {
            a: 'an array'
        };

        expect(Joi.object({ a: Joi.array() }).validate(obj).error).to.be.an.error();
    });

    it('validates when parameter is required to be an Array and is given correctly as a json string', () => {

        const obj = {
            a: '[1,2]'
        };

        expect(Joi.object({ a: Joi.array() }).validate(obj).error).to.not.exist();
    });

    it('fails validation when parameter is required to be an Array but is given as a json that is incorrect (object instead of array)', () => {

        const obj = {
            a: '{"b":2}'
        };

        expect(Joi.object({ a: Joi.object({ b: Joi.string().required() }) }).validate(obj).error).to.be.an.error();
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

        expect(Joi.compile(schema).validate(obj).error).to.be.an.error();
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

        expect(Joi.compile(schema).validate(obj).error).to.be.an.error();
    });

    it('fails validation with extra keys', () => {

        const schema = {
            a: Joi.number()
        };

        const obj = {
            a: 1,
            b: 'a'
        };

        expect(Joi.compile(schema).validate(obj).error).to.be.an.error();
    });

    it('validates missing optional key with string condition', () => {

        const schema = {
            key: Joi.string().alphanum(false).min(8)
        };

        expect(Joi.compile(schema).validate({}).error).to.not.exist();
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

        expect(schema.validate(obj, { stripUnknown: true, allowUnknown: true })).to.equal({ value: { a: 1, b: 'a' } });
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

        expect(schema.validate(obj, { stripUnknown: { arrays: false, objects: true }, allowUnknown: true })).to.equal({ value: { a: 1, b: 'a' } });
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

        const err = schema.validate(obj, { stripUnknown: true }).error;
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

        const err = schema.validate(obj, { stripUnknown: { arrays: false, objects: true } }).error;
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

        expect(schema.validate(obj, { stripUnknown: true, abortEarly: false }).error).to.be.an.error();
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

        expect(schema.validate(obj, { stripUnknown: { arrays: false, objects: true }, abortEarly: false }).error).to.be.an.error();
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

        expect(schema.validate(obj, { allowUnknown: true })).to.equal({ value: { a: 1, b: 'a', d: 'c' } });
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

        expect(localConfig.validate(obj)).to.equal({ value: { a: 1, b: 'a', d: 'c' } });
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

        expect(localConfig.validate(obj)).to.equal({ value: { a: 1, b: 'a' } });
        expect(localConfig.validate({ a: 1, b: 'a' })).to.equal({ value: { a: 1, b: 'a' } });
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

        expect(localConfig.validate(obj)).to.equal({ value: { a: 1, b: 'a' } });
        expect(localConfig.validate({ a: 1, b: 'a' })).to.equal({ value: { a: 1, b: 'a' } });
    });

    it('should work when the skipFunctions setting is enabled', () => {

        const schema = Joi.object({ username: Joi.string() }).prefs({ skipFunctions: true });
        const input = { username: 'test', func: function () { } };
        expect(schema.validate(input).error).to.not.exist();
    });

    it('should work when the skipFunctions setting is disabled', () => {

        const schema = Joi.object({ username: Joi.string() });
        const input = { username: 'test', func: function () { } };

        const err = schema.validate(input, { skipFunctions: false }).error;
        expect(err.message).to.contain('"func" is not allowed');
    });

    it('should not convert values when convert is false', () => {

        const schema = Joi.object({
            arr: Joi.array().items(Joi.string())
        });

        const input = { arr: 'foo' };
        expect(schema.validate(input, { convert: false }).error).to.be.an.error();
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

        const err = schema.validate(input, { abortEarly: false }).error;
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
            type: 'object.unknown',
            context: { key: 'baz', label: 'test2.test3[2].baz.test4[0].baz', child: 'baz', value: '123' }
        }]);
    });

    it('accepts no options', () => {

        expect(Joi.string().validate('test').error).to.not.exist();
        expect(Joi.string().validate('test')).to.equal({ value: 'test' });
        expect(Joi.number().validate('5', { convert: false }).error).to.be.an.error();
    });

    it('accepts null options', () => {

        expect(Joi.string().validate('test', null).error).to.not.exist();
    });

    it('accepts undefined options', () => {

        expect(Joi.string().validate('test', undefined).error).to.not.exist();
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

    describe('validateAsync()', () => {

        it('should work with a successful promise', async () => {

            expect(await Joi.string().validateAsync('foo')).to.equal('foo');
        });

        it('should work with a successful promise and a catch in between', () => {

            const promise = Joi.string().validateAsync('foo');

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

            const promise = Joi.string().validateAsync(0);

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

            const promise = Joi.string().validateAsync(0);

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

            const promise = Joi.string().validateAsync(0);

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

            const promise = Joi.string().validateAsync('foo');

            return promise.then((value) => {

                throw new Error('oops');
            }).then(() => {

                throw new Error('Should not go here');
            }, (err) => {

                expect(err).to.be.an.error('oops');
            });
        });

        it('should catch errors in a failing promise callback', () => {

            const promise = Joi.string().validateAsync(0);

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

            const promise = Joi.string().validateAsync(0);

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

    describe('types()', () => {

        it('returns type shortcut methods', () => {

            expect(() => {

                const string = Joi.string;
                string();
            }).to.throw('Must be invoked on a Joi instance.');

            const { string } = Joi.types();
            expect(() => string.allow('x')).to.not.throw();

            const { error } = string.validate(0);
            expect(error).to.be.an.error('"value" must be a string');
        });

        it('returns extended shortcuts', () => {

            const customJoi = Joi.extend({
                base: Joi.string(),
                name: 'myType'
            });

            expect(() => {

                const string = customJoi.string;
                string();
            }).to.throw('Must be invoked on a Joi instance.');

            const { string, myType } = customJoi.types();
            expect(() => string.allow('x')).to.not.throw();
            expect(string.validate(0).error).to.be.an.error('"value" must be a string');

            expect(() => myType.allow('x')).to.not.throw();
            expect(myType.validate(0).error).to.be.an.error('"value" must be a string');

            expect(customJoi._types.size).to.equal(Joi._types.size + 1);
        });
    });
});
