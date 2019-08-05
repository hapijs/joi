'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('any', () => {

    describe('warning()', () => {

        it('errors on invalid code', () => {

            expect(() => Joi.any().warning()).to.throw('Invalid warning code');
            expect(() => Joi.any().warning(123)).to.throw('Invalid warning code');
        });
    });
});
