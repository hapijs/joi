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

    it('converts a string to a boolean', (done) => {

        Joi.boolean().validate('true', (err, value) => {

            expect(err).to.not.exist();
            expect(value).to.equal(true);
            done();
        });
    });

    it('errors on a number not 0 or 1', (done) => {

        Joi.boolean().validate(2, (err, value) => {

            expect(err).to.exist();
            expect(value).to.equal(2);
            done();
        });
    });

    describe('validate()', () => {

        it('converts string values and validates', (done) => {

            const rule = Joi.boolean();
            Helper.validate(rule, [
                ['1234', false, null, '"value" must be a boolean'],
                [false, true],
                [true, true],
                [null, false, null, '"value" must be a boolean'],
                ['on', true],
                ['off', true],
                ['true', true],
                ['false', true],
                ['yes', true],
                ['no', true],
                ['1', true],
                ['0', true]
            ], done);
        });

        it('converts number values and validates', (done) => {

            const rule = Joi.boolean();
            Helper.validate(rule, [
                [1234, false, null, '"value" must be a boolean'],
                [1, true],
                [0, true]
            ], done);
        });

        it('converts 1 to true', (done) => {

            Joi.boolean().validate(1, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(true);
                done();
            });
        });

        it('converts 0 to false', (done) => {

            Joi.boolean().validate(0, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(false);
                done();
            });
        });

        it('should handle work with required', (done) => {

            const rule = Joi.boolean().required();
            Helper.validate(rule, [
                ['1234', false, null, '"value" must be a boolean'],
                ['true', true],
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
    });
});
