'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;

describe('isAsync()', () => {

    it('returns false for schemas without async rules', () => {

        expect(Joi.alternatives().isAsync()).to.be.false();
        expect(Joi.array().isAsync()).to.be.false();
        expect(Joi.boolean().isAsync()).to.be.false();
        expect(Joi.date().isAsync()).to.be.false();
        expect(Joi.number().isAsync()).to.be.false();
        expect(Joi.object().isAsync()).to.be.false();
        expect(Joi.string().isAsync()).to.be.false();
    });

    it('returns true for schemas with external rules', () => {

        expect(Joi.string().external(() => {}).isAsync()).to.be.true();
        expect(Joi.number().external(() => {}).isAsync()).to.be.true();
        expect(Joi.boolean().external(() => {}).isAsync()).to.be.true();
        expect(Joi.date().external(() => {}).isAsync()).to.be.true();
        expect(Joi.object().external(() => {}).isAsync()).to.be.true();
        expect(Joi.array().external(() => {}).isAsync()).to.be.true();
        expect(Joi.alternatives().external(() => {}).isAsync()).to.be.true();
    });

    it('returns true for objects with async child schemas', () => {

        expect(Joi.object({ a: Joi.string().external(() => {}) }).isAsync()).to.be.true();
        expect(Joi.object({ a: Joi.string() }).isAsync()).to.be.false();
        expect(Joi.object().pattern(/a/, Joi.string().external(() => {})).isAsync()).to.be.true();
        expect(Joi.object().pattern(/a/, Joi.string()).isAsync()).to.be.false();
        expect(Joi.object().pattern(Joi.string(), { a: Joi.string().external(() => {}) }).isAsync()).to.be.true();
        expect(Joi.object().pattern(Joi.string(), { a: Joi.string() }).isAsync()).to.be.false();
    });

    it('returns true for arrays with async items', () => {

        expect(Joi.array().items(Joi.string().external(() => {})).isAsync()).to.be.true();
        expect(Joi.array().items(Joi.string()).isAsync()).to.be.false();
        expect(Joi.array().ordered(Joi.string().external(() => {})).isAsync()).to.be.true();
        expect(Joi.array().ordered(Joi.string()).isAsync()).to.be.false();
    });

    it('returns true for alternatives with async schemas', () => {

        expect(Joi.alternatives().try(Joi.string().external(() => {})).isAsync()).to.be.true();
        expect(Joi.alternatives().conditional('a', { is: 'b', then: Joi.string().external(() => {}) }).isAsync()).to.be.true();
        expect(Joi.alternatives().conditional('a', { is: 'b', otherwise: Joi.string().external(() => {}) }).isAsync()).to.be.true();
        expect(Joi.alternatives().conditional('a', {
            is: 'b',
            otherwise: Joi.string().external(() => {})
        }).isAsync()).to.be.true();
        expect(Joi.alternatives().conditional('a', {
            is: 'b',
            then: Joi.string(),
            otherwise: Joi.number()
        }).isAsync()).to.be.false();
        expect(Joi.any().when('a', {
            is: 'b',
            then: Joi.string().external(() => {})
        }).isAsync()).to.be.true();
        expect(Joi.any().when('a', {
            is: 'b',
            otherwise: Joi.string().external(() => {})
        }).isAsync()).to.be.true();
        expect(Joi.any().when('a', {
            switch: [
                { is: 'b', then: Joi.string() },
                { is: 'c', then: Joi.number().external(() => {}), otherwise: Joi.string() }
            ]
        }).isAsync()).to.be.true();
        expect(Joi.any().when('a', {
            switch: [
                { is: 'b', then: Joi.string() },
                { is: 'c', then: Joi.string(), otherwise: Joi.number().external(() => {}) }
            ]
        }).isAsync()).to.be.true();
    });

    it('returns false for alternatives without switch', () => {

        expect(Joi.object({
            limit: Joi.any(),
            arr: Joi.array(),
            arr2: Joi.when('arr', {
                is: Joi.array().min(Joi.ref('limit')),
                then: Joi.array()
            })
        }).isAsync()).to.be.false();
    });
});
