'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Joi = require('..');
const Helper = require('./helper');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('alternatives', () => {

    it('fails when no alternatives are provided', (done) => {

        Joi.alternatives().validate('a', (err, value) => {

            expect(err).to.exist();
            expect(err.message).to.equal('"value" not matching any of the allowed alternatives');
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

    describe('#try', () => {

        it('throws when missing alternatives', (done) => {

            expect(() => {

                Joi.alternatives().try();
            }).to.throw('Cannot add other alternatives without at least one schema');
            done();
        });
    });

    describe('#when', () => {

        it('throws on invalid ref (not string)', (done) => {

            expect(() => {

                Joi.alternatives().when(5, { is: 6, then: Joi.number() });
            }).to.throw('Invalid reference: 5');
            done();
        });

        it('validates conditional alternatives', (done) => {

            const schema = {
                a: Joi.alternatives().when('b', { is: 5, then: 'x', otherwise: 'y' })
                                     .try('z'),
                b: Joi.any()
            };

            Helper.validate(schema, [
                [{ a: 'x', b: 5 }, true],
                [{ a: 'x', b: 6 }, false],
                [{ a: 'y', b: 5 }, false],
                [{ a: 'y', b: 6 }, true],
                [{ a: 'z', b: 5 }, true],
                [{ a: 'z', b: 6 }, true]
            ], done);
        });

        it('validates conditional alternatives (empty key)', (done) => {

            const schema = {
                a: Joi.alternatives().when('', { is: 5, then: 'x', otherwise: 'y' })
                                     .try('z'),
                '': Joi.any()
            };

            Helper.validate(schema, [
                [{ a: 'x', '': 5 }, true],
                [{ a: 'x', '': 6 }, false],
                [{ a: 'y', '': 5 }, false],
                [{ a: 'y', '': 6 }, true],
                [{ a: 'z', '': 5 }, true],
                [{ a: 'z', '': 6 }, true]
            ], done);
        });

        it('validates only then', (done) => {

            const schema = {
                a: Joi.alternatives().when(Joi.ref('b'), { is: 5, then: 'x' })
                                     .try('z'),
                b: Joi.any()
            };

            Helper.validate(schema, [
                [{ a: 'x', b: 5 }, true],
                [{ a: 'x', b: 6 }, false],
                [{ a: 'y', b: 5 }, false],
                [{ a: 'y', b: 6 }, false],
                [{ a: 'z', b: 5 }, true],
                [{ a: 'z', b: 6 }, true]
            ], done);
        });

        it('validates only otherwise', (done) => {

            const schema = {
                a: Joi.alternatives().when('b', { is: 5, otherwise: 'y' })
                                     .try('z'),
                b: Joi.any()
            };

            Helper.validate(schema, [
                [{ a: 'x', b: 5 }, false],
                [{ a: 'x', b: 6 }, false],
                [{ a: 'y', b: 5 }, false],
                [{ a: 'y', b: 6 }, true],
                [{ a: 'z', b: 5 }, true],
                [{ a: 'z', b: 6 }, true]
            ], done);
        });

        it('validates when is is null', (done) => {

            const schema = {
                a: Joi.alternatives().when('b', { is: null, then: 'x', otherwise: Joi.number() }),
                b: Joi.any()
            };

            Helper.validate(schema, [
                [{ a: 1 }, true],
                [{ a: 'y' }, false],
                [{ a: 'x', b: null }, true],
                [{ a: 'y', b: null }, false],
                [{ a: 1, b: null }, false]
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
                [{ a: 'x', b: 5, c: '1' }, false],
                [{ a: 'x', b: '5', c: '5' }, false],
                [{ a: 'y', b: 5, c: 5 }, false],
                [{ a: 'y' }, false]
            ], done);
        });

        it('validates when then has ref', (done) => {

            const schema = {
                a: Joi.alternatives().when('b', { is: 5, then: Joi.ref('c') }),
                b: Joi.any(),
                c: Joi.number()
            };

            Helper.validate(schema, [
                [{ a: 'x', b: 5, c: '1' }, false],
                [{ a: 1, b: 5, c: '1' }, true],
                [{ a: '1', b: 5, c: '1' }, false]
            ], done);
        });

        it('validates when otherwise has ref', (done) => {

            const schema = {
                a: Joi.alternatives().when('b', { is: 6, otherwise: Joi.ref('c') }),
                b: Joi.any(),
                c: Joi.number()
            };

            Helper.validate(schema, [
                [{ a: 'x', b: 5, c: '1' }, false],
                [{ a: 1, b: 5, c: '1' }, true],
                [{ a: '1', b: 5, c: '1' }, false]
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
                a: Joi.alternatives().when('b', { is: 5, then: Joi.optional(), otherwise: Joi.required() }).required(),
                b: Joi.number()
            });

            Helper.validate(schema, [
                [{ a: 1 }, true],
                [{}, false],
                [{ b: 1 }, false],
                [{ a: 1, b: 1 }, true],
                [{ a: 1, b: 5 }, true],
                [{ b: 5 }, false]
            ], done);
        });
    });

    describe('#describe', () => {

        it('describes when', (done) => {

            const schema = {
                a: Joi.alternatives().when('b', { is: 5, then: 'x', otherwise: 'y' })
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

            expect(Joi.describe(schema)).to.deep.equal(outcome);
            done();
        });

        it('describes when (only then)', (done) => {

            const schema = {
                a: Joi.alternatives().when('b', { is: 5, then: 'x' })
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

            expect(Joi.describe(schema)).to.deep.equal(outcome);
            done();
        });

        it('describes when (only otherwise)', (done) => {

            const schema = {
                a: Joi.alternatives().when('b', { is: 5, otherwise: 'y' })
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

            expect(Joi.describe(schema)).to.deep.equal(outcome);
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

            expect(Joi.describe(schema)).to.deep.equal(outcome);
            done();
        });
    });
});
