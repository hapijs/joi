'use strict';

const Code = require('@hapi/code');
const Joi = require('../..');
const Lab = require('@hapi/lab');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('any', () => {

    describe('custom()', () => {

        it('uses custom validation', () => {

            const error = new Error('nope');
            const method = (value, helpers) => {

                if (value === '1') {
                    throw error;
                }

                if (value === '2') {
                    return '3';
                }

                if (value === '4') {
                    return helpers.error('any.invalid');
                }

                if (value === '5') {
                    return undefined;
                }

                return value;
            };

            const schema = Joi.string().custom(method, 'custom validation');
            Helper.validate(schema, [
                ['x', true, null, 'x'],
                ['2', true, null, '3'],
                ['5', true, null, undefined],
                ['1', false, null, {
                    message: '"value" failed custom validation because nope',
                    details: [{
                        message: '"value" failed custom validation because nope',
                        path: [],
                        type: 'any.custom',
                        context: { label: 'value', value: '1', error }
                    }]
                }],
                ['4', false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { label: 'value', value: '4' }
                    }]
                }]
            ]);
        });

        it('errors on invalid arguments', () => {

            const method = () => null;
            expect(() => Joi.any().custom({})).to.throw('Method must be a function');
            expect(() => Joi.any().custom(method)).to.not.throw();
            expect(() => Joi.any().custom(method, '')).to.throw('Description must be a non-empty string');
            expect(() => Joi.any().custom(method, 0)).to.throw('Description must be a non-empty string');
            expect(() => Joi.any().custom(method, [])).to.throw('Description must be a non-empty string');
        });
    });

    describe('warning()', () => {

        it('errors on invalid code', () => {

            expect(() => Joi.any().warning()).to.throw('Invalid warning code');
            expect(() => Joi.any().warning(123)).to.throw('Invalid warning code');
        });
    });
});
