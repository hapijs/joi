'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('alternatives', () => {

    it('can be called on its own', () => {

        const alternatives = Joi.alternatives;
        expect(() => alternatives()).to.throw('Must be invoked on a Joi instance.');
    });

    it('fails when no alternatives are provided', async () => {

        const err = await expect(Joi.alternatives().validate('a')).to.reject();
        expect(err.message).to.equal('"value" not matching any of the allowed alternatives');
        expect(err.details).to.equal([
            {
                context: {
                    key: undefined,
                    label: 'value'
                },
                message: '"value" not matching any of the allowed alternatives',
                path: [],
                type: 'alternatives.base'
            }
        ]);
    });

    it('allows undefined when no alternatives are provided', async () => {

        await Joi.alternatives().validate(undefined);
    });

    it('applies modifiers when higher priority converts', async () => {

        const schema = Joi.object({
            a: [
                Joi.number(),
                Joi.string()
            ]
        });

        const value = await schema.validate({ a: '5' });
        expect(value.a).to.equal(5);
    });

    it('applies modifiers when lower priority valid is a match', async () => {

        const schema = Joi.object({
            a: [
                Joi.number(),
                Joi.valid('5')
            ]
        });

        const value = await schema.validate({ a: '5' });
        expect(value.a).to.equal(5);
    });

    it('does not apply modifier if alternative fails', async () => {

        const schema = Joi.object({
            a: [
                Joi.object({ c: Joi.any(), d: Joi.number() }).rename('b', 'c'),
                { b: Joi.any(), d: Joi.string() }
            ]
        });

        const input = { a: { b: 'any', d: 'string' } };
        const value = await schema.validate(input);
        expect(value.a.b).to.equal('any');
    });

    describe('try()', () => {

        it('throws when missing alternatives', () => {

            expect(() => {

                Joi.alternatives().try();
            }).to.throw('Cannot add other alternatives without at least one schema');
        });

        it('validates deep alternatives', () => {

            const schema = Joi.alternatives().try(Joi.boolean(), Joi.object({
                p: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('foo', 'bar'))
            }));
            Helper.validate(schema, [
                [{ p: 1 }, false, null, {
                    message: '"value" must be a boolean, child "p" fails because ["p" must be a boolean, "p" must be a string]',
                    details: [
                        {
                            message: '"value" must be a boolean',
                            path: [],
                            type: 'boolean.base',
                            context: { label: 'value', key: undefined, value: { p: 1 } }
                        },
                        {
                            message: '"p" must be a boolean',
                            path: ['p'],
                            type: 'boolean.base',
                            context: { label: 'p', key: 'p', value: 1 }
                        },
                        {
                            message: '"p" must be a string',
                            path: ['p'],
                            type: 'string.base',
                            context: { value: 1, label: 'p', key: 'p' }
                        }
                    ]
                }],
                [{ p: '...' }, false, null, {
                    message: '"value" must be a boolean, child "p" fails because ["p" must be a boolean, "p" must be one of [foo, bar]]',
                    details: [
                        {
                            message: '"value" must be a boolean',
                            path: [],
                            type: 'boolean.base',
                            context: { label: 'value', key: undefined, value: { p: '...' } }
                        },
                        {
                            message: '"p" must be a boolean',
                            path: ['p'],
                            type: 'boolean.base',
                            context: { label: 'p', key: 'p', value: '...' }
                        },
                        {
                            message: '"p" must be one of [foo, bar]',
                            path: ['p'],
                            type: 'any.allowOnly',
                            context: { value: '...', valids: ['foo', 'bar'], label: 'p', key: 'p' }
                        }
                    ]
                }],
                [1, false, null, {
                    message: '"value" must be a boolean, "value" must be an object',
                    details: [
                        {
                            message: '"value" must be a boolean',
                            path: [],
                            type: 'boolean.base',
                            context: { label: 'value', key: undefined, value: 1 }
                        },
                        {
                            message: '"value" must be an object',
                            path: [],
                            type: 'object.base',
                            context: { label: 'value', key: undefined, value: 1 }
                        }
                    ]
                }]
            ]);
        });

        it('validates deep alternatives (with wrapArrays false)', () => {

            const schema = Joi.alternatives().try(Joi.boolean(), Joi.object({
                p: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('foo', 'bar'))
            })).options({ language: { messages: { wrapArrays: false } } });
            Helper.validate(schema, [
                [{ p: 1 }, false, null, {
                    message: '"value" must be a boolean, child "p" fails because "p" must be a boolean, "p" must be a string',
                    details: [
                        {
                            message: '"value" must be a boolean',
                            path: [],
                            type: 'boolean.base',
                            context: { label: 'value', key: undefined, value: { p: 1 } }
                        },
                        {
                            message: '"p" must be a boolean',
                            path: ['p'],
                            type: 'boolean.base',
                            context: { label: 'p', key: 'p', value: 1 }
                        },
                        {
                            message: '"p" must be a string',
                            path: ['p'],
                            type: 'string.base',
                            context: { value: 1, label: 'p', key: 'p' }
                        }
                    ]
                }],
                [{ p: '...' }, false, null, {
                    message: '"value" must be a boolean, child "p" fails because "p" must be a boolean, "p" must be one of foo, bar',
                    details: [
                        {
                            message: '"value" must be a boolean',
                            path: [],
                            type: 'boolean.base',
                            context: { label: 'value', key: undefined, value: { p: '...' } }
                        },
                        {
                            message: '"p" must be a boolean',
                            path: ['p'],
                            type: 'boolean.base',
                            context: { label: 'p', key: 'p', value: '...' }
                        },
                        {
                            message: '"p" must be one of foo, bar',
                            path: ['p'],
                            type: 'any.allowOnly',
                            context: { value: '...', valids: ['foo', 'bar'], label: 'p', key: 'p' }
                        }
                    ]
                }],
                [1, false, null, {
                    message: '"value" must be a boolean, "value" must be an object',
                    details: [
                        {
                            message: '"value" must be a boolean',
                            path: [],
                            type: 'boolean.base',
                            context: { label: 'value', key: undefined, value: 1 }
                        },
                        {
                            message: '"value" must be an object',
                            path: [],
                            type: 'object.base',
                            context: { label: 'value', key: undefined, value: 1 }
                        }
                    ]
                }]
            ]);
        });

        it('validates deep alternatives (with custom error)', () => {

            const schema = Joi.alternatives().try(Joi.boolean(), Joi.object({
                p: Joi.number()
            })).error(new Error('oops'));
            expect(schema.validate({ p: 'a' }).error).to.be.an.error('oops');
        });
    });

    describe('when()', () => {

        it('throws on invalid ref (not string)', () => {

            expect(() => {

                Joi.alternatives().when(5, { is: 6, then: Joi.number() });
            }).to.throw('Invalid condition: 5');
        });

        describe('with ref', () => {

            it('validates conditional alternatives', () => {

                const schema = {
                    a: Joi.alternatives()
                        .when('b', { is: 5, then: 'x', otherwise: 'y' })
                        .try('z'),
                    b: Joi.any()
                };

                Helper.validate(schema, [
                    [{ a: 'x', b: 5 }, true],
                    [{ a: 'x', b: 6 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [y]]',
                        details: [{
                            message: '"a" must be one of [y]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'x', valids: ['y'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'y', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: 6 }, true],
                    [{ a: 'z', b: 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'z', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'z', b: 6 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [y]]',
                        details: [{
                            message: '"a" must be one of [y]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'z', valids: ['y'], label: 'a', key: 'a' }
                        }]
                    }]
                ]);
            });

            it('validates conditional alternatives (empty key)', () => {

                const schema = {
                    a: Joi.alternatives()
                        .when('', { is: 5, then: 'x', otherwise: 'y' })
                        .try('z'),
                    '': Joi.any()
                };

                Helper.validate(schema, [
                    [{ a: 'x', '': 5 }, true],
                    [{ a: 'x', '': 6 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [y]]',
                        details: [{
                            message: '"a" must be one of [y]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'x', valids: ['y'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', '': 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'y', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', '': 6 }, true],
                    [{ a: 'z', '': 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'z', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'z', '': 6 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [y]]',
                        details: [{
                            message: '"a" must be one of [y]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'z', valids: ['y'], label: 'a', key: 'a' }
                        }]
                    }]
                ]);
            });

            it('validates only then', () => {

                const schema = {
                    a: Joi.alternatives()
                        .when(Joi.ref('b'), { is: 5, then: 'x' })
                        .try('z'),
                    b: Joi.any()
                };

                Helper.validate(schema, [
                    [{ a: 'x', b: 5 }, true],
                    [{ a: 'x', b: 6 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [z]]',
                        details: [{
                            message: '"a" must be one of [z]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'x', valids: ['z'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'y', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: 6 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [z]]',
                        details: [{
                            message: '"a" must be one of [z]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'y', valids: ['z'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'z', b: 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'z', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'z', b: 6 }, true]
                ]);
            });

            it('validates only otherwise', () => {

                const schema = {
                    a: Joi.alternatives()
                        .when('b', { is: 5, otherwise: 'y' })
                        .try('z'),
                    b: Joi.any()
                };

                Helper.validate(schema, [
                    [{ a: 'x', b: 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [z]]',
                        details: [{
                            message: '"a" must be one of [z]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'x', valids: ['z'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'x', b: 6 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [y]]',
                        details: [{
                            message: '"a" must be one of [y]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'x', valids: ['y'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [z]]',
                        details: [{
                            message: '"a" must be one of [z]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'y', valids: ['z'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: 6 }, true],
                    [{ a: 'z', b: 5 }, true],
                    [{ a: 'z', b: 6 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [y]]',
                        details: [{
                            message: '"a" must be one of [y]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'z', valids: ['y'], label: 'a', key: 'a' }
                        }]
                    }]
                ]);
            });

            it('validates "then" when a preceding "when" has only "otherwise"', () => {

                const schema = Joi.object({
                    a: Joi.number(),
                    b: Joi.number(),
                    c: Joi.number()
                        .when('a', { is: 1, otherwise: Joi.number().min(1) })
                        .when('b', { is: 1, then: Joi.number().min(1) })
                });

                Helper.validate(schema, [
                    [{ a: 1, b: 1, c: 0 }, false, null, {
                        message: 'child "c" fails because ["c" must be larger than or equal to 1]',
                        details: [{
                            message: '"c" must be larger than or equal to 1',
                            path: ['c'],
                            type: 'number.min',
                            context: { limit: 1, value: 0, label: 'c', key: 'c' }
                        }]
                    }],
                    [{ a: 1, b: 1, c: 1 }, true],
                    [{ a: 0, b: 1, c: 1 }, true],
                    [{ a: 1, b: 0, c: 0 }, true]
                ]);
            });

            it('validates when is is null', () => {

                const schema = {
                    a: Joi.alternatives().when('b', { is: null, then: 'x', otherwise: Joi.number() }),
                    b: Joi.any()
                };

                Helper.validate(schema, [
                    [{ a: 1 }, true],
                    [{ a: 'y' }, false, null, {
                        message: 'child "a" fails because ["a" must be a number]',
                        details: [{
                            message: '"a" must be a number',
                            path: ['a'],
                            type: 'number.base',
                            context: { label: 'a', key: 'a', value: 'y' }
                        }]
                    }],
                    [{ a: 'x', b: null }, true],
                    [{ a: 'y', b: null }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'y', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 1, b: null }, false, null, {
                        message: 'child "a" fails because ["a" must be a string]',
                        details: [{
                            message: '"a" must be a string',
                            path: ['a'],
                            type: 'string.base',
                            context: { value: 1, label: 'a', key: 'a' }
                        }]
                    }]
                ]);
            });

            it('validates when is has ref', () => {

                const schema = {
                    a: Joi.alternatives().when('b', { is: Joi.ref('c'), then: 'x' }),
                    b: Joi.any(),
                    c: Joi.number()
                };

                Helper.validate(schema, [
                    [{ a: 'x', b: 5, c: '5' }, true],
                    [{ a: 'x', b: 5, c: '1' }, false, null, {
                        message: 'child "a" fails because ["a" not matching any of the allowed alternatives]',
                        details: [{
                            message: '"a" not matching any of the allowed alternatives',
                            path: ['a'],
                            type: 'alternatives.base',
                            context: { label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'x', b: '5', c: '5' }, false, null, {
                        message: 'child "a" fails because ["a" not matching any of the allowed alternatives]',
                        details: [{
                            message: '"a" not matching any of the allowed alternatives',
                            path: ['a'],
                            type: 'alternatives.base',
                            context: { label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: 5, c: 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'y', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y' }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'y', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }]
                ]);
            });

            it('validates when is has ref pointing to a complex type', () => {

                const date = new Date(42);

                const schema = {
                    a: Joi.alternatives().when('b', { is: Joi.ref('c'), then: 'x' }),
                    b: Joi.date(),
                    c: Joi.date()
                };

                Helper.validate(schema, [
                    [{ a: 'x', b: date, c: date }, true],
                    [{ a: 'x', b: date, c: Date.now() }, false, null, {
                        message: 'child "a" fails because ["a" not matching any of the allowed alternatives]',
                        details: [{
                            message: '"a" not matching any of the allowed alternatives',
                            path: ['a'],
                            type: 'alternatives.base',
                            context: { label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: date, c: date }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'y', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y' }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'y', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }]
                ]);
            });


            it('validates when is has either ref pointing to a complex type or value', () => {

                const date = new Date(42);
                const now = Date.now();

                const schema = {
                    a: Joi.alternatives().when('b', {
                        is: Joi.valid(
                            new Date(+date), // Intentional cloning of the date to change the reference
                            Joi.ref('c')
                        ),
                        then: 'x'
                    }),
                    b: Joi.date(),
                    c: Joi.date()
                };

                Helper.validate(schema, [
                    [{ a: 'x', b: date, c: date }, true],
                    [{ a: 'x', b: date, c: now }, true, null, { a: 'x', b: date, c: new Date(now) }],
                    [{ a: 'y', b: date, c: date }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'y', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y' }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'y', valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }]
                ]);
            });

            it('validates when then has ref', () => {

                const ref = Joi.ref('c');
                const schema = {
                    a: Joi.alternatives().when('b', { is: 5, then: ref }),
                    b: Joi.any(),
                    c: Joi.number()
                };

                Helper.validate(schema, [
                    [{ a: 'x', b: 5, c: '1' }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [ref:c]]',
                        details: [{
                            message: '"a" must be one of [ref:c]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'x', valids: [ref], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 1, b: 5, c: '1' }, true],
                    [{ a: '1', b: 5, c: '1' }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [ref:c]]',
                        details: [{
                            message: '"a" must be one of [ref:c]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: '1', valids: [ref], label: 'a', key: 'a' }
                        }]
                    }]
                ]);
            });

            it('validates when otherwise has ref', () => {

                const ref = Joi.ref('c');
                const schema = {
                    a: Joi.alternatives().when('b', { is: 6, otherwise: ref }),
                    b: Joi.any(),
                    c: Joi.number()
                };

                Helper.validate(schema, [
                    [{ a: 'x', b: 5, c: '1' }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [ref:c]]',
                        details: [{
                            message: '"a" must be one of [ref:c]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: 'x', valids: [ref], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 1, b: 5, c: '1' }, true],
                    [{ a: '1', b: 5, c: '1' }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [ref:c]]',
                        details: [{
                            message: '"a" must be one of [ref:c]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { value: '1', valids: [ref], label: 'a', key: 'a' }
                        }]
                    }]
                ]);
            });

            it('validates when empty value', () => {

                const schema = {
                    a: Joi.alternatives().when('b', { is: true, then: Joi.required() }),
                    b: Joi.boolean().default(false)
                };

                Helper.validate(schema, [
                    [{ b: false }, true],
                    [{ b: true }, true]           // true because required() only applies to the one alternative
                ]);
            });

            it('validates when missing value', () => {

                const schema = Joi.object({
                    a: Joi.alternatives().when('b', {
                        is: 5,
                        then: Joi.optional(),
                        otherwise: Joi.required()
                    }).required(),
                    b: Joi.number()
                });

                Helper.validate(schema, [
                    [{ a: 1 }, true],
                    [{}, false, null, {
                        message: 'child "a" fails because ["a" is required]',
                        details: [{
                            message: '"a" is required',
                            path: ['a'],
                            type: 'any.required',
                            context: { label: 'a', key: 'a' }
                        }]
                    }],
                    [{ b: 1 }, false, null, {
                        message: 'child "a" fails because ["a" is required]',
                        details: [{
                            message: '"a" is required',
                            path: ['a'],
                            type: 'any.required',
                            context: { label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 1, b: 1 }, true],
                    [{ a: 1, b: 5 }, true],
                    [{ b: 5 }, false, null, {
                        message: 'child "a" fails because ["a" is required]',
                        details: [{
                            message: '"a" is required',
                            path: ['a'],
                            type: 'any.required',
                            context: { label: 'a', key: 'a' }
                        }]
                    }]
                ]);
            });

            it('validates with nested whens', () => {

                // If ((b === 0 && a === 123) ||
                //     (b !== 0 && a === anything))
                // then c === 456
                // else c === 789
                const schema = Joi.object({
                    a: Joi.number().required(),
                    b: Joi.number().required(),
                    c: Joi.when('a', {
                        is: Joi.when('b', {
                            is: Joi.valid(0),
                            then: Joi.valid(123)
                        }),
                        then: Joi.valid(456),
                        otherwise: Joi.valid(789)
                    })
                });

                Helper.validate(schema, [
                    [{ a: 123, b: 0, c: 456 }, true],
                    [{ a: 0, b: 1, c: 456 }, true],
                    [{ a: 0, b: 0, c: 789 }, true],
                    [{ a: 123, b: 456, c: 456 }, true],
                    [{ a: 0, b: 0, c: 456 }, false, null, {
                        message: 'child "c" fails because ["c" must be one of [789]]',
                        details: [{
                            message: '"c" must be one of [789]',
                            path: ['c'],
                            type: 'any.allowOnly',
                            context: { value: 456, valids: [789], label: 'c', key: 'c' }
                        }]
                    }],
                    [{ a: 123, b: 456, c: 789 }, false, null, {
                        message: 'child "c" fails because ["c" must be one of [456]]',
                        details: [{
                            message: '"c" must be one of [456]',
                            path: ['c'],
                            type: 'any.allowOnly',
                            context: { value: 789, valids: [456], label: 'c', key: 'c' }
                        }]
                    }]
                ]);
            });
        });

        describe('with schema', () => {

            it('should peek inside a simple value', () => {

                const schema = Joi.number().when(Joi.number().min(0), { then: Joi.number().min(10) });
                Helper.validate(schema, [
                    [-1, true, null, -1],
                    [1, false, null, {
                        message: '"value" must be larger than or equal to 10',
                        details: [{
                            message: '"value" must be larger than or equal to 10',
                            path: [],
                            type: 'number.min',
                            context: { limit: 10, value: 1, key: undefined, label: 'value' }
                        }]
                    }],
                    [10, true, null, 10]
                ]);
            });

            it('should peek inside an object', () => {

                const schema = Joi.object().keys({
                    foo: Joi.string(),
                    bar: Joi.number()
                }).when(Joi.object().keys({
                    foo: Joi.only('hasBar').required()
                }).unknown(), {
                    then: Joi.object().keys({
                        bar: Joi.required()
                    })
                });
                Helper.validate(schema, [
                    [{ foo: 'whatever' }, true, null, { foo: 'whatever' }],
                    [{ foo: 'hasBar' }, false, null, {
                        message: 'child "bar" fails because ["bar" is required]',
                        details: [{
                            message: '"bar" is required',
                            path: ['bar'],
                            type: 'any.required',
                            context: { key: 'bar', label: 'bar' }
                        }]
                    }],
                    [{ foo: 'hasBar', bar: 42 }, true, null, { foo: 'hasBar', bar: 42 }],
                    [{}, true, null, {}]
                ]);
            });
        });
    });

    describe('label()', () => {

        it('passes the label to the underlying schema', () => {

            const schema = Joi.object().keys({
                a: Joi.boolean(),
                b: Joi.when('a', {
                    is: true,
                    then: Joi.string().empty('').allow(null)
                }).label('Label b'),
                c: Joi.when('a', {
                    is: true,
                    otherwise: Joi.string().empty('').allow(null)
                }).label('Label c'),
                d: Joi.alt().try([Joi.string()]).label('Label d')
            }).or('b', 'c', 'd');

            Helper.validate(schema, [
                [{ a: true, b: 1 }, false, null, {
                    message: 'child "Label b" fails because ["Label b" must be a string]',
                    details: [{
                        message: '"Label b" must be a string',
                        path: ['b'],
                        type: 'string.base',
                        context: { value: 1, key: 'b', label: 'Label b' }
                    }]
                }],
                [{ a: false, b: 1, d: 1 }, false, null, {
                    message: 'child "Label d" fails because ["Label d" must be a string]',
                    details: [{
                        message: '"Label d" must be a string',
                        path: ['d'],
                        type: 'string.base',
                        context: { value: 1, key: 'd', label: 'Label d' }
                    }]
                }],
                [{ a: false, b: 1, c: 1 }, false, null, {
                    message: 'child "Label c" fails because ["Label c" must be a string]',
                    details: [{
                        message: '"Label c" must be a string',
                        path: ['c'],
                        type: 'string.base',
                        context: { value: 1, key: 'c', label: 'Label c' }
                    }]
                }]
            ]);
        });

        it('does not modify the original schema', () => {

            const schema = Joi.when('a', {
                is: true,
                then: Joi.string().empty('').allow(null)
            });
            const labeled = schema.label('Label b');

            expect(schema.describe()).to.equal({
                base: { type: 'any' },
                flags: { presence: 'ignore' },
                type: 'alternatives',
                alternatives: [{
                    is: {
                        type: 'boolean',
                        flags: { allowOnly: true, insensitive: true, presence: 'required' },
                        truthy: [true],
                        falsy: [false],
                        valids: [true]
                    },
                    ref: 'ref:a',
                    then: {
                        type: 'string',
                        flags: {
                            empty: {
                                flags: { allowOnly: true },
                                type: 'string',
                                valids: ['']
                            }
                        },
                        valids: [null],
                        invalids: ['']
                    }
                }]
            });
            expect(labeled.describe()).to.equal({
                base: { type: 'any' },
                flags: { presence: 'ignore' },
                label: 'Label b',
                type: 'alternatives',
                alternatives: [{
                    is: {
                        type: 'boolean',
                        flags: { allowOnly: true, insensitive: true, presence: 'required' },
                        truthy: [true],
                        falsy: [false],
                        valids: [true]
                    },
                    ref: 'ref:a',
                    then: {
                        type: 'string',
                        flags: {
                            empty: {
                                flags: { allowOnly: true },
                                type: 'string',
                                valids: ['']
                            }
                        },
                        label: 'Label b',
                        valids: [null],
                        invalids: ['']
                    }
                }]
            });
        });
    });

    describe('describe()', () => {

        it('describes when', () => {

            const schema = {
                a: Joi.alternatives()
                    .when('b', { is: 5, then: 'x', otherwise: 'y' })
                    .try('z'),
                b: Joi.any()
            };

            const outcome = {
                type: 'object',
                children: {
                    b: {
                        type: 'any'
                    },
                    a: {
                        type: 'alternatives',
                        alternatives: [
                            {
                                ref: 'ref:b',
                                is: {
                                    type: 'number',
                                    flags: {
                                        allowOnly: true,
                                        presence: 'required',
                                        unsafe: false
                                    },
                                    valids: [5],
                                    invalids: [Infinity, -Infinity]
                                },
                                then: {
                                    type: 'string',
                                    flags: {
                                        allowOnly: true
                                    },
                                    valids: ['x'],
                                    invalids: ['']
                                },
                                otherwise: {
                                    type: 'string',
                                    flags: {
                                        allowOnly: true
                                    },
                                    valids: ['y'],
                                    invalids: ['']
                                }
                            },
                            {
                                type: 'string',
                                flags: {
                                    allowOnly: true
                                },
                                valids: ['z'],
                                invalids: ['']
                            }
                        ]
                    }
                }
            };

            expect(Joi.describe(schema)).to.equal(outcome);
        });

        it('describes when (only then)', () => {

            const schema = {
                a: Joi.alternatives()
                    .when('b', { is: 5, then: 'x' })
                    .try('z'),
                b: Joi.any()
            };

            const outcome = {
                type: 'object',
                children: {
                    b: {
                        type: 'any'
                    },
                    a: {
                        type: 'alternatives',
                        alternatives: [
                            {
                                ref: 'ref:b',
                                is: {
                                    type: 'number',
                                    flags: {
                                        allowOnly: true,
                                        presence: 'required',
                                        unsafe: false
                                    },
                                    valids: [5],
                                    invalids: [Infinity, -Infinity]
                                },
                                then: {
                                    type: 'string',
                                    flags: {
                                        allowOnly: true
                                    },
                                    valids: ['x'],
                                    invalids: ['']
                                }
                            },
                            {
                                type: 'string',
                                flags: {
                                    allowOnly: true
                                },
                                valids: ['z'],
                                invalids: ['']
                            }
                        ]
                    }
                }
            };

            expect(Joi.describe(schema)).to.equal(outcome);
        });

        it('describes when (only otherwise)', () => {

            const schema = {
                a: Joi.alternatives()
                    .when('b', { is: 5, otherwise: 'y' })
                    .try('z'),
                b: Joi.any()
            };

            const outcome = {
                type: 'object',
                children: {
                    b: {
                        type: 'any'
                    },
                    a: {
                        type: 'alternatives',
                        alternatives: [
                            {
                                ref: 'ref:b',
                                is: {
                                    type: 'number',
                                    flags: {
                                        allowOnly: true,
                                        presence: 'required',
                                        unsafe: false
                                    },
                                    valids: [5],
                                    invalids: [Infinity, -Infinity]
                                },
                                otherwise: {
                                    type: 'string',
                                    flags: {
                                        allowOnly: true
                                    },
                                    valids: ['y'],
                                    invalids: ['']
                                }
                            },
                            {
                                type: 'string',
                                flags: {
                                    allowOnly: true
                                },
                                valids: ['z'],
                                invalids: ['']
                            }
                        ]
                    }
                }
            };

            expect(Joi.describe(schema)).to.equal(outcome);
        });

        it('describes when (with schema)', () => {

            const schema = Joi.alternatives()
                .when(Joi.string().label('foo'), {
                    then: Joi.string().required().min(1),
                    otherwise: Joi.boolean()
                });

            const outcome = {
                type: 'alternatives',
                alternatives: [{
                    peek: {
                        type: 'string',
                        flags: {},
                        label: 'foo',
                        invalids: ['']
                    },
                    then: {
                        type: 'string',
                        flags: { presence: 'required' },
                        invalids: [''],
                        rules: [{ arg: 1, name: 'min' }]
                    },
                    otherwise: {
                        type: 'boolean',
                        flags: { insensitive: true },
                        truthy: [true],
                        falsy: [false]
                    }
                }]
            };

            expect(Joi.describe(schema)).to.equal(outcome);
        });

        it('describes inherited fields (from any)', () => {

            const schema = Joi.alternatives()
                .try('a')
                .description('d')
                .example('a')
                .meta('b')
                .meta('c')
                .notes('f')
                .tags('g');

            const outcome = {
                type: 'alternatives',
                description: 'd',
                notes: ['f'],
                tags: ['g'],
                meta: ['b', 'c'],
                examples: [{ value: 'a' }],
                alternatives: [{
                    type: 'string',
                    flags: {
                        allowOnly: true
                    },
                    valids: ['a'],
                    invalids: ['']
                }]
            };

            expect(Joi.describe(schema)).to.equal(outcome);
        });
    });
});
