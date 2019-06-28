'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Manipulate', () => {

    describe('extract()', () => {

        it('extracts nested schema', () => {

            const d = Joi.number();
            const c = Joi.object({ d });
            const b = Joi.object({ c });
            const a = Joi.object({ b });

            expect(a.extract('b')).to.shallow.equal(b);
            expect(a.extract('b.c.d')).to.shallow.equal(d);
            expect(a.extract(['b', 'c', 'd'])).to.shallow.equal(d);
        });

        it('extracts nested schema with ids', () => {

            const d = Joi.number().id('D');
            const c = Joi.object({ d }).id('C');
            const b = Joi.object({ c }).id('B');
            const a = Joi.object({ b });

            expect(a.extract('B')).to.shallow.equal(b);
            expect(a.extract('B.C.D')).to.shallow.equal(d);
        });

        it('extracts nested schema from array', () => {

            const d = Joi.number().id('d');
            const c = Joi.object({ d }).id('c');
            const b = Joi.object({ c }).id('b');
            const a = Joi.array().items(b);

            expect(a.extract('b')).to.shallow.equal(b);
            expect(a.extract('b.c.d')).to.shallow.equal(d);
        });

        it('extracts nested schema from alternatives', () => {

            const d = Joi.number().id('d');
            const c = Joi.object({ d }).id('c');
            const b = Joi.object({ c }).id('b');
            const a = Joi.alternatives(b);

            expect(a.extract('b')).to.shallow.equal(b);
            expect(a.extract('b.c.d')).to.shallow.equal(d);
        });

        it('extracts nested schema after object key override', () => {

            const d = Joi.number();
            const c = Joi.object({ d });
            const b = Joi.object({ c });
            const a = Joi.object({ b });
            const x = a.keys({ b: c });

            expect(x.extract('b')).to.shallow.equal(c);
            expect(x.extract('b.d')).to.shallow.equal(d);
        });

        it('extracts nested schema after object key override and custom ids', () => {

            const d = Joi.number().id('D');
            const c = Joi.object({ d }).id('C');
            const b = Joi.object({ c }).id('B');
            const a = Joi.object({ b }).id('A');
            const x = a.keys({ b: c });

            expect(x.extract('C')).to.shallow.equal(c);
            expect(x.extract('C.D')).to.shallow.equal(d);
        });

        it('extracts nested schema after object concat', () => {

            const d = Joi.number();
            const c = Joi.object({ d });
            const b = Joi.object({ c });
            const a = Joi.object({ b });
            const x = a.concat(b);

            expect(x.extract('b')).to.shallow.equal(b);
            expect(x.extract('c')).to.shallow.equal(c);
        });
    });

    describe('id()', () => {

        it('errors on missing id', () => {

            expect(() => Joi.id()).to.throw('id must be a non-empty string');
        });

        it('errors on invalid id', () => {

            expect(() => Joi.id('a.b')).to.throw('id cannot contain period character');
        });

        it('errors on id override', () => {

            expect(() => Joi.id('b').id('b')).to.throw('Cannot override schema id');
        });
    });

    describe('labels()', () => {

        it('extracts nested schema', () => {

            const d = Joi.number();
            const c = Joi.object({ d });
            const b = Joi.object({ c });
            const a = Joi.object({ b });

            expect(a.mapLabels('b')).to.equal('b');
            expect(a.mapLabels('b.c.d')).to.equal('b.c.d');
            expect(a.mapLabels(['b', 'c', 'd'])).to.equal('b.c.d');
        });

        it('extracts nested schema with ids', () => {

            const d = Joi.number().label('D');
            const c = Joi.object({ d }).label('C');
            const b = Joi.object({ c }).label('B');
            const a = Joi.object({ b });

            expect(a.mapLabels('b')).to.equal('B');
            expect(a.mapLabels('b.c.d')).to.equal('B.C.D');
        });
    });
});
