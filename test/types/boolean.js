'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('boolean', () => {

    it('can be called on its own', () => {

        const boolean = Joi.boolean;
        expect(() => boolean()).to.throw('Must be invoked on a Joi instance.');
    });

    it('should throw an exception if arguments were passed.', () => {

        expect(() => Joi.boolean('invalid argument.')).to.throw('The boolean type does not allow arguments');
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
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', value: 'true' }
                }]
            }],
            ['false', false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', value: 'false' }
                }]
            }],
            ['TrUe', false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', value: 'TrUe' }
                }]
            }],
            ['FalSe', false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', value: 'FalSe' }
                }]
            }]
        ]);
    });

    it('errors on a number', () => {

        Helper.validate(Joi.boolean(), [
            [1, false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', value: 1 }
                }]
            }],
            [0, false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', value: 0 }
                }]
            }],
            [2, false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', value: 2 }
                }]
            }]
        ]);
    });

    it('errors on truthy without convert', () => {

        const schema = Joi.boolean().truthy('y');
        expect(schema.validate('y', { convert: false }).error).be.an.error('"value" must be a boolean');
    });

    it('errors on falsy without convert', () => {

        const schema = Joi.boolean().falsy('n');
        expect(schema.validate('n', { convert: false }).error).be.an.error('"value" must be a boolean');
    });

    describe('cast()', () => {

        it('casts value to number', () => {

            const schema = Joi.boolean().cast('number');
            expect(schema.validate(true).value).to.equal(1);
            expect(schema.validate(false).value).to.equal(0);
        });

        it('casts value to string', () => {

            const schema = Joi.boolean().cast('string');
            expect(schema.validate(true).value).to.equal('true');
            expect(schema.validate(false).value).to.equal('false');
        });

        it('ignores null', () => {

            const schema = Joi.boolean().allow(null).cast('string');
            expect(schema.validate(null).value).to.be.null();
        });

        it('ignores string', () => {

            const schema = Joi.boolean().allow('x').cast('string');
            expect(schema.validate('x').value).to.equal('x');
        });
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
            expect(error).to.be.an.error('"value" must be a boolean');
            expect(error.details).to.equal([{
                message: '"value" must be a boolean',
                path: [],
                type: 'boolean.base',
                context: { label: 'value', value: 'y' }
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
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'TrUe' }
                    }]
                }],
                ['FalSe', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'FalSe' }
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
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: '1234' }
                    }]
                }],
                [false, true],
                [true, true],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: null }
                    }]
                }],
                ['on', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'on' }
                    }]
                }],
                ['off', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'off' }
                    }]
                }],
                ['yes', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'yes' }
                    }]
                }],
                ['no', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'no' }
                    }]
                }],
                ['1', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: '1' }
                    }]
                }],
                ['0', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: '0' }
                    }]
                }]
            ]);
        });

        it('should handle work with required', () => {

            const rule = Joi.boolean().required();
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: '1234' }
                    }]
                }],
                [false, true],
                [true, true],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with allow', () => {

            const rule = Joi.boolean().allow(false);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: '1234' }
                    }]
                }],
                [false, true],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with invalid', () => {

            const rule = Joi.boolean().invalid(false);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: '1234' }
                    }]
                }],
                [false, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: false, invalids: [false], label: 'value' }
                    }]
                }],
                [true, true],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with invalid and null allowed', () => {

            const rule = Joi.boolean().invalid(false).allow(null);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: '1234' }
                    }]
                }],
                [false, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: false, invalids: [false], label: 'value' }
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
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: '1234' }
                    }]
                }],
                [false, true],
                [true, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: true, invalids: [true], label: 'value' }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with allow, invalid, and null allowed', () => {

            const rule = Joi.boolean().invalid(true).allow(false).allow(null);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: '1234' }
                    }]
                }],
                [false, true],
                [true, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: true, invalids: [true], label: 'value' }
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
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'N' }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with additional truthy array', () => {

            const rule = Joi.boolean().truthy('Y', 'Si');
            Helper.validate(rule, [
                ['Si', true],
                ['Y', true],
                [true, true],
                [false, true],
                ['N', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'N' }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with additional falsy value', () => {

            const rule = Joi.boolean().falsy('N');
            Helper.validate(rule, [
                ['N', true],
                ['Y', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'Y' }
                    }]
                }],
                [true, true],
                [false, true],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('should handle work with additional falsy array', () => {

            const rule = Joi.boolean().falsy('N', 'Never');
            Helper.validate(rule, [
                ['N', true],
                ['Never', true],
                ['Y', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'Y' }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: null }
                    }]
                }],
                [true, true],
                [false, true]
            ]);
        });

        it('should handle work with required, null allowed, and both additional truthy and falsy values', () => {

            const rule = Joi.boolean().truthy('Y', 'Si', 1).falsy('N', 'Never', 0).allow(null).required();
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
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'M' }
                    }]
                }],
                ['Yes', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'Yes' }
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
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'no' }
                    }]
                }]
            ]);

            Helper.validate(b, [
                ['no', true],
                ['yes', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', value: 'yes' }
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
