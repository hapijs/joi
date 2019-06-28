'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Modify', () => {

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

    describe('modify()', () => {

        it('adjusts nested schema', () => {

            const before = Joi.object({
                a: Joi.number(),
                b: Joi.object({
                    c: Joi.object({
                        d: Joi.number()
                    })
                })
            });

            const after = Joi.object({
                a: Joi.number(),
                b: Joi.object({
                    c: Joi.object({
                        d: Joi.number().min(10)
                    })
                })
            });

            expect(before.modify('b.c.d', (schema) => schema.min(10))).to.equal(after);
            expect(before.modify([['b', 'c', 'd']], (schema) => schema.min(10))).to.equal(after);
        });

        it('adjusts nested schema with ids', () => {

            const before = Joi.object({
                a: Joi.number().id('A'),
                b: Joi.object({
                    c: Joi.object({
                        d: Joi.number().id('D')
                    })
                })
            });

            const after = Joi.object({
                a: Joi.number().id('A'),
                b: Joi.object({
                    c: Joi.object({
                        d: Joi.number().id('D').min(10)
                    })
                })
            });

            expect(before.modify('b.c.D', (schema) => schema.min(10))).to.equal(after);
            expect(before.modify([['b', 'c', 'D']], (schema) => schema.min(10))).to.equal(after);
        });

        it('sets keys as required', () => {

            const orig = Joi.object({ a: 0, b: 0, c: { d: 0, e: { f: 0 } }, g: { h: 0 } });
            const schema = orig.modify(['a', 'b', 'c.d', 'c.e.f', 'g'], (x) => x.required());

            Helper.validate(orig, [
                [{}, true]
            ]);

            Helper.validate(schema, [
                [{}, false, null, {
                    message: '"a" is required',
                    details: [{
                        message: '"a" is required',
                        path: ['a'],
                        type: 'any.required',
                        context: { label: 'a', key: 'a' }
                    }]
                }],
                [{ a: 0 }, false, null, {
                    message: '"b" is required',
                    details: [{
                        message: '"b" is required',
                        path: ['b'],
                        type: 'any.required',
                        context: { label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 0, b: 0 }, false, null, {
                    message: '"g" is required',
                    details: [{
                        message: '"g" is required',
                        path: ['g'],
                        type: 'any.required',
                        context: { label: 'g', key: 'g' }
                    }]
                }],
                [{ a: 0, b: 0, g: {} }, true],
                [{ a: 0, b: 0, c: {}, g: {} }, false, null, {
                    message: '"c.d" is required',
                    details: [{
                        message: '"c.d" is required',
                        path: ['c', 'd'],
                        type: 'any.required',
                        context: { label: 'c.d', key: 'd' }
                    }]
                }],
                [{ a: 0, b: 0, c: { d: 0 }, g: {} }, true],
                [{ a: 0, b: 0, c: { d: 0, e: {} }, g: {} }, false, null, {
                    message: '"c.e.f" is required',
                    details: [{
                        message: '"c.e.f" is required',
                        path: ['c', 'e', 'f'],
                        type: 'any.required',
                        context: { label: 'c.e.f', key: 'f' }
                    }]
                }],
                [{ a: 0, b: 0, c: { d: 0, e: { f: 0 } }, g: {} }, true]
            ]);
        });

        it('sets keys as optional', () => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number().required()
            }).
                modify(['a', 'b'], (x) => x.optional());

            Helper.validate(schema, [
                [{}, true],
                [{ a: 0 }, true],
                [{ a: 0, b: 0 }, true]
            ]);
        });

        it('sets keys as forbidden', () => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number().required()
            }).
                modify(['a', 'b'], (x) => x.forbidden());

            Helper.validate(schema, [
                [{}, true],
                [{ a: undefined }, true],
                [{ a: undefined, b: undefined }, true],
                [{ a: 0 }, false, null, {
                    message: '"a" is not allowed',
                    details: [{
                        message: '"a" is not allowed',
                        path: ['a'],
                        type: 'any.unknown',
                        context: { label: 'a', key: 'a', value: 0 }
                    }]
                }],
                [{ b: 0 }, false, null, {
                    message: '"b" is not allowed',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'any.unknown',
                        context: { label: 'b', key: 'b', value: 0 }
                    }]
                }]
            ]);
        });
    });
});
