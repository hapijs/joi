'use strict';

const Code = require('@hapi/code');
const Joi = require('..');
const Lab = require('@hapi/lab');
const Legacy = require('@hapi/joi-legacy-test');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('cast', () => {

    describe('schema()', () => {

        it('casts templates', () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.x('{a + 1}')
            });

            Helper.validate(schema, [[{ a: 5, b: 6 }, true]]);
        });

        it('compiles null schema', () => {

            Helper.validate(Joi.compile(null), [
                ['a', false, {
                    message: '"value" must be [null]',
                    path: [],
                    type: 'any.only',
                    context: { value: 'a', valids: [null], label: 'value' }
                }],
                [null, true]
            ]);
        });

        it('compiles number literal', () => {

            Helper.validate(Joi.compile(5), [
                [6, false, {
                    message: '"value" must be [5]',
                    path: [],
                    type: 'any.only',
                    context: { value: 6, valids: [5], label: 'value' }
                }],
                [5, true]
            ]);
        });

        it('compiles string literal', () => {

            Helper.validate(Joi.compile('5'), [
                ['6', false, {
                    message: '"value" must be [5]',
                    path: [],
                    type: 'any.only',
                    context: { value: '6', valids: ['5'], label: 'value' }
                }],
                ['5', true]
            ]);
        });

        it('compiles boolean literal', () => {

            Helper.validate(Joi.compile(true), [
                [false, false, {
                    message: '"value" must be [true]',
                    path: [],
                    type: 'any.only',
                    context: { value: false, valids: [true], label: 'value' }
                }],
                [true, true]
            ]);
        });

        it('compiles date literal', () => {

            const now = Date.now();
            const dnow = new Date(now);
            Helper.validate(Joi.compile(dnow), [
                [new Date(now), true],
                [now, true, new Date(now)],
                [now * 2, false, {
                    message: `"value" must be [${dnow.toISOString()}]`,
                    path: [],
                    type: 'any.only',
                    context: { value: new Date(now * 2), valids: [dnow], label: 'value' }
                }]
            ]);
        });

        it('compile [null]', () => {

            const schema = Joi.compile([null]);
            Helper.equal(schema, Joi.valid(Joi.override, null));
        });

        it('compile [1]', () => {

            const schema = Joi.compile([1]);
            Helper.equal(schema, Joi.valid(Joi.override, 1));
        });

        it('compile ["a"]', () => {

            const schema = Joi.compile(['a']);
            Helper.equal(schema, Joi.valid(Joi.override, 'a'));
        });

        it('compile [null, null, null]', () => {

            const schema = Joi.compile([null]);
            Helper.equal(schema, Joi.valid(Joi.override, null));
        });

        it('compile [1, 2, 3]', () => {

            const schema = Joi.compile([1, 2, 3]);
            Helper.equal(schema, Joi.valid(Joi.override, 1, 2, 3));
        });

        it('compile ["a", "b", "c"]', () => {

            const schema = Joi.compile(['a', 'b', 'c']);
            Helper.equal(schema, Joi.valid(Joi.override, 'a', 'b', 'c'));
        });

        it('compile [null, "a", 1, true]', () => {

            const schema = Joi.compile([null, 'a', 1, true]);
            Helper.equal(schema, Joi.valid(Joi.override, null, 'a', 1, true));
        });
    });

    describe('compile()', () => {

        it('compiles object with plain keys', () => {

            const schema = {
                a: 1
            };

            expect(Joi.isSchema(schema)).to.be.false();

            const compiled = Joi.compile(schema);
            expect(Joi.isSchema(compiled)).to.be.true();
        });

        it('compiles object with schema keys', () => {

            const schema = {
                a: Joi.number()
            };

            expect(Joi.isSchema(schema)).to.be.false();

            const compiled = Joi.compile(schema);
            expect(Joi.isSchema(compiled)).to.be.true();
        });

        it('errors on legacy schema', () => {

            const schema = Legacy.number();
            expect(() => Joi.compile(schema)).to.throw(`Cannot mix different versions of joi schemas: ${require('@hapi/joi-legacy-test/package.json').version} ${require('../package.json').version}`);
            expect(() => Joi.compile(schema, { legacy: true })).to.not.throw();
        });

        it('errors on legacy keys', () => {

            const schema = {
                a: Legacy.number()
            };

            expect(() => Joi.compile(schema)).to.throw('Cannot mix different versions of joi schemas (a)');
        });

        describe('legacy', () => {

            it('compiles object with plain keys', () => {

                const schema = {
                    a: 1,
                    b: [2, 3]
                };

                expect(Joi.isSchema(schema)).to.be.false();

                const compiled = Joi.compile(schema, { legacy: true });
                expect(Joi.isSchema(compiled)).to.be.true();
            });

            it('compiles object with schema keys (v16)', () => {

                const schema = {
                    a: Joi.number()
                };

                expect(Joi.isSchema(schema)).to.be.false();

                const compiled = Joi.compile(schema, { legacy: true });
                expect(Joi.isSchema(compiled)).to.be.true();
            });

            it('compiles object with schema array items (v16)', () => {

                const schema = {
                    a: [Joi.number()]
                };

                expect(Joi.isSchema(schema)).to.be.false();

                const compiled = Joi.compile(schema, { legacy: true });
                expect(Joi.isSchema(compiled)).to.be.true();
            });

            it('compiles object with schema keys (v15)', () => {

                const schema = {
                    a: Legacy.number()
                };

                expect(Joi.isSchema(schema)).to.be.false();

                const compiled = Joi.compile(schema, { legacy: true });
                expect(Joi.isSchema(compiled, { legacy: true })).to.be.true();
                expect(() => Joi.isSchema(compiled)).to.throw('Cannot mix different versions of joi schemas');
            });

            it('compiles object with schema keys (v15)', () => {

                const schema = {
                    a: [Legacy.number()]
                };

                expect(Joi.isSchema(schema)).to.be.false();

                const compiled = Joi.compile(schema, { legacy: true });
                expect(Joi.isSchema(compiled, { legacy: true })).to.be.true();
                expect(() => Joi.isSchema(compiled)).to.throw('Cannot mix different versions of joi schemas');
            });
        });
    });
});
