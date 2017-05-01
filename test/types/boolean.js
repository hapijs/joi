'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Joi = require('../..');
const Helper = require('../helper');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('boolean', () => {

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
            ['true', false, null, '"value" must be a boolean'],
            ['false', false, null, '"value" must be a boolean'],
            ['TrUe', false, null, '"value" must be a boolean'],
            ['FalSe', false, null, '"value" must be a boolean']
        ], done);
    });

    it('errors on a number', (done) => {

        Helper.validate(Joi.boolean(), [
            [1, false, null, '"value" must be a boolean'],
            [0, false, null, '"value" must be a boolean'],
            [2, false, null, '"value" must be a boolean']
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
            expect(schema.validate('y').error).to.be.an.error('"value" must be a boolean');
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
                ['TrUe', false, null, '"value" must be a boolean'],
                ['FalSe', false, null, '"value" must be a boolean']
            ], done);
        });

    });

    describe('validate()', () => {

        it('does not convert string values and validates', (done) => {

            const rule = Joi.boolean();
            Helper.validate(rule, [
                ['1234', false, null, '"value" must be a boolean'],
                [false, true],
                [true, true],
                [null, false, null, '"value" must be a boolean'],
                ['on', false, null, '"value" must be a boolean'],
                ['off', false, null, '"value" must be a boolean'],
                ['yes', false, null, '"value" must be a boolean'],
                ['no', false, null, '"value" must be a boolean'],
                ['1', false, null, '"value" must be a boolean'],
                ['0', false, null, '"value" must be a boolean']
            ], done);
        });

        it('should handle work with required', (done) => {

            const rule = Joi.boolean().required();
            Helper.validate(rule, [
                ['1234', false, null, '"value" must be a boolean'],
                [false, true],
                [true, true],
                [null, false, null, '"value" must be a boolean']
            ], done);
        });

        it('should handle work with allow', (done) => {

            const rule = Joi.boolean().allow(false);
            Helper.validate(rule, [
                ['1234', false, null, '"value" must be a boolean'],
                [false, true],
                [null, false, null, '"value" must be a boolean']
            ], done);
        });

        it('should handle work with invalid', (done) => {

            const rule = Joi.boolean().invalid(false);
            Helper.validate(rule, [
                ['1234', false, null, '"value" must be a boolean'],
                [false, false, null, '"value" contains an invalid value'],
                [true, true],
                [null, false, null, '"value" must be a boolean']
            ], done);
        });

        it('should handle work with invalid and null allowed', (done) => {

            const rule = Joi.boolean().invalid(false).allow(null);
            Helper.validate(rule, [
                ['1234', false, null, '"value" must be a boolean'],
                [false, false, null, '"value" contains an invalid value'],
                [true, true],
                [null, true]
            ], done);
        });

        it('should handle work with allow and invalid', (done) => {

            const rule = Joi.boolean().invalid(true).allow(false);
            Helper.validate(rule, [
                ['1234', false, null, '"value" must be a boolean'],
                [false, true],
                [true, false, null, '"value" contains an invalid value'],
                [null, false, null, '"value" must be a boolean']
            ], done);
        });

        it('should handle work with allow, invalid, and null allowed', (done) => {

            const rule = Joi.boolean().invalid(true).allow(false).allow(null);
            Helper.validate(rule, [
                ['1234', false, null, '"value" must be a boolean'],
                [false, true],
                [true, false, null, '"value" contains an invalid value'],
                [null, true]
            ], done);
        });

        it('should handle work with additional truthy value', (done) => {

            const rule = Joi.boolean().truthy('Y');
            Helper.validate(rule, [
                ['Y', true],
                [true, true],
                [false, true],
                ['N', false, null, '"value" must be a boolean'],
                [null, false, null, '"value" must be a boolean']
            ], done);
        });

        it('should handle work with additional truthy array', (done) => {

            const rule = Joi.boolean().truthy(['Y', 'Si']);
            Helper.validate(rule, [
                ['Si', true],
                ['Y', true],
                [true, true],
                [false, true],
                ['N', false, null, '"value" must be a boolean'],
                [null, false, null, '"value" must be a boolean']
            ], done);
        });

        it('should handle work with additional falsy value', (done) => {

            const rule = Joi.boolean().falsy('N');
            Helper.validate(rule, [
                ['N', true],
                ['Y', false, null, '"value" must be a boolean'],
                [true, true],
                [false, true],
                [null, false, null, '"value" must be a boolean']
            ], done);
        });

        it('should handle work with additional falsy array', (done) => {

            const rule = Joi.boolean().falsy(['N', 'Never']);
            Helper.validate(rule, [
                ['N', true],
                ['Never', true],
                ['Y', false, null, '"value" must be a boolean'],
                [null, false, null, '"value" must be a boolean'],
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
                ['M', false, null, '"value" must be a boolean'],
                ['Yes', false, null, '"value" must be a boolean']
            ], done);
        });

        it('should handle concatenated schema', (done) => {

            const a = Joi.boolean().truthy('yes');
            const b = Joi.boolean().falsy('no');

            Helper.validate(a, [
                ['yes', true],
                ['no', false, null, '"value" must be a boolean']
            ]);

            Helper.validate(b, [
                ['no', true],
                ['yes', false, null, '"value" must be a boolean']
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
                falsy : [false, 'no']
            });
            done();
        });
    });
});
