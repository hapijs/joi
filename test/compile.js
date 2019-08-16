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

            expect(schema.validate({ a: 5, b: 6 }).error).to.not.exist();
        });

        it('compiles null schema', () => {

            Helper.validate(Joi.compile(null), [
                ['a', false, null, {
                    message: '"value" must be one of [null]',
                    details: [{
                        message: '"value" must be one of [null]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'a', valids: [null], label: 'value' }
                    }]
                }],
                [null, true]
            ]);
        });

        it('compiles number literal', () => {

            Helper.validate(Joi.compile(5), [
                [6, false, null, {
                    message: '"value" must be one of [5]',
                    details: [{
                        message: '"value" must be one of [5]',
                        path: [],
                        type: 'any.only',
                        context: { value: 6, valids: [5], label: 'value' }
                    }]
                }],
                [5, true]
            ]);
        });

        it('compiles string literal', () => {

            Helper.validate(Joi.compile('5'), [
                ['6', false, null, {
                    message: '"value" must be one of [5]',
                    details: [{
                        message: '"value" must be one of [5]',
                        path: [],
                        type: 'any.only',
                        context: { value: '6', valids: ['5'], label: 'value' }
                    }]
                }],
                ['5', true]
            ]);
        });

        it('compiles boolean literal', () => {

            Helper.validate(Joi.compile(true), [
                [false, false, null, {
                    message: '"value" must be one of [true]',
                    details: [{
                        message: '"value" must be one of [true]',
                        path: [],
                        type: 'any.only',
                        context: { value: false, valids: [true], label: 'value' }
                    }]
                }],
                [true, true]
            ]);
        });

        it('compiles date literal', () => {

            const now = Date.now();
            const dnow = new Date(now);
            Helper.validate(Joi.compile(dnow), [
                [new Date(now), true],
                [now, true],
                [now * 2, false, null, {
                    message: `"value" must be one of [${dnow.toISOString()}]`,
                    details: [{
                        message: `"value" must be one of [${dnow.toISOString()}]`,
                        path: [],
                        type: 'any.only',
                        context: { value: new Date(now * 2), valids: [dnow], label: 'value' }
                    }]
                }]
            ]);
        });

        it('compiles alternatives', () => {

            const schema = Joi.compile(['key', 5, { a: true, b: [/^a/, 'boom'] }]);
            Helper.validate(schema, [
                ['key', true],
                [5, true],
                ['other', false, null, {
                    message: '"value" does not match any of the allowed types',
                    details: [
                        {
                            message: '"value" does not match any of the allowed types',
                            path: [],
                            type: 'alternatives.match',
                            context: {
                                message: '"value" must be one of [key]. "value" must be one of [5]. "value" must be of type object',
                                label: 'value',
                                value: 'other',
                                details: [
                                    {
                                        message: '"value" must be one of [key]',
                                        path: [],
                                        type: 'any.only',
                                        context: { value: 'other', valids: ['key'], label: 'value' }
                                    },
                                    {
                                        message: '"value" must be one of [5]',
                                        path: [],
                                        type: 'any.only',
                                        context: { value: 'other', valids: [5], label: 'value' }
                                    },
                                    {
                                        message: '"value" must be of type object',
                                        path: [],
                                        type: 'object.base',
                                        context: { label: 'value', value: 'other', type: 'object' }
                                    }
                                ]
                            }
                        }
                    ]
                }],
                [6, false, null, {
                    message: '"value" does not match any of the allowed types',
                    details: [
                        {
                            message: '"value" does not match any of the allowed types',
                            path: [],
                            type: 'alternatives.match',
                            context: {
                                message: '"value" must be one of [key]. "value" must be one of [5]. "value" must be of type object',
                                label: 'value',
                                value: 6,
                                details: [
                                    {
                                        message: '"value" must be one of [key]',
                                        path: [],
                                        type: 'any.only',
                                        context: { value: 6, valids: ['key'], label: 'value' }
                                    },
                                    {
                                        message: '"value" must be one of [5]',
                                        path: [],
                                        type: 'any.only',
                                        context: { value: 6, valids: [5], label: 'value' }
                                    },
                                    {
                                        message: '"value" must be of type object',
                                        path: [],
                                        type: 'object.base',
                                        context: { label: 'value', value: 6, type: 'object' }
                                    }
                                ]
                            }
                        }
                    ]
                }],
                [{ c: 5 }, false, null, {
                    message: '"value" does not match any of the allowed types',
                    details: [
                        {
                            message: '"value" does not match any of the allowed types',
                            path: [],
                            type: 'alternatives.match',
                            context: {
                                message: '"value" must be one of [key]. "value" must be one of [5]. "c" is not allowed',
                                label: 'value',
                                value: { c: 5 },
                                details: [
                                    {
                                        message: '"value" must be one of [key]',
                                        path: [],
                                        type: 'any.only',
                                        context: { value: { c: 5 }, valids: ['key'], label: 'value' }
                                    },
                                    {
                                        message: '"value" must be one of [5]',
                                        path: [],
                                        type: 'any.only',
                                        context: { value: { c: 5 }, valids: [5], label: 'value' }
                                    },
                                    {
                                        message: '"c" is not allowed',
                                        path: ['c'],
                                        type: 'object.unknown',
                                        context: { child: 'c', label: 'c', key: 'c', value: 5 }
                                    }
                                ]
                            }
                        }
                    ]
                }],
                [{}, true],
                [{ b: 'abc' }, true],
                [{ a: true, b: 'boom' }, true],
                [{ a: 5, b: 'a' }, false, null, {
                    message: '"value" does not match any of the allowed types',
                    details: [
                        {
                            message: '"value" does not match any of the allowed types',
                            path: [],
                            type: 'alternatives.match',
                            context: {
                                label: 'value',
                                message: '"value" must be one of [key]. "value" must be one of [5]. "a" must be one of [true]',
                                value: { a: 5, b: 'a' },
                                details: [
                                    {
                                        message: '"value" must be one of [key]',
                                        path: [],
                                        type: 'any.only',
                                        context: { value: { a: 5, b: 'a' }, valids: ['key'], label: 'value' }
                                    },
                                    {
                                        message: '"value" must be one of [5]',
                                        path: [],
                                        type: 'any.only',
                                        context: { value: { a: 5, b: 'a' }, valids: [5], label: 'value' }
                                    },
                                    {
                                        message: '"a" must be one of [true]',
                                        path: ['a'],
                                        type: 'any.only',
                                        context: { label: 'a', key: 'a', value: 5, valids: [true] }
                                    }
                                ]
                            }
                        }
                    ]
                }]
            ]);
        });

        it('compile [null]', () => {

            const schema = Joi.compile([null]);
            expect(schema).to.equal(Joi.valid(null));
        });

        it('compile [1]', () => {

            const schema = Joi.compile([1]);
            expect(schema).to.equal(Joi.valid(1));
        });

        it('compile ["a"]', () => {

            const schema = Joi.compile(['a']);
            expect(schema).to.equal(Joi.valid('a'));
        });

        it('compile [null, null, null]', () => {

            const schema = Joi.compile([null]);
            expect(schema).to.equal(Joi.valid(null));
        });

        it('compile [1, 2, 3]', () => {

            const schema = Joi.compile([1, 2, 3]);
            expect(schema).to.equal(Joi.valid(1, 2, 3));
        });

        it('compile ["a", "b", "c"]', () => {

            const schema = Joi.compile(['a','b','c']);
            expect(schema).to.equal(Joi.valid('a', 'b', 'c'));
        });

        it('compile [null, "a", 1, true]', () => {

            const schema = Joi.compile([null, 'a', 1, true]);
            expect(schema).to.equal(Joi.valid(null, 'a', 1, true));
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
            expect(() => Joi.compile(schema)).to.throw('Cannot mix different versions of joi schemas');
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
