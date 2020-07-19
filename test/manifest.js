'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

const Helper = require('./helper');

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
                defaultDescribedFn: Joi.string().default(defaultDescribedFn),
                defaultArray: Joi.array().default(['x'])
            })
                .prefs({ abortEarly: false, convert: false })
                .rename('renamed', 'required')
                .without('required', 'xor')
                .without('xor', 'required')
                .allow({ a: 'x' })
                .meta({ x: 1 });

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
                                type: 'any',
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
                    },
                    defaultArray: {
                        type: 'array',
                        flags: {
                            default: ['x']
                        }
                    }
                },
                dependencies: [
                    {
                        rel: 'without',
                        key: 'required',
                        peers: ['xor']
                    },
                    {
                        rel: 'without',
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
                },
                metas: [{ x: 1 }]
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

        it('describes defaults', () => {

            const schema = Joi.object({
                foo: Joi.string().default('bar')
            })
                .default({ foo: 'bar' });

            expect(schema.describe()).to.equal({
                type: 'object',
                flags: { default: { foo: 'bar' } },
                keys: { foo: { type: 'string', flags: { default: 'bar' } } }
            });
        });

        it('describes null defaults', () => {

            const description = Joi.any().allow(null).default(null).describe();
            expect(description.invalids).to.not.exist();
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
                Joi.function(),
                Joi.number(),
                Joi.object(),
                Joi.string(),
                Joi.symbol()
            ]);
        });

        it('sets flags', () => {

            internals.test([
                Joi.string().required(),
                Joi.function().default(() => null, { literal: true }),
                Joi.object().default(),
                Joi.array().default(['x']),
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

        it('sets any terms', () => {

            internals.test([
                Joi.string().example('text').tag('a').note('ok then').meta(123),
                Joi.binary().external((v) => v, 'custom'),
                Joi.number().alter({ x: (s) => s.min(1) })
            ]);
        });

        it('builds alternatives', () => {

            internals.test([
                Joi.alternatives().try(Joi.boolean()),
                Joi.alternatives(Joi.boolean(), Joi.object({ p: Joi.number() })),
                Joi.alternatives(Joi.object()).error(new Error())
            ]);
        });

        it('builds whens', () => {

            internals.test([
                Joi.number().when('$x', { is: true, then: Joi.required(), otherwise: Joi.forbidden() }),
                Joi.number().when(Joi.valid('x'), { then: Joi.required(), otherwise: Joi.forbidden() }),
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
                Joi.boolean().sensitive(),
                Joi.boolean().sensitive(false)
            ]);
        });

        it('builds dates', () => {

            internals.test([
                Joi.date().min('1-1-2000 UTC')
            ]);
        });

        it('builds links', () => {

            expect(() => Joi.build(Joi.link().describe())).to.throw('Invalid link description missing link');
            internals.test([
                Joi.link('....'),
                Joi.link(Joi.ref('xxx....', { separator: 'x' })),
                Joi.link('/'),
                Joi.link('..a').relative()
            ]);
        });

        it('builds objects', () => {

            internals.test([
                Joi.object({}),
                Joi.object({ p: Joi.number() }),
                Joi.object({ a: Joi.string(), b: Joi.number() }),
                Joi.object().rename('a', 'b'),
                Joi.object().rename(/a/, 'b'),
                Joi.object().rename(/(a)/, Joi.x('x{#1}')),
                Joi.object().and('a', 'b').or('c', 'd').without('e', 'f').xor('g.h', 'i', { separator: false }),
                Joi.object().pattern(/x/, Joi.number()),
                Joi.object().pattern(Joi.string(), Joi.number()),
                Joi.object().pattern(/x/, Joi.number(), { matches: Joi.array().length(Joi.ref('$x')), fallthrough: true }),
                Joi.object({ a: 1 }).concat(Joi.object({ a: 3 })),
                Joi.object().instance(RegExp).default(/x/).allow({}).allow({ x: 1 }),
                Joi.object({ regex: 'b' }),
                Joi.object({ buffer: 'c' }),
                Joi.object({ function: 'd' }),
                Joi.object({ override: 'e' }),
                Joi.object({ ref: 'f' }),
                Joi.object({ special: 'g' }),
                Joi.object({ value: 'h' }),
                Joi.object({ type: 'a' }),
                Joi.object({ type: 'a', regex: 'b', buffer: 'c', function: 'd', override: 'e', ref: 'f', special: 'g', value: 'f' })
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

        it('builds extended schema (nested builds)', () => {

            const custom = Joi.extend({
                type: 'fancy',
                base: Joi.object({ a: Joi.number() }),
                flags: {
                    presence: {}                                // For coverage
                },
                terms: {
                    fancy: { init: [] }
                },
                rules: {
                    pants: {
                        method(button) {

                            this.$_terms.fancy.push(button);
                            return this;
                        }
                    }
                },
                manifest: {

                    build(obj, desc) {

                        if (desc.fancy) {
                            obj = obj.clone();
                            obj.$_terms.fancy = desc.fancy.slice();
                        }

                        return obj;
                    }
                }
            });

            const schema = custom.fancy().pants('green').required();
            const desc = schema.describe();

            expect(desc).to.equal({
                type: 'fancy',
                flags: {
                    presence: 'required'
                },
                keys: {
                    a: { type: 'number' }
                },
                fancy: ['green']
            });

            const built = custom.build(desc);
            Helper.equal(built, schema);
        });

        it('builds extended schema (complex)', () => {

            const custom = Joi.extend({
                type: 'million',
                base: Joi.number(),
                flags: {
                    sizable: { setter: 'big' }
                },
                messages: {
                    'million.base': '{{#label}} must be at least a million',
                    'million.big': '{{#label}} must be at least five millions',
                    'million.round': '{{#label}} must be a round number',
                    'million.dividable': '{{#label}} must be dividable by {{#q}}'
                },
                coerce(value, { schema }) {

                    // Only called when prefs.convert is true

                    if (schema.$_getRule('round')) {
                        return { value: Math.round(value) };
                    }
                },
                validate(value, { schema, error }) {

                    // Base validation regardless of the rules applied

                    if (value < 1000000) {
                        return { value, errors: error('million.base') };
                    }

                    // Check flags for global state

                    if (schema.$_getFlag('sizable') &&
                        value < 5000000) {

                        return { value, errors: error('million.big') };
                    }
                },
                rules: {
                    big: {
                        alias: 'large',
                        method() {

                            return this.$_setFlag('sizable', true);
                        }
                    },
                    round: {
                        convert: true,              // Dual rule: converts or validates
                        method() {

                            return this.$_addRule('round');
                        },
                        validate(value, helpers, args, options) {

                            // Only called when prefs.convert is false (due to rule convert option)

                            if (value % 1 !== 0) {
                                return helpers.error('million.round');
                            }
                        }
                    },
                    dividable: {
                        multi: true,                // Rule supports multiple invocations
                        method(q) {

                            return this.$_addRule({ name: 'dividable', args: { q } });
                        },
                        args: [
                            {
                                name: 'q',
                                ref: true,
                                assert: (value) => typeof value === 'number' && !isNaN(value),
                                message: 'q must be a number or reference'
                            }
                        ],
                        validate(value, helpers, args, options) {

                            if (value % args.q === 0) {
                                return value;       // Value is valid
                            }

                            return helpers.error('million.dividable', { q: args.q });
                        }
                    },
                    even: {
                        method() {

                            // Rule with only method used to alias another rule

                            return this.dividable(2);
                        }
                    }
                }
            });

            const schema = custom.object({
                a: custom.million().round().dividable(Joi.ref('b')),
                b: custom.number(),
                c: custom.million().even().dividable(7),
                d: custom.million().round().prefs({ convert: false }),
                e: custom.million().large()
            });

            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'object',
                keys: {
                    b: {
                        type: 'number'
                    },
                    a: {
                        type: 'million',
                        rules: [
                            { name: 'round' },
                            {
                                name: 'dividable',
                                args: { q: { ref: { path: ['b'] } } }
                            }
                        ]
                    },
                    c: {
                        type: 'million',
                        rules: [
                            { name: 'dividable', args: { q: 2 } },
                            { name: 'dividable', args: { q: 7 } }
                        ]
                    },
                    d: {
                        type: 'million',
                        rules: [
                            { name: 'round' }
                        ],
                        preferences: {
                            convert: false
                        }
                    },
                    e: {
                        type: 'million',
                        flags: {
                            sizable: true
                        }
                    }
                }
            });

            const built = custom.build(desc);
            Helper.equal(built, schema);
        });

        it('builds extended schema (base with terms)', () => {

            const custom = Joi.extend({
                type: 'fancy',
                base: Joi.array().items(Joi.string().required())
            });

            const schema = custom.fancy();
            const desc = schema.describe();

            expect(desc).to.equal({
                type: 'fancy',
                items: [
                    {
                        flags: { presence: 'required' },
                        type: 'string'
                    }
                ]
            });

            const built = custom.build(desc);
            Helper.equal(built, schema);

            Helper.validate(built, [
                [[1], false, '"[0]" must be a string'],
                [['x'], true]
            ]);
        });
    });
});


internals.test = function (schemas) {

    for (const schema of schemas) {
        const built = Joi.build(schema.describe());
        Helper.equal(built, schema);
    }
};
