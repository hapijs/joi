'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Joi = require('../lib');
const Helper = require('./helper');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('boolean', () => {

    it('does not convert a string to a boolean', (done) => {

        Joi.boolean().validate('true', (err, value) => {

            expect(err).to.exist();
            expect(value).to.not.equal(true);
            done();
        });
    });

    it('errors on a number', (done) => {

        Helper.validate(Joi.boolean(), [
            [1, false, null, '"value" must be a boolean'],
            [0, false, null, '"value" must be a boolean'],
            [2, false, null, '"value" must be a boolean']
        ], done);
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
                ['true', false, null, '"value" must be a boolean'],
                ['false', false, null, '"value" must be a boolean'],
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
                ['true', false, null, '"value" must be a boolean'],
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
                ['Si', true],
                [true, true],
                [false, true],
                [1, true],
                [0, true],
                [null, true],
                ['M', false, null, '"value" must be a boolean'],
                ['Yes', false, null, '"value" must be a boolean'],
                ['y', false, null, '"value" must be a boolean']
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
                    presence: 'required'
                },
                truthyValues: ['yes'],
                falsyValues : ['no']
            });
            done();
        });
    });
});
