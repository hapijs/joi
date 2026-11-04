'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('object', () => {

    it('preserves internal state of built-in values when cloning', () => {

        const schema = Joi.object({ unused: Joi.any() });

        const date = schema.validate(new Date(0)).value;
        expect(date).to.be.instanceof(Date);
        expect(date.getTime()).to.equal(0);

        const map = schema.validate(new Map([['a', 1]])).value;
        expect(map).to.be.instanceof(Map);
        expect(map.get('a')).to.equal(1);

        const set = schema.validate(new Set([1])).value;
        expect(set).to.be.instanceof(Set);
        expect(set.has(1)).to.be.true();

        const regex = schema.validate(/ab/g).value;
        expect(regex).to.be.instanceof(RegExp);
        expect(regex.test('ab')).to.be.true();
        expect(regex.source).to.equal('ab');
        expect(regex.flags).to.equal('g');

        const url = schema.validate(new URL('https://example.com/')).value;
        expect(url).to.be.instanceof(URL);
        expect(url.hostname).to.equal('example.com');

        const buffer = schema.validate(Buffer.from('hi')).value;
        expect(buffer).to.be.instanceof(Buffer);
        expect(buffer.toString()).to.equal('hi');
    });
});
