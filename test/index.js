'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Joi', () => {

    it('validates with a callback', () => {

        return new Promise((resolve, reject) => {

            const schema = Joi.number();
            Joi.validate(0, schema, (err, value) => {

                if (err) {
                    return reject(err);
                }

                resolve(value);
            });
        }).then((value) => {

            expect(value).to.equal(0);
        });
    });

    it('validates object', async () => {

        const schema = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        }).without('a', 'none');

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
                    context: { value: 5, label: 'value', key: undefined }
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
                    context: { value: 'a', valids: ['b'], label: 'value', key: undefined }
                }]
            }],
            ['b', true],
            [5, false, null, {
                message: '"value" must be a string',
                details: [{
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 5, label: 'value', key: undefined }
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
            context: { value: null, label: 'value', key: undefined }
        }]);
        expect(err.annotate()).to.equal('{\n  \u001b[41m\"value\"\u001b[0m\u001b[31m [1]: -- missing --\u001b[0m\n}\n\u001b[31m\n[1] "value" must be a string\u001b[0m');
    });

    it('validates null schema', () => {

        Helper.validate(null, [
            ['a', false, null, {
                message: '"value" must be one of [null]',
                details: [{
                    message: '"value" must be one of [null]',
                    path: [],
                    type: 'any.allowOnly',
                    context: { value: 'a', valids: [null], label: 'value', key: undefined }
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
                    context: { value: 6, valids: [5], label: 'value', key: undefined }
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
                    context: { value: '6', valids: ['5'], label: 'value', key: undefined }
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
                    context: { value: false, valids: [true], label: 'value', key: undefined }
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
                message: `"value" must be one of [${dnow}]`,
                details: [{
                    message: `"value" must be one of [${dnow}]`,
                    path: [],
                    type: 'any.allowOnly',
                    context: { value: new Date(now * 2), valids: [dnow], label: 'value', key: undefined }
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
                message: '"value" must be one of [key], "value" must be a number, "value" must be an object',
                details: [
                    {
                        message: '"value" must be one of [key]',
                        path: [],
                        type: 'any.allowOnly',
                        context: { value: 'other', valids: ['key'], label: 'value', key: undefined }
                    },
                    {
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', key: undefined, value: 'other' }
                    },
                    {
                        message: '"value" must be an object',
                        path: [],
                        type: 'object.base',
                        context: { label: 'value', key: undefined, value: 'other' }
                    }
                ]
            }],
            [6, false, null, {
                message: '"value" must be a string, "value" must be one of [5], "value" must be an object',
                details: [
                    {
                        message: '"value" must be a string',
                        path: [],
                        type: 'string.base',
                        context: { value: 6, label: 'value', key: undefined }
                    },
                    {
                        message: '"value" must be one of [5]',
                        path: [],
                        type: 'any.allowOnly',
                        context: { value: 6, valids: [5], label: 'value', key: undefined }
                    },
                    {
                        message: '"value" must be an object',
                        path: [],
                        type: 'object.base',
                        context: { label: 'value', key: undefined, value: 6 }
                    }
                ]
            }],
            [{ c: 5 }, false, null, {
                message: '"value" must be a string, "value" must be a number, "c" is not allowed',
                details: [
                    {
                        message: '"value" must be a string',
                        path: [],
                        type: 'string.base',
                        context: { value: { c: 5 }, label: 'value', key: undefined }
                    },
                    {
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', key: undefined, value: { c: 5 } }
                    },
                    {
                        message: '"c" is not allowed',
                        path: ['c'],
                        type: 'object.allowUnknown',
                        context: { child: 'c', label: 'c', key: 'c', value: 5 }
                    }
                ]
            }],
            [{}, true],
            [{ b: 'abc' }, true],
            [{ a: true, b: 'boom' }, true],
            [{ a: 5, b: 'a' }, false, null, {
                message: '"value" must be a string, "value" must be a number, child "a" fails because ["a" must be a boolean]',
                details: [
                    {
                        message: '"value" must be a string',
                        path: [],
                        type: 'string.base',
                        context: { value: { a: 5, b: 'a' }, label: 'value', key: undefined }
                    },
                    {
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', key: undefined, value: { a: 5, b: 'a' } }
                    },
                    {
                        message: '"a" must be a boolean',
                        path: ['a'],
                        type: 'boolean.base',
                        context: { label: 'a', key: 'a', value: 5 }
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
                message: '"value" must be one of [key], "value" must be a number, "value" must be an object',
                details: [
                    {
                        message: '"value" must be one of [key]',
                        path: [],
                        type: 'any.allowOnly',
                        context: { value: 'other', valids: ['key'], label: 'value', key: undefined }
                    },
                    {
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', key: undefined, value: 'other' }
                    },
                    {
                        message: '"value" must be an object',
                        path: [],
                        type: 'object.base',
                        context: { label: 'value', key: undefined, value: 'other' }
                    }
                ]
            }],
            [6, false, null, {
                message: '"value" must be a string, "value" must be one of [5], "value" must be an object',
                details: [
                    {
                        message: '"value" must be a string',
                        path: [],
                        type: 'string.base',
                        context: { value: 6, label: 'value', key: undefined }
                    },
                    {
                        message: '"value" must be one of [5]',
                        path: [],
                        type: 'any.allowOnly',
                        context: { value: 6, valids: [5], label: 'value', key: undefined }
                    },
                    {
                        message: '"value" must be an object',
                        path: [],
                        type: 'object.base',
                        context: { label: 'value', key: undefined, value: 6 }
                    }
                ]
            }],
            [{ c: 5 }, false, null, {
                message: '"value" must be a string, "value" must be a number, "c" is not allowed',
                details: [
                    {
                        message: '"value" must be a string',
                        path: [],
                        type: 'string.base',
                        context: { value: { c: 5 }, label: 'value', key: undefined }
                    },
                    {
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', key: undefined, value: { c: 5 } }
                    },
                    {
                        message: '"c" is not allowed',
                        path: ['c'],
                        type: 'object.allowUnknown',
                        context: { child: 'c', label: 'c', key: 'c', value: 5 }
                    }
                ]
            }],
            [{}, true],
            [{ b: 'abc' }, true],
            [{ a: true, b: 'boom' }, true],
            [{ a: 5, b: 'a' }, false, null, {
                message: '"value" must be a string, "value" must be a number, child "a" fails because ["a" must be a boolean]',
                details: [
                    {
                        message: '"value" must be a string',
                        path: [],
                        type: 'string.base',
                        context: { value: { a: 5, b: 'a' }, label: 'value', key: undefined }
                    },
                    {
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', key: undefined, value: { a: 5, b: 'a' } }
                    },
                    {
                        message: '"a" must be a boolean',
                        path: ['a'],
                        type: 'boolean.base',
                        context: { label: 'a', key: 'a', value: 5 }
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
                label: 'value',
                key: undefined
            }
        }]);
    });

    it('validated with', async () => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string()
        }).with('txt', 'upc');

        const err = await expect(Joi.validate({ txt: 'a' }, schema, { abortEarly: false })).to.reject();
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
                key: 'txt'
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
                        key: 'txt'
                    }
                }]
            }],
            [{ txt: 'test', upc: null }, false, null, {
                message: 'child "upc" fails because ["upc" must be a string]',
                details: [{
                    message: '"upc" must be a string',
                    path: ['upc'],
                    type: 'string.base',
                    context: { value: null, label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: 'test', upc: '' }, false, null, {
                message: 'child "upc" fails because ["upc" is not allowed to be empty]',
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
                        key: 'txt'
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

        const err = await expect(Joi.validate({ txt: 'a', upc: 'b' }, schema, { abortEarly: false })).to.reject();
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
                key: 'txt'
            }
        }]);

        Helper.validate(schema, [
            [{ upc: 'test' }, true],
            [{ txt: 'test' }, true],
            [{ txt: 'test', upc: null }, false, null, {
                message: 'child "upc" fails because ["upc" must be a string]',
                details: [{
                    message: '"upc" must be a string',
                    path: ['upc'],
                    type: 'string.base',
                    context: { value: null, label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: 'test', upc: '' }, false, null, {
                message: 'child "upc" fails because ["upc" is not allowed to be empty]',
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
                        key: 'txt'
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

        const err = await expect(Joi.validate({}, schema, { abortEarly: false })).to.reject();
        expect(err).to.be.an.error('"value" must contain at least one of [txt, upc]');
        expect(err.details).to.equal([{
            message: '"value" must contain at least one of [txt, upc]',
            path: [],
            type: 'object.missing',
            context: {
                peers: ['txt', 'upc'],
                peersWithLabels: ['txt', 'upc'],
                label: 'value',
                key: undefined
            }
        }]);

        Helper.validate(schema, [
            [{ upc: null }, false, null, {
                message: 'child "upc" fails because ["upc" must be a string]',
                details: [{
                    message: '"upc" must be a string',
                    path: ['upc'],
                    type: 'string.base',
                    context: { value: null, label: 'upc', key: 'upc' }
                }]
            }],
            [{ upc: 'test' }, true],
            [{ txt: null }, false, null, {
                message: 'child "txt" fails because ["txt" must be a string]',
                details: [{
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: 'test' }, true],
            [{ txt: 'test', upc: null }, false, null, {
                message: 'child "upc" fails because ["upc" must be a string]',
                details: [{
                    message: '"upc" must be a string',
                    path: ['upc'],
                    type: 'string.base',
                    context: { value: null, label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: 'test', upc: '' }, false, null, {
                message: 'child "upc" fails because ["upc" is not allowed to be empty]',
                details: [{
                    message: '"upc" is not allowed to be empty',
                    path: ['upc'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'upc', key: 'upc' }
                }]
            }],
            [{ txt: '', upc: 'test' }, false, null, {
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: null, upc: 'test' }, false, null, {
                message: 'child "txt" fails because ["txt" must be a string]',
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
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: '' }, false, null, {
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
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
                        key: undefined
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
                        key: undefined
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
                        key: undefined
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
                        key: undefined
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
                        key: undefined
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
                        key: undefined
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

        const err = await expect(Joi.validate({}, schema, { abortEarly: false })).to.reject();
        expect(err).to.be.an.error('"value" must contain at least one of [txt, upc, code]');
        expect(err.details).to.equal([{
            message: '"value" must contain at least one of [txt, upc, code]',
            path: [],
            type: 'object.missing',
            context: {
                peers: ['txt', 'upc', 'code'],
                peersWithLabels: ['txt', 'upc', 'code'],
                label: 'value',
                key: undefined
            }
        }]);

        Helper.validate(schema, [
            [{ upc: null }, true],
            [{ upc: 'test' }, true],
            [{ txt: null }, false, null, {
                message: 'child "txt" fails because ["txt" must be a string]',
                details: [{
                    message: '"txt" must be a string',
                    path: ['txt'],
                    type: 'string.base',
                    context: { value: null, label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: 'test' }, true],
            [{ code: null }, false, null, {
                message: 'child "code" fails because ["code" must be a number]',
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
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: null, upc: 'test' }, false, null, {
                message: 'child "txt" fails because ["txt" must be a string]',
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
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: undefined, code: 999 }, false, null, {
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: undefined, code: undefined }, false, null, {
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: '' }, false, null, {
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
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

        const err = await expect(Joi.validate({ txt: 'x' }, schema, { abortEarly: false })).to.reject();
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
                key: undefined
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
                        key: undefined
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
                        key: undefined
                    }
                }]
            }],
            [{ txt: null }, false, null, {
                message: 'child "txt" fails because ["txt" must be a string]',
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
                        key: undefined
                    }
                }]
            }],
            [{ code: null }, false, null, {
                message: 'child "code" fails because ["code" must be a number]',
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
                        key: undefined
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
                        key: undefined
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
                        key: undefined
                    }
                }]
            }],
            [{ txt: '', upc: 'test' }, false, null, {
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: null, upc: 'test' }, false, null, {
                message: 'child "txt" fails because ["txt" must be a string]',
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
                        key: undefined
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
                        key: undefined
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
                        key: undefined
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
                        key: undefined
                    }
                }]
            }],
            [{ txt: '', upc: undefined }, false, null, {
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: undefined, code: 999 }, false, null, {
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: undefined, code: undefined }, false, null, {
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
                details: [{
                    message: '"txt" is not allowed to be empty',
                    path: ['txt'],
                    type: 'any.empty',
                    context: { value: '', invalids: [''], label: 'txt', key: 'txt' }
                }]
            }],
            [{ txt: '', upc: '' }, false, null, {
                message: 'child "txt" fails because ["txt" is not allowed to be empty]',
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
                        key: undefined
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

        const err = await expect(Joi.validate({ txt: 'x', upc: 'y', code: 123 }, schema, { abortEarly: false })).to.reject();
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
                key: undefined
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
                        key: undefined
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
                        key: undefined
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

        const err = await expect(schema.validate({ auth: { mode: 'none' } })).to.reject();
        expect(err).to.be.an.error('child "auth" fails because [child "mode" fails because ["mode" must be one of [required, optional, try, null]], "auth" must be a string, "auth" must be a boolean]');
        expect(err.details).to.equal([
            {
                message: '"mode" must be one of [required, optional, try, null]',
                path: ['auth', 'mode'],
                type: 'any.allowOnly',
                context: { value: 'none', valids: ['required', 'optional', 'try', null], label: 'mode', key: 'mode' }
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
                    context: { child: 'something', label: 'something', key: 'something', value: undefined }
                }]
            }],
            [{ auth: { something: undefined } }, false, null, {
                message: 'child "auth" fails because ["something" is not allowed, "auth" must be a string, "auth" must be a boolean]',
                details: [
                    {
                        message: '"something" is not allowed',
                        path: ['auth', 'something'],
                        type: 'object.allowUnknown',
                        context: { child: 'something', label: 'something', key: 'something', value: undefined }
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
            }],
            [{ auth: null }, true],
            [{ auth: undefined }, true],
            [{}, true],
            [{ auth: true }, true],
            [{ auth: 123 }, false, null, {
                message: 'child "auth" fails because ["auth" must be an object, "auth" must be a string, "auth" must be a boolean]',
                details: [
                    {
                        message: '"auth" must be an object',
                        path: ['auth'],
                        type: 'object.base',
                        context: { label: 'auth', key: 'auth', value: 123 }
                    },
                    {
                        message: '"auth" must be a string',
                        path: ['auth'],
                        type: 'string.base',
                        context: { value: 123, label: 'auth', key: 'auth' }
                    },
                    {
                        message: '"auth" must be a boolean',
                        path: ['auth'],
                        type: 'boolean.base',
                        context: { label: 'auth', key: 'auth', value: 123 }
                    }
                ]
            }]
        ]);
    });

    it('validates alternatives', async () => {

        const schema = Joi.object({
            auth: Joi.alternatives(
                Joi.object({
                    mode: Joi.string().valid('required', 'optional', 'try').allow(null)
                }).allow(null),
                Joi.string(),
                Joi.boolean()
            )
        });

        const err = await expect(schema.validate({ auth: { mode: 'none' } })).to.reject();
        expect(err).to.be.an.error('child "auth" fails because [child "mode" fails because ["mode" must be one of [required, optional, try, null]], "auth" must be a string, "auth" must be a boolean]');
        expect(err.details).to.equal([
            {
                message: '"mode" must be one of [required, optional, try, null]',
                path: ['auth', 'mode'],
                type: 'any.allowOnly',
                context: { value: 'none', valids: ['required', 'optional', 'try', null], label: 'mode', key: 'mode' }
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
                    context: { child: 'something', label: 'something', key: 'something', value: undefined }
                }]
            }],
            [{ auth: { something: undefined } }, false, null, {
                message: 'child "auth" fails because ["something" is not allowed, "auth" must be a string, "auth" must be a boolean]',
                details: [
                    {
                        message: '"something" is not allowed',
                        path: ['auth', 'something'],
                        type: 'object.allowUnknown',
                        context: { child: 'something', label: 'something', key: 'something', value: undefined }
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
            }],
            [{ auth: null }, true],
            [{ auth: undefined }, true],
            [{}, true],
            [{ auth: true }, true],
            [{ auth: 123 }, false, null, {
                message: 'child "auth" fails because ["auth" must be an object, "auth" must be a string, "auth" must be a boolean]',
                details: [
                    {
                        message: '"auth" must be an object',
                        path: ['auth'],
                        type: 'object.base',
                        context: { label: 'auth', key: 'auth', value: 123 }
                    },
                    {
                        message: '"auth" must be a string',
                        path: ['auth'],
                        type: 'string.base',
                        context: { value: 123, label: 'auth', key: 'auth' }
                    },
                    {
                        message: '"auth" must be a boolean',
                        path: ['auth'],
                        type: 'boolean.base',
                        context: { label: 'auth', key: 'auth', value: 123 }
                    }
                ]
            }]
        ]);
    });

    it('validates required alternatives', () => {

        const schema = {
            a: Joi.alternatives(
                Joi.string().required(),
                Joi.boolean().required()
            )
        };

        Helper.validate(schema, [
            [{ a: null }, false, null, {
                message: 'child "a" fails because ["a" must be a string, "a" must be a boolean]',
                details: [
                    {
                        message: '"a" must be a string',
                        path: ['a'],
                        type: 'string.base',
                        context: { value: null, label: 'a', key: 'a' }
                    },
                    {
                        message: '"a" must be a boolean',
                        path: ['a'],
                        type: 'boolean.base',
                        context: { label: 'a', key: 'a', value: null }
                    }
                ]
            }],
            [{ a: undefined }, true],
            [{}, true],
            [{ a: true }, true],
            [{ a: 'true' }, true],
            [{ a: 123 }, false, null, {
                message: 'child "a" fails because ["a" must be a string, "a" must be a boolean]',
                details: [
                    {
                        message: '"a" must be a string',
                        path: ['a'],
                        type: 'string.base',
                        context: { value: 123, label: 'a', key: 'a' }
                    },
                    {
                        message: '"a" must be a boolean',
                        path: ['a'],
                        type: 'boolean.base',
                        context: { label: 'a', key: 'a', value: 123 }
                    }
                ]
            }],
            [{ a: { c: 1 } }, false, null, {
                message: 'child "a" fails because ["a" must be a string, "a" must be a boolean]',
                details: [
                    {
                        message: '"a" must be a string',
                        path: ['a'],
                        type: 'string.base',
                        context: { value: { c: 1 }, label: 'a', key: 'a' }
                    },
                    {
                        message: '"a" must be a boolean',
                        path: ['a'],
                        type: 'boolean.base',
                        context: { label: 'a', key: 'a', value: { c: 1 } }
                    }
                ]
            }],
            [{ b: undefined }, false, null, {
                message: '"b" is not allowed',
                details: [{
                    message: '"b" is not allowed',
                    path: ['b'],
                    type: 'object.allowUnknown',
                    context: { child: 'b', label: 'b', key: 'b', value: undefined }
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
                message: 'child "a" fails because ["a" must be a string, "a" must be a boolean]',
                details: [
                    {
                        message: '"a" must be a string',
                        path: ['a'],
                        type: 'string.base',
                        context: { value: null, label: 'a', key: 'a' }
                    },
                    {
                        message: '"a" must be a boolean',
                        path: ['a'],
                        type: 'boolean.base',
                        context: { label: 'a', key: 'a', value: null }
                    }
                ]
            }],
            [{ a: undefined }, true],
            [{}, true],
            [{ a: true }, true],
            [{ a: 'true' }, true],
            [{ a: 123 }, false, null, {
                message: 'child "a" fails because ["a" must be a string, "a" must be a boolean]',
                details: [
                    {
                        message: '"a" must be a string',
                        path: ['a'],
                        type: 'string.base',
                        context: { value: 123, label: 'a', key: 'a' }
                    },
                    {
                        message: '"a" must be a boolean',
                        path: ['a'],
                        type: 'boolean.base',
                        context: { label: 'a', key: 'a', value: 123 }
                    }
                ]
            }],
            [{ a: { c: 1 } }, false, null, {
                message: 'child "a" fails because ["a" must be a string, "a" must be a boolean]',
                details: [
                    {
                        message: '"a" must be a string',
                        path: ['a'],
                        type: 'string.base',
                        context: { value: { c: 1 }, label: 'a', key: 'a' }
                    },
                    {
                        message: '"a" must be a boolean',
                        path: ['a'],
                        type: 'boolean.base',
                        context: { label: 'a', key: 'a', value: { c: 1 } }
                    }
                ]
            }],
            [{ b: undefined }, false, null, {
                message: '"b" is not allowed',
                details: [{
                    message: '"b" is not allowed',
                    path: ['b'],
                    type: 'object.allowUnknown',
                    context: { child: 'b', label: 'b', key: 'b', value: undefined }
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
                message: 'child "brand" fails because ["brand" at position 1 fails because ["1" must be one of [amex, visa]]]',
                details: [{
                    message: '"1" must be one of [amex, visa]',
                    path: ['brand', 1],
                    type: 'any.allowOnly',
                    context: { value: 'mc', valids: ['amex', 'visa'], label: 1, key: 1 }
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
                    context: { value: 5, invalids: [Infinity, -Infinity, 5], label: 'value', key: undefined }
                }]
            }],
            ['5', false, null, {
                message: '"value" contains an invalid value',
                details: [{
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 5, invalids: [Infinity, -Infinity, 5], label: 'value', key: undefined }
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
        expect(err.message).to.contain('"unknown" is not allowed');

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

        const err2 = await expect(Joi.compile(config).validate({ module: {} })).to.reject();
        expect(err2.message).to.contain('"compile" is required');
        expect(err2.message).to.contain('"module" must be a string');

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
            module: Joi.alt().try(
                Joi.object({
                    compile: Joi.func().required(),
                    execute: Joi.func()
                }),
                Joi.string()
            ).required()
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

        const schema = {
            a: Joi.object({
                b: Joi.string().required()
            })
        };

        const input = {
            a: '{"b":"string"}'
        };

        const value = await Joi.validate(input, schema);
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

        const schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        const value = await Joi.validate(obj, schema, { stripUnknown: true, allowUnknown: true });
        expect(value).to.equal({ a: 1, b: 'a' });
    });

    it('validates with extra keys and remove them when stripUnknown (as an object) is set', async () => {

        const schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        const value = await Joi.validate(obj, schema, { stripUnknown: { arrays: false, objects: true }, allowUnknown: true });
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

        const err = await expect(Joi.validate(obj, schema, { stripUnknown: true })).to.reject();
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
                key: undefined
            }
        }]);
    });

    it('validates dependencies when stripUnknown (as an object) is set', async () => {

        const schema = Joi.object({
            a: Joi.number(),
            b: Joi.string()
        }).and('a', 'b');

        const obj = {
            a: 1,
            foo: 'bar'
        };

        const err = await expect(Joi.validate(obj, schema, { stripUnknown: { arrays: false, objects: true } })).to.reject();
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
                key: undefined
            }
        }]);
    });

    it('fails to validate with incorrect property when asked to strip unknown keys without aborting early', async () => {

        const schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        const obj = {
            a: 1,
            b: 'f',
            d: 'c'
        };

        await expect(Joi.validate(obj, schema, { stripUnknown: true, abortEarly: false })).to.reject();
    });

    it('fails to validate with incorrect property when asked to strip unknown keys (as an object) without aborting early', async () => {

        const schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        const obj = {
            a: 1,
            b: 'f',
            d: 'c'
        };

        await expect(Joi.validate(obj, schema, { stripUnknown: { arrays: false, objects: true }, abortEarly: false })).to.reject();
    });

    it('should pass validation with extra keys when allowUnknown is set', async () => {

        const schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        const value = await Joi.validate(obj, schema, { allowUnknown: true });
        expect(value).to.equal({ a: 1, b: 'a', d: 'c' });
    });

    it('should pass validation with extra keys set', async () => {

        const localConfig = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c')
        }).options({ allowUnknown: true });

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
        }).options({ stripUnknown: true, allowUnknown: true });

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
        }).options({ stripUnknown: { arrays: false, objects: true }, allowUnknown: true });

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

        const schema = Joi.object({ username: Joi.string() }).options({ skipFunctions: true });
        const input = { username: 'test', func: function () { } };
        await Joi.validate(input, schema);
    });

    it('should work when the skipFunctions setting is disabled', async () => {

        const schema = { username: Joi.string() };
        const input = { username: 'test', func: function () { } };

        const err = await expect(Joi.validate(input, schema, { skipFunctions: false })).to.reject();
        expect(err.message).to.contain('"func" is not allowed');
    });

    it('should not convert values when convert is false', async () => {

        const schema = {
            arr: Joi.array().items(Joi.string())
        };

        const input = { arr: 'foo' };
        await expect(Joi.validate(input, schema, { convert: false })).to.reject();
    });

    it('full errors when abortEarly is false', async () => {

        const schema = {
            a: Joi.string(),
            b: Joi.string()
        };

        const input = { a: 1, b: 2 };

        const errOne = await expect(Joi.validate(input, schema)).to.reject();
        const errFull = await expect(Joi.validate(input, schema, { abortEarly: false })).to.reject();
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

        const err = await expect(Joi.validate(input, schema, { abortEarly: false })).to.reject();
        expect(err.details).to.have.length(6);
        expect(err.details).to.equal([{
            message: '"foo" length must be less than or equal to 3 characters long',
            path: ['test', 0, 'foo'],
            type: 'string.max',
            context: { limit: 3, value: 'test1', key: 'foo', label: 'foo', encoding: undefined }
        }, {
            message: '"bar" length must be less than or equal to 5 characters long',
            path: ['test', 0, 'bar'],
            type: 'string.max',
            context: { limit: 5, value: 'testfailed', key: 'bar', label: 'bar', encoding: undefined }
        }, {
            message: '"foo" length must be less than or equal to 3 characters long',
            path: ['test2', 'test3', 1, 'foo'],
            type: 'string.max',
            context: { limit: 3, value: 'test1', key: 'foo', label: 'foo', encoding: undefined }
        }, {
            message: '"bar" length must be less than or equal to 5 characters long',
            path: ['test2', 'test3', 1, 'bar'],
            type: 'string.max',
            context: { limit: 5, value: 'testfailed', key: 'bar', label: 'bar', encoding: undefined }
        }, {
            message: '"foo" length must be less than or equal to 3 characters long',
            path: ['test2', 'test3', 2, 'baz', 'test4', 0, 'foo'],
            type: 'string.max',
            context: { limit: 3, value: 'test1', key: 'foo', label: 'foo', encoding: undefined }
        }, {
            message: '"baz" is not allowed',
            path: ['test2', 'test3', 2, 'baz', 'test4', 0, 'baz'],
            type: 'object.allowUnknown',
            context: { key: 'baz', label: 'baz', child: 'baz', value: '123' }
        }]);
    });

    it('validates using the root any object', async () => {

        const any = Joi;
        await any.validate('abc');
    });

    it('validates using the root any object (no callback)', () => {

        const any = Joi;
        const result = any.validate('abc');
        expect(result.error).to.not.exist();
        expect(result.value).to.equal('abc');
    });

    it('accepts no options', async () => {

        await Joi.validate('test', Joi.string());
    });

    it('accepts no options (no callback)', () => {

        const result = Joi.validate('test', Joi.string());
        expect(result.error).to.not.exist();
        expect(result.value).to.equal('test');
    });

    it('accepts options', async () => {

        await expect(Joi.validate('5', Joi.number(), { convert: false })).to.reject();
    });

    it('accepts options (no callback)', () => {

        const result = Joi.validate('5', Joi.number(), { convert: false });
        expect(result.error).to.exist();
    });

    it('accepts null options', async () => {

        await Joi.validate('test', Joi.string(), null);
    });

    it('accepts undefined options', async () => {

        await Joi.validate('test', Joi.string(), undefined);
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
                date: Joi.date(),
                child: Joi.object({
                    alphanum: Joi.string().alphanum()
                })
            },
            min: [Joi.number(), Joi.string().min(3)],
            max: Joi.string().max(3).default(0),
            required: Joi.string().required(),
            xor: Joi.string(),
            renamed: Joi.string().valid('456'),
            notEmpty: Joi.string().required().description('a').notes('b').tags('c'),
            empty: Joi.string().empty('').strip(),
            defaultRef: Joi.string().default(defaultRef, 'not here'),
            defaultFn: Joi.string().default(defaultFn, 'not here'),
            defaultDescribedFn: Joi.string().default(defaultDescribedFn, 'described test')
        }).options({ abortEarly: false, convert: false }).rename('renamed', 'required').without('required', 'xor').without('xor', 'required');

        const result = {
            type: 'object',
            children: {
                sub: {
                    type: 'object',
                    children: {
                        email: {
                            type: 'string',
                            invalids: [''],
                            rules: [{ name: 'email' }]
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
                            rules: [{ name: 'min', arg: 3 }]
                        }
                    ]
                },
                max: {
                    type: 'string',
                    flags: {
                        default: 0
                    },
                    invalids: [''],
                    rules: [{ name: 'max', arg: 3 }]
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
                        default: 'ref:xor'
                    },
                    invalids: ['']
                },
                defaultFn: {
                    type: 'string',
                    flags: {
                        default: {
                            description: 'testing',
                            function   : defaultFn
                        }
                    },
                    invalids: ['']
                },
                defaultDescribedFn: {
                    type: 'string',
                    flags: {
                        default: {
                            description: 'described test',
                            function   : defaultDescribedFn
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
                    isRegExp: false,
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
            expect(description.children.defaultRef.flags.default).to.equal('ref:xor');
            expect(description.children.defaultFn.flags.default.description).to.equal('testing');
            expect(description.children.defaultDescribedFn.flags.default.description).to.equal('described test');
        });

        it('describes schema (root)', () => {

            const description = Joi.describe(schema);
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
    });

    describe('assert()', () => {

        it('does not have a return value', () => {

            let result;
            expect(() => {

                result = Joi.assert('4', Joi.number());
            }).to.not.throw();
            expect(result).to.not.exist();
        });
    });

    describe('attempt()', () => {

        it('throws on invalid value', () => {

            expect(() => {

                Joi.attempt('x', Joi.number());
            }).to.throw('"value" must be a number');
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

        it('throws on invalid value with message as error', () => {

            expect(() => {

                Joi.attempt('x', Joi.number(), new Error('invalid value'));
            }).to.throw('invalid value');
        });

        it('throws a validation error and not a TypeError when parameter is given as a json string with incorrect property', () => {

            const schema = {
                a: Joi.object({
                    b: Joi.string()
                })
            };

            const input = {
                a: '{"c":"string"}'
            };

            expect(() => {

                Joi.attempt(input, schema);
            }).to.throw(/\"c\" is not allowed/);
        });

        it('throws a custom error from the schema if provided', () => {

            expect(() => {

                Joi.attempt('x', Joi.number().error(new Error('Oh noes !')));
            }).to.throw('Oh noes !');
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

    describe('reach()', () => {

        it('should fail without any parameter', () => {

            expect(() => Joi.reach()).to.throw('you must provide a joi schema');
        });

        it('should fail when schema is not a joi object', () => {

            expect(() => Joi.reach({ foo: 'bar' }, 'foo')).to.throw('you must provide a joi schema');
        });

        it('should fail without a proper path', () => {

            const schema = Joi.object();
            expect(() => Joi.reach(schema)).to.throw('path must be a string or an array of strings');
            expect(() => Joi.reach(schema, true)).to.throw('path must be a string or an array of strings');
        });

        it('should return undefined when no keys are defined', () => {

            const schema = Joi.object();
            expect(Joi.reach(schema, 'a')).to.be.undefined();
        });

        it('should return undefined when key is not found', () => {

            const schema = Joi.object().keys({ a: Joi.number() });
            expect(Joi.reach(schema, 'foo')).to.be.undefined();
        });

        it('should return a schema when key is found', () => {

            const a = Joi.number();
            const schema = Joi.object().keys({ a });
            expect(Joi.reach(schema, 'a')).to.shallow.equal(a);
        });

        it('should return a schema when key as array is found', () => {

            const a = Joi.number();
            const schema = Joi.object().keys({ a });
            expect(Joi.reach(schema, ['a'])).to.shallow.equal(a);
        });

        it('should return undefined on a schema that does not support reach', () => {

            const schema = Joi.number();
            expect(Joi.reach(schema, 'a')).to.be.undefined();
        });

        it('should return a schema when deep key is found', () => {

            const bar = Joi.number();
            const schema = Joi.object({ foo: Joi.object({ bar }) });
            expect(Joi.reach(schema, 'foo.bar')).to.shallow.equal(bar);
        });

        it('should return a schema when deep key is found', () => {

            const bar = Joi.number();
            const schema = Joi.object({ foo: Joi.object({ bar }) });
            expect(Joi.reach(schema, ['foo','bar'])).to.shallow.equal(bar);
        });

        it('should return undefined when deep key is not found', () => {

            const schema = Joi.object({ foo: Joi.object({ bar: Joi.number() }) });
            expect(Joi.reach(schema, 'foo.baz')).to.be.undefined();
        });

        it('should return the same schema with an empty path', () => {

            const schema = Joi.object();
            expect(Joi.reach(schema, '')).to.shallow.equal(schema);
        });
    });

    describe('extend()', () => {

        describe('parameters', () => {

            it('must be an object or array of objects', () => {

                expect(() => Joi.extend(true)).to.throw(/"value" at position 0 does not match any of the allowed types/);
                expect(() => Joi.extend(null)).to.throw(/"value" at position 0 does not match any of the allowed types/);
                expect(() => Joi.extend([{ name: 'foo' }, true])).to.throw(/"value" at position 1 does not match any of the allowed types/);
                expect(() => Joi.extend([{ name: 'foo' }, null])).to.throw(/"value" at position 1 does not match any of the allowed types/);
                expect(() => Joi.extend()).to.throw('You need to provide at least one extension');
            });

            it('must have a valid string as name for the type', () => {

                expect(() => Joi.extend({ base: Joi.number() })).to.throw(/"name" is required/);
                expect(() => Joi.extend({ name: 123 })).to.throw(/"name" must be a string/);
                expect(() => Joi.extend({ name: '' })).to.throw(/"name" is not allowed to be empty/);
            });

            it('must have a Joi schema as base when present', () => {

                expect(() => Joi.extend({ base: true })).to.throw(/"base" must be an object/);
                expect(() => Joi.extend({ base: { isJoi: true } })).to.throw(/"base" must be an instance of "Joi object"/);
            });

            it('must have valid coerce function', () => {

                expect(() => Joi.extend({ name: 'a', coerce: true })).to.throw(/"coerce" must be a Function/);
                expect(() => Joi.extend({ name: 'a', coerce() {} })).to.throw(/"coerce" must have an arity of 3/);
                expect(() => Joi.extend({ name: 'a', coerce(a, b) {} })).to.throw(/"coerce" must have an arity of 3/);
                expect(() => Joi.extend({ name: 'a', coerce(a, b, c, d) {} })).to.throw(/"coerce" must have an arity of 3/);
            });

            it('must have valid pre function', () => {

                expect(() => Joi.extend({ name: 'a', pre: true })).to.throw(/"pre" must be a Function/);
                expect(() => Joi.extend({ name: 'a', pre() {} })).to.throw(/"pre" must have an arity of 3/);
                expect(() => Joi.extend({ name: 'a', pre(a, b) {} })).to.throw(/"pre" must have an arity of 3/);
                expect(() => Joi.extend({ name: 'a', pre(a, b, c, d) {} })).to.throw(/"pre" must have an arity of 3/);
            });

            it('must have valid language object', () => {

                expect(() => Joi.extend({ name: 'a', language: true })).to.throw(/"language" must be an object/);
                expect(() => Joi.extend({ name: 'a', language() {} })).to.throw(/"language" must be an object/);
                expect(() => Joi.extend({ name: 'a', language: null })).to.throw(/"language" must be an object/);
            });

            it('must have valid rules', () => {

                expect(() => Joi.extend({ name: 'a', rules: true })).to.throw(/"rules" must be an array/);
                expect(() => Joi.extend({ name: 'a', rules: [true] })).to.throw(/"0" must be an object/);
                expect(() => Joi.extend({ name: 'a', rules: [{}] })).to.throw(/"name" is required/);
                expect(() => Joi.extend({ name: 'a', rules: [{ name: true }] })).to.throw(/"name" must be a string/);
                expect(() => Joi.extend({ name: 'a', rules: [{ name: 'foo' }] })).to.throw(/must contain at least one of \[setup, validate\]/);

                expect(() => {

                    Joi.extend({ name: 'a', rules: [{ name: 'foo', validate: true }] });
                }).to.throw(/"validate" must be a Function/);

                expect(() => {

                    Joi.extend({
                        name: 'a', rules: [{
                            name: 'foo',
                            validate() {}
                        }]
                    });
                }).to.throw(/"validate" must have an arity of 4/);

                expect(() => {

                    Joi.extend({ name: 'a', rules: [{ name: 'foo', setup: true }] });
                }).to.throw(/"setup" must be a Function/);

                expect(() => {

                    Joi.extend({
                        name: 'a', rules: [{
                            name: 'foo',
                            setup() {}
                        }]
                    });
                }).to.throw(/"setup" must have an arity of 1/);

                expect(() => {

                    Joi.extend({
                        name: 'a', rules: [{
                            name: 'foo',
                            validate(a, b, c, d) {},
                            params: {
                                foo: true
                            }
                        }]
                    });
                }).to.throw(/"foo" must be an object/);

                expect(() => {

                    Joi.extend({
                        name: 'a', rules: [{
                            name: 'foo',
                            validate(a, b, c, d) {},
                            params: {
                                foo: {}
                            }
                        }]
                    });
                }).to.throw(/"foo" must be an instance of "Joi object"/);

                expect(() => {

                    Joi.extend({
                        name: 'a', rules: [{
                            name: 'foo',
                            validate(a, b, c, d) {},
                            params: {
                                foo: { isJoi: true }
                            }
                        }]
                    });
                }).to.throw(/"foo" must be an instance of "Joi object"/);

                expect(() => {

                    Joi.extend({
                        name: 'a', rules: [{
                            name: 'foo',
                            validate(a, b, c, d) {},
                            params: Joi.number()
                        }]
                    });
                }).to.throw(/"params" must be an instance of "Joi object"/);
            });
        });

        it('defines a custom type with a default base', () => {

            const customJoi = Joi.extend({
                name: 'myType'
            });

            expect(Joi.myType).to.not.exist();
            expect(customJoi.myType).to.be.a.function();

            const schema = customJoi.myType();
            expect(schema._type).to.equal('myType');
            expect(schema.isJoi).to.be.true();
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
                        context: { value: 123, label: 'value', key: undefined }
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
                            label: 'value',
                            key: undefined
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
                    message: 'child "a" fails because ["a" must be a number]',
                    details: [{
                        message: '"a" must be a number',
                        path: ['a'],
                        type: 'number.base',
                        context: { key: 'a', label: 'a', value: 'a' }
                    }]
                }]
            ]);
        });

        it('defines a custom type with new rules', () => {

            const customJoi = Joi.extend({
                name: 'myType',
                language: {
                    bar: 'oh no bar !'
                },
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, options) {

                            return null; // Valid
                        }
                    },
                    {
                        name: 'bar',
                        validate(params, value, state, options) {

                            return this.createError('myType.bar', null, state, options);
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

        it('new rules should have the correct this', () => {

            const customJoi = Joi.extend({
                name: 'myType',
                language: {
                    bar: 'oh no bar !'
                },
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, options) {

                            return this.createError('myType.bar', { v: value }, state, options);
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
                pre(value, state, options) {

                    return this._flags.foo;
                },
                rules: [
                    {
                        name: 'foo',
                        params: {
                            first: Joi.string(),
                            second: Joi.func().ref()
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
                pre(value, state, options) {

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
                pre(value, state, options) {

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

                            return { isJoi:true };
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
                pre(value, state, options) {

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
                        validate(params, value, state, options) {

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
                        validate(params, value, state, options) {

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
                        validate(params, value, state, options) {

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
                        validate(params, value, state, options) {

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
                            q: Joi.func().ref(),
                            currency: Joi.string()
                        },
                        validate(params, value, state, options) {

                            const q = params.q(state.parent, options) || 0;
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
                        validate(params, value, state, options) {

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
                        validate(params, value, state, options) {

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

        it('does not override a predefined language', () => {

            const base = Joi.any().options({
                language: {
                    myType: {
                        foo: 'original'
                    }
                }
            });

            const customJoi = Joi.extend({
                base,
                name: 'myType',
                language: {
                    foo: 'modified'
                },
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, options) {

                            return this.createError('myType.foo', null, state, options);
                        }
                    }
                ]
            });

            // Checks for a language leak in the base
            expect(base._settings.language.myType.foo).to.equal('original');

            const schema = customJoi.myType().foo();
            const result = schema.validate({});
            expect(result.error).to.be.an.instanceof(Error);
            expect(result.error.toString()).to.equal('ValidationError: "value" original');
        });

        it('does not change predefined options', () => {

            const base = Joi.number().options({
                abortEarly: false
            });

            const customJoi = Joi.extend({
                base,
                name: 'myType',
                language: {
                    foo: 'foo'
                },
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, options) {

                            return this.createError('myType.foo', null, state, options);
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
                coerce(value, state, options) {

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
                coerce(value, state, options) {

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
                coerce(value, state, options) {

                    return 'foobar';
                },
                name: 'myType'
            });

            const customJoi2 = customJoi.extend({
                base: customJoi.myType(),
                coerce(value, state, options) {

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
                coerce(value, state, options) {

                    return this.createError('any.invalid', null, state, options);
                },
                name: 'myType'
            });

            const customJoi2 = customJoi.extend({
                base: customJoi.myType(),
                coerce(value, state, options) {

                    expect(value).to.equal('foobar');
                    return 'baz';
                },
                name: 'myType'
            });

            const schema = customJoi2.myType();
            const result = schema.validate('');
            expect(result.error).to.an.error('"value" contains an invalid value');
        });

        it('defines a custom type casting its input value', () => {

            const customJoi = Joi.extend({
                base: Joi.string(),
                pre(value, state, options) {

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
                coerce(value, state, options) {

                    return true;
                },
                pre(value, state, options) {

                    return value.toString();
                },
                name: 'myType'
            });

            const schema = customJoi.myType();
            const result = schema.validate('foo');
            expect(result.error).to.be.null();
            expect(result.value).to.equal('true');
        });

        it('defines a custom type with a failing coerce', () => {

            const customJoi = Joi.extend({
                coerce(value, state, options) {

                    return this.createError('any.invalid', null, state, options);
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
                pre(value, state, options) {

                    return this.createError('any.invalid', null, state, options);
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
                coerce(value, state, options) {

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
                pre(value, state, options) {

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
                pre(value, state, options) {

                    throw new Error('should not reach here');
                },
                name: 'myType'
            });

            const schema = customJoi.myType();
            const result = schema.validate('foo');
            expect(result.error).to.exist();
            expect(result.error.toString()).to.equal('ValidationError: "value" must be a number');
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
                            validate(params, value, state, options) {}
                        },
                        {
                            name: 'bar',
                            validate(params, value, state, options) {}
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
                                qux: Joi.func().ref(),
                                quux: Joi.func().ref()
                            },
                            validate(params, value, state, options) {}
                        }
                    ]
                });

                const schema = customJoi.myType().foo('bar', 42, Joi.ref('a.b'), Joi.ref('$c.d'));
                expect(schema.describe()).to.equal({
                    type: 'myType',
                    rules: [
                        { name: 'foo', arg: { bar: 'bar', baz: 42, qux: 'ref:a.b', quux: 'context:c.d' } }
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
                            validate(params, value, state, options) {}
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
                            validate(params, value, state, options) {}
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
                            validate(params, value, state, options) {}
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
                            validate(params, value, state, options) {}
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

            const customJoi = Joi.extend([
                {
                    name: 'myType'
                },
                (joi) => ({
                    name: 'mySecondType',
                    base: joi.myType()
                })
            ]);

            expect(() => customJoi.mySecondType()).to.not.throw();
        });

        it('should be able to merge rules when type is defined several times in the same extend call', () => {

            const customJoi = Joi.extend([
                (joi) => ({
                    name: 'myType',
                    base: joi.myType ? joi.myType() : joi.number(), // Inherit an already existing implementation or number
                    rules: [
                        {
                            name: 'foo',
                            validate(params, value, state, options) {

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
                            validate(params, value, state, options) {

                                return 2;
                            }
                        }
                    ]
                })
            ]);

            expect(() => customJoi.myType().foo().bar()).to.not.throw();
            expect(customJoi.attempt({ a: 123, b: 456 }, { a: customJoi.myType().foo(), b: customJoi.myType().bar() })).to.equal({ a: 1, b: 2 });
        });

        it('should only keep last definition when type is defined several times with different bases', () => {

            const customJoi = Joi.extend([
                (joi) => ({
                    name: 'myType',
                    base: Joi.number(),
                    rules: [
                        {
                            name: 'foo',
                            validate(params, value, state, options) {

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
                            validate(params, value, state, options) {

                                return 2;
                            }
                        }
                    ]
                })
            ]);

            expect(() => customJoi.myType().foo()).to.throw();
            expect(() => customJoi.myType().bar()).to.not.throw();
        });

        it('returns a generic error when using an undefined language', () => {

            const customJoi = Joi.extend({
                name: 'myType',
                rules: [{
                    name: 'foo',
                    validate(params, value, state, options) {

                        return this.createError('myType.foo', null, state, options);
                    }
                }]
            });

            const result = customJoi.myType().foo().validate({});
            expect(result.error).to.be.an.error('Error code "myType.foo" is not defined, your custom type is missing the correct language definition');
            expect(result.error.details).to.equal([{
                message: 'Error code "myType.foo" is not defined, your custom type is missing the correct language definition',
                path: [],
                type: 'myType.foo',
                context: { key: undefined, label: 'value' }
            }]);
        });

        it('merges languages when multiple extensions extend the same type', () => {

            const customJoiWithBoth = Joi.extend([
                (joi) => ({
                    base: joi.number(),
                    name: 'number',
                    language: { foo: 'foo' },
                    rules: [{
                        name: 'foo',
                        validate(params, value, state, options) {

                            return this.createError('number.foo', null, state, options);
                        }
                    }]
                }),
                (joi) => ({
                    base: joi.number(),
                    name: 'number',
                    language: { bar: 'bar' },
                    rules: [{
                        name: 'bar',
                        validate(params, value, state, options) {

                            return this.createError('number.bar', null, state, options);
                        }
                    }]
                })
            ]);

            expect(customJoiWithBoth.number().foo().validate(0).error).to.be.an.error('"value" foo');
            expect(customJoiWithBoth.number().bar().validate(0).error).to.be.an.error('"value" bar');

            const customJoiWithFirst = Joi.extend([
                (joi) => ({
                    base: joi.number(),
                    name: 'number',
                    language: { foo: 'foo' },
                    rules: [{
                        name: 'foo',
                        validate(params, value, state, options) {

                            return this.createError('number.foo', null, state, options);
                        }
                    }]
                }),
                (joi) => ({
                    base: joi.number(),
                    name: 'number',
                    rules: [{
                        name: 'bar',
                        validate(params, value, state, options) {

                            return this.createError('number.base', null, state, options);
                        }
                    }]
                })
            ]);

            expect(customJoiWithFirst.number().foo().validate(0).error).to.be.an.error('"value" foo');
            expect(customJoiWithFirst.number().bar().validate(0).error).to.be.an.error('"value" must be a number');

            const customJoiWithSecond = Joi.extend([
                (joi) => ({
                    base: joi.number(),
                    name: 'number',
                    rules: [{
                        name: 'foo',
                        validate(params, value, state, options) {

                            return this.createError('number.base', null, state, options);
                        }
                    }]
                }),
                (joi) => ({
                    base: joi.number(),
                    name: 'number',
                    language: { bar: 'bar' },
                    rules: [{
                        name: 'bar',
                        validate(params, value, state, options) {

                            return this.createError('number.bar', null, state, options);
                        }
                    }]
                })
            ]);

            expect(customJoiWithSecond.number().foo().validate(0).error).to.be.an.error('"value" must be a number');
            expect(customJoiWithSecond.number().bar().validate(0).error).to.be.an.error('"value" bar');
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
                    raw: true
                },
                children: {
                    foo: {
                        type: 'string',
                        description: 'defaulted',
                        flags: {
                            presence: 'required',
                            allowOnly: true,
                            raw: true
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

                    switch (schema.schemaType) {
                        case 'bool':
                            return schema.required();
                    }
                });
            }).to.throw('defaults() must return a schema');
        });

        it('should fail on missing return for a standard type', () => {

            const defaultJoi = Joi.defaults((schema) => {

                switch (schema.schemaType) {
                    case 'any':
                        return schema.required();
                }
            });
            expect(() => defaultJoi.string()).to.throw('defaults() must return a schema');
        });

        it('should fail on missing return for a standard type on an inherited default', () => {

            const defaultJoi = Joi.defaults((schema) => {

                switch (schema.schemaType) {
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

            const schema = Joi.string();

            const promise = Joi.validate('foo', schema);

            return promise.then((value) => {

                expect(value).to.equal('foo');
            }, () => {

                throw new Error('Should not go here');
            });
        });

        it('should work with a successful promise and a catch in between', () => {

            const schema = Joi.string();

            const promise = Joi.validate('foo', schema);

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

            const schema = Joi.string();

            const promise = Joi.validate(0, schema);

            return promise.then((value) => {

                throw new Error('Should not go here');
            }, (err) => {

                expect(err).to.be.an.error('"value" must be a string');
                expect(err.details).to.equal([{
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 0, key: undefined, label: 'value' }
                }]);
            });
        });

        it('should work with a failing promise and a then in between', () => {

            const schema = Joi.string();

            const promise = Joi.validate(0, schema);

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
                        context: { value: 0, key: undefined, label: 'value' }
                    }]);
                });
        });

        it('should work with a failing promise (with catch)', () => {

            const schema = Joi.string();

            const promise = Joi.validate(0, schema);

            return promise.catch((err) => {

                expect(err).to.be.an.error('"value" must be a string');
                expect(err.details).to.equal([{
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 0, key: undefined, label: 'value' }
                }]);
            });
        });

        it('should catch errors in a successful promise callback', () => {

            const schema = Joi.string();

            const promise = Joi.validate('foo', schema);

            return promise.then((value) => {

                throw new Error('oops');
            }).then(() => {

                throw new Error('Should not go here');
            }, (err) => {

                expect(err).to.be.an.error('oops');
            });
        });

        it('should catch errors in a failing promise callback', () => {

            const schema = Joi.string();

            const promise = Joi.validate(0, schema);

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

            const schema = Joi.string();

            const promise = Joi.validate(0, schema);

            return promise.catch(() => {

                throw new Error('oops');
            }).then(() => {

                throw new Error('Should not go here');
            }, (err) => {

                expect(err).to.be.an.error('oops');
            });
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
