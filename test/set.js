'use strict';

// Load modules

const Lab = require('lab');
const Set = require('../lib/set');


// Declare internals

const internals = {};


// Test shortcuts

const { describe, it, expect } = exports.lab = Lab.script();


describe('Set', () => {

    describe('has()', () => {

        it('compares date to null', (done) => {

            const set = new Set();
            set.add(null);
            expect(set.has(new Date())).to.be.false();
            done();
        });

        it('compares buffer to null', (done) => {

            const set = new Set();
            set.add(null);
            expect(set.has(new Buffer(''))).to.be.false();
            done();
        });

        it('compares different types of values', (done) => {

            let set = new Set();
            set.add(1);
            expect(set.has(1)).to.be.true();
            expect(set.has(2)).to.be.false();

            const d = new Date();
            set = new Set();
            set.add(d);
            expect(set.has(new Date(d.getTime()))).to.be.true();
            expect(set.has(new Date(d.getTime() + 1))).to.be.false();

            const str = 'foo';
            set = new Set();
            set.add(str);
            expect(set.has(str)).to.be.true();
            expect(set.has('foobar')).to.be.false();

            const s = Symbol('foo');
            set = new Set();
            set.add(s);
            expect(set.has(s)).to.be.true();
            expect(set.has(Symbol('foo'))).to.be.false();

            const o = {};
            set = new Set();
            set.add(o);
            expect(set.has(o)).to.be.true();
            expect(set.has({})).to.be.false();

            const f = () => {};
            set = new Set();
            set.add(f);
            expect(set.has(f)).to.be.true();
            expect(set.has(() => {})).to.be.false();

            const b = new Buffer('foo');
            set = new Set();
            set.add(b);
            expect(set.has(b)).to.be.true();
            expect(set.has(new Buffer('foobar'))).to.be.false();

            done();
        });
    });

    describe('values()', () => {

        it('returns array', (done) => {

            const set = new Set();
            set.add('x');
            set.add('y');
            expect(set.values()).to.equal(['x', 'y']);
            done();
        });

        it('strips undefined', (done) => {

            const set = new Set();
            set.add(undefined);
            set.add('x');
            expect(set.values({ stripUndefined: true })).to.not.include(undefined).and.to.equal(['x']);
            done();
        });
    });

    describe('add()', () => {

        it('allows valid values to be set', (done) => {

            expect(() => {

                const set = new Set();
                set.add(true);
                set.add(1);
                set.add('hello');
                set.add(new Date());
                set.add(Symbol('foo'));
            }).not.to.throw();
            done();
        });

    });

    describe('slice', () => {

        it('returns a new Set', (done) => {

            const set = new Set();
            set.add(null);
            const otherValids = set.slice();
            otherValids.add('null');
            expect(set.has(null)).to.equal(true);
            expect(otherValids.has(null)).to.equal(true);
            expect(set.has('null')).to.equal(false);
            expect(otherValids.has('null')).to.equal(true);
            done();
        });
    });

    describe('concat', () => {

        it('merges _set into a new Set', (done) => {

            const set = new Set();
            const otherValids = set.slice();
            set.add(null);
            otherValids.add('null');
            const thirdSet = otherValids.concat(set);
            expect(set.has(null)).to.equal(true);
            expect(otherValids.has(null)).to.equal(false);
            expect(set.has('null')).to.equal(false);
            expect(otherValids.has('null')).to.equal(true);
            expect(thirdSet.has(null)).to.equal(true);
            expect(thirdSet.has('null')).to.equal(true);
            done();
        });
    });
});
