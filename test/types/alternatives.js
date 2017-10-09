'use strict';

// Load modules

const Lab = require('lab');
const Joi = require('../..');
const Helper = require('../helper');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Lab.expect;


describe('alternatives', () => {

    it('can be called on its own', (done) => {

        const alternatives = Joi.alternatives;
        expect(() => alternatives()).to.throw('Must be invoked on a Joi instance.');
        done();
    });

    it('fails when no alternatives are provided', (done) => {

        Joi.alternatives().validate('a', (err, value) => {

            expect(err).to.exist();
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
            done();
        });
    });

    it('allows undefined when no alternatives are provided', (done) => {

        Joi.alternatives().validate(undefined, (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('applies modifiers when higher priority converts', (done) => {

        const schema = Joi.object({
            a: [
                Joi.number(),
                Joi.string()
            ]
        });

        schema.validate({ a: '5' }, (err, value) => {

            expect(err).to.not.exist();
            expect(value.a).to.equal(5);
            done();
        });
    });

    it('applies modifiers when lower priority valid is a match', (done) => {

        const schema = Joi.object({
            a: [
                Joi.number(),
                Joi.valid('5')
            ]
        });

        schema.validate({ a: '5' }, (err, value) => {

            expect(err).to.not.exist();
            expect(value.a).to.equal(5);
            done();
        });
    });

    it('does not apply modifier if alternative fails', (done) => {

        const schema = Joi.object({
            a: [
                Joi.object({ c: Joi.any(), d: Joi.number() }).rename('b', 'c'),
                { b: Joi.any(), d: Joi.string() }
            ]
        });

        const input = { a: { b: 'any', d: 'string' } };
        schema.validate(input, (err, value) => {

            expect(err).to.not.exist();
            expect(value.a.b).to.equal('any');
            done();
        });
    });

    describe('try()', () => {

        it('throws when missing alternatives', (done) => {

            expect(() => {

                Joi.alternatives().try();
            }).to.throw('Cannot add other alternatives without at least one schema');
            done();
        });

        it('validates deep alternatives', (done) => {

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
                            context: { label: 'value', key: undefined }
                        },
                        {
                            message: '"p" must be a boolean',
                            path: ['p'],
                            type: 'boolean.base',
                            context: { label: 'p', key: 'p' }
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
                            context: { label: 'value', key: undefined }
                        },
                        {
                            message: '"p" must be a boolean',
                            path: ['p'],
                            type: 'boolean.base',
                            context: { label: 'p', key: 'p' }
                        },
                        {
                            message: '"p" must be one of [foo, bar]',
                            path: ['p'],
                            type: 'any.allowOnly',
                            context: { valids: ['foo', 'bar'], label: 'p', key: 'p' }
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
                            context: { label: 'value', key: undefined }
                        },
                        {
                            message: '"value" must be an object',
                            path: [],
                            type: 'object.base',
                            context: { label: 'value', key: undefined }
                        }
                    ]
                }]
            ], done);
        });

        it('validates deep alternatives (with wrapArrays false)', (done) => {

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
                            context: { label: 'value', key: undefined }
                        },
                        {
                            message: '"p" must be a boolean',
                            path: ['p'],
                            type: 'boolean.base',
                            context: { label: 'p', key: 'p' }
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
                            context: { label: 'value', key: undefined }
                        },
                        {
                            message: '"p" must be a boolean',
                            path: ['p'],
                            type: 'boolean.base',
                            context: { label: 'p', key: 'p' }
                        },
                        {
                            message: '"p" must be one of foo, bar',
                            path: ['p'],
                            type: 'any.allowOnly',
                            context: { valids: ['foo', 'bar'], label: 'p', key: 'p' }
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
                            context: { label: 'value', key: undefined }
                        },
                        {
                            message: '"value" must be an object',
                            path: [],
                            type: 'object.base',
                            context: { label: 'value', key: undefined }
                        }
                    ]
                }]
            ], done);
        });

        it('validates deep alternatives (with custom error)', (done) => {

            const schema = Joi.alternatives().try(Joi.boolean(), Joi.object({
                p: Joi.number()
            })).error(new Error('oops'));
            expect(schema.validate({ p: 'a' }).error).to.be.an.error('oops');
            done();
        });
    });

    describe('when()', () => {

        it('throws on invalid ref (not string)', (done) => {

            expect(() => {

                Joi.alternatives().when(5, { is: 6, then: Joi.number() });
            }).to.throw('Invalid condition: 5');
            done();
        });

        describe('with ref', () => {

            it('validates conditional alternatives', (done) => {

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
                            context: { valids: ['y'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: 6 }, true],
                    [{ a: 'z', b: 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'z', b: 6 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [y]]',
                        details: [{
                            message: '"a" must be one of [y]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['y'], label: 'a', key: 'a' }
                        }]
                    }]
                ], done);
            });

            it('validates conditional alternatives (empty key)', (done) => {

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
                            context: { valids: ['y'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', '': 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', '': 6 }, true],
                    [{ a: 'z', '': 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'z', '': 6 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [y]]',
                        details: [{
                            message: '"a" must be one of [y]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['y'], label: 'a', key: 'a' }
                        }]
                    }]
                ], done);
            });

            it('validates only then', (done) => {

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
                            context: { valids: ['z'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: 6 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [z]]',
                        details: [{
                            message: '"a" must be one of [z]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['z'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'z', b: 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'z', b: 6 }, true]
                ], done);
            });

            it('validates only otherwise', (done) => {

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
                            context: { valids: ['z'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'x', b: 6 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [y]]',
                        details: [{
                            message: '"a" must be one of [y]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['y'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y', b: 5 }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [z]]',
                        details: [{
                            message: '"a" must be one of [z]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['z'], label: 'a', key: 'a' }
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
                            context: { valids: ['y'], label: 'a', key: 'a' }
                        }]
                    }]
                ], done);
            });

            it('validates "then" when a preceding "when" has only "otherwise"', (done) => {

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
                ], done);
            });

            it('validates when is is null', (done) => {

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
                            context: { label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'x', b: null }, true],
                    [{ a: 'y', b: null }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['x'], label: 'a', key: 'a' }
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
                ], done);
            });

            it('validates when is has ref', (done) => {

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
                            context: { valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 'y' }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [x]]',
                        details: [{
                            message: '"a" must be one of [x]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: ['x'], label: 'a', key: 'a' }
                        }]
                    }]
                ], done);
            });

            it('validates when then has ref', (done) => {

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
                            context: { valids: [ref], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 1, b: 5, c: '1' }, true],
                    [{ a: '1', b: 5, c: '1' }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [ref:c]]',
                        details: [{
                            message: '"a" must be one of [ref:c]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: [ref], label: 'a', key: 'a' }
                        }]
                    }]
                ], done);
            });

            it('validates when otherwise has ref', (done) => {

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
                            context: { valids: [ref], label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: 1, b: 5, c: '1' }, true],
                    [{ a: '1', b: 5, c: '1' }, false, null, {
                        message: 'child "a" fails because ["a" must be one of [ref:c]]',
                        details: [{
                            message: '"a" must be one of [ref:c]',
                            path: ['a'],
                            type: 'any.allowOnly',
                            context: { valids: [ref], label: 'a', key: 'a' }
                        }]
                    }]
                ], done);
            });

            it('validates when empty value', (done) => {

                const schema = {
                    a: Joi.alternatives().when('b', { is: true, then: Joi.required() }),
                    b: Joi.boolean().default(false)
                };

                Helper.validate(schema, [
                    [{ b: false }, true],
                    [{ b: true }, true]           // true because required() only applies to the one alternative
                ], done);
            });

            it('validates when missing value', (done) => {

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
                ], done);
            });

            it('validates with nested whens', (done) => {

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
                            context: { valids: [789], label: 'c', key: 'c' }
                        }]
                    }],
                    [{ a: 123, b: 456, c: 789 }, false, null, {
                        message: 'child "c" fails because ["c" must be one of [456]]',
                        details: [{
                            message: '"c" must be one of [456]',
                            path: ['c'],
                            type: 'any.allowOnly',
                            context: { valids: [456], label: 'c', key: 'c' }
                        }]
                    }]
                ], done);
            });
        });

        describe('with schema', () => {

            it('should peek inside a simple value', (done) => {

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
                ], done);
            });

            it('should peek inside an object', (done) => {

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
                ], done);
            });
        });
    });

    describe('describe()', () => {

        it('describes when', (done) => {

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
                                        presence: 'required'
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
            done();
        });

        it('describes when (only then)', (done) => {

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
                                        presence: 'required'
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
            done();
        });

        it('describes when (only otherwise)', (done) => {

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
                                        presence: 'required'
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
            done();
        });

        it('describes when (with schema)', (done) => {

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
            done();
        });

        it('describes inherited fields (from any)', (done) => {

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
                examples: ['a'],
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
            done();
        });
    });
});
