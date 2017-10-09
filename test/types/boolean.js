'use strict';

// Load modules

const Lab = require('lab');
const Joi = require('../..');
const Helper = require('../helper');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Lab.expect;


describe('boolean', () => {

    it('can be called on its own', (done) => {

        const boolean = Joi.boolean;
        expect(() => boolean()).to.throw('Must be invoked on a Joi instance.');
        done();
    });

    it('should throw an exception if arguments were passed.', (done) => {

        expect(
            () => Joi.boolean('invalid argument.')
        ).to.throw('Joi.boolean() does not allow arguments.');

        done();
    });

    it('converts boolean string to a boolean', (done) => {

        Helper.validate(Joi.boolean(), [
            ['true', true, null, true],
            ['false', true, null, false],
            ['TrUe', true, null, true],
            ['FalSe', true, null, false]
        ], done);
    });

    it('does not convert boolean string to a boolean in strict mode', (done) => {

        Helper.validate(Joi.boolean().strict(), [
            ['true', false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined }
                }]
            }],
            ['false', false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined }
                }]
            }],
            ['TrUe', false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined }
                }]
            }],
            ['FalSe', false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined }
                }]
            }]
        ], done);
    });

    it('errors on a number', (done) => {

        Helper.validate(Joi.boolean(), [
            [1, false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined }
                }]
            }],
            [0, false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined }
                }]
            }],
            [2, false, null, {
                message: '"value" must be a boolean',
                details: [{
                    message: '"value" must be a boolean',
                    path: [],
                    type: 'boolean.base',
                    context: { label: 'value', key: undefined }
                }]
            }]
        ], done);
    });

    describe('insensitive()', () => {

        it('should default to case insensitive', (done) => {

            const schema = Joi.boolean().truthy('Y');
            expect(schema.validate('y').error).not.to.exist();
            done();
        });

        it('should stick to case insensitive if called', (done) => {

            const schema = Joi.boolean().truthy('Y').insensitive();
            expect(schema.validate('y').error).not.to.exist();
            done();
        });

        it('should be able to do strict comparison', (done) => {

            const schema = Joi.boolean().truthy('Y').insensitive(false);
            const error = schema.validate('y').error;
            expect(error).to.be.an.error('"value" must be a boolean');
            expect(error.details).to.equal([{
                message: '"value" must be a boolean',
                path: [],
                type: 'boolean.base',
                context: { label: 'value', key: undefined }
            }]);
            done();
        });

        it('should return the same instance if nothing changed', (done) => {

            const insensitiveSchema = Joi.boolean();
            expect(insensitiveSchema.insensitive()).to.shallow.equal(insensitiveSchema);
            expect(insensitiveSchema.insensitive(false)).to.not.shallow.equal(insensitiveSchema);

            const sensitiveSchema = Joi.boolean().insensitive(false);
            expect(sensitiveSchema.insensitive(false)).to.shallow.equal(sensitiveSchema);
            expect(sensitiveSchema.insensitive()).to.not.shallow.equal(sensitiveSchema);

            done();
        });

        it('converts boolean string to a boolean with a sensitive case', (done) => {

            Helper.validate(Joi.boolean().insensitive(false), [
                ['true', true, null, true],
                ['false', true, null, false],
                ['TrUe', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                ['FalSe', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

    });

    describe('validate()', () => {

        it('does not convert string values and validates', (done) => {

            const rule = Joi.boolean();
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
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
                        context: { label: 'value', key: undefined }
                    }]
                }],
                ['on', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                ['off', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                ['yes', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                ['no', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                ['1', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                ['0', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('should handle work with required', (done) => {

            const rule = Joi.boolean().required();
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
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
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('should handle work with allow', (done) => {

            const rule = Joi.boolean().allow(false);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [false, true],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('should handle work with invalid', (done) => {

            const rule = Joi.boolean().invalid(false);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [false, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [true, true],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('should handle work with invalid and null allowed', (done) => {

            const rule = Joi.boolean().invalid(false).allow(null);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [false, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [true, true],
                [null, true]
            ], done);
        });

        it('should handle work with allow and invalid', (done) => {

            const rule = Joi.boolean().invalid(true).allow(false);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [false, true],
                [true, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('should handle work with allow, invalid, and null allowed', (done) => {

            const rule = Joi.boolean().invalid(true).allow(false).allow(null);
            Helper.validate(rule, [
                ['1234', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [false, true],
                [true, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [null, true]
            ], done);
        });

        it('should handle work with additional truthy value', (done) => {

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
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('should handle work with additional truthy array', (done) => {

            const rule = Joi.boolean().truthy(['Y', 'Si']);
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
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('should handle work with additional falsy value', (done) => {

            const rule = Joi.boolean().falsy('N');
            Helper.validate(rule, [
                ['N', true],
                ['Y', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
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
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('should handle work with additional falsy array', (done) => {

            const rule = Joi.boolean().falsy(['N', 'Never']);
            Helper.validate(rule, [
                ['N', true],
                ['Never', true],
                ['Y', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [true, true],
                [false, true]
            ], done);
        });

        it('should handle work with required, null allowed, and both additional truthy and falsy values', (done) => {

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
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                ['Yes', false, null, {
                    message: '"value" must be a boolean',
                    details: [{
                        message: '"value" must be a boolean',
                        path: [],
                        type: 'boolean.base',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        it('should handle concatenated schema', (done) => {

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
                        context: { label: 'value', key: undefined }
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
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ]);

            Helper.validate(a.concat(b), [
                ['yes', true],
                ['no', true]
            ], done);
        });

        it('should describe truthy and falsy values', (done) => {

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
            done();
        });
    });
});
