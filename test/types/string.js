'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


process.env.TZ = 'utc'; // Needed for timezone sensitive tests


describe('string', () => {

    it('should throw an exception if arguments were passed.', () => {

        expect(() => Joi.string('invalid argument.')).to.throw('The string type does not allow arguments');
    });

    it('blocks empty strings by default', () => {

        Helper.validate(Joi.string(), [['', false, '"value" is not allowed to be empty']]);
        Helper.validate(Joi.string().allow('x'), [['', false, '"value" is not allowed to be empty']]);
        Helper.validate(Joi.string().allow(''), [['', true]]);
    });

    it('fails on boolean', () => {

        const schema = Joi.string();
        Helper.validate(schema, [
            [true, false, {
                message: '"value" must be a string',
                path: [],
                type: 'string.base',
                context: { value: true, label: 'value' }
            }],
            [false, false, {
                message: '"value" must be a string',
                path: [],
                type: 'string.base',
                context: { value: false, label: 'value' }
            }]
        ]);
    });

    it('fails on integer', () => {

        const schema = Joi.string();
        Helper.validate(schema, [
            [123, false, {
                message: '"value" must be a string',
                path: [],
                type: 'string.base',
                context: { value: 123, label: 'value' }
            }],
            [0, false, {
                message: '"value" must be a string',
                path: [],
                type: 'string.base',
                context: { value: 0, label: 'value' }
            }],
            ['123', true],
            ['0', true]
        ]);
    });

    it('allows undefined, deny empty string', () => {

        Helper.validate(Joi.string(), [
            [undefined, true],
            ['', false, {
                message: '"value" is not allowed to be empty',
                path: [],
                type: 'string.empty',
                context: { value: '', label: 'value' }
            }]
        ]);
    });

    it('validates null', () => {

        Helper.validate(Joi.string(), [[null, false, {
            message: '"value" must be a string',
            path: [],
            type: 'string.base',
            context: { value: null, label: 'value' }
        }]]);

        expect(Joi.string().validate(null).error.annotate()).to.equal('"value" must be a string');
    });

    it('supports own properties references', () => {

        const schema = Joi.string()
            .when('.length', { is: 3, then: 'abc', break: true })
            .when('.0', { is: 'a', then: 'axxx' });

        Helper.validate(schema, [
            ['abc', true],
            ['axxx', true]
        ]);
    });

    describe('allow()', () => {

        it('validates combination of allow(\'\') and min', () => {

            const rule = Joi.string().allow('').min(3);
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 3 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 3,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', true],
                ['1234', true],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of allow(\'\') and max', () => {

            const rule = Joi.string().allow('').max(3);
            Helper.validate(rule, [
                ['x', true],
                ['123', true],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of null allowed and max', () => {

            const rule = Joi.string().allow(null).max(3);
            Helper.validate(rule, [
                ['x', true],
                ['123', true],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, true]
            ]);
        });

        it('validates null with allow(null)', () => {

            Helper.validate(Joi.string().allow(null), [
                [null, true]
            ]);
        });

        it('validates "" (empty string) with allow(\'\')', () => {

            Helper.validate(Joi.string().allow(''), [
                ['', true],
                ['', true]
            ]);
        });
    });

    describe('alphanum()', () => {

        it('validates alphanum', () => {

            const schema = Joi.string().alphanum();
            Helper.validate(schema, [
                ['w0rld of w4lm4rtl4bs', false, {
                    message: '"value" must only contain alpha-numeric characters',
                    path: [],
                    type: 'string.alphanum',
                    context: { value: 'w0rld of w4lm4rtl4bs', label: 'value' }
                }],
                ['w0rldofw4lm4rtl4bs', true],
                ['abcd#f?h1j orly?', false, {
                    message: '"value" must only contain alpha-numeric characters',
                    path: [],
                    type: 'string.alphanum',
                    context: { value: 'abcd#f?h1j orly?', label: 'value' }
                }]
            ]);
        });

        it('validates combination of min, max, and alphanum', () => {

            const rule = Joi.string().min(2).max(3).alphanum();
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', true],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['12', true],
                ['ab', true],
                ['abc', true],
                ['abcd', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: 'abcd',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['*ab', false, {
                    message: '"value" must only contain alpha-numeric characters',
                    path: [],
                    type: 'string.alphanum',
                    context: { value: '*ab', label: 'value' }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of min, max, alphanum, and allow(\'\')', () => {

            const rule = Joi.string().min(2).max(3).alphanum().allow('');
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', true],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['12', true],
                ['ab', true],
                ['abc', true],
                ['abcd', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: 'abcd',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['*ab', false, {
                    message: '"value" must only contain alpha-numeric characters',
                    path: [],
                    type: 'string.alphanum',
                    context: { value: '*ab', label: 'value' }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of min, max, alphanum, and required', () => {

            const rule = Joi.string().min(2).max(3).alphanum().required();
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', true],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['12', true],
                ['ab', true],
                ['abc', true],
                ['abcd', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: 'abcd',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['*ab', false, {
                    message: '"value" must only contain alpha-numeric characters',
                    path: [],
                    type: 'string.alphanum',
                    context: { value: '*ab', label: 'value' }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of min, max, alphanum, and regex', () => {

            const rule = Joi.string().min(2).max(3).alphanum().regex(/^a/);
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', false, {
                    message: '"value" with value "123" fails to match the required pattern: /^a/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^a/,
                        value: '123',
                        label: 'value'
                    }
                }],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['12', false, {
                    message: '"value" with value "12" fails to match the required pattern: /^a/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^a/,
                        value: '12',
                        label: 'value'
                    }
                }],
                ['ab', true],
                ['abc', true],
                ['a2c', true],
                ['abcd', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: 'abcd',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['*ab', false, {
                    message: '"value" must only contain alpha-numeric characters',
                    path: [],
                    type: 'string.alphanum',
                    context: { value: '*ab', label: 'value' }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of min, max, alphanum, required, and regex', () => {

            const rule = Joi.string().min(2).max(3).alphanum().required().regex(/^a/);
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', false, {
                    message: '"value" with value "123" fails to match the required pattern: /^a/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^a/,
                        value: '123',
                        label: 'value'
                    }
                }],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['12', false, {
                    message: '"value" with value "12" fails to match the required pattern: /^a/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^a/,
                        value: '12',
                        label: 'value'
                    }
                }],
                ['ab', true],
                ['abc', true],
                ['a2c', true],
                ['abcd', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: 'abcd',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['*ab', false, {
                    message: '"value" must only contain alpha-numeric characters',
                    path: [],
                    type: 'string.alphanum',
                    context: { value: '*ab', label: 'value' }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of min, max, alphanum, allow(\'\'), and regex', () => {

            const rule = Joi.string().min(2).max(3).alphanum().allow('').regex(/^a/);
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', false, {
                    message: '"value" with value "123" fails to match the required pattern: /^a/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^a/,
                        value: '123',
                        label: 'value'
                    }
                }],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['12', false, {
                    message: '"value" with value "12" fails to match the required pattern: /^a/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^a/,
                        value: '12',
                        label: 'value'
                    }
                }],
                ['ab', true],
                ['abc', true],
                ['a2c', true],
                ['abcd', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: 'abcd',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['*ab', false, {
                    message: '"value" must only contain alpha-numeric characters',
                    path: [],
                    type: 'string.alphanum',
                    context: { value: '*ab', label: 'value' }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });
    });

    describe('base64()', () => {

        it('validates the base64 options', () => {

            expect(() => Joi.string().base64('a')).to.throw('Options must be of type object');
            expect(() => Joi.string().base64({ paddingRequired: 'a' })).to.throw('paddingRequired must be boolean');
            expect(() => Joi.string().base64({ urlSafe: 'a' })).to.throw('urlSafe must be boolean');
        });

        it('validates a base64 string with no options', () => {

            const rule = Joi.string().base64();
            Helper.validate(rule, [
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4=', true],
                ['YW55IGNh+/5hbCBwbGVhc3VyZS4=', true],
                ['=YW55IGNhcm5hbCBwbGVhc3VyZS4', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: '=YW55IGNhcm5hbCBwbGVhc3VyZS4',
                        label: 'value'
                    }
                }],
                ['YW55IGNhcm5hb-_wbGVhc3VyZS4=', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW55IGNhcm5hb-_wbGVhc3VyZS4=',
                        label: 'value'
                    }
                }],
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4==', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW55IGNhcm5hbCBwbGVhc3VyZS4==',
                        label: 'value'
                    }
                }],
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW55IGNhcm5hbCBwbGVhc3VyZS4',
                        label: 'value'
                    }
                }],
                ['Y=', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'Y=',
                        label: 'value'
                    }
                }],
                ['Y===', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'Y===',
                        label: 'value'
                    }
                }],
                ['YW', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW',
                        label: 'value'
                    }
                }],
                ['YW==', true],
                ['YW5', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW5',
                        label: 'value'
                    }
                }],
                ['YW5=', true],
                ['$#%#$^$^)(*&^%', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: '$#%#$^$^)(*&^%',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates a base64 string with padding explicitly required', () => {

            const rule = Joi.string().base64({ paddingRequired: true });
            Helper.validate(rule, [
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4=', true],
                ['=YW55IGNhcm5hbCBwbGVhc3VyZS4', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: '=YW55IGNhcm5hbCBwbGVhc3VyZS4',
                        label: 'value'
                    }
                }],
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4==', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW55IGNhcm5hbCBwbGVhc3VyZS4==',
                        label: 'value'
                    }
                }],
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW55IGNhcm5hbCBwbGVhc3VyZS4',
                        label: 'value'
                    }
                }],
                ['Y=', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'Y=',
                        label: 'value'
                    }
                }],
                ['Y===', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'Y===',
                        label: 'value'
                    }
                }],
                ['YW', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW',
                        label: 'value'
                    }
                }],
                ['YW==', true],
                ['YW5', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW5',
                        label: 'value'
                    }
                }],
                ['YW5=', true],
                ['$#%#$^$^)(*&^%', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: '$#%#$^$^)(*&^%',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates a base64 string with padding not required', () => {

            const rule = Joi.string().base64({ paddingRequired: false });
            Helper.validate(rule, [
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4=', true],
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4==', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW55IGNhcm5hbCBwbGVhc3VyZS4==',
                        label: 'value'
                    }
                }],
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4', true],
                ['=YW55IGNhcm5hbCBwbGVhc3VyZS4', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: '=YW55IGNhcm5hbCBwbGVhc3VyZS4',
                        label: 'value'
                    }
                }],
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4==', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW55IGNhcm5hbCBwbGVhc3VyZS4==',
                        label: 'value'
                    }
                }],
                ['YW55IG==cm5hbCBwbGVhc3VyZS4=', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW55IG==cm5hbCBwbGVhc3VyZS4=',
                        label: 'value'
                    }
                }],
                ['Y$', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'Y$',
                        label: 'value'
                    }
                }],
                ['Y', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'Y',
                        label: 'value'
                    }
                }],
                ['Y===', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'Y===',
                        label: 'value'
                    }
                }],
                ['YW', true],
                ['YW==', true],
                ['YW5', true],
                ['YW5=', true],
                ['$#%#$^$^)(*&^%', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: '$#%#$^$^)(*&^%',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates a url-safe base64 string with padding explicitly required', () => {

            const rule = Joi.string().base64({ urlSafe: true, paddingRequired: true });
            Helper.validate(rule, [
                ['YW55IGNhcm5hb-_wbGVhc3VyZS4=', true],
                ['=YW55IGNhcm5-_CBwbGVhc3VyZS4', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: '=YW55IGNhcm5-_CBwbGVhc3VyZS4',
                        label: 'value'
                    }
                }],
                ['YW55IGNhcm5+/CBwbGVhc3VyZS4=', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW55IGNhcm5+/CBwbGVhc3VyZS4=',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates a url-safe base64 string with padding not required', () => {

            const rule = Joi.string().base64({ urlSafe: true, paddingRequired: false });
            Helper.validate(rule, [
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4=', true],
                ['YW55IGNhcm-_bCBwbGVhc3VyZS4=', true],
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4', true],
                ['YW55IGNhc-_hbCBwbGVhc3VyZS4', true],
                ['YW55IGNhcm5hbCBwbGVhc3VyZS4==', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW55IGNhcm5hbCBwbGVhc3VyZS4==',
                        label: 'value'
                    }
                }],
                ['YW55IGNhcm-_bCBwbGVhc3VyZS4==', false, {
                    message: '"value" must be a valid base64 string',
                    path: [],
                    type: 'string.base64',
                    context: {
                        value: 'YW55IGNhcm-_bCBwbGVhc3VyZS4==',
                        label: 'value'
                    }
                }]
            ]);
        });
    });

    describe('creditCard()', () => {

        it('should validate credit card', () => {

            const t = Joi.string().creditCard();

            Helper.validate(t, [
                ['378734493671000', true],  // american express
                ['371449635398431', true],  // american express
                ['378282246310005', true],  // american express
                ['341111111111111', true],  // american express
                ['5610591081018250', true], // australian bank
                ['5019717010103742', true], // dankort pbs
                ['38520000023237', true],   // diners club
                ['30569309025904', true],   // diners club
                ['6011000990139424', true], // discover
                ['6011111111111117', true], // discover
                ['6011601160116611', true], // discover
                ['3566002020360505', true], // jbc
                ['3530111333300000', true], // jbc
                ['5105105105105100', true], // mastercard
                ['5555555555554444', true], // mastercard
                ['5431111111111111', true], // mastercard
                ['6331101999990016', true], // switch/solo paymentech
                ['4222222222222', true],    // visa
                ['4012888888881881', true], // visa
                ['4111111111111111', true], // visa
                ['4111111111111112', false, {
                    message: '"value" must be a credit card',
                    path: [],
                    type: 'string.creditCard',
                    context: { value: '4111111111111112', label: 'value' }
                }],
                ['411111111111111X', false, {
                    message: '"value" must be a credit card',
                    path: [],
                    type: 'string.creditCard',
                    context: { value: '411111111111111X', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });
    });

    describe('dataUri()', () => {

        it('validates a dataUri string', () => {

            const rule = Joi.string().dataUri();
            Helper.validate(rule, [
                ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', true],
                ['ata:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', false, {
                    message: '"value" must be a valid dataUri string',
                    path: [],
                    type: 'string.dataUri',
                    context: {
                        value: 'ata:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==',
                        label: 'value'
                    }
                }],
                ['data:image/png;iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', true],
                ['base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', false, {
                    message: '"value" must be a valid dataUri string',
                    path: [],
                    type: 'string.dataUri',
                    context: {
                        value: 'base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==',
                        label: 'value'
                    }
                }],
                ['data:base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', false, {
                    message: '"value" must be a valid dataUri string',
                    path: [],
                    type: 'string.dataUri',
                    context: {
                        value: 'data:base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==',
                        label: 'value'
                    }
                }],
                ['data:image/png;base64,=YW55IGNhcm5hbCBwbGVhc3VyZS4', false, {
                    message: '"value" must be a valid dataUri string',
                    path: [],
                    type: 'string.dataUri',
                    context: {
                        value: 'data:image/png;base64,=YW55IGNhcm5hbCBwbGVhc3VyZS4',
                        label: 'value'
                    }
                }],
                ['data:image/png;base64,YW55IGNhcm5hbCBwbGVhc3VyZS4=', true],
                ['data:image/png;charset=utf-8,=YW55IGNhcm5hbCBwbGVhc3VyZS', true],
                ['data:text/x-script.python;charset=utf-8,=YW55IGNhcm5hbCBwbGVhc3VyZS', true]
            ]);
        });

        it('validates a dataUri string with padding explicitly required', () => {

            const rule = Joi.string().dataUri({ paddingRequired: true });
            Helper.validate(rule, [
                ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', true],
                ['ata:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', false, {
                    message: '"value" must be a valid dataUri string',
                    path: [],
                    type: 'string.dataUri',
                    context: {
                        value: 'ata:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==',
                        label: 'value'
                    }
                }],
                ['data:image/png;iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', true],
                ['base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', false, {
                    message: '"value" must be a valid dataUri string',
                    path: [],
                    type: 'string.dataUri',
                    context: {
                        value: 'base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==',
                        label: 'value'
                    }
                }],
                ['data:base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', false, {
                    message: '"value" must be a valid dataUri string',
                    path: [],
                    type: 'string.dataUri',
                    context: {
                        value: 'data:base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==',
                        label: 'value'
                    }
                }],
                ['data:image/png;base64,=YW55IGNhcm5hbCBwbGVhc3VyZS4', false, {
                    message: '"value" must be a valid dataUri string',
                    path: [],
                    type: 'string.dataUri',
                    context: {
                        value: 'data:image/png;base64,=YW55IGNhcm5hbCBwbGVhc3VyZS4',
                        label: 'value'
                    }
                }],
                ['data:image/png;base64,YW55IGNhcm5hbCBwbGVhc3VyZS4=', true],
                ['data:image/png;charset=utf-8,=YW55IGNhcm5hbCBwbGVhc3VyZS', true]
            ]);

        });

        it('validates a dataUri string with padding not required', () => {

            const rule = Joi.string().dataUri({ paddingRequired: false });
            Helper.validate(rule, [
                ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', true],
                ['ata:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', false, {
                    message: '"value" must be a valid dataUri string',
                    path: [],
                    type: 'string.dataUri',
                    context: {
                        value: 'ata:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==',
                        label: 'value'
                    }
                }],
                ['data:image/png;iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', true],
                ['base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', false, {
                    message: '"value" must be a valid dataUri string',
                    path: [],
                    type: 'string.dataUri',
                    context: {
                        value: 'base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==',
                        label: 'value'
                    }
                }],
                ['data:base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==', false, {
                    message: '"value" must be a valid dataUri string',
                    path: [],
                    type: 'string.dataUri',
                    context: {
                        value: 'data:base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAABJRU5ErkJggg==',
                        label: 'value'
                    }
                }],
                ['data:image/png;base64,=YW55IGNhcm5hbCBwbGVhc3VyZS4', false, {
                    message: '"value" must be a valid dataUri string',
                    path: [],
                    type: 'string.dataUri',
                    context: {
                        value: 'data:image/png;base64,=YW55IGNhcm5hbCBwbGVhc3VyZS4',
                        label: 'value'
                    }
                }],
                ['data:image/png;base64,YW55IGNhcm5hbCBwbGVhc3VyZS4=', true],
                ['data:image/png;charset=utf-8,=YW55IGNhcm5hbCBwbGVhc3VyZS', true]
            ]);

        });
    });

    describe('describe()', () => {

        it('describes various versions of a guid', () => {

            const schema = Joi.string().guid({ version: ['uuidv1', 'uuidv3', 'uuidv5'] });

            expect(schema.describe()).to.equal({
                type: 'string',
                rules: [
                    {
                        name: 'guid',
                        args: {
                            options: {
                                version: ['uuidv1', 'uuidv3', 'uuidv5']
                            }
                        }
                    }
                ]
            });
        });

        it('describes invert regex pattern', () => {

            const schema = Joi.string().regex(/[a-z]/, { invert: true });

            expect(schema.describe()).to.equal({
                type: 'string',
                rules: [
                    {
                        name: 'pattern',
                        args: {
                            regex: '/[a-z]/',
                            options: {
                                invert: true
                            }
                        }
                    }
                ]
            });
        });
    });

    describe('domain()', () => {

        it('validates options', () => {

            expect(() => Joi.string().domain({ minDomainSegments: 1 })).to.not.throw();
            expect(() => Joi.string().domain({ minDomainSegments: '1' })).to.throw('minDomainSegments must be a positive integer');
            expect(() => Joi.string().domain({ minDomainSegments: 0 })).to.throw('minDomainSegments must be a positive integer');
            expect(() => Joi.string().domain({ minDomainSegments: -1 })).to.throw('minDomainSegments must be a positive integer');
            expect(() => Joi.string().domain({ minDomainSegments: 2.3 })).to.throw('minDomainSegments must be a positive integer');

            expect(() => Joi.string().domain({ maxDomainSegments: 4 })).to.not.throw();
            expect(() => Joi.string().domain({ maxDomainSegments: '1' })).to.throw('maxDomainSegments must be a positive integer');
            expect(() => Joi.string().domain({ maxDomainSegments: 0 })).to.throw('maxDomainSegments must be a positive integer');
            expect(() => Joi.string().domain({ maxDomainSegments: -1 })).to.throw('maxDomainSegments must be a positive integer');
            expect(() => Joi.string().domain({ maxDomainSegments: 2.3 })).to.throw('maxDomainSegments must be a positive integer');

            expect(() => Joi.string().domain({ tlds: false })).to.not.throw();
            expect(() => Joi.string().domain({ tlds: true })).to.not.throw();
            expect(() => Joi.string().domain({ tlds: {} })).to.not.throw();

            expect(() => Joi.string().domain({ tlds: { allow: true } })).to.not.throw();
            expect(() => Joi.string().domain({ tlds: { allow: false } })).to.not.throw();
            expect(() => Joi.string().domain({ tlds: { allow: ['com'] } })).to.not.throw();
            expect(() => Joi.string().domain({ tlds: { allow: new Set(['com']) } })).to.not.throw();
            expect(() => Joi.string().domain({ tlds: { allow: 'com' } })).to.throw('tlds.allow must be an array, Set, or boolean');
            expect(() => Joi.string().domain({ tlds: { allow: { com: true } } })).to.throw('tlds.allow must be an array, Set, or boolean');
            expect(() => Joi.string().domain({ tlds: { allow: ['co.uk'] } })).to.throw('tlds.allow must contain valid top level domain names');

            expect(() => Joi.string().domain({ tlds: { deny: ['com'] } })).to.not.throw();
            expect(() => Joi.string().domain({ tlds: { deny: false } })).to.not.throw();
            expect(() => Joi.string().domain({ tlds: { deny: new Set(['com']) } })).to.not.throw();
            expect(() => Joi.string().domain({ tlds: { deny: true } })).to.throw('tlds.deny must be an array, Set, or boolean');
            expect(() => Joi.string().domain({ tlds: { deny: 'com' } })).to.throw('tlds.deny must be an array, Set, or boolean');
            expect(() => Joi.string().domain({ tlds: { deny: { com: true } } })).to.throw('tlds.deny must be an array, Set, or boolean');
            expect(() => Joi.string().domain({ tlds: { deny: ['co.uk'] } })).to.throw('tlds.deny must contain valid top level domain names');
        });

        it('validates domain', () => {

            const schema = Joi.string().domain();
            Helper.validate(schema, [
                ['example.com', true],
                ['com', false, {
                    message: '"value" must contain a valid domain name',
                    path: [],
                    type: 'string.domain',
                    context: { value: 'com', label: 'value' }
                }],
                ['"example.com', false, {
                    message: '"value" must contain a valid domain name',
                    path: [],
                    type: 'string.domain',
                    context: { value: '"example.com', label: 'value' }
                }],
                ['mail@example.com', false, '"value" must contain a valid domain name']
            ]);
        });

        it('validates domain with tlds.allow', () => {

            const schema = Joi.string().domain({ tlds: { allow: ['com', 'org'] } });
            Helper.validate(schema, [
                ['example.com', true],
                ['example.org', true],
                ['example.edu', false, {
                    message: '"value" must contain a valid domain name',
                    path: [],
                    type: 'string.domain',
                    context: { value: 'example.edu', label: 'value' }
                }]
            ]);
        });

        it('validates domain with minDomainSegments', () => {

            const schema = Joi.string().domain({ minDomainSegments: 4 });
            Helper.validate(schema, [
                ['example.com', false, {
                    message: '"value" must contain a valid domain name',
                    path: [],
                    type: 'string.domain',
                    context: { value: 'example.com', label: 'value' }
                }],
                ['www.example.com', false, {
                    message: '"value" must contain a valid domain name',
                    path: [],
                    type: 'string.domain',
                    context: { value: 'www.example.com', label: 'value' }
                }],
                ['sub.www.example.com', true]
            ]);
        });

        it('validates domain with maxDomainSegments', () => {

            const schema = Joi.string().domain({ maxDomainSegments: 4 });
            Helper.validate(schema, [
                ['x.y.z.example.com', false, {
                    message: '"value" must contain a valid domain name',
                    path: [],
                    type: 'string.domain',
                    context: { value: 'x.y.z.example.com', label: 'value' }
                }],
                ['sub.www.example.com', true]
            ]);
        });

        it('validates domain', () => {

            const schema = { item: Joi.string().domain() };
            Helper.validate(Joi.compile(schema), [[{ item: 'something' }, false, {
                message: '"item" must contain a valid domain name',
                path: ['item'],
                type: 'string.domain',
                context: { value: 'something', label: 'item', key: 'item' }
            }]]);
        });
    });

    describe('email()', () => {

        it('validates options', () => {

            expect(() => Joi.string().email({})).to.not.throw();
            expect(() => Joi.string().email({ minDomainSegments: 1 })).to.not.throw();
            expect(() => Joi.string().email({ minDomainSegments: '1' })).to.throw('minDomainSegments must be a positive integer');
            expect(() => Joi.string().email({ minDomainSegments: 0 })).to.throw('minDomainSegments must be a positive integer');
            expect(() => Joi.string().email({ minDomainSegments: -1 })).to.throw('minDomainSegments must be a positive integer');
            expect(() => Joi.string().email({ minDomainSegments: 2.3 })).to.throw('minDomainSegments must be a positive integer');

            expect(() => Joi.string().email({ tlds: false })).to.not.throw();
            expect(() => Joi.string().email({ tlds: true })).to.not.throw();
            expect(() => Joi.string().email({ tlds: {} })).to.not.throw();

            expect(() => Joi.string().email({ tlds: { allow: true } })).to.not.throw();
            expect(() => Joi.string().email({ tlds: { allow: false } })).to.not.throw();
            expect(() => Joi.string().email({ tlds: { allow: ['com'] } })).to.not.throw();
            expect(() => Joi.string().email({ tlds: { allow: new Set(['com']) } })).to.not.throw();
            expect(() => Joi.string().email({ tlds: { allow: 'com' } })).to.throw('tlds.allow must be an array, Set, or boolean');
            expect(() => Joi.string().email({ tlds: { allow: { com: true } } })).to.throw('tlds.allow must be an array, Set, or boolean');

            expect(() => Joi.string().email({ tlds: { deny: ['com'] } })).to.not.throw();
            expect(() => Joi.string().email({ tlds: { deny: new Set(['com']) } })).to.not.throw();
            expect(() => Joi.string().email({ tlds: { deny: false } })).to.not.throw();
            expect(() => Joi.string().email({ tlds: { deny: true } })).to.throw('tlds.deny must be an array, Set, or boolean');
            expect(() => Joi.string().email({ tlds: { deny: 'com' } })).to.throw('tlds.deny must be an array, Set, or boolean');
            expect(() => Joi.string().email({ tlds: { deny: { com: true } } })).to.throw('tlds.deny must be an array, Set, or boolean');

            expect(() => Joi.string().email({ multiple: true })).to.not.throw();
            expect(() => Joi.string().email({ multiple: false })).to.not.throw();
            expect(() => Joi.string().email({ multiple: {} })).to.throw('multiple option must be an boolean');
            expect(() => Joi.string().email({ multiple: 'abc' })).to.throw('multiple option must be an boolean');
        });

        it('validates email', () => {

            const schema = Joi.string().email();
            Helper.validate(schema, [
                ['joe@example.com', true],
                ['êjness@something.com', true],
                ['"joe"@example.com', false, {
                    message: '"value" must be a valid email',
                    path: [],
                    type: 'string.email',
                    context: { value: '"joe"@example.com', invalids: ['"joe"@example.com'], label: 'value' }
                }],
                ['example@io', false, {
                    message: '"value" must be a valid email',
                    path: [],
                    type: 'string.email',
                    context: { value: 'example@io', invalids: ['example@io'], label: 'value' }
                }],
                ['@iaminvalid.com', false, {
                    message: '"value" must be a valid email',
                    path: [],
                    type: 'string.email',
                    context: { value: '@iaminvalid.com', invalids: ['@iaminvalid.com'], label: 'value' }
                }],
                ['joe@[IPv6:2a00:1450:4001:c02::1b]', false, {
                    message: '"value" must be a valid email',
                    path: [],
                    type: 'string.email',
                    context: { value: 'joe@[IPv6:2a00:1450:4001:c02::1b]', invalids: ['joe@[IPv6:2a00:1450:4001:c02::1b]'], label: 'value' }
                }],
                ['12345678901234567890123456789012345678901234567890123456789012345@example.com', false, {
                    message: '"value" must be a valid email',
                    path: [],
                    type: 'string.email',
                    context: { value: '12345678901234567890123456789012345678901234567890123456789012345@example.com', invalids: ['12345678901234567890123456789012345678901234567890123456789012345@example.com'], label: 'value' }
                }],
                ['123456789012345678901234567890123456789012345678901234567890@12345678901234567890123456789012345678901234567890123456789.12345678901234567890123456789012345678901234567890123456789.12345678901234567890123456789012345678901234567890123456789.12345.toolong.com', false, {
                    message: '"value" must be a valid email',
                    path: [],
                    type: 'string.email',
                    context: { value: '123456789012345678901234567890123456789012345678901234567890@12345678901234567890123456789012345678901234567890123456789.12345678901234567890123456789012345678901234567890123456789.12345678901234567890123456789012345678901234567890123456789.12345.toolong.com', invalids: ['123456789012345678901234567890123456789012345678901234567890@12345678901234567890123456789012345678901234567890123456789.12345678901234567890123456789012345678901234567890123456789.12345678901234567890123456789012345678901234567890123456789.12345.toolong.com'], label: 'value' }
                }]
            ]);
        });

        it('allows long emails', () => {

            const schema = Joi.string().email({ ignoreLength: true });
            Helper.validate(schema, [
                ['12345678901234567890123456789012345678901234567890123456789012345@example.com', true],
                ['123456789012345678901234567890123456789012345678901234567890@12345678901234567890123456789012345678901234567890123456789.12345678901234567890123456789012345678901234567890123456789.12345678901234567890123456789012345678901234567890123456789.12345.toolong.com', true]
            ]);
        });

        it('validates email with tlds.allow', () => {

            const schema = Joi.string().email({ tlds: { allow: ['com', 'org'] } });
            Helper.validate(schema, [
                ['joe@example.com', true],
                ['joe@example.org', true],
                ['joe@example.edu', false, {
                    message: '"value" must be a valid email',
                    path: [],
                    type: 'string.email',
                    context: { value: 'joe@example.edu', invalids: ['joe@example.edu'], label: 'value' }
                }]
            ]);
        });

        it('validates email with tlds false', () => {

            const schema = Joi.string().email({ tlds: false });
            Helper.validate(schema, [
                ['joe@example.no-such-domain', true],
                ['joe@example.org', true]
            ]);
        });

        it('validates email with minDomainSegments', () => {

            const schema = Joi.string().email({ minDomainSegments: 4 });
            Helper.validate(schema, [
                ['joe@example.com', false, {
                    message: '"value" must be a valid email',
                    path: [],
                    type: 'string.email',
                    context: { value: 'joe@example.com', invalids: ['joe@example.com'], label: 'value' }
                }],
                ['joe@www.example.com', false, {
                    message: '"value" must be a valid email',
                    path: [],
                    type: 'string.email',
                    context: { value: 'joe@www.example.com', invalids: ['joe@www.example.com'], label: 'value' }
                }],
                ['joe@sub.www.example.com', true]
            ]);
        });

        it('validates email with multiple', () => {

            const schema = Joi.string().email({ multiple: true });
            Helper.validate(schema, [
                ['joe@example.com', true],
                ['joe@example.com, joe@example.org, joe@example.com', true],
                ['joe@example.com , joe@example.org ,joe@example.com', true],
                ['joe@example.com  , joe@example.org ,  joe@example.com', true],
                ['joe@example.com, joe@example, joe@example.org, joe@com', false, {
                    message: '"value" must be a valid email',
                    path: [],
                    type: 'string.email',
                    context: { value: 'joe@example.com, joe@example, joe@example.org, joe@com', invalids: ['joe@example', 'joe@com'], label: 'value' }
                }]
            ]);
        });

        it('validates email with multiple (separator)', () => {

            const schema = Joi.string().email({ multiple: true, separator: ';' });
            Helper.validate(schema, [
                ['joe@example.com', true],
                ['joe@example.com; joe@example.org; joe@example.com', true],
                ['joe@example.com ; joe@example.org ;joe@example.com', true],
                ['joe@example.com  ; joe@example.org ;  joe@example.com', true],
                ['joe@example.com; joe@example; joe@example.org; joe@com', false, {
                    message: '"value" must be a valid email',
                    path: [],
                    type: 'string.email',
                    context: { value: 'joe@example.com; joe@example; joe@example.org; joe@com', invalids: ['joe@example', 'joe@com'], label: 'value' }
                }]
            ]);
        });

        it('validates email', () => {

            const schema = { item: Joi.string().email() };
            Helper.validate(Joi.compile(schema), [[{ item: 'something' }, false, {
                message: '"item" must be a valid email',
                path: ['item'],
                type: 'string.email',
                context: { value: 'something', invalids: ['something'], label: 'item', key: 'item' }
            }]]);
        });

        it('validates combination of email and min', () => {

            const rule = Joi.string().email().min(8);
            Helper.validate(rule, [
                ['x@x.com', false, {
                    message: '"value" length must be at least 8 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 8,
                        value: 'x@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123@x.com', true],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of email, min, and max', () => {

            const rule = Joi.string().email().min(8).max(10);
            Helper.validate(rule, [
                ['x@x.com', false, {
                    message: '"value" length must be at least 8 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 8,
                        value: 'x@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123@x.com', true],
                ['1234@x.com', true],
                ['12345@x.com', false, {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 10,
                        value: '12345@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of email, min, max, and invalid', () => {

            const rule = Joi.string().email().min(8).max(10).invalid('123@x.com');
            Helper.validate(rule, [
                ['x@x.com', false, {
                    message: '"value" length must be at least 8 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 8,
                        value: 'x@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123@x.com', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: '123@x.com', invalids: ['123@x.com'], label: 'value' }
                }],
                ['1234@x.com', true],
                ['12345@x.com', false, {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 10,
                        value: '12345@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of email, min, max, and allow', () => {

            const rule = Joi.string().email().min(8).max(10).allow('x@x.com');
            Helper.validate(rule, [
                ['x@x.com', true],
                ['123@x.com', true],
                ['1234@x.com', true],
                ['12345@x.com', false, {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 10,
                        value: '12345@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of email, min, max, allow, and invalid', () => {

            const rule = Joi.string().email().min(8).max(10).allow('x@x.com').invalid('123@x.com');
            Helper.validate(rule, [
                ['x@x.com', true],
                ['123@x.com', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: '123@x.com', invalids: ['123@x.com'], label: 'value' }
                }],
                ['1234@x.com', true],
                ['12345@x.com', false, {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 10,
                        value: '12345@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of email, min, max, allow, invalid, and allow(\'\')', () => {

            const rule = Joi.string().email().min(8).max(10).allow('x@x.com').invalid('123@x.com').allow('');
            Helper.validate(rule, [
                ['x@x.com', true],
                ['123@x.com', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: '123@x.com', invalids: ['123@x.com'], label: 'value' }
                }],
                ['1234@x.com', true],
                ['12345@x.com', false, {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 10,
                        value: '12345@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of email, min, max, allow, and allow(\'\')', () => {

            const rule = Joi.string().email().min(8).max(10).allow('x@x.com').allow('');
            Helper.validate(rule, [
                ['x@x.com', true],
                ['123@x.com', true],
                ['1234@x.com', true],
                ['12345@x.com', false, {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 10,
                        value: '12345@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of email, min, max, allow, invalid, and regex', () => {

            const rule = Joi.string().email().min(8).max(10).allow('x@x.com').invalid('123@x.com').regex(/^1/);
            Helper.validate(rule, [
                ['x@x.com', true],
                ['123@x.com', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: '123@x.com', invalids: ['123@x.com'], label: 'value' }
                }],
                ['1234@x.com', true],
                ['12345@x.com', false, {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 10,
                        value: '12345@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of email, min, max, allow, invalid, regex, and allow(\'\')', () => {

            const rule = Joi.string().email().min(8).max(10).allow('x@x.com').invalid('123@x.com').regex(/^1/).allow('');
            Helper.validate(rule, [
                ['x@x.com', true],
                ['123@x.com', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: '123@x.com', invalids: ['123@x.com'], label: 'value' }
                }],
                ['1234@x.com', true],
                ['12345@x.com', false, {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 10,
                        value: '12345@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of email, min, max, and allow(\'\')', () => {

            const rule = Joi.string().email().min(8).max(10).allow('');
            Helper.validate(rule, [
                ['x@x.com', false, {
                    message: '"value" length must be at least 8 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 8,
                        value: 'x@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123@x.com', true],
                ['1234@x.com', true],
                ['12345@x.com', false, {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 10,
                        value: '12345@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of email, min, max, and regex', () => {

            const rule = Joi.string().email().min(8).max(10).regex(/^1234/);
            Helper.validate(rule, [
                ['x@x.com', false, {
                    message: '"value" length must be at least 8 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 8,
                        value: 'x@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123@x.com', false, {
                    message: '"value" with value "123@x.com" fails to match the required pattern: /^1234/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^1234/,
                        value: '123@x.com',
                        label: 'value'
                    }
                }],
                ['1234@x.com', true],
                ['12345@x.com', false, {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 10,
                        value: '12345@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of email, min, max, regex, and allow(\'\')', () => {

            const rule = Joi.string().email().min(8).max(10).regex(/^1234/).allow('');
            Helper.validate(rule, [
                ['x@x.com', false, {
                    message: '"value" length must be at least 8 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 8,
                        value: 'x@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123@x.com', false, {
                    message: '"value" with value "123@x.com" fails to match the required pattern: /^1234/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^1234/,
                        value: '123@x.com',
                        label: 'value'
                    }
                }],
                ['1234@x.com', true],
                ['12345@x.com', false, {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 10,
                        value: '12345@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of email, min, max, regex, and required', () => {

            const rule = Joi.string().email().min(8).max(10).regex(/^1234/).required();
            Helper.validate(rule, [
                ['x@x.com', false, {
                    message: '"value" length must be at least 8 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 8,
                        value: 'x@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123@x.com', false, {
                    message: '"value" with value "123@x.com" fails to match the required pattern: /^1234/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^1234/,
                        value: '123@x.com',
                        label: 'value'
                    }
                }],
                ['1234@x.com', true],
                ['12345@x.com', false, {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 10,
                        value: '12345@x.com',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });
    });

    describe('guid()', () => {

        it('throws when options.version is invalid', () => {

            expect(() => Joi.string().guid({ version: 42 })).to.throw('version at position 0 must be a string');
            expect(() => Joi.string().guid({ version: '42' })).to.throw('version at position 0 must be one of uuidv1, uuidv2, uuidv3, uuidv4, uuidv5');
        });

        it('throws when options.separator is invalid', () => {

            expect(() => Joi.string().guid({ separator: 42 })).to.throw('separator must be one of true, false, "-", or ":"');
        });

        it('validates guid', () => {

            Helper.validate(Joi.string().guid(), [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', true],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-4548-85E4-04FC71357423', true],
                ['69593D62:71EA:4548:85E4:04FC71357423', true],
                ['677E2553DD4D43B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', true],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', true],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', true],
                ['{D1A5279D-B27D-0CD4-005E-EFDD53D08E8D}', true],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D]', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D]',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D:B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D:B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D:4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D:4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4:A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4:A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E:EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E:EFDD53D08E8D}',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates uuidv1', () => {

            Helper.validate(Joi.string().guid({ version: ['uuidv1'] }), [
                ['{D1A5279D-B27D-1CD4-A05E-EFDD53D08E8D}', true],
                ['{B59511BD6A5F1DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-1548-85E4-04FC71357423', true],
                ['677E2553DD4D13B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-1717-88c1-b7c4b7ba80db}', true],
                ['{7e9081b59a6d1cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-1c48-9b33-68921dd72463', true],
                ['b4b2fb69c6241e5eb0698e0c6ec66618', true],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-1CD4-C05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-1CD4-C05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{283B67B2-430F-1E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-1E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-1CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-1CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-1CD4-A05E-EFDD53D08E8D]', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-1CD4-A05E-EFDD53D08E8D]',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-1CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-1CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D:B27D-1CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D:B27D-1CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D:1CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D:1CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-1CD4:A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-1CD4:A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-1CD4-A05E:EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-1CD4-A05E:EFDD53D08E8D}',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates uuidv2', () => {

            Helper.validate(Joi.string().guid({ version: ['uuidv2'] }), [
                ['{D1A5279D-B27D-2CD4-A05E-EFDD53D08E8D}', true],
                ['{B59511BD6A5F2DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-2548-85E4-04FC71357423', true],
                ['677E2553DD4D23B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-2717-88c1-b7c4b7ba80db}', true],
                ['{7e9081b59a6d2cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-2c48-9b33-68921dd72463', true],
                ['b4b2fb69c6242e5eb0698e0c6ec66618', true],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-2CD4-C05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-2CD4-C05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{283B67B2-430F-2E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-2E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-2CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-2CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-2CD4-A05E-EFDD53D08E8D]', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-2CD4-A05E-EFDD53D08E8D]',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-2CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-2CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D:B27D-2CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D:B27D-2CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D:2CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D:2CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-2CD4:A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-2CD4:A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-2CD4-A05E:EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-2CD4-A05E:EFDD53D08E8D}',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates uuidv3', () => {

            Helper.validate(Joi.string().guid({ version: ['uuidv3'] }), [
                ['{D1A5279D-B27D-3CD4-A05E-EFDD53D08E8D}', true],
                ['{B59511BD6A5F3DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-3548-85E4-04FC71357423', true],
                ['677E2553DD4D33B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-3717-88c1-b7c4b7ba80db}', true],
                ['{7e9081b59a6d3cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-3c48-9b33-68921dd72463', true],
                ['b4b2fb69c6243e5eb0698e0c6ec66618', true],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-3CD4-C05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-3CD4-C05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{283B67B2-430F-3E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-3E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-3CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-3CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-3CD4-A05E-EFDD53D08E8D]', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-3CD4-A05E-EFDD53D08E8D]',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-3CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-3CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D:B27D-3CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D:B27D-3CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D:3CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D:3CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-3CD4:A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-3CD4:A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-3CD4-A05E:EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-3CD4-A05E:EFDD53D08E8D}',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates uuidv4', () => {

            Helper.validate(Joi.string().guid({ version: ['uuidv4'] }), [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', true],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-4548-85E4-04FC71357423', true],
                ['677E2553DD4D43B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', true],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', true],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', true],
                ['{D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-C05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-C05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D]', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D]',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D:B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D:B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D:4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D:4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4:A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4:A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E:EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E:EFDD53D08E8D}',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates uuidv5', () => {

            Helper.validate(Joi.string().guid({ version: ['uuidv5'] }), [
                ['{D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D}', true],
                ['{B59511BD6A5F5DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-5548-85E4-04FC71357423', true],
                ['677E2553DD4D53B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-5717-88c1-b7c4b7ba80db}', true],
                ['{7e9081b59a6d5cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-5c48-9b33-68921dd72463', true],
                ['b4b2fb69c6245e5eb0698e0c6ec66618', true],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-5CD4-C05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-5CD4-C05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{283B67B2-430F-5E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-5E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D]', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D]',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D:B27D-5CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D:B27D-5CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D:5CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D:5CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-5CD4:A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-5CD4:A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-5CD4-A05E:EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-5CD4-A05E:EFDD53D08E8D}',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates multiple uuid versions (1,3,5)', () => {

            Helper.validate(Joi.string().guid({ version: ['uuidv1', 'uuidv3', 'uuidv5'] }), [
                ['{D1A5279D-B27D-1CD4-805E-EFDD53D08E8D}', true],
                ['{D1A5279D-B27D-3CD4-905E-EFDD53D08E8D}', true],
                ['{D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D}', true],
                ['{B59511BD6A5F5DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-5548-85E4-04FC71357423', true],
                ['677E2553DD4D53B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-5717-88c1-b7c4b7ba80db}', true],
                ['{7e9081b59a6d5cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-5c48-9b33-68921dd72463', true],
                ['b4b2fb69c6245e5eb0698e0c6ec66618', true],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-5CD4-C05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-5CD4-C05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{283B67B2-430F-5E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-5E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D]', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D]',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-5CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D:B27D-5CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D:B27D-5CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D:5CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D:5CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-5CD4:A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-5CD4:A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-5CD4-A05E:EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-5CD4-A05E:EFDD53D08E8D}',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates guid', () => {

            const schema = { item: Joi.string().guid() };
            Helper.validate(Joi.compile(schema), [[{ item: 'something' }, false, {
                message: '"item" must be a valid GUID',
                path: ['item'],
                type: 'string.guid',
                context: { value: 'something', label: 'item', key: 'item' }
            }]]);
        });

        it('validates separator', () => {

            Helper.validate(Joi.string().guid({ separator: '-' }), [
                ['69593D62-71EA-4548-85E4-04FC71357423', true],
                ['69593D62:71EA:4548:85E4:04FC71357423', false, '"value" must be a valid GUID'],
                ['b4b2fb69c6241e5eb0698e0c6ec66618', false, '"value" must be a valid GUID']
            ]);

            Helper.validate(Joi.string().guid({ separator: ':' }), [
                ['69593D62:71EA:4548:85E4:04FC71357423', true],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, '"value" must be a valid GUID'],
                ['b4b2fb69c6241e5eb0698e0c6ec66618', false, '"value" must be a valid GUID']
            ]);

            Helper.validate(Joi.string().guid({ separator: true }), [
                ['69593D62-71EA-4548-85E4-04FC71357423', true],
                ['69593D62:71EA:4548:85E4:04FC71357423', true],
                ['b4b2fb69c6241e5eb0698e0c6ec66618', false, '"value" must be a valid GUID']
            ]);

            Helper.validate(Joi.string().guid({ separator: false }), [
                ['69593D62-71EA-4548-85E4-04FC71357423', false, '"value" must be a valid GUID'],
                ['69593D62:71EA:4548:85E4:04FC71357423', false, '"value" must be a valid GUID'],
                ['b4b2fb69c6241e5eb0698e0c6ec66618', true]
            ]);
        });

        it('validates combination of guid and min', () => {

            const rule = Joi.string().guid().min(36);
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', true],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', false, {
                    message: '"value" length must be at least 36 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 36,
                        value: '{B59511BD6A5F4DF09ECF562A108D8A2E}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['69593D62-71EA-4548-85E4-04FC71357423', true],
                ['677E2553DD4D43B09DA77414DB1EB8EA', false, {
                    message: '"value" length must be at least 36 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 36,
                        value: '677E2553DD4D43B09DA77414DB1EB8EA',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', true],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', false, {
                    message: '"value" length must be at least 36 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 36,
                        value: '{7e9081b59a6d4cc1a8c347f69fb4198d}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', true],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', false, {
                    message: '"value" length must be at least 36 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 36,
                        value: 'b4b2fb69c6244e5eb0698e0c6ec66618',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of guid, min and max', () => {

            const rule = Joi.string().guid().min(32).max(34);
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '69593D62-71EA-4548-85E4-04FC71357423',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['677E2553DD4D43B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '0c74f13f-fa83-4c48-9b33-68921dd72463',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', true],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of guid, min, max and invalid', () => {

            const rule = Joi.string().guid().min(32).max(34).invalid('b4b2fb69c6244e5eb0698e0c6ec66618');
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '69593D62-71EA-4548-85E4-04FC71357423',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['677E2553DD4D43B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '0c74f13f-fa83-4c48-9b33-68921dd72463',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'b4b2fb69c6244e5eb0698e0c6ec66618', invalids: ['b4b2fb69c6244e5eb0698e0c6ec66618'], label: 'value' }
                }],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of guid, min, max and allow', () => {

            const rule = Joi.string().guid().min(32).max(34).allow('{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D');
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '69593D62-71EA-4548-85E4-04FC71357423',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['677E2553DD4D43B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '0c74f13f-fa83-4c48-9b33-68921dd72463',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', true],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', true],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of guid, min, max, allow and invalid', () => {

            const rule = Joi.string().guid().min(32).max(34).allow('{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D').invalid('b4b2fb69c6244e5eb0698e0c6ec66618');
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '69593D62-71EA-4548-85E4-04FC71357423',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['677E2553DD4D43B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '0c74f13f-fa83-4c48-9b33-68921dd72463',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'b4b2fb69c6244e5eb0698e0c6ec66618', invalids: ['b4b2fb69c6244e5eb0698e0c6ec66618'], label: 'value' }
                }],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', true],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of guid, min, max, allow, invalid and allow(\'\')', () => {

            const rule = Joi.string().guid().min(32).max(34).allow('{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D').invalid('b4b2fb69c6244e5eb0698e0c6ec66618').allow('');
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '69593D62-71EA-4548-85E4-04FC71357423',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['677E2553DD4D43B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '0c74f13f-fa83-4c48-9b33-68921dd72463',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'b4b2fb69c6244e5eb0698e0c6ec66618', invalids: ['b4b2fb69c6244e5eb0698e0c6ec66618'], label: 'value' }
                }],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', true],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of guid, min, max, allow and allow(\'\')', () => {

            const rule = Joi.string().guid().min(32).max(34).allow('{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D').allow('');
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '69593D62-71EA-4548-85E4-04FC71357423',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['677E2553DD4D43B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '0c74f13f-fa83-4c48-9b33-68921dd72463',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', true],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', true],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of guid, min, max, allow, invalid and regex', () => {

            const rule = Joi.string().guid().min(32).max(34).allow('{D1A5279D-B27D-4CD4-A05E-EFDD53D08').invalid('b4b2fb69c6244e5eb0698e0c6ec66618').regex(/^{7e908/);
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', false, {
                    message: '"value" with value "{B59511BD6A5F4DF09ECF562A108D8A2E}" fails to match the required pattern: /^{7e908/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e908/,
                        value: '{B59511BD6A5F4DF09ECF562A108D8A2E}',
                        label: 'value'
                    }
                }],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '69593D62-71EA-4548-85E4-04FC71357423',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['677E2553DD4D43B09DA77414DB1EB8EA', false, {
                    message: '"value" with value "677E2553DD4D43B09DA77414DB1EB8EA" fails to match the required pattern: /^{7e908/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e908/,
                        value: '677E2553DD4D43B09DA77414DB1EB8EA',
                        label: 'value'
                    }
                }],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '0c74f13f-fa83-4c48-9b33-68921dd72463',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'b4b2fb69c6244e5eb0698e0c6ec66618', invalids: ['b4b2fb69c6244e5eb0698e0c6ec66618'], label: 'value' }
                }],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08', true],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of guid, min, max, allow, invalid, regex and allow(\'\')', () => {

            const rule = Joi.string().guid().min(32).max(34).allow('{D1A5279D-B27D-4CD4-A05E-EFDD53D08').invalid('b4b2fb69c6244e5eb0698e0c6ec66618').regex(/^{7e908/).allow('');
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', false, {
                    message: '"value" with value "{B59511BD6A5F4DF09ECF562A108D8A2E}" fails to match the required pattern: /^{7e908/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e908/,
                        value: '{B59511BD6A5F4DF09ECF562A108D8A2E}',
                        label: 'value'
                    }
                }],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '69593D62-71EA-4548-85E4-04FC71357423',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['677E2553DD4D43B09DA77414DB1EB8EA', false, {
                    message: '"value" with value "677E2553DD4D43B09DA77414DB1EB8EA" fails to match the required pattern: /^{7e908/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e908/,
                        value: '677E2553DD4D43B09DA77414DB1EB8EA',
                        label: 'value'
                    }
                }],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '0c74f13f-fa83-4c48-9b33-68921dd72463',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'b4b2fb69c6244e5eb0698e0c6ec66618', invalids: ['b4b2fb69c6244e5eb0698e0c6ec66618'], label: 'value' }
                }],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08', true],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of guid, min, max and allow(\'\')', () => {

            const rule = Joi.string().guid().min(32).max(34).allow('');
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', true],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '69593D62-71EA-4548-85E4-04FC71357423',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['677E2553DD4D43B09DA77414DB1EB8EA', true],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '0c74f13f-fa83-4c48-9b33-68921dd72463',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', true],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of guid, min, max and regex', () => {

            const rule = Joi.string().guid().min(32).max(34).regex(/^{7e9081/i);
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', false, {
                    message: '"value" with value "{B59511BD6A5F4DF09ECF562A108D8A2E}" fails to match the required pattern: /^{7e9081/i',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e9081/i,
                        value: '{B59511BD6A5F4DF09ECF562A108D8A2E}',
                        label: 'value'
                    }
                }],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '69593D62-71EA-4548-85E4-04FC71357423',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['677E2553DD4D43B09DA77414DB1EB8EA', false, {
                    message: '"value" with value "677E2553DD4D43B09DA77414DB1EB8EA" fails to match the required pattern: /^{7e9081/i',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e9081/i,
                        value: '677E2553DD4D43B09DA77414DB1EB8EA',
                        label: 'value'
                    }
                }],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '0c74f13f-fa83-4c48-9b33-68921dd72463',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', false, {
                    message: '"value" with value "b4b2fb69c6244e5eb0698e0c6ec66618" fails to match the required pattern: /^{7e9081/i',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e9081/i,
                        value: 'b4b2fb69c6244e5eb0698e0c6ec66618',
                        label: 'value'
                    }
                }],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of guid, min, max, regex and allow(\'\')', () => {

            const rule = Joi.string().guid().min(32).max(34).regex(/^{7e9081/i).allow('');
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', false, {
                    message: '"value" with value "{B59511BD6A5F4DF09ECF562A108D8A2E}" fails to match the required pattern: /^{7e9081/i',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e9081/i,
                        value: '{B59511BD6A5F4DF09ECF562A108D8A2E}',
                        label: 'value'
                    }
                }],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '69593D62-71EA-4548-85E4-04FC71357423',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['677E2553DD4D43B09DA77414DB1EB8EA', false, {
                    message: '"value" with value "677E2553DD4D43B09DA77414DB1EB8EA" fails to match the required pattern: /^{7e9081/i',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e9081/i,
                        value: '677E2553DD4D43B09DA77414DB1EB8EA',
                        label: 'value'
                    }
                }],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '0c74f13f-fa83-4c48-9b33-68921dd72463',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', false, {
                    message: '"value" with value "b4b2fb69c6244e5eb0698e0c6ec66618" fails to match the required pattern: /^{7e9081/i',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e9081/i,
                        value: 'b4b2fb69c6244e5eb0698e0c6ec66618',
                        label: 'value'
                    }
                }],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of guid, min, max, regex and required', () => {

            const rule = Joi.string().guid().min(32).max(34).regex(/^{7e9081/i).required();
            Helper.validate(rule, [
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{B59511BD6A5F4DF09ECF562A108D8A2E}', false, {
                    message: '"value" with value "{B59511BD6A5F4DF09ECF562A108D8A2E}" fails to match the required pattern: /^{7e9081/i',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e9081/i,
                        value: '{B59511BD6A5F4DF09ECF562A108D8A2E}',
                        label: 'value'
                    }
                }],
                ['69593D62-71EA-4548-85E4-04FC71357423', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '69593D62-71EA-4548-85E4-04FC71357423',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['677E2553DD4D43B09DA77414DB1EB8EA', false, {
                    message: '"value" with value "677E2553DD4D43B09DA77414DB1EB8EA" fails to match the required pattern: /^{7e9081/i',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e9081/i,
                        value: '677E2553DD4D43B09DA77414DB1EB8EA',
                        label: 'value'
                    }
                }],
                ['{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '{5ba3bba3-729a-4717-88c1-b7c4b7ba80db}',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['{7e9081b59a6d4cc1a8c347f69fb4198d}', true],
                ['0c74f13f-fa83-4c48-9b33-68921dd72463', false, {
                    message: '"value" length must be less than or equal to 34 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 34,
                        value: '0c74f13f-fa83-4c48-9b33-68921dd72463',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['b4b2fb69c6244e5eb0698e0c6ec66618', false, {
                    message: '"value" with value "b4b2fb69c6244e5eb0698e0c6ec66618" fails to match the required pattern: /^{7e9081/i',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^{7e9081/i,
                        value: 'b4b2fb69c6244e5eb0698e0c6ec66618',
                        label: 'value'
                    }
                }],
                ['{283B67B2-430F-4E6F-97E6-19041992-C1B0}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{283B67B2-430F-4E6F-97E6-19041992-C1B0}',
                        label: 'value'
                    }
                }],
                ['{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: '{D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D',
                        label: 'value'
                    }
                }],
                ['D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}', false, {
                    message: '"value" must be a valid GUID',
                    path: [],
                    type: 'string.guid',
                    context: {
                        value: 'D1A5279D-B27D-4CD4-A05E-EFDD53D08E8D}',
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });
    });

    describe('hex()', () => {

        it('validates the hexadecimal options', () => {

            expect(() => {

                Joi.string().hex('a');
            }).to.throw('Options must be of type object');

            expect(() => {

                Joi.string().hex({ byteAligned: 'a' });
            }).to.throw('byteAligned must be boolean');
        });

        it('validates an hexadecimal string with no options', () => {

            const rule = Joi.string().hex();
            Helper.validate(rule, [
                ['123456789abcdef', true],
                ['123456789AbCdEf', true],
                ['123afg', false, {
                    message: '"value" must only contain hexadecimal characters',
                    path: [],
                    type: 'string.hex',
                    context: { value: '123afg', label: 'value' }
                }],
                ['0x123456789AbCdEf', false, '"value" must only contain hexadecimal characters']
            ]);
        });

        it('validates an hexadecimal string with byte align explicitly required', () => {

            const rule = Joi.string().hex({ byteAligned: true }).strict();
            Helper.validate(rule, [
                ['0123456789abcdef', true],
                ['123456789abcdef', false, {
                    message: '"value" hex decoded representation must be byte aligned',
                    path: [],
                    type: 'string.hexAlign',
                    context: { value: '123456789abcdef', label: 'value' }
                }],
                ['0123afg', false, {
                    message: '"value" must only contain hexadecimal characters',
                    path: [],
                    type: 'string.hex',
                    context: { value: '0123afg', label: 'value' }
                }]
            ]);
        });

        it('converts an hexadecimal string with byte align explicitly required', () => {

            const rule = Joi.string().hex({ byteAligned: true });
            Helper.validate(rule, [
                ['0123456789abcdef', true, '0123456789abcdef'],
                ['123456789abcdef', true, '0123456789abcdef'],
                ['0123afg', false, {
                    message: '"value" must only contain hexadecimal characters',
                    path: [],
                    type: 'string.hex',
                    context: { value: '00123afg', label: 'value' }
                }],
                ['00123afg', false, {
                    message: '"value" must only contain hexadecimal characters',
                    path: [],
                    type: 'string.hex',
                    context: { value: '00123afg', label: 'value' }
                }]
            ]);
        });
    });

    describe('hostname()', () => {

        it('validates hostnames', () => {

            const schema = Joi.string().hostname();
            Helper.validate(schema, [
                ['www.example.com', true],
                ['domain.local', true],
                ['3domain.local', true],
                ['hostname', true],
                ['host:name', false, {
                    message: '"value" must be a valid hostname',
                    path: [],
                    type: 'string.hostname',
                    context: { value: 'host:name', label: 'value' }
                }],
                ['-', false, {
                    message: '"value" must be a valid hostname',
                    path: [],
                    type: 'string.hostname',
                    context: { value: '-', label: 'value' }
                }],
                ['2387628', false, '"value" must be a valid hostname'],
                ['01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789', false, {
                    message: '"value" must be a valid hostname',
                    path: [],
                    type: 'string.hostname',
                    context: { value: '01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789', label: 'value' }
                }],
                ['::1', true],
                ['0:0:0:0:0:0:0:1', true],
                ['0:?:0:0:0:0:0:1', false, {
                    message: '"value" must be a valid hostname',
                    path: [],
                    type: 'string.hostname',
                    context: { value: '0:?:0:0:0:0:0:1', label: 'value' }
                }]
            ]);
        });
    });

    describe('insensitive', () => {

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.string().insensitive();
            expect(schema.insensitive()).to.shallow.equal(schema);
        });

        it('sets right values with valid', () => {

            const simpleSchema = Joi.string().insensitive().valid('A');
            Helper.validate(simpleSchema, [['a', true, 'A']]);

            const refSchema = Joi.string().insensitive().valid(Joi.ref('$v'));
            Helper.validate(refSchema, { context: { v: 'A' } }, [['a', true, 'A']]);

            const refArraySchema = Joi.string().insensitive().valid(Joi.in('$v'));
            Helper.validate(refArraySchema, { context: { v: ['B', 'A'] } }, [['a', true, 'A']]);

            const strictSchema = Joi.string().insensitive().valid('A').strict();
            Helper.validate(strictSchema, [['a', true, 'a']]);
        });
    });

    describe('invalid()', () => {

        it('should return false for denied value', () => {

            const text = Joi.string().invalid('joi');
            Helper.validate(text, [['joi', false, '"value" contains an invalid value']]);
        });

        it('validates invalid values', () => {

            const schema = Joi.string().invalid('a', 'b', 'c');
            Helper.validate(schema, [
                ['x', true],
                ['a', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'a', invalids: ['a', 'b', 'c'], label: 'value' }
                }],
                ['c', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'c', invalids: ['a', 'b', 'c'], label: 'value' }
                }]
            ]);
        });

        it('should invert invalid values', () => {

            const schema = Joi.string().valid('a', 'b', 'c');
            Helper.validate(schema, [
                ['x', false, {
                    message: '"value" must be one of [a, b, c]',
                    path: [],
                    type: 'any.only',
                    context: { value: 'x', valids: ['a', 'b', 'c'], label: 'value' }
                }],
                ['a', true],
                ['c', true]
            ]);
        });

        it('inverts case sensitive values', () => {

            Helper.validate(Joi.string().invalid('a', 'b'), [
                ['a', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'a', invalids: ['a', 'b'], label: 'value' }
                }],
                ['b', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'b', invalids: ['a', 'b'], label: 'value' }
                }],
                ['A', true],
                ['B', true]
            ]);
        });

        it('inverts case insensitive values', () => {

            Helper.validate(Joi.string().invalid('a', 'b').insensitive(), [
                ['a', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'a', invalids: ['a', 'b'], label: 'value' }
                }],
                ['b', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'b', invalids: ['a', 'b'], label: 'value' }
                }],
                ['A', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'A', invalids: ['a', 'b'], label: 'value' }
                }],
                ['B', false, {
                    message: '"value" contains an invalid value',
                    path: [],
                    type: 'any.invalid',
                    context: { value: 'B', invalids: ['a', 'b'], label: 'value' }
                }]
            ]);
        });
    });

    describe('ip()', () => {

        const prepareIps = function (ips) {

            return function (success, message = '', version = ['ipv4', 'ipv6']) {

                return ips.map((ip) => [ip, success, !success && message ? {
                    message,
                    path: [],
                    type: /versions/.test(message) ? 'string.ipVersion' : 'string.ip',
                    context: (() => {

                        const context = {
                            value: ip,
                            cidr: /(\w+) CIDR/.exec(message)[1],
                            label: 'value'
                        };

                        if (/versions/.test(message)) {
                            context.version = version;
                        }

                        return context;
                    })()
                } : ip]);
            };
        };

        const invalidIPs = function (message, version) {

            return prepareIps([
                'ASDF',
                '192.0.2.16:80/30',
                '192.0.2.16a',
                'qwerty',
                '127.0.0.1:8000',
                'ftp://www.example.com',
                'Bananas in pajamas are coming down the stairs'
            ])(false, message, version);
        };

        const invalidIPv4s = function (message, version) {

            return prepareIps([
                '0.0.0.0/33',
                '256.0.0.0/0',
                '255.255.255.256/32',
                '255.255.255.255/64',
                '255.255.255.255/128',
                '255.255.255.255/255',
                '256.0.0.0',
                '255.255.255.256'
            ])(false, message, version);
        };

        const invalidIPv6s = function (message, version) {

            return prepareIps([
                '1080:0:0:0:8:800:200C:417G/33',
                '1080:0:0:0:8:800:200C:417G',
                'FEDC:BA98:7654:3210:FEDC:BA98:7654:3210/129',
                'FEDC:BA98:7654:3210:FEDC:BA98:7654:3210/255'
            ])(false, message, version);
        };

        const invalidIPvFutures = function (message, version) {

            return prepareIps([
                'v1.09#/33',
                'v1.09#',
                'v1.09azAZ-._~!$&\'()*+,;=:/129',
                'v1.09azAZ-._~!$&\'()*+,;=:/255'
            ])(false, message, version);
        };

        const validIPv4sWithCidr = prepareIps([
            '0.0.0.0/32',
            '255.255.255.255/0',
            '127.0.0.1/0',
            '192.168.2.1/0',
            '0.0.0.3/2',
            '0.0.0.7/3',
            '0.0.0.15/4',
            '0.0.0.31/5',
            '0.0.0.63/6',
            '0.0.0.127/7',
            '01.020.030.100/7',
            '0.0.0.0/0',
            '00.00.00.00/0',
            '000.000.000.000/32'
        ]);

        const validIPv4sWithoutCidr = prepareIps([
            '0.0.0.0',
            '255.255.255.255',
            '127.0.0.1',
            '192.168.2.1',
            '0.0.0.3',
            '0.0.0.7',
            '0.0.0.15',
            '0.0.0.31',
            '0.0.0.63',
            '0.0.0.127',
            '01.020.030.100',
            '0.0.0.0',
            '00.00.00.00',
            '000.000.000.000'
        ]);

        const validIPv6sWithCidr = prepareIps([
            '2001:db8::7/32',
            'a:b:c:d:e::1.2.3.4/13',
            'a:b:c:d:e::1.2.3.4/64',
            'FEDC:BA98:7654:3210:FEDC:BA98:7654:3210/0',
            'FEDC:BA98:7654:3210:FEDC:BA98:7654:3210/32',
            'FEDC:BA98:7654:3210:FEDC:BA98:7654:3210/128',
            '1080:0:0:0:8:800:200C:417A/27'
        ]);

        const validIPv6sWithoutCidr = prepareIps([
            '2001:db8::7',
            'a:b:c:d:e::1.2.3.4',
            'FEDC:BA98:7654:3210:FEDC:BA98:7654:3210',
            'FEDC:BA98:7654:3210:FEDC:BA98:7654:3210',
            '1080:0:0:0:8:800:200C:417A',
            '::1:2:3:4:5:6:7',
            '::1:2:3:4:5:6',
            '1::1:2:3:4:5:6',
            '::1:2:3:4:5',
            '1::1:2:3:4:5',
            '2:1::1:2:3:4:5',
            '::1:2:3:4',
            '1::1:2:3:4',
            '2:1::1:2:3:4',
            '3:2:1::1:2:3:4',
            '::1:2:3',
            '1::1:2:3',
            '2:1::1:2:3',
            '3:2:1::1:2:3',
            '4:3:2:1::1:2:3',
            '::1:2',
            '1::1:2',
            '2:1::1:2',
            '3:2:1::1:2',
            '4:3:2:1::1:2',
            '5:4:3:2:1::1:2',
            '::1',
            '1::1',
            '2:1::1',
            '3:2:1::1',
            '4:3:2:1::1',
            '5:4:3:2:1::1',
            '6:5:4:3:2:1::1',
            '::',
            '1::',
            '2:1::',
            '3:2:1::',
            '4:3:2:1::',
            '5:4:3:2:1::',
            '6:5:4:3:2:1::',
            '7:6:5:4:3:2:1::'
        ]);

        const validIPvFuturesWithCidr = prepareIps(['v1.09azAZ-._~!$&\'()*+,;=:/32', 'v1.09azAZ-._~!$&\'()*+,;=:/128']);

        const validIPvFuturesWithoutCidr = prepareIps(['v1.09azAZ-._~!$&\'()*+,;=:']);

        it('should validate all ip addresses with optional CIDR by default', () => {

            const schema = Joi.string().ip();
            const message = '"value" must be a valid ip address with a optional CIDR';
            Helper.validate(schema, []
                .concat(validIPv4sWithCidr(true))
                .concat(validIPv4sWithoutCidr(true))
                .concat(validIPv6sWithCidr(true))
                .concat(validIPv6sWithoutCidr(true))
                .concat(validIPvFuturesWithCidr(true))
                .concat(validIPvFuturesWithoutCidr(true))
                .concat(invalidIPs(message))
                .concat(invalidIPv4s(message))
                .concat(invalidIPv6s(message))
                .concat(invalidIPvFutures(message)));
        });

        it('should validate all ip addresses with an optional CIDR', () => {

            const schema = Joi.string().ip({ cidr: 'optional' });
            const message = '"value" must be a valid ip address with a optional CIDR';
            Helper.validate(schema, []
                .concat(validIPv4sWithCidr(true))
                .concat(validIPv4sWithoutCidr(true))
                .concat(validIPv6sWithCidr(true))
                .concat(validIPv6sWithoutCidr(true))
                .concat(validIPvFuturesWithCidr(true))
                .concat(validIPvFuturesWithoutCidr(true))
                .concat(invalidIPs(message))
                .concat(invalidIPv4s(message))
                .concat(invalidIPv6s(message))
                .concat(invalidIPvFutures(message)));
        });

        it('should validate all ip addresses with a required CIDR', () => {

            const schema = Joi.string().ip({ cidr: 'required' });
            const message = '"value" must be a valid ip address with a required CIDR';
            Helper.validate(schema, []
                .concat(validIPv4sWithCidr(true))
                .concat(validIPv4sWithoutCidr(false, message))
                .concat(validIPv6sWithCidr(true))
                .concat(validIPv6sWithoutCidr(false, message))
                .concat(validIPvFuturesWithCidr(true))
                .concat(validIPvFuturesWithoutCidr(false, message))
                .concat(invalidIPs(message))
                .concat(invalidIPv4s(message))
                .concat(invalidIPv6s(message))
                .concat(invalidIPvFutures(message)));
        });

        it('should validate all ip addresses with a forbidden CIDR', () => {

            const schema = Joi.string().ip({ cidr: 'forbidden' });
            const message = '"value" must be a valid ip address with a forbidden CIDR';
            Helper.validate(schema, []
                .concat(validIPv4sWithCidr(false, message))
                .concat(validIPv4sWithoutCidr(true))
                .concat(validIPv6sWithCidr(false, message))
                .concat(validIPv6sWithoutCidr(true))
                .concat(validIPvFuturesWithCidr(false, message))
                .concat(validIPvFuturesWithoutCidr(true))
                .concat(invalidIPs(message))
                .concat(invalidIPv4s(message))
                .concat(invalidIPv6s(message))
                .concat(invalidIPvFutures(message)));
        });

        it('throws when options is not an object', () => {

            expect(() => Joi.string().ip(42)).to.throw('Options must be of type object');
        });

        it('throws when options.cidr is not a string', () => {

            expect(() => Joi.string().ip({ cidr: 42 })).to.throw('options.cidr must be a string');
        });

        it('throws when options.cidr is not a valid value', () => {

            expect(() => Joi.string().ip({ cidr: '42' })).to.throw('options.cidr must be one of required, optional, forbidden');
        });

        it('throws when options.version is an empty array', () => {

            expect(() => Joi.string().ip({ version: [] })).to.throw('options.version must have at least 1 version specified');
        });

        it('throws when options.version is not a string', () => {

            expect(() => Joi.string().ip({ version: 42 })).to.throw('options.version must be a string or an array of string');
        });

        it('throws when options.version is not a valid value', () => {

            expect(() => Joi.string().ip({ version: '42' })).to.throw('options.version contains unknown version 42 - must be one of ipv4, ipv6, ipvfuture');
        });

        it('validates ip', () => {

            const schema = { item: Joi.string().ip() };
            Helper.validate(Joi.compile(schema), [[{ item: 'something' }, false, {
                message: '"item" must be a valid ip address with a optional CIDR',
                path: ['item'],
                type: 'string.ip',
                context: {
                    value: 'something',
                    cidr: 'optional',
                    label: 'item',
                    key: 'item'
                }
            }]]);
        });

        it('validates ip and cidr presence', () => {

            const schema = { item: Joi.string().ip({ cidr: 'required' }) };
            Helper.validate(Joi.compile(schema), [[{ item: 'something' }, false, {
                message: '"item" must be a valid ip address with a required CIDR',
                path: ['item'],
                type: 'string.ip',
                context: {
                    value: 'something',
                    cidr: 'required',
                    label: 'item',
                    key: 'item'
                }
            }]]);
        });

        it('validates custom ip version and cidr presence', () => {

            const schema = { item: Joi.string().ip({ version: 'ipv4', cidr: 'required' }) };
            Helper.validate(Joi.compile(schema), [[{ item: 'something' }, false, {
                message: '"item" must be a valid ip address of one of the following versions [ipv4] with a required CIDR',
                path: ['item'],
                type: 'string.ipVersion',
                context: {
                    value: 'something',
                    cidr: 'required',
                    version: ['ipv4'],
                    label: 'item',
                    key: 'item'
                }
            }]]);
        });

        describe('ip({ version: "ipv4" })', () => {

            it('should validate all ipv4 addresses with a default CIDR strategy', () => {

                const version = 'ipv4';
                const schema = Joi.string().ip({ version });
                const message = '"value" must be a valid ip address of one of the following versions [ipv4] with a optional CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(true))
                    .concat(validIPv4sWithoutCidr(true))
                    .concat(validIPv6sWithCidr(false, message, [version]))
                    .concat(validIPv6sWithoutCidr(false, message, [version]))
                    .concat(validIPvFuturesWithCidr(false, message, [version]))
                    .concat(validIPvFuturesWithoutCidr(false, message, [version]))
                    .concat(invalidIPs(message, [version]))
                    .concat(invalidIPv4s(message, [version]))
                    .concat(invalidIPv6s(message, [version]))
                    .concat(invalidIPvFutures(message, [version])));
            });

            it('should validate all ipv4 addresses with an optional CIDR', () => {

                const version = 'ipv4';
                const schema = Joi.string().ip({ version, cidr: 'optional' });
                const message = '"value" must be a valid ip address of one of the following versions [ipv4] with a optional CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(true))
                    .concat(validIPv4sWithoutCidr(true))
                    .concat(validIPv6sWithCidr(false, message, [version]))
                    .concat(validIPv6sWithoutCidr(false, message, [version]))
                    .concat(validIPvFuturesWithCidr(false, message, [version]))
                    .concat(validIPvFuturesWithoutCidr(false, message, [version]))
                    .concat(invalidIPs(message, [version]))
                    .concat(invalidIPv4s(message, [version]))
                    .concat(invalidIPv6s(message, [version]))
                    .concat(invalidIPvFutures(message, [version])));
            });

            it('should validate all ipv4 addresses with a required CIDR', () => {

                const version = 'ipv4';
                const schema = Joi.string().ip({ version, cidr: 'required' });
                const message = '"value" must be a valid ip address of one of the following versions [ipv4] with a required CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(true))
                    .concat(validIPv4sWithoutCidr(false, message, [version]))
                    .concat(validIPv6sWithCidr(false, message, [version]))
                    .concat(validIPv6sWithoutCidr(false, message, [version]))
                    .concat(validIPvFuturesWithCidr(false, message, [version]))
                    .concat(validIPvFuturesWithoutCidr(false, message, [version]))
                    .concat(invalidIPs(message, [version]))
                    .concat(invalidIPv4s(message, [version]))
                    .concat(invalidIPv6s(message, [version]))
                    .concat(invalidIPvFutures(message, [version])));
            });

            it('should validate all ipv4 addresses with a forbidden CIDR', () => {

                const version = 'ipv4';
                const schema = Joi.string().ip({ version, cidr: 'forbidden' });
                const message = '"value" must be a valid ip address of one of the following versions [ipv4] with a forbidden CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(false, message, [version]))
                    .concat(validIPv4sWithoutCidr(true))
                    .concat(validIPv6sWithCidr(false, message, [version]))
                    .concat(validIPv6sWithoutCidr(false, message, [version]))
                    .concat(validIPvFuturesWithCidr(false, message, [version]))
                    .concat(validIPvFuturesWithoutCidr(false, message, [version]))
                    .concat(invalidIPs(message, [version]))
                    .concat(invalidIPv4s(message, [version]))
                    .concat(invalidIPv6s(message, [version]))
                    .concat(invalidIPvFutures(message, [version])));
            });
        });

        describe('ip({ version: "ipv6" })', () => {

            it('should validate all ipv6 addresses with a default CIDR strategy', () => {

                const version = 'ipv6';
                const schema = Joi.string().ip({ version });
                const message = '"value" must be a valid ip address of one of the following versions [ipv6] with a optional CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(false, message, [version]))
                    .concat(validIPv4sWithoutCidr(false, message, [version]))
                    .concat(validIPv6sWithCidr(true))
                    .concat(validIPv6sWithoutCidr(true))
                    .concat(validIPvFuturesWithCidr(false, message, [version]))
                    .concat(validIPvFuturesWithoutCidr(false, message, [version]))
                    .concat(invalidIPs(message, [version]))
                    .concat(invalidIPv4s(message, [version]))
                    .concat(invalidIPv6s(message, [version]))
                    .concat(invalidIPvFutures(message, [version])));
            });

            it('should validate all ipv6 addresses with an optional CIDR', () => {

                const version = 'ipv6';
                const schema = Joi.string().ip({ version, cidr: 'optional' });
                const message = '"value" must be a valid ip address of one of the following versions [ipv6] with a optional CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(false, message, [version]))
                    .concat(validIPv4sWithoutCidr(false, message, [version]))
                    .concat(validIPv6sWithCidr(true))
                    .concat(validIPv6sWithoutCidr(true))
                    .concat(validIPvFuturesWithCidr(false, message, [version]))
                    .concat(validIPvFuturesWithoutCidr(false, message, [version]))
                    .concat(invalidIPs(message, [version]))
                    .concat(invalidIPv4s(message, [version]))
                    .concat(invalidIPv6s(message, [version]))
                    .concat(invalidIPvFutures(message, [version])));
            });

            it('should validate all ipv6 addresses with a required CIDR', () => {

                const version = 'ipv6';
                const schema = Joi.string().ip({ version, cidr: 'required' });
                const message = '"value" must be a valid ip address of one of the following versions [ipv6] with a required CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(false, message, [version]))
                    .concat(validIPv4sWithoutCidr(false, message, [version]))
                    .concat(validIPv6sWithCidr(true))
                    .concat(validIPv6sWithoutCidr(false, message, [version]))
                    .concat(validIPvFuturesWithCidr(false, message, [version]))
                    .concat(validIPvFuturesWithoutCidr(false, message, [version]))
                    .concat(invalidIPs(message, [version]))
                    .concat(invalidIPv4s(message, [version]))
                    .concat(invalidIPv6s(message, [version]))
                    .concat(invalidIPvFutures(message, [version])));
            });

            it('should validate all ipv6 addresses with a forbidden CIDR', () => {

                const version = 'ipv6';
                const schema = Joi.string().ip({ version, cidr: 'forbidden' });
                const message = '"value" must be a valid ip address of one of the following versions [ipv6] with a forbidden CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(false, message, [version]))
                    .concat(validIPv4sWithoutCidr(false, message, [version]))
                    .concat(validIPv6sWithCidr(false, message, [version]))
                    .concat(validIPv6sWithoutCidr(true))
                    .concat(validIPvFuturesWithCidr(false, message, [version]))
                    .concat(validIPvFuturesWithoutCidr(false, message, [version]))
                    .concat(invalidIPs(message, [version]))
                    .concat(invalidIPv4s(message, [version]))
                    .concat(invalidIPv6s(message, [version]))
                    .concat(invalidIPvFutures(message, [version])));
            });
        });

        describe('ip({ version: "ipvfuture" })', () => {

            it('should validate all ipvfuture addresses with a default CIDR strategy', () => {

                const version = 'ipvfuture';
                const schema = Joi.string().ip({ version });
                const message = '"value" must be a valid ip address of one of the following versions [ipvfuture] with a optional CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(false, message, [version]))
                    .concat(validIPv4sWithoutCidr(false, message, [version]))
                    .concat(validIPv6sWithCidr(false, message, [version]))
                    .concat(validIPv6sWithoutCidr(false, message, [version]))
                    .concat(validIPvFuturesWithCidr(true))
                    .concat(validIPvFuturesWithoutCidr(true))
                    .concat(invalidIPs(message, [version]))
                    .concat(invalidIPv4s(message, [version]))
                    .concat(invalidIPv6s(message, [version]))
                    .concat(invalidIPvFutures(message, [version])));
            });

            it('should validate all ipvfuture addresses with an optional CIDR', () => {

                const version = 'ipvfuture';
                const schema = Joi.string().ip({ version, cidr: 'optional' });
                const message = '"value" must be a valid ip address of one of the following versions [ipvfuture] with a optional CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(false, message, [version]))
                    .concat(validIPv4sWithoutCidr(false, message, [version]))
                    .concat(validIPv6sWithCidr(false, message, [version]))
                    .concat(validIPv6sWithoutCidr(false, message, [version]))
                    .concat(validIPvFuturesWithCidr(true))
                    .concat(validIPvFuturesWithoutCidr(true))
                    .concat(invalidIPs(message, [version]))
                    .concat(invalidIPv4s(message, [version]))
                    .concat(invalidIPv6s(message, [version]))
                    .concat(invalidIPvFutures(message, [version])));
            });

            it('should validate all ipvfuture addresses with a required CIDR', () => {

                const version = 'ipvfuture';
                const schema = Joi.string().ip({ version, cidr: 'required' });
                const message = '"value" must be a valid ip address of one of the following versions [ipvfuture] with a required CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(false, message, [version]))
                    .concat(validIPv4sWithoutCidr(false, message, [version]))
                    .concat(validIPv6sWithCidr(false, message, [version]))
                    .concat(validIPv6sWithoutCidr(false, message, [version]))
                    .concat(validIPvFuturesWithCidr(true))
                    .concat(validIPvFuturesWithoutCidr(false, message, [version]))
                    .concat(invalidIPs(message, [version]))
                    .concat(invalidIPv4s(message, [version]))
                    .concat(invalidIPv6s(message, [version]))
                    .concat(invalidIPvFutures(message, [version])));
            });

            it('should validate all ipvfuture addresses with a forbidden CIDR', () => {

                const version = 'ipvfuture';
                const schema = Joi.string().ip({ version, cidr: 'forbidden' });
                const message = '"value" must be a valid ip address of one of the following versions [ipvfuture] with a forbidden CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(false, message, [version]))
                    .concat(validIPv4sWithoutCidr(false, message, [version]))
                    .concat(validIPv6sWithCidr(false, message, [version]))
                    .concat(validIPv6sWithoutCidr(false, message, [version]))
                    .concat(validIPvFuturesWithCidr(false, message, [version]))
                    .concat(validIPvFuturesWithoutCidr(true))
                    .concat(invalidIPs(message, [version]))
                    .concat(invalidIPv4s(message, [version]))
                    .concat(invalidIPv6s(message, [version]))
                    .concat(invalidIPvFutures(message, [version])));
            });
        });

        describe('ip({ version: [ "ipv4", "ipv6" ] })', () => {

            it('should validate all ipv4 and ipv6 addresses with a default CIDR strategy', () => {

                const schema = Joi.string().ip({ version: ['ipv4', 'ipv6'] });
                const message = '"value" must be a valid ip address of one of the following versions [ipv4, ipv6] with a optional CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(true))
                    .concat(validIPv4sWithoutCidr(true))
                    .concat(validIPv6sWithCidr(true))
                    .concat(validIPv6sWithoutCidr(true))
                    .concat(validIPvFuturesWithCidr(false, message))
                    .concat(validIPvFuturesWithoutCidr(false, message))
                    .concat(invalidIPs(message))
                    .concat(invalidIPv4s(message))
                    .concat(invalidIPv6s(message))
                    .concat(invalidIPvFutures(message)));
            });

            it('should validate all ipv4 and ipv6 addresses with an optional CIDR', () => {

                const schema = Joi.string().ip({ version: ['ipv4', 'ipv6'], cidr: 'optional' });
                const message = '"value" must be a valid ip address of one of the following versions [ipv4, ipv6] with a optional CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(true))
                    .concat(validIPv4sWithoutCidr(true))
                    .concat(validIPv6sWithCidr(true))
                    .concat(validIPv6sWithoutCidr(true))
                    .concat(validIPvFuturesWithCidr(false, message))
                    .concat(validIPvFuturesWithoutCidr(false, message))
                    .concat(invalidIPs(message))
                    .concat(invalidIPv4s(message))
                    .concat(invalidIPv6s(message))
                    .concat(invalidIPvFutures(message)));
            });

            it('should validate all ipv4 and ipv6 addresses with a required CIDR', () => {

                const schema = Joi.string().ip({ version: ['ipv4', 'ipv6'], cidr: 'required' });
                const message = '"value" must be a valid ip address of one of the following versions [ipv4, ipv6] with a required CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(true))
                    .concat(validIPv4sWithoutCidr(false, message))
                    .concat(validIPv6sWithCidr(true))
                    .concat(validIPv6sWithoutCidr(false, message))
                    .concat(validIPvFuturesWithCidr(false, message))
                    .concat(validIPvFuturesWithoutCidr(false, message))
                    .concat(invalidIPs(message))
                    .concat(invalidIPv4s(message))
                    .concat(invalidIPv6s(message))
                    .concat(invalidIPvFutures(message)));
            });

            it('should validate all ipv4 and ipv6 addresses with a forbidden CIDR', () => {

                const schema = Joi.string().ip({ version: ['ipv4', 'ipv6'], cidr: 'forbidden' });
                const message = '"value" must be a valid ip address of one of the following versions [ipv4, ipv6] with a forbidden CIDR';
                Helper.validate(schema, []
                    .concat(validIPv4sWithCidr(false, message))
                    .concat(validIPv4sWithoutCidr(true))
                    .concat(validIPv6sWithCidr(false, message))
                    .concat(validIPv6sWithoutCidr(true))
                    .concat(validIPvFuturesWithCidr(false, message))
                    .concat(validIPvFuturesWithoutCidr(false, message))
                    .concat(invalidIPs(message))
                    .concat(invalidIPv4s(message))
                    .concat(invalidIPv6s(message))
                    .concat(invalidIPvFutures(message)));
            });
        });
    });

    describe('isoData()', () => {

        it('validates isoDate', () => {

            Helper.validate(Joi.string().isoDate(), { convert: false }, [
                ['+002013-06-07T14:21:46.295Z', true],
                ['-002013-06-07T14:21:46.295Z', true],
                ['002013-06-07T14:21:46.295Z', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '002013-06-07T14:21:46.295Z', label: 'value' }
                }],
                ['+2013-06-07T14:21:46.295Z', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '+2013-06-07T14:21:46.295Z', label: 'value' }
                }],
                ['-2013-06-07T14:21:46.295Z', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '-2013-06-07T14:21:46.295Z', label: 'value' }
                }],
                ['2013-06-07T14:21:46.295Z', true],
                ['2013-06-07T14:21:46.295Z0', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07T14:21:46.295Z0', label: 'value' }
                }],
                ['2013-06-07T14:21:46.295+07:00', true],
                ['2013-06-07T14:21:46.295+07', true],
                ['2013-06-07T14:21:46.295+07:000', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07T14:21:46.295+07:000', label: 'value' }
                }],
                ['2013-06-07T14:21:46.295-07:00', true],
                ['2013-06-07T14:21:46Z', true],
                ['2013-06-07T14:21:46Z0', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07T14:21:46Z0', label: 'value' }
                }],
                ['2013-06-07T14:21:46+07:00', true],
                ['2013-06-07T14:21:46+07:000', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07T14:21:46+07:000', label: 'value' }
                }],
                ['2013-06-07T14:21:46-07:00', true],
                ['2013-06-07T14:21Z', true],
                ['2013-06-07T14:21+07:00', true],
                ['2013-06-07T14:21+07:000', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07T14:21+07:000', label: 'value' }
                }],
                ['2013-06-07T14:21-07:00', true],
                ['2013-06-07T14:21Z+7:00', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07T14:21Z+7:00', label: 'value' }
                }],
                ['2013-06-07', true],
                ['2013-06-07T', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07T', label: 'value' }
                }],
                ['2013-06-07T14:21', true],
                ['1-1-2013', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '1-1-2013', label: 'value' }
                }],
                ['2013-06-07T14.2334,4', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07T14.2334,4', label: 'value' }
                }],
                ['2013-06-07T14,23:34', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07T14,23:34', label: 'value' }
                }],
                ['2013-06-07T24', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07T24', label: 'value' }
                }],
                ['2013-06-07T24:00', true],
                ['2013-06-07T24:21', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07T24:21', label: 'value' }
                }],
                ['2013-06-07 146946.295', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07 146946.295', label: 'value' }
                }],
                ['2013-06-07 1421,44', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-06-07 1421,44', label: 'value' }
                }],
                ['2013-W2311', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-W2311', label: 'value' }
                }],
                ['2013-M231', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-M231', label: 'value' }
                }],
                ['2013-W23-1T14:21', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-W23-1T14:21', label: 'value' }
                }],
                ['2013-W23-1T14:21:', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-W23-1T14:21:', label: 'value' }
                }],
                ['2013-W23-1T14:21:46+07:00', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-W23-1T14:21:46+07:00', label: 'value' }
                }],
                ['2013-W23-1T14:21:46+07:000', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-W23-1T14:21:46+07:000', label: 'value' }
                }],
                ['2013-W23-1T14:21:46-07:00', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-W23-1T14:21:46-07:00', label: 'value' }
                }],
                ['2013-184', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-184', label: 'value' }
                }],
                ['2013-1841', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-1841', label: 'value' }
                }]
            ]);
        });

        it('validates isoDate', () => {

            const schema = { item: Joi.string().isoDate() };
            Helper.validate(Joi.compile(schema), [[{ item: 'something' }, false, '"item" must be in iso format']]);
            Helper.validate(Joi.compile(schema), { convert: false }, [[{ item: 'something' }, false, '"item" must be in iso format']]);
        });

        it('validates and formats isoDate with convert set to true (default)', () => {

            const rule = Joi.string().isoDate();
            Helper.validate(rule, { convert: true }, [
                ['+002013-06-07T14:21:46.295Z', true, '2013-06-07T14:21:46.295Z'],
                ['-002013-06-07T14:21:46.295Z', true, '-002013-06-07T14:21:46.295Z'],
                ['2013-06-07T14:21:46.295Z', true, '2013-06-07T14:21:46.295Z'],
                ['2013-06-07T14:21:46.295+07:00', true, '2013-06-07T07:21:46.295Z'],
                ['2013-06-07T14:21:46.295-07:00', true, '2013-06-07T21:21:46.295Z'],
                ['2013-06-07T14:21:46Z', true, '2013-06-07T14:21:46.000Z'],
                ['2013-06-07T14:21:46+07:00', true, '2013-06-07T07:21:46.000Z'],
                ['2013-06-07T14:21:46-07:00', true, '2013-06-07T21:21:46.000Z'],
                ['2013-06-07T14:21Z', true, '2013-06-07T14:21:00.000Z'],
                ['2013-06-07T14:21+07:00', true, '2013-06-07T07:21:00.000Z'],
                ['2013-06-07T14:21-07:00', true, '2013-06-07T21:21:00.000Z'],
                ['2013-06-07', true, '2013-06-07T00:00:00.000Z'],
                ['2013-06-07T14:21', true, '2013-06-07T14:21:00.000Z'],
                ['2013-184', false, {
                    message: '"value" must be in iso format',
                    path: [],
                    type: 'string.isoDate',
                    context: { value: '2013-184', label: 'value' }
                }]
            ]);
        });

        it('supports allowed values', () => {

            const schema = Joi.string().isoDate().allow('x');
            Helper.validate(schema, [['x', true]]);
        });
    });

    describe('isoDuration()', () => {

        it('validates isoDuration', () => {

            Helper.validate(Joi.string().isoDuration(), [
                ['P3Y6M4DT12H30M5S', true],
                ['P3Y6M4DT12H30M', true],
                ['P3Y6M4DT12H5S', true],
                ['P3Y6M4DT30M5S', true],
                ['P3Y6MT12H30M5S', true],
                ['P3Y4DT12H30M5S', true],
                ['P6M4DT12H30M5S', true],
                ['PT10H20M5S', true],
                ['PT40S', true],
                ['PT0S', true],
                ['P0D', true],
                ['P30S', false, {
                    message: '"value" must be a valid ISO 8601 duration',
                    path: [],
                    type: 'string.isoDuration',
                    context: { value: 'P30S', label: 'value' }
                }],
                ['P30', false, {
                    message: '"value" must be a valid ISO 8601 duration',
                    path: [],
                    type: 'string.isoDuration',
                    context: { value: 'P30', label: 'value' }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });
    });

    describe('length()', () => {

        it('validates length requirements', () => {

            const schema = Joi.string().length(3);
            Helper.validate(schema, [
                ['test', false, {
                    message: '"value" length must be 3 characters long',
                    path: [],
                    type: 'string.length',
                    context: {
                        limit: 3,
                        value: 'test',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['0', false, {
                    message: '"value" length must be 3 characters long',
                    path: [],
                    type: 'string.length',
                    context: {
                        limit: 3,
                        value: '0',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }],
                ['abc', true]
            ]);
        });

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.string().length('a');
            }).to.throw('limit must be a positive integer or reference');
        });

        it('throws when limit is not an integer', () => {

            expect(() => {

                Joi.string().length(1.2);
            }).to.throw('limit must be a positive integer or reference');
        });

        it('throws when limit is not a positive integer', () => {

            expect(() => {

                Joi.string().length(-42);
            }).to.throw('limit must be a positive integer or reference');
        });

        it('enforces a limit using byte count', () => {

            const schema = Joi.string().length(2, 'utf8');
            Helper.validate(schema, [
                ['\u00bd', true],
                ['a', false, {
                    message: '"value" length must be 2 characters long',
                    path: [],
                    type: 'string.length',
                    context: { limit: 2, value: 'a', encoding: 'utf8', label: 'value' }
                }]
            ]);
        });

        it('accepts references as length', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.number(), b: Joi.string().length(ref, 'utf8') });
            Helper.validate(schema, [
                [{ a: 2, b: '\u00bd' }, true],
                [{ a: 2, b: 'a' }, false, {
                    message: '"b" length must be ref:a characters long',
                    path: ['b'],
                    type: 'string.length',
                    context: { limit: ref, value: 'a', encoding: 'utf8', label: 'b', key: 'b' }
                }]
            ]);
        });

        it('accepts context references as length', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.string().length(ref, 'utf8') });
            Helper.validate(schema, { context: { a: 2 } }, [
                [{ b: '\u00bd' }, true],
                [{ b: 'a' }, false, {
                    message: '"b" length must be ref:global:a characters long',
                    path: ['b'],
                    type: 'string.length',
                    context: { limit: ref, value: 'a', encoding: 'utf8', label: 'b', key: 'b' }
                }],
                [{ b: 'a' }, false, {
                    message: '"b" length must be ref:global:a characters long',
                    path: ['b'],
                    type: 'string.length',
                    context: { limit: ref, value: 'a', encoding: 'utf8', label: 'b', key: 'b' }
                }]
            ]);
        });

        it('errors if reference is not a number', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.any(), b: Joi.string().length(ref, 'utf8') });

            Helper.validate(schema, [
                [{ a: 'Hi there', b: '\u00bd' }, false, {
                    message: '"b" limit references "ref:a" which must be a positive integer',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'Hi there', arg: 'limit', reason: 'must be a positive integer' }
                }]
            ]);
        });

        it('errors if context reference is not a number', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ a: Joi.any(), b: Joi.string().length(ref, 'utf8') });

            Helper.validate(schema, { context: { a: 'Hi there' } }, [
                [{ b: '\u00bd' }, false, {
                    message: '"b" limit references "ref:global:a" which must be a positive integer',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'Hi there', reason: 'must be a positive integer', arg: 'limit' }
                }]
            ]);
        });
    });

    describe('lowercase()', () => {

        it('only allows strings that are entirely lowercase', () => {

            const schema = Joi.string().lowercase();
            Helper.validate(schema, { convert: false }, [
                ['this is all lowercase', true],
                ['5', true],
                ['lower\tcase', true],
                ['Uppercase', false, {
                    message: '"value" must only contain lowercase characters',
                    path: [],
                    type: 'string.lowercase',
                    context: { value: 'Uppercase', label: 'value' }
                }],
                ['MixEd cAsE', false, {
                    message: '"value" must only contain lowercase characters',
                    path: [],
                    type: 'string.lowercase',
                    context: { value: 'MixEd cAsE', label: 'value' }
                }],
                [1, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 1, label: 'value' }
                }]
            ]);
        });

        it('coerce string to lowercase before validation', () => {

            const schema = Joi.string().lowercase();
            Helper.validate(schema, [['UPPER TO LOWER', true, 'upper to lower']]);
        });

        it('should work in combination with a trim', () => {

            const schema = Joi.string().lowercase().trim();
            Helper.validate(schema, [
                [' abc', true, 'abc'],
                [' ABC', true, 'abc'],
                ['ABC', true, 'abc'],
                [1, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 1, label: 'value' }
                }]
            ]);
        });

        it('should work in combination with a replacement', () => {

            const schema = Joi.string().lowercase().replace(/\s+/g, ' ');
            Helper.validate(schema, [
                ['a\r b\n c', true, 'a b c'],
                ['A\t B  C', true, 'a b c'],
                ['ABC', true, 'abc'],
                [1, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 1, label: 'value' }
                }]
            ]);
        });
    });

    describe('max()', () => {

        it('validates maximum length when max is used', () => {

            const schema = Joi.string().max(3);
            Helper.validate(schema, [
                ['test', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: 'test',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['0', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.string().max('a');
            }).to.throw('limit must be a positive integer or reference');
        });

        it('throws when limit is not an integer', () => {

            expect(() => {

                Joi.string().max(1.2);
            }).to.throw('limit must be a positive integer or reference');
        });

        it('throws when limit is not a positive integer', () => {

            expect(() => {

                Joi.string().max(-1);
            }).to.throw('limit must be a positive integer or reference');
        });

        it('enforces a limit using byte count', () => {

            const schema = Joi.string().max(1, 'utf8');
            Helper.validate(schema, [
                ['\u00bd', false, {
                    message: '"value" length must be less than or equal to 1 characters long',
                    path: [],
                    type: 'string.max',
                    context: { limit: 1, value: '\u00bd', encoding: 'utf8', label: 'value' }
                }],
                ['a', true]
            ]);
        });

        it('accepts references as min length', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.number(), b: Joi.string().max(ref, 'utf8') });
            Helper.validate(schema, [
                [{ a: 2, b: '\u00bd' }, true],
                [{ a: 2, b: 'three' }, false, {
                    message: '"b" length must be less than or equal to ref:a characters long',
                    path: ['b'],
                    type: 'string.max',
                    context: {
                        limit: ref,
                        value: 'three',
                        encoding: 'utf8',
                        label: 'b',
                        key: 'b'
                    }
                }]
            ]);
        });

        it('accepts context references as min length', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.string().max(ref, 'utf8') });
            Helper.validate(schema, { context: { a: 2 } }, [
                [{ b: '\u00bd' }, true],
                [{ b: 'three' }, false, {
                    message: '"b" length must be less than or equal to ref:global:a characters long',
                    path: ['b'],
                    type: 'string.max',
                    context: {
                        limit: ref,
                        value: 'three',
                        encoding: 'utf8',
                        label: 'b',
                        key: 'b'
                    }
                }]
            ]);
        });

        it('errors if reference is not a number', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.any(), b: Joi.string().max(ref, 'utf8') });

            Helper.validate(schema, [
                [{ a: 'Hi there', b: '\u00bd' }, false, {
                    message: '"b" limit references "ref:a" which must be a positive integer',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'Hi there', arg: 'limit', reason: 'must be a positive integer' }
                }]
            ]);
        });

        it('errors if context reference is not a number', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.string().max(ref, 'utf8') });

            Helper.validate(schema, { context: { a: 'Hi there' } }, [
                [{ b: '\u00bd' }, false, {
                    message: '"b" limit references "ref:global:a" which must be a positive integer',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'Hi there', arg: 'limit', reason: 'must be a positive integer' }
                }]
            ]);
        });
    });

    describe('min()', () => {

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.string().min('a');
            }).to.throw('limit must be a positive integer or reference');
        });

        it('throws when limit is not an integer', () => {

            expect(() => {

                Joi.string().min(1.2);
            }).to.throw('limit must be a positive integer or reference');
        });

        it('throws when limit is not a positive integer', () => {

            expect(() => {

                Joi.string().min(-1);
            }).to.throw('limit must be a positive integer or reference');
        });

        it('enforces a limit using byte count', () => {

            const schema = Joi.string().min(2, 'utf8');
            Helper.validate(schema, [
                ['\u00bd', true],
                ['a', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'a',
                        encoding: 'utf8',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('accepts references as min length', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.number(), b: Joi.string().min(ref, 'utf8') });
            Helper.validate(schema, [
                [{ a: 2, b: '\u00bd' }, true],
                [{ a: 2, b: 'a' }, false, {
                    message: '"b" length must be at least ref:a characters long',
                    path: ['b'],
                    type: 'string.min',
                    context: {
                        limit: ref,
                        value: 'a',
                        encoding: 'utf8',
                        label: 'b',
                        key: 'b'
                    }
                }]
            ]);
        });

        it('accepts references as min length within a when', () => {

            const schema = Joi.object({
                a: Joi.string().required(),
                b: Joi.number().required(),
                c: Joi.number().required().when('a', {
                    is: Joi.string().min(Joi.ref('b')), // a.length >= b
                    then: Joi.number().valid(0)
                })
            });

            Helper.validate(schema, [
                [{ a: 'abc', b: 4, c: 42 }, true],
                [{ a: 'abc', b: 3, c: 0 }, true],
                [{ a: 'abc', b: 3, c: 42 }, false, {
                    message: '"c" must be [0]',
                    path: ['c'],
                    type: 'any.only',
                    context: { value: 42, valids: [0], label: 'c', key: 'c' }
                }]
            ]);
        });

        it('accepts context references as min length', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.string().min(ref, 'utf8') });
            Helper.validate(schema, { context: { a: 2 } }, [
                [{ b: '\u00bd' }, true],
                [{ b: 'a' }, false, {
                    message: '"b" length must be at least ref:global:a characters long',
                    path: ['b'],
                    type: 'string.min',
                    context: {
                        limit: ref,
                        value: 'a',
                        encoding: 'utf8',
                        label: 'b',
                        key: 'b'
                    }
                }]
            ]);
        });

        it('errors if reference is not a number', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.any(), b: Joi.string().min(ref, 'utf8') });

            Helper.validate(schema, [
                [{ a: 'Hi there', b: '\u00bd' }, false, {
                    message: '"b" limit references "ref:a" which must be a positive integer',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'Hi there', arg: 'limit', reason: 'must be a positive integer' }
                }]
            ]);
        });

        it('errors if context reference is not a number', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.string().min(ref, 'utf8') });

            Helper.validate(schema, { context: { a: 'Hi there' } }, [
                [{ b: '\u00bd' }, false, {
                    message: '"b" limit references "ref:global:a" which must be a positive integer',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'Hi there', arg: 'limit', reason: 'must be a positive integer' }
                }]
            ]);
        });

        it('validates minimum length when min is used', () => {

            const schema = Joi.string().min(3);
            Helper.validate(schema, [
                ['test', true],
                ['0', false, {
                    message: '"value" length must be at least 3 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 3,
                        value: '0',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates minimum length when min is 0', () => {

            const schema = Joi.string().min(0).required();
            Helper.validate(schema, [
                ['0', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }],
                [undefined, false, {
                    message: '"value" is required',
                    path: [],
                    type: 'any.required',
                    context: { label: 'value' }
                }]
            ]);
        });

        it('should return false with minimum length and a null value passed in', () => {

            const schema = Joi.string().min(3);
            Helper.validate(schema, [
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('null allowed overrides min length requirement', () => {

            const schema = Joi.string().min(3).allow(null);
            Helper.validate(schema, [
                [null, true]
            ]);
        });

        it('validates combination of min and max', () => {

            const rule = Joi.string().min(2).max(3);
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', true],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['12', true],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of min, max, and allow(\'\')', () => {

            const rule = Joi.string().min(2).max(3).allow('');
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', true],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['12', true],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of min, max, and required', () => {

            const rule = Joi.string().min(2).max(3).required();
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', true],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['12', true],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of min, max, and regex', () => {

            const rule = Joi.string().min(2).max(3).regex(/^a/);
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', false, {
                    message: '"value" with value "123" fails to match the required pattern: /^a/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^a/,
                        value: '123',
                        label: 'value'
                    }
                }],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['12', false, {
                    message: '"value" with value "12" fails to match the required pattern: /^a/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^a/,
                        value: '12',
                        label: 'value'
                    }
                }],
                ['ab', true],
                ['abc', true],
                ['abcd', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: 'abcd',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of min, max, regex, and allow(\'\')', () => {

            const rule = Joi.string().min(2).max(3).regex(/^a/).allow('');
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', false, {
                    message: '"value" with value "123" fails to match the required pattern: /^a/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^a/,
                        value: '123',
                        label: 'value'
                    }
                }],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['12', false, {
                    message: '"value" with value "12" fails to match the required pattern: /^a/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^a/,
                        value: '12',
                        label: 'value'
                    }
                }],
                ['ab', true],
                ['abc', true],
                ['abcd', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: 'abcd',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });

        it('validates combination of min, max, regex, and required', () => {

            const rule = Joi.string().min(2).max(3).regex(/^a/).required();
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" length must be at least 2 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 2,
                        value: 'x',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['123', false, {
                    message: '"value" with value "123" fails to match the required pattern: /^a/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^a/,
                        value: '123',
                        label: 'value'
                    }
                }],
                ['1234', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: '1234',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['12', false, {
                    message: '"value" with value "12" fails to match the required pattern: /^a/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^a/,
                        value: '12',
                        label: 'value'
                    }
                }],
                ['ab', true],
                ['abc', true],
                ['abcd', false, {
                    message: '"value" length must be less than or equal to 3 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 3,
                        value: 'abcd',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });
    });

    describe('normalize()', () => {

        // The characters chosen for the "original" string below are such that
        // it and its four normalization forms are all different from each other
        // See: http://www.unicode.org/faq/normalization.html#6
        // and: http://www.unicode.org/reports/tr15/#Singletons_Figure

        const normalizations = {
            original: '\u03D3 \u212B',   // 'ϓ Å'
            NFC: '\u03D3 \u00C5',        // 'ϓ Å'
            NFD: '\u03D2\u0301 A\u030A', // 'ϓ Å'
            NFKC: '\u038E \u00C5',       // 'Ύ Å'
            NFKD: '\u03A5\u0301 A\u030A' // 'Ύ Å'
        };

        it('throws when normalization form is invalid', () => {

            expect(() => {

                Joi.string().normalize('NFCD');
            }).to.throw('normalization form must be one of NFC, NFD, NFKC, NFKD');
        });

        it('only allow strings that are in NFC form', () => {

            const schema = Joi.string().normalize('NFC');

            Helper.validate(schema, { convert: false }, [
                [normalizations.original, false, {
                    message: '"value" must be unicode normalized in the NFC form',
                    path: [],
                    type: 'string.normalize',
                    context: {
                        form: 'NFC',
                        value: normalizations.original,
                        label: 'value'
                    }
                }],
                [normalizations.NFC, true]
            ]);
        });

        it('only allow strings that are in NFD form', () => {

            const schema = Joi.string().normalize('NFD');

            Helper.validate(schema, { convert: false }, [
                [normalizations.original, false, {
                    message: '"value" must be unicode normalized in the NFD form',
                    path: [],
                    type: 'string.normalize',
                    context: {
                        form: 'NFD',
                        value: normalizations.original,
                        label: 'value'
                    }
                }],
                [normalizations.NFD, true]
            ]);
        });

        it('only allow strings that are in NFKC form', () => {

            const schema = Joi.string().normalize('NFKC');

            Helper.validate(schema, { convert: false }, [
                [normalizations.original, false, {
                    message: '"value" must be unicode normalized in the NFKC form',
                    path: [],
                    type: 'string.normalize',
                    context: {
                        form: 'NFKC',
                        value: normalizations.original,
                        label: 'value'
                    }
                }],
                [normalizations.NFKC, true]
            ]);
        });

        it('only allow strings that are in NFKD form', () => {

            const schema = Joi.string().normalize('NFKD');

            Helper.validate(schema, { convert: false }, [
                [normalizations.original, false, {
                    message: '"value" must be unicode normalized in the NFKD form',
                    path: [],
                    type: 'string.normalize',
                    context: {
                        form: 'NFKD',
                        value: normalizations.original,
                        label: 'value'
                    }
                }],
                [normalizations.NFKD, true]
            ]);
        });

        it('normalizes string using NFC before validation', () => {

            Helper.validate(Joi.string().normalize('NFC'), [[normalizations.original, true, normalizations.NFC]]);
        });

        it('normalizes string using NFD before validation', () => {

            Helper.validate(Joi.string().normalize('NFD'), [[normalizations.original, true, normalizations.NFD]]);
        });

        it('normalizes string using NFKC before validation', () => {

            Helper.validate(Joi.string().normalize('NFKC'), [[normalizations.original, true, normalizations.NFKC]]);
        });

        it('normalizes string using NFKD before validation', () => {

            Helper.validate(Joi.string().normalize('NFKD'), [[normalizations.original, true, normalizations.NFKD]]);
        });

        it('should default to NFC form', () => {

            Helper.validate(Joi.string().normalize(), [[normalizations.original, true, normalizations.NFC]]);
        });

        // The below tests use the composed and decomposed form
        // of the 'ñ' character

        it('should work in combination with min', () => {

            const baseSchema = Joi.string().min(2);
            Helper.validate(baseSchema.normalize('NFD'), [['\u00F1', true, 'n\u0303']]);

            Helper.validate(baseSchema.normalize('NFC'), [['n\u0303', false, {
                message: '"value" length must be at least 2 characters long',
                path: [],
                type: 'string.min',
                context: {
                    limit: 2,
                    value: '\u00F1',
                    encoding: undefined,
                    label: 'value'
                }
            }]]);
        });

        it('should work in combination with max', () => {

            const baseSchema = Joi.string().max(1);
            Helper.validate(baseSchema.normalize('NFC'), [['n\u0303', true, '\u00F1']]);

            Helper.validate(baseSchema.normalize('NFD'), [['\u00F1', false, {
                message: '"value" length must be less than or equal to 1 characters long',
                path: [],
                type: 'string.max',
                context: {
                    limit: 1,
                    value: 'n\u0303',
                    encoding: undefined,
                    label: 'value'
                }
            }]]);
        });

        it('composition should work in combination with length', () => {

            const schema = Joi.string().length(2).normalize('NFC');

            Helper.validate(schema, [
                ['\u00F1', false, {
                    message: '"value" length must be 2 characters long',
                    path: [],
                    type: 'string.length',
                    context: {
                        limit: 2,
                        value: '\u00F1',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['n\u0303', false, {
                    message: '"value" length must be 2 characters long',
                    path: [],
                    type: 'string.length',
                    context: {
                        limit: 2,
                        value: '\u00F1',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['\u00F1\u00F1', true, '\u00F1\u00F1'.normalize('NFC')],
                ['\u00F1n\u0303', true, '\u00F1n\u0303'.normalize('NFC')],
                ['n\u0303n\u0303', true, 'n\u0303n\u0303'.normalize('NFC')]
            ]);
        });

        it('decomposition should work in combination with length', () => {

            const schema = Joi.string().length(2).normalize('NFD');

            Helper.validate(schema, [
                ['\u00F1\u00F1', false, {
                    message: '"value" length must be 2 characters long',
                    path: [],
                    type: 'string.length',
                    context: {
                        limit: 2,
                        value: 'n\u0303n\u0303',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['\u00F1n\u0303', false, {
                    message: '"value" length must be 2 characters long',
                    path: [],
                    type: 'string.length',
                    context: {
                        limit: 2,
                        value: 'n\u0303n\u0303',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['n\u0303n\u0303', false, {
                    message: '"value" length must be 2 characters long',
                    path: [],
                    type: 'string.length',
                    context: {
                        limit: 2,
                        value: 'n\u0303n\u0303',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['\u00F1', true, '\u00F1'.normalize('NFD')],
                ['n\u0303', true, 'n\u0303'.normalize('NFD')]
            ]);
        });

        it('should work in combination with lowercase', () => {

            const baseSchema = Joi.string().lowercase();
            Helper.validate(baseSchema.normalize('NFC'), [['N\u0303', true, '\u00F1']]);
            Helper.validate(baseSchema.normalize('NFD'), [['\u00D1', true, 'n\u0303']]);
        });

        it('should work in combination with uppercase', () => {

            const baseSchema = Joi.string().uppercase();
            Helper.validate(baseSchema.normalize('NFC'), [['n\u0303', true, '\u00D1']]);
            Helper.validate(baseSchema.normalize('NFD'), [['\u00F1', true, 'N\u0303']]);
        });
    });

    describe('regex()', () => {

        it('validates regex', () => {

            const schema = Joi.string().regex(/^[0-9][-][a-z]+$/);
            Helper.validate(schema, [
                ['van', false, {
                    message: '"value" with value "van" fails to match the required pattern: /^[0-9][-][a-z]+$/',
                    path: [],
                    type: 'string.pattern.base',
                    context: {
                        name: undefined,
                        regex: /^[0-9][-][a-z]+$/,
                        value: 'van',
                        label: 'value'
                    }
                }],
                ['0-www', true]
            ]);
        });

        it('rejects regex with global or sticky flag', () => {

            expect(() => Joi.string().regex(/a/g)).to.throw('regex should not use global or sticky mode');
            expect(() => Joi.string().regex(/a/y)).to.throw('regex should not use global or sticky mode');
        });

        it('should not include a pattern name by default', () => {

            const schema = Joi.string().regex(/[a-z]+/).regex(/[0-9]+/);
            Helper.validate(schema, [['abcd', false, {
                message: '"value" with value "abcd" fails to match the required pattern: /[0-9]+/',
                path: [],
                type: 'string.pattern.base',
                context: {
                    name: undefined,
                    regex: /[0-9]+/,
                    value: 'abcd',
                    label: 'value'
                }
            }]]);
        });

        it('should include a pattern name if specified', () => {

            const schema = Joi.string().regex(/[a-z]+/, 'letters').regex(/[0-9]+/, 'numbers');
            Helper.validate(schema, [['abcd', false, {
                message: '"value" with value "abcd" fails to match the numbers pattern',
                path: [],
                type: 'string.pattern.name',
                context: {
                    name: 'numbers',
                    regex: /[0-9]+/,
                    value: 'abcd',
                    label: 'value'
                }
            }]]);
        });

        it('should include a pattern name in options object', () => {

            const schema = Joi.string().regex(/[a-z]+/, { name: 'letters' }).regex(/[0-9]+/, { name: 'numbers' });
            Helper.validate(schema, [['abcd', false, {
                message: '"value" with value "abcd" fails to match the numbers pattern',
                path: [],
                type: 'string.pattern.name',
                context: {
                    name: 'numbers',
                    regex: /[0-9]+/,
                    value: 'abcd',
                    label: 'value'
                }
            }]]);
        });

        it('should "invert" regex pattern if specified in options object', () => {

            const schema = Joi.string().regex(/[a-z]/, { invert: true });
            Helper.validate(schema, [
                ['0123456789', true],
                ['abcdefg', false, {
                    message: '"value" with value "abcdefg" matches the inverted pattern: /[a-z]/',
                    path: [],
                    type: 'string.pattern.invert.base',
                    context: {
                        name: undefined,
                        regex: /[a-z]/,
                        value: 'abcdefg',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('should include inverted pattern name if specified', () => {

            const schema = Joi.string().regex(/[a-z]/, {
                name: 'lowercase',
                invert: true
            });
            Helper.validate(schema, [
                ['0123456789', true],
                ['abcdefg', false, {
                    message: '"value" with value "abcdefg" matches the inverted lowercase pattern',
                    path: [],
                    type: 'string.pattern.invert.name',
                    context: {
                        name: 'lowercase',
                        regex: /[a-z]/,
                        value: 'abcdefg',
                        label: 'value'
                    }
                }]
            ]);
        });
    });

    describe('replace()', () => {

        it('successfully replaces the first occurrence of the expression', () => {

            const schema = Joi.string().replace(/\s+/, ''); // no "g" flag
            Helper.validate(schema, { convert: true }, [
                ['\tsomething', true, 'something'],
                ['something\r', true, 'something'],
                ['something  ', true, 'something'],
                ['some  thing', true, 'something'],
                ['so me thing', true, 'some thing'] // first occurrence!
            ]);
        });

        it('successfully replaces all occurrences of the expression', () => {

            const schema = Joi.string().replace(/\s+/g, ''); // has "g" flag
            Helper.validate(schema, { convert: true }, [
                ['\tsomething', true, 'something'],
                ['something\r', true, 'something'],
                ['something  ', true, 'something'],
                ['some  thing', true, 'something'],
                ['so me thing', true, 'something']
            ]);
        });

        it('successfully replaces all occurrences of a string pattern', () => {

            const schema = Joi.string().replace('foo', 'X'); // has "g" flag
            Helper.validate(schema, { convert: true }, [
                ['foobarfoobazfoo', true, 'XbarXbazX']
            ]);
        });

        it('successfully replaces multiple times', () => {

            const schema = Joi.string().replace(/a/g, 'b').replace(/b/g, 'c');
            Helper.validate(schema, [['a quick brown fox', true, 'c quick crown fox']]);
        });

        it('should work in combination with trim', () => {

            // The string below is the name "Yamada Tarou" separated by a
            // carriage return, a "full width" ideographic space and a newline

            const schema = Joi.string().trim().replace(/\s+/g, ' ');
            Helper.validate(schema, [[' \u5C71\u7530\r\u3000\n\u592A\u90CE ', true, '\u5C71\u7530 \u592A\u90CE']]);
        });

        it('should work in combination with min', () => {

            const schema = Joi.string().min(4).replace(/\s+/g, ' ');
            Helper.validate(schema, [
                ['   a   ', false, {
                    message: '"value" length must be at least 4 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 4,
                        value: ' a ',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['abc    ', true, 'abc '],
                ['a\t\rbc', true, 'a bc']
            ]);
        });

        it('should work in combination with max', () => {

            const schema = Joi.string().max(5).replace(/ CHANGE ME /g, '-b-');
            Helper.validate(schema, [
                ['a CHANGE ME c', true, 'a-b-c'],
                ['a-b-c', true, 'a-b-c'] // nothing changes here!
            ]);
        });

        it('should work in combination with length', () => {

            const schema = Joi.string().length(5).replace(/\s+/g, ' ');
            Helper.validate(schema, [
                ['a    bc', false, {
                    message: '"value" length must be 5 characters long',
                    path: [],
                    type: 'string.length',
                    context: {
                        limit: 5,
                        value: 'a bc',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['a\tb\nc', true, 'a b c']
            ]);
        });

    });

    describe('required()', () => {

        it('denies undefined, deny empty string', () => {

            Helper.validate(Joi.string().required(), [
                [undefined, false, {
                    message: '"value" is required',
                    path: [],
                    type: 'any.required',
                    context: { label: 'value' }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }]
            ]);
        });

        it('prints a friend error message for an empty string', () => {

            const schema = Joi.string().required();
            Helper.validate(Joi.compile(schema), [['', false, {
                message: '"value" is not allowed to be empty',
                path: [],
                type: 'string.empty',
                context: { value: '', label: 'value' }
            }]]);
        });

        it('prints a friendly error message for trimmed whitespace', () => {

            const schema = Joi.string().trim().required();

            Helper.validate(Joi.compile(schema), [['    ', false, {
                message: '"value" is not allowed to be empty',
                path: [],
                type: 'string.empty',
                context: { value: '', label: 'value' }
            }]]);
        });

        it('validates non-empty strings', () => {

            const schema = Joi.string().required();
            Helper.validate(schema, [
                ['test', true],
                ['0', true],
                [null, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: null, label: 'value' }
                }]
            ]);
        });
    });

    describe('token()', () => {

        it('validates token', () => {

            const schema = Joi.string().token();
            Helper.validate(schema, [
                ['w0rld_of_w4lm4rtl4bs', true],
                ['w0rld of_w4lm4rtl4bs', false, {
                    message: '"value" must only contain alpha-numeric and underscore characters',
                    path: [],
                    type: 'string.token',
                    context: { value: 'w0rld of_w4lm4rtl4bs', label: 'value' }
                }],
                ['abcd#f?h1j orly?', false, {
                    message: '"value" must only contain alpha-numeric and underscore characters',
                    path: [],
                    type: 'string.token',
                    context: { value: 'abcd#f?h1j orly?', label: 'value' }
                }]
            ]);
        });
    });

    describe('trim()', () => {

        it('only allow strings that have no leading or trailing whitespace', () => {

            const schema = Joi.string().trim();
            Helper.validate(schema, { convert: false }, [
                [' something', false, {
                    message: '"value" must not have leading or trailing whitespace',
                    path: [],
                    type: 'string.trim',
                    context: { value: ' something', label: 'value' }
                }],
                ['something ', false, {
                    message: '"value" must not have leading or trailing whitespace',
                    path: [],
                    type: 'string.trim',
                    context: { value: 'something ', label: 'value' }
                }],
                ['something\n', false, {
                    message: '"value" must not have leading or trailing whitespace',
                    path: [],
                    type: 'string.trim',
                    context: { value: 'something\n', label: 'value' }
                }],
                ['some thing', true],
                ['something', true]
            ]);
        });

        it('disable existing trim flag when passing enabled: false', () => {

            const trimEnabledSchema = Joi.string().trim(true);
            Helper.validate(trimEnabledSchema, { convert: false }, [
                [' something', false, {
                    message: '"value" must not have leading or trailing whitespace',
                    path: [],
                    type: 'string.trim',
                    context: { value: ' something', label: 'value' }
                }]
            ]);

            const trimDisabledSchema = trimEnabledSchema.trim(false);
            Helper.validate(trimDisabledSchema, { convert: false }, [
                [' something', true]
            ]);

            Helper.validate(trimDisabledSchema, [
                [' something', true]
            ]);
        });

        it('removes leading and trailing whitespace before validation', () => {

            const schema = Joi.string().trim();
            Helper.validate(schema, [[' trim this ', true, 'trim this']]);
        });

        it('removes leading and trailing whitespace before validation', () => {

            const schema = Joi.string().trim().allow('');
            Helper.validate(schema, [['     ', true, '']]);
        });

        it('should work in combination with min', () => {

            const schema = Joi.string().min(4).trim();
            Helper.validate(schema, [
                [' a ', false, {
                    message: '"value" length must be at least 4 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 4,
                        value: 'a',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['abc ', false, {
                    message: '"value" length must be at least 4 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        limit: 4,
                        value: 'abc',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['abcd ', true, 'abcd']
            ]);
        });

        it('should work in combination with max', () => {

            const schema = Joi.string().max(4).trim();
            Helper.validate(schema, [
                [' abcde ', false, {
                    message: '"value" length must be less than or equal to 4 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        limit: 4,
                        value: 'abcde',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['abc ', true, 'abc'],
                ['abcd ', true, 'abcd']
            ]);
        });

        it('should work in combination with length', () => {

            const schema = Joi.string().length(4).trim();
            Helper.validate(schema, [
                [' ab ', false, {
                    message: '"value" length must be 4 characters long',
                    path: [],
                    type: 'string.length',
                    context: {
                        limit: 4,
                        value: 'ab',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['abc ', false, {
                    message: '"value" length must be 4 characters long',
                    path: [],
                    type: 'string.length',
                    context: {
                        limit: 4,
                        value: 'abc',
                        encoding: undefined,
                        label: 'value'
                    }
                }],
                ['abcd ', true, 'abcd']
            ]);
        });

        it('should work in combination with a case change', () => {

            const schema = Joi.string().trim().lowercase();
            Helper.validate(schema, [
                [' abc', true, 'abc'],
                [' ABC', true, 'abc'],
                ['ABC', true, 'abc']
            ]);
        });

        it('throws when option is not a boolean', () => {

            expect(() => {

                Joi.string().trim(42);
            }).to.throw('enabled must be a boolean');
        });
    });

    describe('truncate()', () => {

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.string().truncate();
            expect(schema.truncate()).to.shallow.equal(schema);
        });

        it('switches the truncate flag', () => {

            const schema = Joi.string().truncate();
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'string',
                flags: { truncate: true }
            });
        });

        it('switches the truncate flag with explicit value', () => {

            const schema = Joi.string().truncate(true);
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'string',
                flags: { truncate: true }
            });
        });

        it('switches the truncate flag back', () => {

            const schema = Joi.string().truncate().truncate(false);
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'string'
            });
        });

        it('does not change anything when used without max', () => {

            const schema = Joi.string().min(2).truncate();
            Helper.validate(schema, [['fooooooooooooooooooo', true, 'fooooooooooooooooooo']]);
        });

        it('truncates a string when used with max', () => {

            const schema = Joi.string().max(5).truncate();

            Helper.validate(schema, [
                ['abc', true, 'abc'],
                ['abcde', true, 'abcde'],
                ['abcdef', true, 'abcde']
            ]);
        });

        it('truncates a string after transformations', () => {

            const schema = Joi.string().max(5).truncate().trim().replace(/a/g, 'aa');

            Helper.validate(schema, [
                ['abc', true, 'aabc'],
                ['abcde', true, 'aabcd'],
                ['abcdef', true, 'aabcd'],
                ['  abcdef  ', true, 'aabcd']
            ]);
        });

        it('truncates a string (ref)', () => {

            const ref = Joi.ref('b');
            const schema = Joi.object({
                a: Joi.string().max(ref).truncate(),
                b: Joi.number()
            });

            Helper.validate(schema, [
                [{ a: 'abc', b: 4 }, true, { a: 'abc', b: 4 }],
                [{ a: 'abcde', b: 2 }, true, { a: 'ab', b: 2 }],
                [{ a: 'abcdef', b: 5 }, true, { a: 'abcde', b: 5 }],
                [{ a: 'abc' }, false, {
                    message: '"a" limit references "ref:b" which must be a positive integer',
                    path: ['a'],
                    type: 'any.ref',
                    context: { key: 'a', label: 'a', ref, arg: 'limit', reason: 'must be a positive integer' }
                }]
            ]);
        });
    });

    describe('uppercase()', () => {

        it('only allow strings that are entirely uppercase', () => {

            const schema = Joi.string().uppercase();
            Helper.validate(schema, { convert: false }, [
                ['THIS IS ALL UPPERCASE', true],
                ['5', true],
                ['UPPER\nCASE', true],
                ['lOWERCASE', false, {
                    message: '"value" must only contain uppercase characters',
                    path: [],
                    type: 'string.uppercase',
                    context: { value: 'lOWERCASE', label: 'value' }
                }],
                ['MixEd cAsE', false, {
                    message: '"value" must only contain uppercase characters',
                    path: [],
                    type: 'string.uppercase',
                    context: { value: 'MixEd cAsE', label: 'value' }
                }],
                [1, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 1, label: 'value' }
                }]
            ]);
        });

        it('coerce string to uppercase before validation', () => {

            const schema = Joi.string().uppercase();
            Helper.validate(schema, [['lower to upper', true, 'LOWER TO UPPER']]);
        });

        it('works in combination with a forced trim', () => {

            const schema = Joi.string().uppercase().trim();
            Helper.validate(schema, [
                [' abc', true, 'ABC'],
                [' ABC', true, 'ABC'],
                ['ABC', true],
                [1, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 1, label: 'value' }
                }]
            ]);
        });

        it('works in combination with a forced replacement', () => {

            const schema = Joi.string().uppercase().replace(/\s+/g, ' ');
            Helper.validate(schema, [
                ['a\r b\n c', true, 'A B C'],
                ['A\t B  C', true, 'A B C'],
                ['ABC', true, 'ABC'],
                [1, false, {
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 1, label: 'value' }
                }]
            ]);
        });

        it('validates combination of uppercase, min, max, alphanum and valid', () => {

            const rule = Joi.string().uppercase().min(2).max(3).alphanum().valid('AB', 'BC');
            Helper.validate(rule, [
                ['x', false, {
                    message: '"value" must be one of [AB, BC]',
                    path: [],
                    type: 'any.only',
                    context: { value: 'X', valids: ['AB', 'BC'], label: 'value' }
                }],
                ['123', false, {
                    message: '"value" must be one of [AB, BC]',
                    path: [],
                    type: 'any.only',
                    context: { value: '123', valids: ['AB', 'BC'], label: 'value' }
                }],
                ['1234', false, {
                    message: '"value" must be one of [AB, BC]',
                    path: [],
                    type: 'any.only',
                    context: { value: '1234', valids: ['AB', 'BC'], label: 'value' }
                }],
                ['12', false, {
                    message: '"value" must be one of [AB, BC]',
                    path: [],
                    type: 'any.only',
                    context: { value: '12', valids: ['AB', 'BC'], label: 'value' }
                }],
                ['ab', true, 'AB'],
                ['abc', false, {
                    message: '"value" must be one of [AB, BC]',
                    path: [],
                    type: 'any.only',
                    context: { value: 'ABC', valids: ['AB', 'BC'], label: 'value' }
                }],
                ['a2c', false, {
                    message: '"value" must be one of [AB, BC]',
                    path: [],
                    type: 'any.only',
                    context: { value: 'A2C', valids: ['AB', 'BC'], label: 'value' }
                }],
                ['abcd', false, {
                    message: '"value" must be one of [AB, BC]',
                    path: [],
                    type: 'any.only',
                    context: { value: 'ABCD', valids: ['AB', 'BC'], label: 'value' }
                }],
                ['*ab', false, {
                    message: '"value" must be one of [AB, BC]',
                    path: [],
                    type: 'any.only',
                    context: { value: '*AB', valids: ['AB', 'BC'], label: 'value' }
                }],
                ['', false, {
                    message: '"value" must be one of [AB, BC]',
                    path: [],
                    type: 'any.only',
                    context: { value: '', valids: ['AB', 'BC'], label: 'value' }
                }],
                ['bc', true, 'BC'],
                ['BC', true],
                ['de', false, {
                    message: '"value" must be one of [AB, BC]',
                    path: [],
                    type: 'any.only',
                    context: { value: 'DE', valids: ['AB', 'BC'], label: 'value' }
                }],
                ['ABc', false, {
                    message: '"value" must be one of [AB, BC]',
                    path: [],
                    type: 'any.only',
                    context: { value: 'ABC', valids: ['AB', 'BC'], label: 'value' }
                }],
                ['AB', true],
                [null, false, {
                    message: '"value" must be one of [AB, BC]',
                    path: [],
                    type: 'any.only',
                    context: { value: null, valids: ['AB', 'BC'], label: 'value' }
                }]
            ]);
        });
    });

    describe('uri()', () => {

        it('validates uri', () => {

            // Handful of tests taken from Node: https://github.com/joyent/node/blob/cfcb1de130867197cbc9c6012b7e84e08e53d032/test/simple/test-url.js
            // Also includes examples from RFC 3986: http://tools.ietf.org/html/rfc3986#page-7

            const schema = Joi.string().uri();

            Helper.validate(schema, [
                ['foo://example.com:8042/over/there?name=ferret#nose', true],
                ['https://example.com?abc[]=123&abc[]=456', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'https://example.com?abc[]=123&abc[]=456', label: 'value' }
                }],
                ['urn:example:animal:ferret:nose', true],
                ['ftp://ftp.is.co.za/rfc/rfc1808.txt', true],
                ['http://www.ietf.org/rfc/rfc2396.txt', true],
                ['ldap://[2001:db8::7]/c=GB?objectClass?one', true],
                ['ldap://2001:db8::7/c=GB?objectClass?one', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'ldap://2001:db8::7/c=GB?objectClass?one', label: 'value' }
                }],
                ['mailto:John.Doe@example.com', true],
                ['news:comp.infosystems.www.servers.unix', true],
                ['tel:+1-816-555-1212', true],
                ['telnet://192.0.2.16:80/', true],
                ['urn:oasis:names:specification:docbook:dtd:xml:4.1.2', true],
                ['file:///example.txt', true],
                ['http://asdf:qw%20er@localhost:8000?asdf=12345&asda=fc%2F#bacon', true],
                ['http://asdf@localhost:8000', true],
                ['http://[v1.09azAZ-._~!$&\'()*+,;=:]', true],
                ['http://[a:b:c:d:e::1.2.3.4]', true],
                ['coap://[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]', true],
                ['http://[1080:0:0:0:8:800:200C:417A]', true],
                ['http://v1.09azAZ-._~!$&\'()*+,;=:', true], // This doesn't look valid, but it is. The `v1.09azAZ-._~!$&\'()*+,;=` part is a valid registered name as it has no invalid characters
                ['http://a:b:c:d:e::1.2.3.4', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'http://a:b:c:d:e::1.2.3.4', label: 'value' }
                }],
                ['coap://FEDC:BA98:7654:3210:FEDC:BA98:7654:3210', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'coap://FEDC:BA98:7654:3210:FEDC:BA98:7654:3210', label: 'value' }
                }],
                ['http://1080:0:0:0:8:800:200C:417A', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'http://1080:0:0:0:8:800:200C:417A', label: 'value' }
                }],
                ['http://127.0.0.1:8000/foo?bar', true],
                ['http://asdf:qwer@localhost:8000', true],
                ['http://user:pass%3A@localhost:80', true],
                ['http://localhost:123', true],
                ['https://localhost:123', true],
                ['file:///whatever', true],
                ['mailto:asdf@asdf.com', true],
                ['ftp://www.example.com', true],
                ['javascript:alert(\'hello\');', true], // eslint-disable-line no-script-url
                ['xmpp:isaacschlueter@jabber.org', true],
                ['f://some.host/path', true],
                ['http://localhost:18/asdf', true],
                ['http://localhost:42/asdf?qwer=zxcv', true],
                ['HTTP://www.example.com/', true],
                ['HTTP://www.example.com', true],
                ['http://www.ExAmPlE.com/', true],
                ['http://user:pw@www.ExAmPlE.com/', true],
                ['http://USER:PW@www.ExAmPlE.com/', true],
                ['http://user@www.example.com/', true],
                ['http://user%3Apw@www.example.com/', true],
                ['http://x.com/path?that%27s#all,%20folks', true],
                ['HTTP://X.COM/Y', true],
                ['http://www.narwhaljs.org/blog/categories?id=news', true],
                ['http://mt0.google.com/vt/lyrs=m@114&hl=en&src=api&x=2&y=2&z=3&s=', true],
                ['http://mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=', true],
                ['http://user:pass@mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=', true],
                ['http://_jabber._tcp.google.com:80/test', true],
                ['http://user:pass@_jabber._tcp.google.com:80/test', true],
                ['http://[fe80::1]/a/b?a=b#abc', true],
                ['http://fe80::1/a/b?a=b#abc', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'http://fe80::1/a/b?a=b#abc', label: 'value' }
                }],
                ['http://user:password@[3ffe:2a00:100:7031::1]:8080', true],
                ['coap://[1080:0:0:0:8:800:200C:417A]:61616/', true],
                ['coap://1080:0:0:0:8:800:200C:417A:61616/', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'coap://1080:0:0:0:8:800:200C:417A:61616/', label: 'value' }
                }],
                ['git+http://github.com/joyent/node.git', true],
                ['http://bucket_name.s3.amazonaws.com/image.jpg', true],
                ['dot.test://foo/bar', true],
                ['svn+ssh://foo/bar', true],
                ['dash-test://foo/bar', true],
                ['xmpp:isaacschlueter@jabber.org', true],
                ['http://atpass:foo%40bar@127.0.0.1:8080/path?search=foo#bar', true],
                ['javascript:alert(\'hello\');', true], // eslint-disable-line no-script-url
                ['file://localhost/etc/node/', true],
                ['file:///etc/node/', true],
                ['http://USER:PW@www.ExAmPlE.com/', true],
                ['mailto:local1@domain1?query1', true],
                ['http://example/a/b?c/../d', true],
                ['http://example/x%2Fabc', true],
                ['http://a/b/c/d;p=1/g;x=1/y', true],
                ['http://a/b/c/g#s/../x', true],
                ['http://a/b/c/.foo', true],
                ['http://example.com/b//c//d;p?q#blarg', true],
                ['g:h', true],
                ['http://a/b/c/g', true],
                ['http://a/b/c/g/', true],
                ['http://a/g', true],
                ['http://g', true],
                ['http://a/b/c/d;p?y', true],
                ['http://a/b/c/g?y', true],
                ['http://a/b/c/d;p?q#s', true],
                ['http://a/b/c/g#s', true],
                ['http://a/b/c/g?y#s', true],
                ['http://a/b/c/;x', true],
                ['http://a/b/c/g;x', true],
                ['http://a/b/c/g;x?y#s', true],
                ['http://a/b/c/d;p?q', true],
                ['http://a/b/c/', true],
                ['http://a/b/', true],
                ['http://a/b/g', true],
                ['http://a/', true],
                ['http://a/g', true],
                ['http://a/g', true],
                ['file:/asda', true],
                ['qwerty', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'qwerty', label: 'value' }
                }],
                ['invalid uri', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'invalid uri', label: 'value' }
                }],
                ['1http://google.com', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: '1http://google.com', label: 'value' }
                }],
                ['http://testdomain`,.<>/?\'";{}][++\\|~!@#$%^&*().org', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'http://testdomain`,.<>/?\'";{}][++\\|~!@#$%^&*().org', label: 'value' }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                ['(╯°□°)╯︵ ┻━┻', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: '(╯°□°)╯︵ ┻━┻', label: 'value' }
                }],
                ['one/two/three?value=abc&value2=123#david-rules', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'one/two/three?value=abc&value2=123#david-rules', label: 'value' }
                }],
                ['//username:password@test.example.com/one/two/three?value=abc&value2=123#david-rules', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: '//username:password@test.example.com/one/two/three?value=abc&value2=123#david-rules', label: 'value' }
                }],
                ['http://a\r" \t\n<\'b:b@c\r\nd/e?f', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'http://a\r" \t\n<\'b:b@c\r\nd/e?f', label: 'value' }
                }],
                ['/absolute', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: '/absolute', label: 'value' }
                }]
            ]);
        });

        it('validates uri with a single scheme provided', () => {

            const schema = Joi.string().uri({
                scheme: 'http'
            });

            Helper.validate(schema, [
                ['http://google.com', true],
                ['https://google.com', false, {
                    message: '"value" must be a valid uri with a scheme matching the http pattern',
                    path: [],
                    type: 'string.uriCustomScheme',
                    context: {
                        scheme: 'http',
                        value: 'https://google.com',
                        label: 'value'
                    }
                }],
                ['ftp://google.com', false, {
                    message: '"value" must be a valid uri with a scheme matching the http pattern',
                    path: [],
                    type: 'string.uriCustomScheme',
                    context: {
                        scheme: 'http',
                        value: 'ftp://google.com',
                        label: 'value'
                    }
                }],
                ['file:/asdf', false, {
                    message: '"value" must be a valid uri with a scheme matching the http pattern',
                    path: [],
                    type: 'string.uriCustomScheme',
                    context: {
                        scheme: 'http',
                        value: 'file:/asdf',
                        label: 'value'
                    }
                }],
                ['/path?query=value#hash', false, {
                    message: '"value" must be a valid uri with a scheme matching the http pattern',
                    path: [],
                    type: 'string.uriCustomScheme',
                    context: {
                        scheme: 'http',
                        value: '/path?query=value#hash',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates uri with a single regex scheme provided', () => {

            const schema = Joi.string().uri({
                scheme: /https?/
            });

            Helper.validate(schema, [
                ['http://google.com', true],
                ['https://google.com', true],
                ['ftp://google.com', false, {
                    message: '"value" must be a valid uri with a scheme matching the https? pattern',
                    path: [],
                    type: 'string.uriCustomScheme',
                    context: {
                        scheme: 'https?',
                        value: 'ftp://google.com',
                        label: 'value'
                    }
                }],
                ['file:/asdf', false, {
                    message: '"value" must be a valid uri with a scheme matching the https? pattern',
                    path: [],
                    type: 'string.uriCustomScheme',
                    context: {
                        scheme: 'https?',
                        value: 'file:/asdf',
                        label: 'value'
                    }
                }],
                ['/path?query=value#hash', false, {
                    message: '"value" must be a valid uri with a scheme matching the https? pattern',
                    path: [],
                    type: 'string.uriCustomScheme',
                    context: {
                        scheme: 'https?',
                        value: '/path?query=value#hash',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates uri with multiple schemes provided', () => {

            const schema = Joi.string().uri({
                scheme: [/https?/, 'ftp', 'file', 'git+http']
            });

            Helper.validate(schema, [
                ['http://google.com', true],
                ['https://google.com', true],
                ['ftp://google.com', true],
                ['file:/asdf', true],
                ['git+http://github.com/hapijs/joi', true],
                ['/path?query=value#hash', false, {
                    message: '"value" must be a valid uri with a scheme matching the https?|ftp|file|git\\+http pattern',
                    path: [],
                    type: 'string.uriCustomScheme',
                    context: {
                        scheme: 'https?|ftp|file|git\\+http',
                        value: '/path?query=value#hash',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates uri', () => {

            const schema = { item: Joi.string().uri() };

            Helper.validate(Joi.compile(schema), [[{ item: 'something invalid' }, false, '"item" must be a valid uri']]);
        });

        it('validates uri with a custom scheme', () => {

            const schema = {
                item: Joi.string().uri({
                    scheme: 'http'
                })
            };

            Helper.validate(Joi.compile(schema), [[{ item: 'something invalid' }, false, '"item" must be a valid uri with a scheme matching the http pattern']]);
        });

        it('validates uri with a custom array of schemes', () => {

            const schema = {
                item: Joi.string().uri({
                    scheme: ['http', /https?/]
                })
            };

            Helper.validate(Joi.compile(schema), [[{ item: 'something invalid' }, false, '"item" must be a valid uri with a scheme matching the http|https? pattern']]);
        });

        it('validates uri treats scheme as optional', () => {

            expect(() => {

                Joi.string().uri({});
            }).to.not.throw();
        });

        it('validates uri requires uriOptions as an object', () => {

            expect(() => {

                Joi.string().uri('http');
            }).to.throw(Error, 'Options must be of type object');
        });

        it('validates uri requires scheme to be a RegExp, String, or Array', () => {

            expect(() => {

                Joi.string().uri({
                    scheme: {}
                });
            }).to.throw(Error, 'scheme must be a RegExp, String, or Array');
        });

        it('validates uri requires scheme to not be an empty array', () => {

            expect(() => {

                Joi.string().uri({
                    scheme: []
                });
            }).to.throw(Error, 'scheme must have at least 1 scheme specified');
        });

        it('validates uri requires scheme to be an Array of schemes to all be valid schemes', () => {

            expect(() => {

                Joi.string().uri({
                    scheme: [
                        'http',
                        '~!@#$%^&*()_'
                    ]
                });
            }).to.throw(Error, 'scheme at position 1 must be a valid scheme');
        });

        it('validates uri requires scheme to be an Array of schemes to be strings or RegExp', () => {

            expect(() => {

                Joi.string().uri({
                    scheme: [
                        'http',
                        {}
                    ]
                });
            }).to.throw(Error, 'scheme at position 1 must be a RegExp or String');
        });

        it('validates uri requires scheme to be a valid String scheme', () => {

            expect(() => {

                Joi.string().uri({
                    scheme: '~!@#$%^&*()_'
                });
            }).to.throw(Error, 'scheme at position 0 must be a valid scheme');
        });

        it('validates uri and domain', () => {

            const schema = Joi.string().uri({ domain: { minDomainSegments: 3, tlds: { allow: ['com'] } } });

            Helper.validate(schema, [
                ['http://test.google.com', true],
                ['http://google.com', false, {
                    message: '"value" must contain a valid domain name',
                    path: [],
                    type: 'string.domain',
                    context: {
                        value: 'google.com',
                        label: 'value'
                    }
                }],
                ['http://test.google.net', false, {
                    message: '"value" must contain a valid domain name',
                    path: [],
                    type: 'string.domain',
                    context: {
                        value: 'test.google.net',
                        label: 'value'
                    }
                }]
            ]);
        });

        it('validates uri and domain (true)', () => {

            const schema = Joi.string().uri({ domain: {} });

            Helper.validate(schema, [
                ['http://test.google.com', true],
                ['http://google.com%F', false, '"value" must contain a valid domain name']
            ]);
        });

        it('validates relative uri', () => {

            const schema = Joi.string().uri({ allowRelative: true });
            Helper.validate(schema, [
                ['foo://example.com:8042/over/there?name=ferret#nose', true],
                ['urn:example:animal:ferret:nose', true],
                ['ftp://ftp.is.co.za/rfc/rfc1808.txt', true],
                ['http://www.ietf.org/rfc/rfc2396.txt', true],
                ['ldap://[2001:db8::7]/c=GB?objectClass?one', true],
                ['mailto:John.Doe@example.com', true],
                ['news:comp.infosystems.www.servers.unix', true],
                ['tel:+1-816-555-1212', true],
                ['telnet://192.0.2.16:80/', true],
                ['urn:oasis:names:specification:docbook:dtd:xml:4.1.2', true],
                ['file:///example.txt', true],
                ['http://asdf:qw%20er@localhost:8000?asdf=12345&asda=fc%2F#bacon', true],
                ['http://asdf@localhost:8000', true],
                ['http://[v1.09azAZ-._~!$&\'()*+,;=:]', true],
                ['http://[a:b:c:d:e::1.2.3.4]', true],
                ['coap://[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]', true],
                ['http://[1080:0:0:0:8:800:200C:417A]', true],
                ['http://127.0.0.1:8000/foo?bar', true],
                ['http://asdf:qwer@localhost:8000', true],
                ['http://user:pass%3A@localhost:80', true],
                ['http://localhost:123', true],
                ['https://localhost:123', true],
                ['file:///whatever', true],
                ['mailto:asdf@asdf.com', true],
                ['ftp://www.example.com', true],
                ['javascript:alert(\'hello\');', true], // eslint-disable-line no-script-url
                ['xmpp:isaacschlueter@jabber.org', true],
                ['f://some.host/path', true],
                ['http://localhost:18/asdf', true],
                ['http://localhost:42/asdf?qwer=zxcv', true],
                ['HTTP://www.example.com/', true],
                ['HTTP://www.example.com', true],
                ['http://www.ExAmPlE.com/', true],
                ['http://user:pw@www.ExAmPlE.com/', true],
                ['http://USER:PW@www.ExAmPlE.com/', true],
                ['http://user@www.example.com/', true],
                ['http://user%3Apw@www.example.com/', true],
                ['http://x.com/path?that%27s#all,%20folks', true],
                ['HTTP://X.COM/Y', true],
                ['http://www.narwhaljs.org/blog/categories?id=news', true],
                ['http://mt0.google.com/vt/lyrs=m@114&hl=en&src=api&x=2&y=2&z=3&s=', true],
                ['http://mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=', true],
                ['http://user:pass@mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=', true],
                ['http://_jabber._tcp.google.com:80/test', true],
                ['http://user:pass@_jabber._tcp.google.com:80/test', true],
                ['http://[fe80::1]/a/b?a=b#abc', true],
                ['http://user:password@[3ffe:2a00:100:7031::1]:8080', true],
                ['coap://[1080:0:0:0:8:800:200C:417A]:61616/', true],
                ['git+http://github.com/joyent/node.git', true],
                ['http://bucket_name.s3.amazonaws.com/image.jpg', true],
                ['dot.test://foo/bar', true],
                ['svn+ssh://foo/bar', true],
                ['dash-test://foo/bar', true],
                ['xmpp:isaacschlueter@jabber.org', true],
                ['http://atpass:foo%40bar@127.0.0.1:8080/path?search=foo#bar', true],
                ['javascript:alert(\'hello\');', true], // eslint-disable-line no-script-url
                ['file://localhost/etc/node/', true],
                ['file:///etc/node/', true],
                ['http://USER:PW@www.ExAmPlE.com/', true],
                ['mailto:local1@domain1?query1', true],
                ['http://example/a/b?c/../d', true],
                ['http://example/x%2Fabc', true],
                ['http://a/b/c/d;p=1/g;x=1/y', true],
                ['http://a/b/c/g#s/../x', true],
                ['http://a/b/c/.foo', true],
                ['http://example.com/b//c//d;p?q#blarg', true],
                ['g:h', true],
                ['http://a/b/c/g', true],
                ['http://a/b/c/g/', true],
                ['http://a/g', true],
                ['http://g', true],
                ['http://a/b/c/d;p?y', true],
                ['http://a/b/c/g?y', true],
                ['http://a/b/c/d;p?q#s', true],
                ['http://a/b/c/g#s', true],
                ['http://a/b/c/g?y#s', true],
                ['http://a/b/c/;x', true],
                ['http://a/b/c/g;x', true],
                ['http://a/b/c/g;x?y#s', true],
                ['http://a/b/c/d;p?q', true],
                ['http://a/b/c/', true],
                ['http://a/b/', true],
                ['http://a/b/g', true],
                ['http://a/', true],
                ['http://a/g', true],
                ['http://a/g', true],
                ['file:/asda', true],
                ['qwerty', true],
                ['invalid uri', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'invalid uri', label: 'value' }
                }],
                ['1http://google.com', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: '1http://google.com', label: 'value' }
                }],
                ['http://testdomain`,.<>/?\'";{}][++\\|~!@#$%^&*().org', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'http://testdomain`,.<>/?\'";{}][++\\|~!@#$%^&*().org', label: 'value' }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                ['(╯°□°)╯︵ ┻━┻', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: '(╯°□°)╯︵ ┻━┻', label: 'value' }
                }],
                ['one/two/three?value=abc&value2=123#david-rules', true],
                ['//username:password@test.example.com/one/two/three?value=abc&value2=123#david-rules', true],
                ['http://a\r" \t\n<\'b:b@c\r\nd/e?f', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'http://a\r" \t\n<\'b:b@c\r\nd/e?f', label: 'value' }
                }],
                ['/absolute', true],
                ['http://', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'http://', label: 'value' }
                }],
                ['http:/', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'http:/', label: 'value' }
                }],
                ['https:/', false, {
                    message: '"value" must be a valid uri',
                    path: [],
                    type: 'string.uri',
                    context: { value: 'https:/', label: 'value' }
                }]
            ]);
        });

        it('validates relative only uri', () => {

            const schema = Joi.string().uri({ relativeOnly: true });
            Helper.validate(schema, [
                ['foo://example.com:8042/over/there?name=ferret#nose', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'foo://example.com:8042/over/there?name=ferret#nose',
                        label: 'value'
                    }
                }],
                ['urn:example:animal:ferret:nose', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'urn:example:animal:ferret:nose',
                        label: 'value'
                    }
                }],
                ['ftp://ftp.is.co.za/rfc/rfc1808.txt', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'ftp://ftp.is.co.za/rfc/rfc1808.txt',
                        label: 'value'
                    }
                }],
                ['http://www.ietf.org/rfc/rfc2396.txt', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://www.ietf.org/rfc/rfc2396.txt',
                        label: 'value'
                    }
                }],
                ['ldap://[2001:db8::7]/c=GB?objectClass?one', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'ldap://[2001:db8::7]/c=GB?objectClass?one',
                        label: 'value'
                    }
                }],
                ['mailto:John.Doe@example.com', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'mailto:John.Doe@example.com',
                        label: 'value'
                    }
                }],
                ['news:comp.infosystems.www.servers.unix', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'news:comp.infosystems.www.servers.unix',
                        label: 'value'
                    }
                }],
                ['tel:+1-816-555-1212', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'tel:+1-816-555-1212',
                        label: 'value'
                    }
                }],
                ['telnet://192.0.2.16:80/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'telnet://192.0.2.16:80/',
                        label: 'value'
                    }
                }],
                ['urn:oasis:names:specification:docbook:dtd:xml:4.1.2', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'urn:oasis:names:specification:docbook:dtd:xml:4.1.2',
                        label: 'value'
                    }
                }],
                ['file:///example.txt', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'file:///example.txt',
                        label: 'value'
                    }
                }],
                ['http://asdf:qw%20er@localhost:8000?asdf=12345&asda=fc%2F#bacon', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://asdf:qw%20er@localhost:8000?asdf=12345&asda=fc%2F#bacon',
                        label: 'value'
                    }
                }],
                ['http://asdf@localhost:8000', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://asdf@localhost:8000',
                        label: 'value'
                    }
                }],
                ['http://[v1.09azAZ-._~!$&\'()*+,;=:]', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://[v1.09azAZ-._~!$&\'()*+,;=:]',
                        label: 'value'
                    }
                }],
                ['http://[a:b:c:d:e::1.2.3.4]', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://[a:b:c:d:e::1.2.3.4]',
                        label: 'value'
                    }
                }],
                ['coap://[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'coap://[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]',
                        label: 'value'
                    }
                }],
                ['http://[1080:0:0:0:8:800:200C:417A]', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://[1080:0:0:0:8:800:200C:417A]',
                        label: 'value'
                    }
                }],
                ['http://127.0.0.1:8000/foo?bar', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://127.0.0.1:8000/foo?bar',
                        label: 'value'
                    }
                }],
                ['http://asdf:qwer@localhost:8000', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://asdf:qwer@localhost:8000',
                        label: 'value'
                    }
                }],
                ['http://user:pass%3A@localhost:80', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://user:pass%3A@localhost:80',
                        label: 'value'
                    }
                }],
                ['http://localhost:123', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://localhost:123',
                        label: 'value'
                    }
                }],
                ['https://localhost:123', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'https://localhost:123',
                        label: 'value'
                    }
                }],
                ['file:///whatever', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'file:///whatever',
                        label: 'value'
                    }
                }],
                ['mailto:asdf@asdf.com', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'mailto:asdf@asdf.com',
                        label: 'value'
                    }
                }],
                ['ftp://www.example.com', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'ftp://www.example.com',
                        label: 'value'
                    }
                }],
                ['javascript:alert(\'hello\');', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'javascript:alert(\'hello\');',
                        label: 'value'
                    }
                }], // eslint-disable-line no-script-url
                ['xmpp:isaacschlueter@jabber.org', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'xmpp:isaacschlueter@jabber.org',
                        label: 'value'
                    }
                }],
                ['f://some.host/path', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'f://some.host/path',
                        label: 'value'
                    }
                }],
                ['http://localhost:18/asdf', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://localhost:18/asdf',
                        label: 'value'
                    }
                }],
                ['http://localhost:42/asdf?qwer=zxcv', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://localhost:42/asdf?qwer=zxcv',
                        label: 'value'
                    }
                }],
                ['HTTP://www.example.com/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'HTTP://www.example.com/',
                        label: 'value'
                    }
                }],
                ['HTTP://www.example.com', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'HTTP://www.example.com',
                        label: 'value'
                    }
                }],
                ['http://www.ExAmPlE.com/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://www.ExAmPlE.com/',
                        label: 'value'
                    }
                }],
                ['http://user:pw@www.ExAmPlE.com/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://user:pw@www.ExAmPlE.com/',
                        label: 'value'
                    }
                }],
                ['http://USER:PW@www.ExAmPlE.com/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://USER:PW@www.ExAmPlE.com/',
                        label: 'value'
                    }
                }],
                ['http://user@www.example.com/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://user@www.example.com/',
                        label: 'value'
                    }
                }],
                ['http://user%3Apw@www.example.com/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://user%3Apw@www.example.com/',
                        label: 'value'
                    }
                }],
                ['http://x.com/path?that%27s#all,%20folks', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://x.com/path?that%27s#all,%20folks',
                        label: 'value'
                    }
                }],
                ['HTTP://X.COM/Y', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'HTTP://X.COM/Y',
                        label: 'value'
                    }
                }],
                ['http://www.narwhaljs.org/blog/categories?id=news', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://www.narwhaljs.org/blog/categories?id=news',
                        label: 'value'
                    }
                }],
                ['http://mt0.google.com/vt/lyrs=m@114&hl=en&src=api&x=2&y=2&z=3&s=', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://mt0.google.com/vt/lyrs=m@114&hl=en&src=api&x=2&y=2&z=3&s=',
                        label: 'value'
                    }
                }],
                ['http://mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=',
                        label: 'value'
                    }
                }],
                ['http://user:pass@mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://user:pass@mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=',
                        label: 'value'
                    }
                }],
                ['http://_jabber._tcp.google.com:80/test', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://_jabber._tcp.google.com:80/test',
                        label: 'value'
                    }
                }],
                ['http://user:pass@_jabber._tcp.google.com:80/test', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://user:pass@_jabber._tcp.google.com:80/test',
                        label: 'value'
                    }
                }],
                ['http://[fe80::1]/a/b?a=b#abc', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://[fe80::1]/a/b?a=b#abc',
                        label: 'value'
                    }
                }],
                ['http://user:password@[3ffe:2a00:100:7031::1]:8080', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://user:password@[3ffe:2a00:100:7031::1]:8080',
                        label: 'value'
                    }
                }],
                ['coap://[1080:0:0:0:8:800:200C:417A]:61616/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'coap://[1080:0:0:0:8:800:200C:417A]:61616/',
                        label: 'value'
                    }
                }],
                ['git+http://github.com/joyent/node.git', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'git+http://github.com/joyent/node.git',
                        label: 'value'
                    }
                }],
                ['http://bucket_name.s3.amazonaws.com/image.jpg', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://bucket_name.s3.amazonaws.com/image.jpg',
                        label: 'value'
                    }
                }],
                ['dot.test://foo/bar', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'dot.test://foo/bar',
                        label: 'value'
                    }
                }],
                ['svn+ssh://foo/bar', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'svn+ssh://foo/bar',
                        label: 'value'
                    }
                }],
                ['dash-test://foo/bar', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'dash-test://foo/bar',
                        label: 'value'
                    }
                }],
                ['xmpp:isaacschlueter@jabber.org', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'xmpp:isaacschlueter@jabber.org',
                        label: 'value'
                    }
                }],
                ['http://atpass:foo%40bar@127.0.0.1:8080/path?search=foo#bar', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://atpass:foo%40bar@127.0.0.1:8080/path?search=foo#bar',
                        label: 'value'
                    }
                }],
                ['javascript:alert(\'hello\');', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'javascript:alert(\'hello\');',
                        label: 'value'
                    }
                }], // eslint-disable-line no-script-url
                ['file://localhost/etc/node/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'file://localhost/etc/node/',
                        label: 'value'
                    }
                }],
                ['file:///etc/node/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'file:///etc/node/',
                        label: 'value'
                    }
                }],
                ['http://USER:PW@www.ExAmPlE.com/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://USER:PW@www.ExAmPlE.com/',
                        label: 'value'
                    }
                }],
                ['mailto:local1@domain1?query1', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'mailto:local1@domain1?query1',
                        label: 'value'
                    }
                }],
                ['http://example/a/b?c/../d', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://example/a/b?c/../d',
                        label: 'value'
                    }
                }],
                ['http://example/x%2Fabc', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://example/x%2Fabc',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/d;p=1/g;x=1/y', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/d;p=1/g;x=1/y',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/g#s/../x', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/g#s/../x',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/.foo', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/.foo',
                        label: 'value'
                    }
                }],
                ['http://example.com/b//c//d;p?q#blarg', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://example.com/b//c//d;p?q#blarg',
                        label: 'value'
                    }
                }],
                ['g:h', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'g:h',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/g', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/g',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/g/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/g/',
                        label: 'value'
                    }
                }],
                ['http://a/g', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/g',
                        label: 'value'
                    }
                }],
                ['http://g', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://g',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/d;p?y', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/d;p?y',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/g?y', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/g?y',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/d;p?q#s', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/d;p?q#s',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/g#s', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/g#s',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/g?y#s', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/g?y#s',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/;x', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/;x',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/g;x', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/g;x',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/g;x?y#s', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/g;x?y#s',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/d;p?q', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/d;p?q',
                        label: 'value'
                    }
                }],
                ['http://a/b/c/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/c/',
                        label: 'value'
                    }
                }],
                ['http://a/b/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/',
                        label: 'value'
                    }
                }],
                ['http://a/b/g', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/b/g',
                        label: 'value'
                    }
                }],
                ['http://a/', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/',
                        label: 'value'
                    }
                }],
                ['http://a/g', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/g',
                        label: 'value'
                    }
                }],
                ['http://a/g', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a/g',
                        label: 'value'
                    }
                }],
                ['file:/asda', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'file:/asda',
                        label: 'value'
                    }
                }],
                ['qwerty', true],
                ['invalid uri', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'invalid uri',
                        label: 'value'
                    }
                }],
                ['1http://google.com', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: '1http://google.com',
                        label: 'value'
                    }
                }],
                ['http://testdomain`,.<>/?\'";{}][++\\|~!@#$%^&*().org', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://testdomain`,.<>/?\'";{}][++\\|~!@#$%^&*().org',
                        label: 'value'
                    }
                }],
                ['', false, {
                    message: '"value" is not allowed to be empty',
                    path: [],
                    type: 'string.empty',
                    context: { value: '', label: 'value' }
                }],
                ['(╯°□°)╯︵ ┻━┻', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: '(╯°□°)╯︵ ┻━┻',
                        label: 'value'
                    }
                }],
                ['one/two/three?value=abc&value2=123#david-rules', true],
                ['//username:password@test.example.com/one/two/three?value=abc&value2=123#david-rules', true],
                ['http://a\r" \t\n<\'b:b@c\r\nd/e?f', false, {
                    message: '"value" must be a valid relative uri',
                    path: [],
                    type: 'string.uriRelativeOnly',
                    context: {
                        value: 'http://a\r" \t\n<\'b:b@c\r\nd/e?f',
                        label: 'value'
                    }
                }],
                ['/absolute', true]
            ]);
        });

        it('validates relative only uri with domain', () => {

            const schema = Joi.string().uri({ relativeOnly: true, domain: { minDomainSegments: 3, tlds: { allow: ['com'] } } });
            Helper.validate(schema, [
                ['foo://example.com:8042/over/there?name=ferret#nose', false, '"value" must be a valid relative uri'],
                ['//test.example.com:8042/over/there?name=ferret#nose', true],
                ['//example.com:8042/over/there?name=ferret#nose', false, '"value" must contain a valid domain name']
            ]);
        });

        it('validates allowed relative uri with domain', () => {

            const schema = Joi.string().uri({ allowRelative: true, domain: { minDomainSegments: 3, tlds: { allow: ['com'] } } });
            Helper.validate(schema, [
                ['//test.example.com:8042/over/there?name=ferret#nose', true],
                ['//example.com:8042/over/there?name=ferret#nose', false, '"value" must contain a valid domain name'],
                ['relative', true]
            ]);
        });

        it('validates uri with square brackets allowed', () => {

            const schema = Joi.string().uri({ allowQuerySquareBrackets: true });

            Helper.validate(schema, [
                ['https://example.com?abc[]=123&abc[]=456', true]
            ]);
        });

        it('errors on unknown options', () => {

            expect(() => Joi.string().uri({ foo: 'bar', baz: 'qux' })).to.throw('Options contain unknown keys: foo,baz');
        });
    });

    describe('valid()', () => {

        it('validates case sensitive values', () => {

            Helper.validate(Joi.string().valid('a', 'b'), [
                ['a', true],
                ['b', true],
                ['A', false, {
                    message: '"value" must be one of [a, b]',
                    path: [],
                    type: 'any.only',
                    context: { value: 'A', valids: ['a', 'b'], label: 'value' }
                }],
                ['B', false, {
                    message: '"value" must be one of [a, b]',
                    path: [],
                    type: 'any.only',
                    context: { value: 'B', valids: ['a', 'b'], label: 'value' }
                }]
            ]);
        });

        it('validates case insensitive values', () => {

            Helper.validate(Joi.string().valid('a', 'b').insensitive(), [
                ['a', true],
                ['b', true],
                ['A', true, 'a'],
                ['B', true, 'b'],
                [4, false, {
                    message: '"value" must be one of [a, b]',
                    path: [],
                    type: 'any.only',
                    context: { value: 4, valids: ['a', 'b'], label: 'value' }
                }]
            ]);
        });

        it('validates case insensitive values with non-strings', () => {

            const valids = ['a', 'b', 5, Buffer.from('c')];
            Helper.validate(Joi.string().valid(...valids).insensitive(), [
                ['a', true],
                ['b', true],
                ['A', true, 'a'],
                ['B', true, 'b'],
                [4, false, {
                    message: '"value" must be one of [a, b, 5, c]',
                    path: [],
                    type: 'any.only',
                    context: { value: 4, valids, label: 'value' }
                }],
                [5, true],
                [Buffer.from('c'), true]
            ]);
        });
    });
});
