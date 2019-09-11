'use strict';

const Code = require('@hapi/code');
const Joi = require('..');
const Lab = require('@hapi/lab');

const Helper = require('./helper');
const Values = require('../lib/values');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Values', () => {

    describe('add()', () => {

        it('allows valid values to be set', () => {

            expect(() => {

                const set = new Values();
                set.add(true);
                set.add(1);
                set.add('hello');
                set.add(new Date());
                set.add(Symbol('foo'));
            }).not.to.throw();
        });

        it('ignores refs added multiple times', () => {

            const set = new Values();
            const ref = Joi.ref('x');
            set.add(ref);
            set.add(ref);
            expect(set).to.have.length(1);
        });
    });

    describe('clone()', () => {

        it('returns a new Values', () => {

            const set = new Values();
            set.add(null);
            const otherValids = set.clone();
            otherValids.add('null');
            expect(set.has(null)).to.equal(true);
            expect(otherValids.has(null)).to.equal(true);
            expect(set.has('null')).to.equal(false);
            expect(otherValids.has('null')).to.equal(true);
        });
    });

    describe('concat()', () => {

        it('merges into a new Values', () => {

            const set = new Values();
            const otherValids = set.clone();
            set.add(null);
            otherValids.add('null');
            const thirdSet = otherValids.concat(set);
            expect(set.has(null)).to.equal(true);
            expect(otherValids.has(null)).to.equal(false);
            expect(set.has('null')).to.equal(false);
            expect(otherValids.has('null')).to.equal(true);
            expect(thirdSet.has(null)).to.equal(true);
            expect(thirdSet.has('null')).to.equal(true);
        });

        it('merges keeps refs flag set', () => {

            const set = new Values();
            set.add(Joi.ref('x'));
            set.concat(new Values());
            expect(set._refs.size).to.equal(1);
        });
    });

    describe('get()', () => {

        it('compares empty string to refs when insensitive', () => {

            const schema = Joi.object({
                a: Joi.string().allow(3).default(''),
                b: Joi.string().insensitive().valid(Joi.ref('a'))
            });

            Helper.validate(schema, [
                [{ b: '' }, true, { b: '', a: '' }],
                [{ b: 'x' }, false, '"b" must be [ref:a]'],
                [{ b: 2 }, false, '"b" must be [ref:a]'],
                [{ a: 3, b: 3 }, true]
            ]);
        });
    });

    describe('has()', () => {

        it('compares date to null', () => {

            const set = new Values();
            set.add(null);
            expect(set.has(new Date())).to.be.false();
        });

        it('compares buffer to null', () => {

            const set = new Values();
            set.add(null);
            expect(set.has(Buffer.from(''))).to.be.false();
        });

        it('compares different types of values', () => {

            let set = new Values();
            set.add(1);
            expect(set.has(1)).to.be.true();
            expect(set.has(2)).to.be.false();

            const d = new Date();
            set = new Values();
            set.add(d);
            expect(set.has(new Date(d.getTime()))).to.be.true();
            expect(set.has(new Date(d.getTime() + 1))).to.be.false();

            const str = 'foo';
            set = new Values();
            set.add(str);
            expect(set.has(str)).to.be.true();
            expect(set.has('foobar')).to.be.false();

            const s = Symbol('foo');
            set = new Values();
            set.add(s);
            expect(set.has(s)).to.be.true();
            expect(set.has(Symbol('foo'))).to.be.false();

            const o = {};
            set = new Values();
            set.add(o);
            expect(set.has(o)).to.be.true();
            expect(set.has({})).to.be.true();

            const f = () => { };
            set = new Values();
            set.add(f);
            expect(set.has(f)).to.be.true();
            expect(set.has(() => { })).to.be.false();

            const b = Buffer.from('foo');
            set = new Values();
            set.add(b);
            expect(set.has(b)).to.be.true();
            expect(set.has(Buffer.from('foobar'))).to.be.false();
        });
    });

    describe('values()', () => {

        it('returns array', () => {

            const set = new Values();
            set.add('x');
            set.add('y');
            expect(set.values()).to.equal(['x', 'y']);
        });

        it('strips undefined', () => {

            const set = new Values();
            set.add(undefined);
            set.add('x');
            expect(set.values({ display: true })).to.not.include(undefined).and.to.equal(['x']);
        });

        it('ignores absent display option', () => {

            const set = new Values();
            set.add(undefined);
            set.add('x');
            expect(set.values({})).to.equal([undefined, 'x']);
        });
    });
});
