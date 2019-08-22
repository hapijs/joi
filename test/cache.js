'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Cache', () => {

    describe('schema', () => {

        it('caches values', () => {

            const schema = Joi.string().pattern(/abc/).cache();

            const validate = schema._definition.rules.pattern.validate;
            let count = 0;
            schema._definition.rules.pattern.validate = function (...args) {

                ++count;
                return validate(...args);
            };

            expect(schema.validate('xabcd').error).to.not.exist();
            expect(schema.validate('xabcd').error).to.not.exist();
            expect(schema.validate('xabcd').error).to.not.exist();

            expect(count).to.equal(1);

            schema._definition.rules.pattern.validate = validate;
        });

        it('caches values (object key)', () => {

            const a = Joi.string().pattern(/abc/).cache();
            const schema = Joi.object({ a });

            const validate = a._definition.rules.pattern.validate;
            let count = 0;
            a._definition.rules.pattern.validate = function (...args) {

                ++count;
                return validate(...args);
            };

            expect(schema.validate({ a: 'xabcd' }).error).to.not.exist();
            expect(schema.validate({ a: 'xabcd' }).error).to.not.exist();
            expect(schema.validate({ a: 'xabcd' }).error).to.not.exist();

            expect(count).to.equal(1);

            a._definition.rules.pattern.validate = validate;
        });

        it('caches errors', () => {

            const schema = Joi.string().pattern(/abc/).cache();

            const validate = schema._definition.rules.pattern.validate;
            let count = 0;
            schema._definition.rules.pattern.validate = function (...args) {

                ++count;
                return validate(...args);
            };

            const err = schema.validate('xbcd').error;
            expect(schema.validate('xbcd').error).to.equal(err);
            expect(schema.validate('xbcd').error).to.equal(err);
            expect(schema.validate('xbcd').error).to.equal(err);

            expect(count).to.equal(1);

            schema._definition.rules.pattern.validate = validate;
        });

        it('skips caching when prefs disabled', () => {

            const cache = Joi.cache.provision();
            const schema = Joi.string().pattern(/abc/).cache(cache);

            const validate = schema._definition.rules.pattern.validate;
            let count = 0;
            schema._definition.rules.pattern.validate = function (...args) {

                ++count;
                return validate(...args);
            };

            expect(schema.validate('xabcd', { cache: false }).error).to.not.exist();
            expect(schema.validate('xabcd', { cache: false }).error).to.not.exist();
            expect(schema.validate('xabcd', { cache: false }).error).to.not.exist();

            expect(count).to.equal(3);

            schema._definition.rules.pattern.validate = validate;
        });

        it('skips caching when schema contains refs', () => {

            const a = Joi.string().allow(Joi.ref('b')).pattern(/abc/).cache();
            const schema = Joi.object({
                a,
                b: Joi.any()
            });

            const validate = a._definition.rules.pattern.validate;
            let count = 0;
            a._definition.rules.pattern.validate = function (...args) {

                ++count;
                return validate(...args);
            };

            expect(schema.validate({ a: 'xabcd' }).error).to.not.exist();
            expect(schema.validate({ a: 'xabcd' }).error).to.not.exist();
            expect(schema.validate({ a: 'xabcd' }).error).to.not.exist();

            expect(count).to.equal(3);

            a._definition.rules.pattern.validate = validate;
        });
    });

    describe('provider', () => {

        describe('provision()', () => {

            it('generates cache', () => {

                const cache = Joi.cache.provision({ max: 5 });

                cache.set(1, 'x');
                expect(cache.get(1)).to.equal('x');

                cache.set(2, 'y');
                expect(cache.get(2)).to.equal('y');

                cache.set(3, 'z');
                expect(cache.get(3)).to.equal('z');

                cache.set('a', 'b');
                expect(cache.get('a')).to.equal('b');

                cache.set('b', 'c');
                expect(cache.get('b')).to.equal('c');

                cache.set({}, 'ignore');
                expect(cache.get({})).to.not.exist();

                cache.set(1, 'v');
                expect(cache.get(1)).to.equal('v');

                cache.set(null, 'x');
                expect(cache.get(null)).to.equal('x');

                expect(cache).to.have.length(5);

                expect(cache.get(2)).to.not.exist();
                expect(cache.get(1)).to.equal('v');
            });
        });

        describe('Joi.cache', () => {

            it('generates cache with default max', () => {

                const cache = Joi.cache.provision();
                for (let i = 0; i < 1020; ++i) {
                    cache.set(i, i + 10);
                    expect(cache.get(i)).to.equal(i + 10);
                }

                expect(cache).to.have.length(1000);
            });

            it('errors on invalid max option', () => {

                expect(() => Joi.cache.provision({ max: null })).to.throw('Invalid max cache size');
                expect(() => Joi.cache.provision({ max: Infinity })).to.throw('Invalid max cache size');
                expect(() => Joi.cache.provision({ max: -1 })).to.throw('Invalid max cache size');
                expect(() => Joi.cache.provision({ max: 0 })).to.throw('Invalid max cache size');
            });
        });
    });
});
