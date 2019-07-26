'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Manifest', () => {

    describe('describe()', () => {

        it('describes schema (direct)', () => {

            const defaultFn = function () {

                return 'test';
            };

            defaultFn.description = 'testing';

            const defaultDescribedFn = function () {

                return 'test';
            };

            const defaultRef = Joi.ref('xor');

            const schema = Joi.object({
                sub: {
                    email: Joi.string().email(),
                    domain: Joi.string().domain(),
                    date: Joi.date(),
                    child: Joi.object({
                        alphanum: Joi.string().alphanum()
                    })
                },
                min: [Joi.number(), Joi.string().min(3)],
                max: Joi.string().max(3).default(0).failover(1),
                required: Joi.string().required(),
                xor: Joi.string(),
                renamed: Joi.string().valid('456'),
                notEmpty: Joi.string().required().description('a').note('b').tag('c'),
                empty: Joi.string().empty('').strip(),
                defaultRef: Joi.string().default(defaultRef),
                defaultFn: Joi.string().default(defaultFn),
                defaultDescribedFn: Joi.string().default(defaultDescribedFn)
            })
                .prefs({ abortEarly: false, convert: false })
                .rename('renamed', 'required')
                .without('required', 'xor')
                .without('xor', 'required')
                .allow({ a: 'x' });

            const result = {
                type: 'object',
                allow: [{ value: { a: 'x' } }],
                keys: {
                    sub: {
                        type: 'object',
                        keys: {
                            email: {
                                type: 'string',
                                rules: [{ name: 'email' }]
                            },
                            domain: {
                                type: 'string',
                                rules: [{ name: 'domain' }]
                            },
                            date: {
                                type: 'date'
                            },
                            child: {
                                type: 'object',
                                keys: {
                                    alphanum: {
                                        type: 'string',
                                        rules: [{ name: 'alphanum' }]
                                    }
                                }
                            }
                        }
                    },
                    min: {
                        type: 'alternatives',
                        matches: [
                            {
                                schema: {
                                    type: 'number'
                                }
                            },
                            {
                                schema: {
                                    type: 'string',
                                    rules: [{ name: 'min', args: { limit: 3 } }]
                                }
                            }
                        ]
                    },
                    max: {
                        type: 'string',
                        flags: {
                            default: 0,
                            failover: 1
                        },
                        rules: [{ name: 'max', args: { limit: 3 } }]
                    },
                    required: {
                        type: 'string',
                        flags: {
                            presence: 'required'
                        }
                    },
                    xor: {
                        type: 'string'
                    },
                    renamed: {
                        type: 'string',
                        flags: {
                            only: true
                        },
                        allow: ['456']
                    },
                    notEmpty: {
                        type: 'string',
                        flags: {
                            description: 'a',
                            presence: 'required'
                        },
                        notes: ['b'],
                        tags: ['c']
                    },
                    empty: {
                        type: 'string',
                        flags: {
                            empty: {
                                type: 'string',
                                flags: {
                                    only: true
                                },
                                allow: ['']
                            },
                            result: 'strip'
                        }
                    },
                    defaultRef: {
                        type: 'string',
                        flags: {
                            default: {
                                ref: { path: ['xor'] }
                            }
                        }
                    },
                    defaultFn: {
                        type: 'string',
                        flags: {
                            default: defaultFn
                        }
                    },
                    defaultDescribedFn: {
                        type: 'string',
                        flags: {
                            default: defaultDescribedFn
                        }
                    }
                },
                dependencies: [
                    {
                        type: 'without',
                        key: 'required',
                        peers: ['xor']
                    },
                    {
                        type: 'without',
                        key: 'xor',
                        peers: ['required']
                    }
                ],
                renames: [
                    {
                        from: 'renamed',
                        to: 'required',
                        options: {
                            alias: false,
                            multiple: false,
                            override: false
                        }
                    }
                ],
                preferences: {
                    abortEarly: false,
                    convert: false
                }
            };

            const description = schema.describe();
            expect(description).to.equal(result);
            expect(description.keys.defaultRef.flags.default).to.equal({ ref: { path: ['xor'] } });
        });

        it('describes schema without invalids', () => {

            const description = Joi.allow(null).describe();
            expect(description.invalids).to.not.exist();
        });

        it('describes value map', () => {

            const symbols = [Symbol(1), Symbol(2)];
            const map = new Map([[1, symbols[0]], ['two', symbols[1]]]);
            const schema = Joi.symbol().map(map).describe();
            expect(schema).to.equal({
                type: 'symbol',
                flags: {
                    only: true
                },
                map: [...map.entries()],
                allow: symbols
            });
        });

        it('describes symbol without map', () => {

            const symbols = [Symbol(1), Symbol(2)];
            const schema = Joi.symbol().valid(...symbols).describe();
            expect(schema).to.equal({
                type: 'symbol',
                flags: {
                    only: true
                },
                allow: symbols
            });
        });

        it('handles empty values', () => {

            expect(Joi.allow(1).invalid(1).describe()).to.equal({ type: 'any', invalid: [1] });
            expect(Joi.invalid(1).allow(1).describe()).to.equal({ type: 'any', allow: [1] });
        });

        it('describes ruleset changes', () => {

            const schema = Joi.string().min(1).keep();
            expect(schema.describe()).to.equal({
                type: 'string',
                rules: [
                    {
                        name: 'min',
                        keep: true,
                        args: { limit: 1 }
                    }
                ]
            });
        });
    });

    describe('build()', () => {

        it('builds basic schemas', () => {

            internals.test([
                Joi.any(),
                Joi.array(),
                Joi.binary(),
                Joi.boolean(),
                Joi.date(),
                Joi.func(),
                Joi.link(),
                Joi.number(),
                Joi.object(),
                Joi.string(),
                Joi.symbol()
            ]);
        });

        it('sets flags', () => {

            internals.test([
                Joi.string().required(),
                Joi.func().default(() => null, { literal: true }),
                Joi.object().default(),
                Joi.boolean().optional(),
                Joi.string().empty(''),
                Joi.binary().strip(),
                Joi.alternatives().raw(),
                Joi.any().result('raw')
            ]);
        });

        it('sets preferences', () => {

            internals.test([
                Joi.object().prefs({ abortEarly: true }),
                Joi.string().min(10).prefs({ messages: { 'string.min': Joi.x('{$x}') } }),
                Joi.string().min(10).prefs({ messages: { 'string.min': Joi.x('{@x}', { prefix: { context: '@' } }) } })
            ]);
        });

        it('sets allow and invalid', () => {

            internals.test([
                Joi.string().allow(1, 2, 3),
                Joi.string().valid(Joi.ref('$x')),
                Joi.number().invalid(1),
                Joi.object().allow({ x: 1 }),
                Joi.allow(null),
                Joi.string().empty('').allow(null)
            ]);
        });

        it('sets rules', () => {

            internals.test([
                Joi.string().lowercase(),
                Joi.string().alphanum(),
                Joi.string().min(10),
                Joi.string().length(10, 'binary')
            ]);
        });

        it('sets ruleset options', () => {

            internals.test([
                Joi.string().min(1).keep(),
                Joi.string().$.min(1).max(2).rule({ message: 'override' }),
                Joi.string().$.min(1).max(2).rule({ message: Joi.x('{$x}') })
            ]);
        });

        it('sets any inners', () => {

            internals.test([
                Joi.string().example('text').tag('a').note('ok then').meta(123),
                Joi.binary().external((v) => v),
                Joi.number().alter({ x: (s) => s.min(1) })
            ]);
        });

        it('builds alternatives', () => {

            internals.test([
                Joi.number().when('$x', { is: true, then: Joi.required(), otherwise: Joi.forbidden() }),
                Joi.number().when(Joi.valid('x'), { then: Joi.required(), otherwise: Joi.forbidden() }),
                Joi.alternatives().try(Joi.boolean()),
                Joi.when('$x', { is: true, then: Joi.string() }),
                Joi.number().when('a', { switch: [{ is: 0, then: Joi.valid(1) }], otherwise: Joi.valid(4) })
            ]);
        });

        it('builds arrays', () => {

            internals.test([
                Joi.array().min(1).items(Joi.number()),
                Joi.array().has(Joi.string()),
                Joi.array().ordered(Joi.number(), Joi.boolean(), Joi.binary()),
                Joi.array().items(Joi.number()).has(Joi.number()),
                Joi.array().sparse().unique()
            ]);
        });

        it('builds binaries', () => {

            internals.test([
                Joi.binary().default(Buffer.from('abcde')).allow(Buffer.from('123'))
            ]);
        });

        it('builds booleans', () => {

            internals.test([
                Joi.boolean().truthy('x'),
                Joi.boolean().falsy(Joi.ref('$x')),
                Joi.boolean().truthy(3).falsy(4),
                Joi.boolean().insensitive(false)
            ]);
        });

        it('builds dates', () => {

            internals.test([
                Joi.date().min('1-1-2000 UTC')
            ]);
        });

        it('builds links', () => {

            internals.test([
                Joi.link('....'),
                Joi.link(Joi.ref('xxx....', { separator: 'x' })),
                Joi.link('/')
            ]);
        });

        it('builds objects', () => {

            internals.test([
                Joi.object({}),
                Joi.object({ a: Joi.string(), b: Joi.number() }),
                Joi.object().rename('a', 'b'),
                Joi.object().rename(/a/, 'b'),
                Joi.object().rename(/(a)/, Joi.x('x{#1}')),
                Joi.object().and('a', 'b').or('c', 'd').without('e', 'f').xor('g.h', 'i', { separator: false }),
                Joi.object().pattern(/x/, Joi.number()),
                Joi.object().pattern(Joi.string(), Joi.number()),
                Joi.object().pattern(/x/, Joi.number(), { matches: Joi.array().length(Joi.ref('$x')), exclusive: true }),
                Joi.object({ a: 1 }).concat(Joi.object({ a: 3 })),
                Joi.object().instance(RegExp).default(/x/).allow({}).allow({ x: 1 })
            ]);
        });

        it('builds strings', () => {

            internals.test([
                Joi.string().min(1).max(10).pattern(/\d*/),
                Joi.string().replace(/x/, 'X')
            ]);
        });

        it('builds strings', () => {

            internals.test([
                Joi.string().min(1).max(10).pattern(/\d*/),
                Joi.string().replace(/x/, 'X')
            ]);
        });

        it('builds symbols', () => {

            internals.test([
                Joi.symbol().map([['a', Symbol('a')]])
            ]);
        });

        it('builds references', () => {

            internals.test([
                Joi.allow(Joi.ref('a'))
            ]);
        });
    });
});


internals.test = function (schemas) {

    for (const schema of schemas) {
        const built = Joi.build(schema.describe());
        expect(built).to.equal(schema, { skip: ['_ruleset'] });
    }
};
