'use strict';

// Load modules

const Lab = require('lab');
const Joi = require('../..');
const Helper = require('../helper');


// Declare internals

const internals = {};


// Test shortcuts

const { describe, it, expect } = exports.lab = Lab.script();


describe('boolean', () => {

    it('can be called on its own', () => {

        const boolean = Joi.boolean;
        expect(() => boolean()).to.throw('Must be invoked on a Joi instance.');
    });

    it('should throw an exception if arguments were passed.', () => {

        expect(
            () => Joi.boolean('invalid argument.')
        ).to.throw('Joi.boolean() does not allow arguments.');
    });

    it('converts boolean string to a boolean', () => {

        Helper.validate(Joi.boolean(), [
            ['true', true, null, true],
            ['false', true, null, false],
            ['TrUe', true, null, true],
            ['FalSe', true, null, false]
        ]);
    });

    it('does not convert boolean string to a boolean in strict mode', () => {

        Helper.validate(Joi.boolean().strict(), [
            ['true', false, null, {
                message: '"true" must be a boolean',
                details: [{
                    message: '"true" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined, value: 'true' }
                }]
            }],
            ['false', false, null, {
                message: '"false" must be a boolean',
                details: [{
                    message: '"false" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined, value: 'false' }
                }]
            }],
            ['TrUe', false, null, {
                message: '"TrUe" must be a boolean',
                details: [{
                    message: '"TrUe" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined, value: 'TrUe' }
                }]
            }],
            ['FalSe', false, null, {
                message: '"FalSe" must be a boolean',
                details: [{
                    message: '"FalSe" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined, value: 'FalSe' }
                }]
            }]
        ]);
    });

    it('errors on a number', () => {

        Helper.validate(Joi.boolean(), [
            [1, false, null, {
                message: '"1" must be a boolean',
                details: [{
                    message: '"1" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined, value: 1 }
                }]
            }],
            [0, false, null, {
                message: '"0" must be a boolean',
                details: [{
                    message: '"0" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined, value: 0 }
                }]
            }],
            [2, false, null, {
                message: '"2" must be a boolean',
                details: [{
                    message: '"2" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined, value: 2 }
                }]
            }]
        ]);
    });

    describe('insensitive()', () => {

        it('should default to case insensitive', () => {

            const schema = Joi.boolean().truthy('Y');
            expect(schema.validate('y').error).not.to.exist();
        });

        it('should stick to case insensitive if called', () => {

            const schema = Joi.boolean().truthy('Y').insensitive();
            expect(schema.validate('y').error).not.to.exist();
        });

        it('should be able to do strict comparison', () => {

            const schema = Joi.boolean().truthy('Y').insensitive(false);
            const error = schema.validate('y').error;
            expect(error).to.be.an.error('"y" must be a boolean');
            expect(error.details).to.equal([{
                message: '"y" must be a boolean',
                path: [],
                type: 'boolean.base',
                context: { label: 'value', key: undefined, value: 'y' }
            }]);
        });

        it('should return the same instance if nothing changed', () => {

            const insensitiveSchema = Joi.boolean();
            expect(insensitiveSchema.insensitive()).to.shallow.equal(insensitiveSchema);
            expect(insensitiveSchema.insensitive(false)).to.not.shallow.equal(insensitiveSchema);

            const sensitiveSchema = Joi.boolean().insensitive(false);
            expect(sensitiveSchema.insensitive(false)).to.shallow.equal(sensitiveSchema);
            expect(sensitiveSchema.insensitive()).to.not.shallow.equal(sensitiveSchema);
        });

        it('converts boolean string to a boolean with a sensitive case', () => {

            Helper.validate(Joi.boolean().insensitive(false), [
                ['true', true, null, true],
                ['false', true, null, false],
                ['TrUe', false, null, {
                    message: '"TrUe" must be a boolean',
                    details: [{
                        message: '"TrUe" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'TrUe' }
                    }]
                }],
                ['FalSe', false, null, {
                    message: '"FalSe" must be a boolean',
                    details: [{
                        message: '"FalSe" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'FalSe' }
                    }]
                }]
            ]);
        });

    });

    describe('validate()', () => {

        it('does not convert string values and validates', () => {

            const rule = Joi.boolean();
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"1234" must be a boolean',
                    details: [{
                        message: '"1234" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: '1234' }
                    }]
                }],
                [false, true],
                [true, true],
                [null, false, null, {
                    message: '"null" must be a boolean',
                    details: [{
                        message: '"null" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: null }
                    }]
                }],
                ['on', false, null, {
                    message: '"on" must be a boolean',
                    details: [{
                        message: '"on" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'on' }
                    }]
                }],
                ['off', false, null, {
                    message: '"off" must be a boolean',
                    details: [{
                        message: '"off" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'off' }
                    }]
                }],
                ['yes', false, null, {
                    message: '"yes" must be a boolean',
                    details: [{
                        message: '"yes" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'yes' }
                    }]
                }],
                ['no', false, null, {
                    message: '"no" must be a boolean',
                    details: [{
                        message: '"no" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'no' }
                    }]
                }],
                ['1', false, null, {
                    message: '"1" must be a boolean',
                    details: [{
                        message: '"1" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: '1' }
                    }]
                }],
                ['0', false, null, {
                    message: '"0" must be a boolean',
                    details: [{
                        message: '"0" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: '0' }
                    }]
                }]
            ]);
        });

        it('should handle work with required', () => {

            const rule = Joi.boolean().required();
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"1234" must be a boolean',
                    details: [{
                        message: '"1234" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: '1234' }
                    }]
                }],
                [false, true],
                [true, true],
                [null, false, null, {
                    message: '"null" must be a boolean',
                    details: [{
                        message: '"null" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with allow', () => {

            const rule = Joi.boolean().allow(false);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"1234" must be a boolean',
                    details: [{
                        message: '"1234" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: '1234' }
                    }]
                }],
                [false, true],
                [null, false, null, {
                    message: '"null" must be a boolean',
                    details: [{
                        message: '"null" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with invalid', () => {

            const rule = Joi.boolean().invalid(false);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"1234" must be a boolean',
                    details: [{
                        message: '"1234" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: '1234' }
                    }]
                }],
                [false, false, null, {
                    message: '"false" is an invalid value',
                    details: [{
                        message: '"false" is an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { label: 'value', key: undefined, value: false }
                    }]
                }],
                [true, true],
                [null, false, null, {
                    message: '"null" must be a boolean',
                    details: [{
                        message: '"null" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with invalid and null allowed', () => {

            const rule = Joi.boolean().invalid(false).allow(null);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"1234" must be a boolean',
                    details: [{
                        message: '"1234" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: '1234' }
                    }]
                }],
                [false, false, null, {
                    message: '"false" is an invalid value',
                    details: [{
                        message: '"false" is an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { label: 'value', key: undefined, value: false }
                    }]
                }],
                [true, true],
                [null, true]
            ]);
        });

        it('should handle work with allow and invalid', () => {

            const rule = Joi.boolean().invalid(true).allow(false);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"1234" must be a boolean',
                    details: [{
                        message: '"1234" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: '1234' }
                    }]
                }],
                [false, true],
                [true, false, null, {
                    message: '"true" is an invalid value',
                    details: [{
                        message: '"true" is an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { label: 'value', key: undefined, value: true }
                    }]
                }],
                [null, false, null, {
                    message: '"null" must be a boolean',
                    details: [{
                        message: '"null" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with allow, invalid, and null allowed', () => {

            const rule = Joi.boolean().invalid(true).allow(false).allow(null);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"1234" must be a boolean',
                    details: [{
                        message: '"1234" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: '1234' }
                    }]
                }],
                [false, true],
                [true, false, null, {
                    message: '"true" is an invalid value',
                    details: [{
                        message: '"true" is an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { label: 'value', key: undefined, value: true }
                    }]
                }],
                [null, true]
            ]);
        });

        it('should handle work with additional truthy value', () => {

            const rule = Joi.boolean().truthy('Y');
            Helper.validate(rule, [
                ['Y', true],
                [true, true],
                [false, true],
                ['N', false, null, {
                    message: '"N" must be a boolean',
                    details: [{
                        message: '"N" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'N' }
                    }]
                }],
                [null, false, null, {
                    message: '"null" must be a boolean',
                    details: [{
                        message: '"null" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with additional truthy array', () => {

            const rule = Joi.boolean().truthy(['Y', 'Si']);
            Helper.validate(rule, [
                ['Si', true],
                ['Y', true],
                [true, true],
                [false, true],
                ['N', false, null, {
                    message: '"N" must be a boolean',
                    details: [{
                        message: '"N" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'N' }
                    }]
                }],
                [null, false, null, {
                    message: '"null" must be a boolean',
                    details: [{
                        message: '"null" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with additional falsy value', () => {

            const rule = Joi.boolean().falsy('N');
            Helper.validate(rule, [
                ['N', true],
                ['Y', false, null, {
                    message: '"Y" must be a boolean',
                    details: [{
                        message: '"Y" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'Y' }
                    }]
                }],
                [true, true],
                [false, true],
                [null, false, null, {
                    message: '"null" must be a boolean',
                    details: [{
                        message: '"null" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with additional falsy array', () => {

            const rule = Joi.boolean().falsy(['N', 'Never']);
            Helper.validate(rule, [
                ['N', true],
                ['Never', true],
                ['Y', false, null, {
                    message: '"Y" must be a boolean',
                    details: [{
                        message: '"Y" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'Y' }
                    }]
                }],
                [null, false, null, {
                    message: '"null" must be a boolean',
                    details: [{
                        message: '"null" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: null }
                    }]
                }],
                [true, true],
                [false, true]
            ]);
        });

        it('should handle work with required, null allowed, and both additional truthy and falsy values', () => {

            const rule = Joi.boolean().truthy(['Y', 'Si', 1]).falsy(['N', 'Never', 0]).allow(null).required();
            Helper.validate(rule, [
                ['N', true],
                ['Never', true],
                ['Y', true],
                ['y', true],
                ['Si', true],
                [true, true],
                [false, true],
                [1, true],
                [0, true],
                [null, true],
                ['M', false, null, {
                    message: '"M" must be a boolean',
                    details: [{
                        message: '"M" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'M' }
                    }]
                }],
                ['Yes', false, null, {
                    message: '"Yes" must be a boolean',
                    details: [{
                        message: '"Yes" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'Yes' }
                    }]
                }]
            ]);
        });

        it('should handle concatenated schema', () => {

            const a = Joi.boolean().truthy('yes');
            const b = Joi.boolean().falsy('no');

            Helper.validate(a, [
                ['yes', true],
                ['no', false, null, {
                    message: '"no" must be a boolean',
                    details: [{
                        message: '"no" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'no' }
                    }]
                }]
            ]);

            Helper.validate(b, [
                ['no', true],
                ['yes', false, null, {
                    message: '"yes" must be a boolean',
                    details: [{
                        message: '"yes" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined, value: 'yes' }
                    }]
                }]
            ]);

            Helper.validate(a.concat(b), [
                ['yes', true],
                ['no', true]
            ]);
        });

        it('should describe truthy and falsy values', () => {

            const schema = Joi.boolean().truthy('yes').falsy('no').required().describe();
            expect(schema).to.equal({
                type: 'boolean',
                flags: {
                    presence: 'required',
                    insensitive: true
                },
                truthy: [true, 'yes'],
                falsy: [false, 'no']
            });
        });
    });
});
