'use strict';

// Load modules

const Lab = require('lab');
const {
    stringify,
    findOrGenerate,
    Cache
} = require('../lib/cache');


// Declare internals

const internals = {};


// Test shortcuts

const { describe, it, expect } = exports.lab = Lab.script();


describe('Set', () => {

    it('stores and gets values', () => {

        const id1 = 'id1';
        const id2 = 'id2';
        const result1 = 1;
        const result2 = 2;
        const cache = new Cache();
        cache.set(id1, result1);
        cache.set(id2, result2);
        expect(cache.get(id1)).to.equal(1);
        expect(cache.get(id2)).to.equal(2);
    });

    describe('get()', () => {

        it('accesses stored information', () => {

            const cache = new Cache();
            cache.set('a', 1);
            expect(cache.get('a')).to.equal(1);
        });

        it('refuses to access when key type does not match', () => {

            const cache = new Cache({
                type: 'number'
            });
            cache.set(10, 'a');
            expect(cache.get('10')).to.be.undefined();
        });
    });

    describe('set()', () => {

        it('sets values', () => {

            const id1 = 'id1';
            const result1 = 1;
            const cache = new Cache();
            cache.set(id1, result1);
            expect(cache.get(id1)).to.equal(1);
        });

        it('refuses when types do not match', () => {

            const cache = new Cache({
                type: 'number'
            });
            cache.set(1, 'one');
            cache.set('1', 'two');
            expect(cache.get('1')).to.be.undefined();
            expect(cache.get(1)).to.equal('one');
        });
    });

    describe('del()', () => {

        it('removes values', () => {

            const id1 = 'id1';
            const result1 = 1;
            const cache = new Cache();
            cache.set(id1, result1);
            expect(cache.get(id1)).to.equal(1);
            cache.del(id1);
            expect(cache.get(id1)).to.be.undefined();
        });

        it('refuses when types do not match', () => {

            const cache = new Cache({
                type: 'number'
            });
            cache.set(1, 'one');
            cache.set(2, 'two');
            expect(cache.del(1)).to.be.true();
            expect(cache.del('2')).to.be.undefined();
        });
    });

    describe('cache.stringify()', () => {

        it('refuses to stringify values that do not match the known type', () => {

            const cache = new Cache({
                type: 'number'
            });
            expect(cache.stringify(5)).to.equal('5');
            expect(cache.stringify('')).to.be.false();
        });
    });

    describe('stringify()', () => {

        it('stringifies values', () => {

            const num = 1;
            const str = '';
            const nil = null;
            const undef = undefined;
            expect(stringify(num)).to.equal('1');
            expect(stringify(str)).to.equal('""');
            expect(stringify(nil)).to.equal('null');
            expect(stringify(undef)).to.equal('undefined');
        });

        it('even stringifies objects', () => {

            const obj = {
                one: 1,
                two: '2',
                three: [1,2,3],
                deep: {
                    depth: 2
                }
            };
            expect(stringify(obj)).to.equal('{"one":1,"two":"2","three":[1,2,3],"deep":{"depth":2}}');
        });
    });

    describe('findOrGenerate()', () => {

        it('finds caches by a given identifier or creates them', () => {

            const identifier = 'identifying-information';
            const cache1 = findOrGenerate(identifier);
            const cache2 = findOrGenerate(identifier);
            expect(cache1).to.equal(cache2);
        });
    });
});
