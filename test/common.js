'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const Common = require('../lib/common');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Common', () => {

    describe('assertOptions', () => {

        it('validates null', () => {

            expect(() => Common.assertOptions()).to.throw('Options must be of type object');
        });
    });
});
