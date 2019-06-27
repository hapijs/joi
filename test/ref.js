'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('ref', () => {

    it('detects references', () => {

        expect(Joi.isRef(Joi.ref('a.b'))).to.be.true();
    });

    it('throws when reference reaches beyond the schema root', () => {

        const schema = Joi.object({
            a: Joi.any(),
            b: Joi.ref('...c')
        });

        expect(() => schema.validate({ a: 1, b: 2 })).to.throw('Invalid reference exceeds the schema root: ref:...c');
    });

    it('reaches self', () => {

        const schema = Joi.number().min(10).message('"{#label}" is {[.]} and that is not good enough');
        expect(schema.validate(1).error).to.be.an.error('"value" is 1 and that is not good enough');
    });

    it('reaches own property', () => {

        const schema = Joi.object({
            x: Joi.alternatives([
                Joi.number(),
                Joi.object({
                    a: Joi.boolean().required()
                })
                    .when('.a', {
                        is: true,
                        then: {
                            b: Joi.string().required()
                        }
                    })
            ])
        });

        Helper.validate(schema, [
            [{ x: 1 }, true],
            [{ x: { a: true, b: 'x' } }, true]
        ]);
    });

    it('reaches parent', () => {

        const schema = {
            a: Joi.any(),
            a1: Joi.ref('a'),
            a2: Joi.ref('..a')
        };

        Helper.validate(schema, [
            [
                {
                    a: 1,
                    a1: 1,
                    a2: 1
                }, true
            ]
        ]);
    });

    it('reaches grandparent', () => {

        const schema = {
            a: Joi.any(),
            b: {
                a1: Joi.ref('...a'),
                a2: Joi.ref('...a')
            }
        };

        Helper.validate(schema, [
            [
                {
                    a: 1,
                    b: {
                        a1: 1,
                        a2: 1
                    }
                }, true
            ]
        ]);
    });

    it('reaches literal', () => {

        const schema = {
            a: Joi.any(),
            b: {
                '...a': Joi.any(),
                c: Joi.ref('...a', { separator: false })
            }
        };

        Helper.validate(schema, [
            [
                {
                    a: 1,
                    b: {
                        '...a': 2,
                        c: 2
                    }
                }, true
            ]
        ]);
    });

    it('reaches ancestor literal', () => {

        const schema = {
            a: Joi.any(),
            '...a': Joi.any(),
            b: {
                '...a': Joi.any(),
                c: Joi.ref('...a', { separator: false, ancestor: 2 })
            }
        };

        Helper.validate(schema, [
            [
                {
                    a: 1,
                    '...a': 3,
                    b: {
                        '...a': 2,
                        c: 3
                    }
                }, true
            ]
        ]);
    });

    it('reaches any level of the relative value structure', () => {

        const ix = Joi.ref('...i');

        const schema = {
            a: {
                b: {
                    c: {
                        d: Joi.any()
                    },
                    e: 2,
                    dx: Joi.ref('c.d'),
                    ex: Joi.ref('..e'),
                    ix,
                    gx: Joi.ref('....f.g'),
                    hx: Joi.ref('....h')
                },
                i: Joi.any()
            },
            f: {
                g: Joi.any()
            },
            h: Joi.any()
        };

        Helper.validate(schema, [
            [
                {
                    a: {
                        b: {
                            c: {
                                d: 1
                            },
                            e: 2,
                            dx: 1,
                            ex: 2,
                            gx: 3,
                            hx: 4,
                            ix: 5
                        },
                        i: 5
                    },
                    f: {
                        g: 3
                    },
                    h: 4
                }, true
            ],
            [
                {
                    a: {
                        b: {
                            c: {
                                d: 1
                            },
                            e: 2,
                            dx: 1,
                            ex: 2,
                            gx: 3,
                            hx: 4,
                            ix: 5
                        },
                        i: 10
                    },
                    f: {
                        g: 3
                    },
                    h: 4
                }, false, null, {
                    message: '"a.b.ix" must be one of [ref:...i]',
                    details: [
                        {
                            message: '"a.b.ix" must be one of [ref:...i]',
                            path: ['a', 'b', 'ix'],
                            type: 'any.allowOnly',
                            context: {
                                value: 5,
                                valids: [ix],
                                key: 'ix',
                                label: 'a.b.ix'
                            }
                        }
                    ]

                }
            ]
        ]);
    });

    it('reaches any level of the relative value structure (ancestor option)', () => {

        const ix = Joi.ref('i', { ancestor: 2 });

        const schema = {
            a: {
                b: {
                    c: {
                        d: Joi.any()
                    },
                    e: 2,
                    dx: Joi.ref('c.d', { ancestor: 1 }),
                    ex: Joi.ref('e', { ancestor: 1 }),
                    ix,
                    gx: Joi.ref('f.g', { ancestor: 3 }),
                    hx: Joi.ref('h', { ancestor: 3 })
                },
                i: Joi.any()
            },
            f: {
                g: Joi.any()
            },
            h: Joi.any()
        };

        Helper.validate(schema, [
            [
                {
                    a: {
                        b: {
                            c: {
                                d: 1
                            },
                            e: 2,
                            dx: 1,
                            ex: 2,
                            gx: 3,
                            hx: 4,
                            ix: 5
                        },
                        i: 5
                    },
                    f: {
                        g: 3
                    },
                    h: 4
                }, true
            ],
            [
                {
                    a: {
                        b: {
                            c: {
                                d: 1
                            },
                            e: 2,
                            dx: 1,
                            ex: 2,
                            gx: 3,
                            hx: 4,
                            ix: 5
                        },
                        i: 10
                    },
                    f: {
                        g: 3
                    },
                    h: 4
                }, false, null, {
                    message: '"a.b.ix" must be one of [ref:...i]',
                    details: [
                        {
                            message: '"a.b.ix" must be one of [ref:...i]',
                            path: ['a', 'b', 'ix'],
                            type: 'any.allowOnly',
                            context: {
                                value: 5,
                                valids: [ix],
                                key: 'ix',
                                label: 'a.b.ix'
                            }
                        }
                    ]

                }
            ]
        ]);
    });

    it('reaches own key value', () => {

        const object = Joi.object().schema('object');
        const schema = {
            key: Joi.object().when('key', {
                is: Joi.object().schema(),
                then: object,
                otherwise: Joi.object().pattern(/.*/, object)
            })
                .required()
        };

        Helper.validate(schema, [
            [{ key: object }, true],
            [{ key: 1 }, false, null, {
                message: '"key" must be an object',
                details: [
                    {
                        message: '"key" must be an object',
                        type: 'object.base',
                        path: ['key'],
                        context: {
                            key: 'key',
                            label: 'key',
                            value: 1
                        }
                    }
                ]
            }],
            [{ key: Joi.number() }, false, null, {
                message: '"key" must be a Joi schema of object type',
                details: [
                    {
                        message: '"key" must be a Joi schema of object type',
                        type: 'object.schema',
                        path: ['key'],
                        context: {
                            key: 'key',
                            label: 'key',
                            type: 'object',
                            value: Joi.number()
                        }
                    }
                ]
            }],
            [{ key: { a: 1 } }, false, null, {
                message: '"key.a" must be an object',
                details: [
                    {
                        message: '"key.a" must be an object',
                        type: 'object.base',
                        path: ['key', 'a'],
                        context: {
                            key: 'a',
                            label: 'key.a',
                            value: 1
                        }
                    }
                ]
            }],
            [{ key: { a: {} } }, false, null, {
                message: '"key.a" must be a Joi schema of object type',
                details: [
                    {
                        message: '"key.a" must be a Joi schema of object type',
                        type: 'object.schema',
                        path: ['key', 'a'],
                        context: {
                            key: 'a',
                            label: 'key.a',
                            type: 'object',
                            value: {}
                        }
                    }
                ]
            }]
        ]);
    });

    it('reaches into set and map', () => {

        const schema = Joi.object({
            a: {
                b: Joi.array()
                    .items({
                        x: Joi.number(),
                        y: Joi.object().cast('map')
                    })
                    .cast('set')
            },
            d: Joi.ref('a.b.2.y.w', { iterables: true })
        });

        const value = {
            a: {
                b: [
                    { x: 1 },
                    { x: 2 },
                    {
                        y: {
                            v: 4,
                            w: 5
                        }
                    }
                ]
            },
            d: 5
        };

        expect(schema.validate(value).error).to.not.exist();

        value.d = 6;
        expect(schema.validate(value).error).to.be.an.error('"d" must be one of [ref:a.b.2.y.w]');
    });

    it('errors on missing iterables flag when reaching into set and map', () => {

        const schema = Joi.object({
            a: {
                b: Joi.array()
                    .items({
                        x: Joi.number(),
                        y: Joi.object().cast('map')
                    })
                    .cast('set')
            },
            d: Joi.ref('a.b.2.y.w')
        });

        const value = {
            a: {
                b: [
                    { x: 1 },
                    { x: 2 },
                    {
                        y: {
                            v: 4,
                            w: 5
                        }
                    }
                ]
            },
            d: 5
        };

        expect(schema.validate(value).error).to.be.an.error('"d" must be one of [ref:a.b.2.y.w]');
    });

    it('throws on prefix + ancestor option)', () => {

        expect(() => Joi.ref('..x', { ancestor: 0 })).to.throw('Cannot combine prefix with ancestor option');
    });

    it('errors on ancestor circular dependency', () => {

        const schema = {
            a: {
                x: Joi.any(),
                b: {
                    c: {
                        d: Joi.ref('....b.x')
                    }
                }
            },
            b: {
                x: Joi.any(),
                y: {
                    z: {
                        o: Joi.ref('....a.x')
                    }
                }
            }
        };

        expect(() => Joi.compile(schema)).to.throw('Item cannot come after itself: b (a.b)');
    });

    it('references array length', () => {

        const ref = Joi.ref('length');
        const schema = Joi.object({
            x: Joi.array().items(Joi.number().valid(ref))
        });

        Helper.validate(schema, [
            [{ x: [1] }, true],
            [{ x: [2, 2] }, true],
            [{ x: [2, 2, 2] }, false, null, {
                message: '"x[0]" must be one of [ref:length]',
                details: [
                    {
                        message: '"x[0]" must be one of [ref:length]',
                        path: ['x', 0],
                        type: 'any.allowOnly',
                        context: {
                            value: 2,
                            valids: [ref],
                            key: 0,
                            label: 'x[0]'
                        }
                    }
                ]
            }]
        ]);
    });

    it('splits when based on own array length', () => {

        const pair = Joi.array().items(2);
        const lucky = Joi.array().items(7);

        const schema = Joi.object({
            x: Joi.array().when('.length', { is: 2, then: pair, otherwise: lucky })
        });

        Helper.validate(schema, [
            [{ x: [7] }, true],
            [{ x: [7, 7, 7] }, true],
            [{ x: [2, 2] }, true],
            [{ x: [2, 2, 2] }, false, null, {
                message: '"x[0]" must be one of [7]',
                details: [
                    {
                        message: '"x[0]" must be one of [7]',
                        path: ['x', 0],
                        type: 'any.allowOnly',
                        context: { value: 2, valids: [7], key: 0, label: 'x[0]' }
                    }
                ]
            }]
        ]);
    });

    it('references array item', () => {

        const ref = Joi.ref('0');
        const schema = Joi.array().ordered(Joi.number(), Joi.number().min(ref));

        Helper.validate(schema, [
            [[1, 2], true],
            [[10, 20], true],
            [[10, 5], false, null, {
                message: '"[1]" must be larger than or equal to ref:0',
                details: [
                    {
                        message: '"[1]" must be larger than or equal to ref:0',
                        path: [1],
                        type: 'number.min',
                        context: { limit: ref, value: 5, key: 1, label: '[1]' }
                    }
                ]
            }]
        ]);
    });

    it('references object own child', () => {

        const ref = Joi.ref('.length');
        const schema = Joi.object({
            length: Joi.number().required()
        })
            .length(ref)
            .unknown();

        expect(schema._refs.refs).to.equal([]);     // Does not register reference it itself

        Helper.validate(schema, [
            [{ length: 1 }, true],
            [{ length: 2, x: 3 }, true],
            [{ length: 2, x: 3, y: 4 }, false, null, {
                message: '"value" must have ref:.length children',
                details: [
                    {
                        message: '"value" must have ref:.length children',
                        path: [],
                        type: 'object.length',
                        context: {
                            value: { length: 2, x: 3, y: 4 },
                            limit: ref,
                            label: 'value'
                        }
                    }
                ]
            }]
        ]);
    });

    it('uses ref as a valid value', async () => {

        const ref = Joi.ref('b');
        const schema = Joi.object({
            a: ref,
            b: Joi.any()
        });

        const err = await expect(schema.validate({ a: 5, b: 6 })).to.reject();

        expect(err).to.be.an.error('"a" must be one of [ref:b]');
        expect(err.details).to.equal([{
            message: '"a" must be one of [ref:b]',
            path: ['a'],
            type: 'any.allowOnly',
            context: { value: 5, valids: [ref], label: 'a', key: 'a' }
        }]);

        Helper.validate(schema, [
            [{ a: 5 }, false, null, {
                message: '"a" must be one of [ref:b]',
                details: [{
                    message: '"a" must be one of [ref:b]',
                    path: ['a'],
                    type: 'any.allowOnly',
                    context: { value: 5, valids: [ref], label: 'a', key: 'a' }
                }]
            }],
            [{ b: 5 }, true],
            [{ a: 5, b: 5 }, true],
            [{ a: '5', b: '5' }, true]
        ]);
    });

    it('sets adjust function', () => {

        const adjust = (v) => 2 * v;
        const ref = Joi.ref('b', { adjust });
        const schema = Joi.object({
            a: ref,
            b: Joi.number()
        });

        Helper.validate(schema, [
            [{ b: 5 }, true],
            [{ a: 10, b: 5 }, true],
            [{ a: 10, b: '5' }, true],
            [{ a: 5 }, false, null, {
                message: '"a" must be one of [ref:b]',
                details: [{
                    message: '"a" must be one of [ref:b]',
                    path: ['a'],
                    type: 'any.allowOnly',
                    context: { value: 5, valids: [ref], label: 'a', key: 'a' }
                }]
            }],
            [{ a: 5, b: 5 }, false, null, {
                message: '"a" must be one of [ref:b]',
                details: [{
                    message: '"a" must be one of [ref:b]',
                    path: ['a'],
                    type: 'any.allowOnly',
                    context: { value: 5, valids: [ref], label: 'a', key: 'a' }
                }]
            }]
        ]);

        expect(schema.describe()).to.equal({
            type: 'object',
            children: {
                b: {
                    type: 'number',
                    flags: { unsafe: false },
                    invalids: [Infinity, -Infinity]
                },
                a: {
                    type: 'any',
                    flags: { allowOnly: true },
                    valids: [
                        {
                            ref: 'value',
                            key: 'b',
                            path: ['b'],
                            adjust
                        }
                    ]
                }
            }
        });
    });

    it('sets map', () => {

        const map = [[5, 10]];
        const ref = Joi.ref('b', { map });
        const schema = Joi.object({
            a: ref,
            b: Joi.number()
        });

        Helper.validate(schema, [
            [{ b: 5 }, true],
            [{ a: 10, b: 5 }, true],
            [{ a: 10, b: '5' }, true],
            [{ a: 5 }, false, null, {
                message: '"a" must be one of [ref:b]',
                details: [{
                    message: '"a" must be one of [ref:b]',
                    path: ['a'],
                    type: 'any.allowOnly',
                    context: { value: 5, valids: [ref], label: 'a', key: 'a' }
                }]
            }],
            [{ a: 5, b: 5 }, false, null, {
                message: '"a" must be one of [ref:b]',
                details: [{
                    message: '"a" must be one of [ref:b]',
                    path: ['a'],
                    type: 'any.allowOnly',
                    context: { value: 5, valids: [ref], label: 'a', key: 'a' }
                }]
            }]
        ]);

        expect(schema.describe()).to.equal({
            type: 'object',
            children: {
                b: {
                    type: 'number',
                    flags: { unsafe: false },
                    invalids: [Infinity, -Infinity]
                },
                a: {
                    type: 'any',
                    flags: { allowOnly: true },
                    valids: [
                        {
                            ref: 'value',
                            key: 'b',
                            path: ['b'],
                            map
                        }
                    ]
                }
            }
        });
    });

    it('uses ref as a valid value (empty key)', async () => {

        const ref = Joi.ref('');
        const schema = Joi.object({
            a: ref,
            '': Joi.any()
        });

        const err = await expect(schema.validate({ a: 5, '': 6 })).to.reject();
        expect(err).to.be.an.error('"a" must be one of [ref:]');
        expect(err.details).to.equal([{
            message: '"a" must be one of [ref:]',
            path: ['a'],
            type: 'any.allowOnly',
            context: { value: 5, valids: [ref], label: 'a', key: 'a' }
        }]);

        Helper.validate(schema, [
            [{ a: 5 }, false, null, {
                message: '"a" must be one of [ref:]',
                details: [{
                    message: '"a" must be one of [ref:]',
                    path: ['a'],
                    type: 'any.allowOnly',
                    context: { value: 5, valids: [ref], label: 'a', key: 'a' }
                }]
            }],
            [{ '': 5 }, true],
            [{ a: 5, '': 5 }, true],
            [{ a: '5', '': '5' }, true]
        ]);
    });

    it('uses ref with nested keys as a valid value', async () => {

        const ref = Joi.ref('b.c');
        const schema = Joi.object({
            a: ref,
            b: {
                c: Joi.any()
            }
        });

        const err = await expect(schema.validate({ a: 5, b: { c: 6 } })).to.reject();

        expect(err).to.be.an.error('"a" must be one of [ref:b.c]');
        expect(err.details).to.equal([{
            message: '"a" must be one of [ref:b.c]',
            path: ['a'],
            type: 'any.allowOnly',
            context: { value: 5, valids: [ref], label: 'a', key: 'a' }
        }]);

        Helper.validate(schema, [
            [{ a: 5 }, false, null, {
                message: '"a" must be one of [ref:b.c]',
                details: [{
                    message: '"a" must be one of [ref:b.c]',
                    path: ['a'],
                    type: 'any.allowOnly',
                    context: { value: 5, valids: [ref], label: 'a', key: 'a' }
                }]
            }],
            [{ b: { c: 5 } }, true],
            [{ a: 5, b: 5 }, false, null, {
                message: '"b" must be an object',
                details: [{
                    message: '"b" must be an object',
                    path: ['b'],
                    type: 'object.base',
                    context: { label: 'b', key: 'b', value: 5 }
                }]
            }],
            [{ a: '5', b: { c: '5' } }, true]
        ]);
    });

    it('uses ref with combined nested keys in sub child', async () => {

        const ref = Joi.ref('b.c');
        expect(ref.root).to.equal('b');

        const schema = Joi.object({
            a: ref,
            b: {
                c: Joi.any()
            }
        });

        const input = { a: 5, b: { c: 5 } };
        await expect(schema.validate(input)).to.not.reject();

        const parent = Joi.object({
            e: schema
        });

        await expect(parent.validate({ e: input })).to.not.reject();
    });

    it('uses ref reach options', async () => {

        const ref = Joi.ref('b/c', { separator: '/' });
        expect(ref.root).to.equal('b');

        const schema = Joi.object({
            a: ref,
            b: {
                c: Joi.any()
            }
        });

        await expect(schema.validate({ a: 5, b: { c: 5 } })).to.not.reject();
    });

    it('ignores the order in which keys are defined', async () => {

        const ab = Joi.object({
            a: {
                c: Joi.number()
            },
            b: Joi.ref('a.c')
        });

        await expect(ab.validate({ a: { c: '5' }, b: 5 })).to.not.reject();

        const ba = Joi.object({
            b: Joi.ref('a.c'),
            a: {
                c: Joi.number()
            }
        });

        await expect(ba.validate({ a: { c: '5' }, b: 5 })).to.not.reject();
    });

    it('uses ref as default value', async () => {

        const schema = Joi.object({
            a: Joi.default(Joi.ref('b')),
            b: Joi.any()
        });

        const value = await schema.validate({ b: 6 });
        expect(value).to.equal({ a: 6, b: 6 });
    });

    it('uses ref mixed with normal values', async () => {

        const schema = Joi.object({
            a: Joi.number().valid(1, Joi.ref('b')),
            b: Joi.any()
        });

        expect(await schema.validate({ a: 6, b: 6 })).to.equal({ a: 6, b: 6 });
        expect(await schema.validate({ a: 1, b: 6 })).to.equal({ a: 1, b: 6 });
        await expect(schema.validate({ a: 6, b: 1 })).to.reject();
    });

    it('uses ref as default value regardless of order', async () => {

        const ab = Joi.object({
            a: Joi.default(Joi.ref('b')),
            b: Joi.number()
        });

        const value = await ab.validate({ b: '6' });
        expect(value).to.equal({ a: 6, b: 6 });

        const ba = Joi.object({
            b: Joi.number(),
            a: Joi.default(Joi.ref('b'))
        });

        const value2 = await ba.validate({ b: '6' });
        expect(value2).to.equal({ a: 6, b: 6 });
    });

    it('ignores the order in which keys are defined with alternatives', () => {

        const ref1 = Joi.ref('a.c');
        const ref2 = Joi.ref('c');
        const a = { c: Joi.number() };
        const b = [ref1, ref2];
        const c = Joi.number();

        for (const value of [{ a, b, c }, { b, a, c }, { b, c, a }, { a, c, b }, { c, a, b }, { c, b, a }]) {
            Helper.validate(value, [
                [{ a: {} }, true],
                [{ a: { c: '5' }, b: 5 }, true],
                [{ a: { c: '5' }, b: 6, c: '6' }, true],
                [{ a: { c: '5' }, b: 7, c: '6' }, false, null, {
                    message: '"b" does not match any of the allowed types',
                    details: [
                        {
                            message: '"b" does not match any of the allowed types',
                            type: 'alternatives.match',
                            path: ['b'],
                            context: {
                                key: 'b',
                                label: 'b',
                                message: '"b" must be one of [ref:a.c]. "b" must be one of [ref:c]',
                                value: 7,
                                details: [
                                    {
                                        message: '"b" must be one of [ref:a.c]',
                                        path: ['b'],
                                        type: 'any.allowOnly',
                                        context: { value: 7, valids: [ref1], label: 'b', key: 'b' }
                                    },
                                    {
                                        message: '"b" must be one of [ref:c]',
                                        path: ['b'],
                                        type: 'any.allowOnly',
                                        context: { value: 7, valids: [ref2], label: 'b', key: 'b' }
                                    }
                                ]
                            }
                        }
                    ]
                }]
            ]);
        }
    });

    it('uses context as default value', async () => {

        const schema = Joi.object({
            a: Joi.default(Joi.ref('$x')),
            b: Joi.any()
        });

        const value = await schema.validate({ b: 6 }, { context: { x: 22 } });
        expect(value).to.equal({ a: 22, b: 6 });
    });

    it('uses context as default value with custom prefix', async () => {

        const schema = Joi.object({
            a: Joi.default(Joi.ref('@x', { prefix: { global: '@' } })),
            b: Joi.any()
        });

        const value = await schema.validate({ b: 6 }, { context: { x: 22 } });
        expect(value).to.equal({ a: 22, b: 6 });
    });

    it('uses context as a valid value', async () => {

        const ref = Joi.ref('$x');
        const schema = Joi.object({
            a: ref,
            b: Joi.any()
        });

        const err = await expect(schema.validate({ a: 5, b: 6 }, { context: { x: 22 } })).to.reject();
        expect(err).to.be.an.error('"a" must be one of [ref:global:x]');
        expect(err.details).to.equal([{
            message: '"a" must be one of [ref:global:x]',
            path: ['a'],
            type: 'any.allowOnly',
            context: { value: 5, valids: [ref], label: 'a', key: 'a' }
        }]);

        Helper.validateOptions(schema, [
            [{ a: 5 }, false, null, {
                message: '"a" must be one of [ref:global:x]',
                details: [{
                    message: '"a" must be one of [ref:global:x]',
                    path: ['a'],
                    type: 'any.allowOnly',
                    context: { value: 5, valids: [ref], label: 'a', key: 'a' }
                }]
            }],
            [{ a: 22 }, true],
            [{ b: 5 }, true],
            [{ a: 22, b: 5 }, true],
            [{ a: '22', b: '5' }, false, null, {
                message: '"a" must be one of [ref:global:x]',
                details: [{
                    message: '"a" must be one of [ref:global:x]',
                    path: ['a'],
                    type: 'any.allowOnly',
                    context: { value: '22', valids: [ref], label: 'a', key: 'a' }
                }]
            }]
        ], { context: { x: 22 } });
    });

    it('uses context in when condition', () => {

        const schema = {
            a: Joi.boolean().when('$x', { is: Joi.exist(), otherwise: Joi.forbidden() })
        };

        Helper.validate(schema, [
            [{}, true],
            [{ a: 'x' }, false, null, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a', value: 'x' }
                }]
            }],
            [{ a: true }, false, null, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a', value: true }
                }]
            }],
            [{}, true, { context: {} }],
            [{ a: 'x' }, false, { context: {} }, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a', value: 'x' }
                }]
            }],
            [{ a: true }, false, { context: {} }, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a', value: true }
                }]
            }],
            [{}, true, { context: { x: 1 } }],
            [{ a: 'x' }, false, { context: { x: 1 } }, {
                message: '"a" must be a boolean',
                details: [{
                    message: '"a" must be a boolean',
                    path: ['a'],
                    type: 'boolean.base',
                    context: { label: 'a', key: 'a', value: 'x' }
                }]
            }],
            [{ a: true }, true, { context: { x: 1 } }]
        ]);
    });

    it('uses nested context in when condition', () => {

        const schema = {
            a: Joi.boolean().when('$x.y', { is: Joi.exist(), otherwise: Joi.forbidden() })
        };

        Helper.validate(schema, [
            [{}, true],
            [{ a: 'x' }, false, null, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a', value: 'x' }
                }]
            }],
            [{ a: true }, false, null, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a', value: true }
                }]
            }],
            [{}, true, { context: {} }],
            [{ a: 'x' }, false, { context: {} }, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a', value: 'x' }
                }]
            }],
            [{ a: true }, false, { context: {} }, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a', value: true }
                }]
            }],
            [{}, true, { context: { x: 1 } }],
            [{ a: 'x' }, false, { context: { x: 1 } }, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a', value: 'x' }
                }]
            }],
            [{ a: true }, false, { context: { x: 1 } }, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a', value: true }
                }]
            }],
            [{}, true, { context: { x: {} } }],
            [{ a: 'x' }, false, { context: { x: {} } }, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a', value: 'x' }
                }]
            }],
            [{ a: true }, false, { context: { x: {} } }, {
                message: '"a" is not allowed',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a', value: true }
                }]
            }],
            [{}, true, { context: { x: { y: 1 } } }],
            [{ a: 'x' }, false, { context: { x: { y: 1 } } }, {
                message: '"a" must be a boolean',
                details: [{
                    message: '"a" must be a boolean',
                    path: ['a'],
                    type: 'boolean.base',
                    context: { label: 'a', key: 'a', value: 'x' }
                }]
            }],
            [{ a: true }, true, { context: { x: { y: 1 } } }]
        ]);
    });

    it('describes schema with ref', () => {

        const desc = Joi
            .valid(Joi.ref('a.b'))
            .invalid(Joi.ref('$b.c'))
            .default(Joi.ref('a.b'))
            .when('a.b', {
                is: Joi.date().min(Joi.ref('a.b')).max(Joi.ref('a.b')),
                then: Joi.number().min(Joi.ref('a.b')).max(Joi.ref('a.b')).greater(Joi.ref('a.b')).less(Joi.ref('a.b')),
                otherwise: Joi.object({
                    a: Joi.string().min(Joi.ref('b.c')).max(Joi.ref('b.c')).length(Joi.ref('b.c'))
                }).with('a', 'b').without('b', 'c').assert('a.b', Joi.ref('a.b'))
            })
            .describe();

        expect(desc).to.equal({
            type: 'alternatives',
            flags: { presence: 'ignore' },
            base: {
                type: 'any',
                flags: {
                    allowOnly: true,
                    default: { ref: 'value', key: 'a.b', path: ['a', 'b'] }
                },
                invalids: [{ ref: 'global', key: 'b.c', path: ['b', 'c'] }],
                valids: [{ ref: 'value', key: 'a.b', path: ['a', 'b'] }]
            },
            alternatives: [{
                ref: { ref: 'value', key: 'a.b', path: ['a', 'b'] },
                is: {
                    type: 'date',
                    rules: [
                        { name: 'min', arg: { ref: 'value', key: 'a.b', path: ['a', 'b'] } },
                        { name: 'max', arg: { ref: 'value', key: 'a.b', path: ['a', 'b'] } }
                    ]
                },
                then: {
                    type: 'number',
                    flags: { allowOnly: true, default: { ref: 'value', key: 'a.b', path: ['a', 'b'] }, unsafe: false },
                    valids: [{ ref: 'value', key: 'a.b', path: ['a', 'b'] }],
                    invalids: [{ ref: 'global', key: 'b.c', path: ['b', 'c'] }, Infinity, -Infinity],
                    rules: [
                        { name: 'min', arg: { ref: 'value', key: 'a.b', path: ['a', 'b'] } },
                        { name: 'max', arg: { ref: 'value', key: 'a.b', path: ['a', 'b'] } },
                        { name: 'greater', arg: { ref: 'value', key: 'a.b', path: ['a', 'b'] } },
                        { name: 'less', arg: { ref: 'value', key: 'a.b', path: ['a', 'b'] } }
                    ]
                },
                otherwise: {
                    type: 'object',
                    flags: { allowOnly: true, default: { ref: 'value', key: 'a.b', path: ['a', 'b'] } },
                    valids: [{ ref: 'value', key: 'a.b', path: ['a', 'b'] }],
                    invalids: [{ ref: 'global', key: 'b.c', path: ['b', 'c'] }],
                    rules: [{
                        name: 'assert',
                        arg: {
                            schema: {
                                type: 'any',
                                flags: { allowOnly: true },
                                valids: [{ ref: 'value', key: 'a.b', path: ['a', 'b'] }]
                            },
                            ref: { ref: 'value', key: 'a.b', path: ['a', 'b'] }
                        }
                    }],
                    children: {
                        a: {
                            type: 'string',
                            invalids: [''],
                            rules: [
                                { name: 'min', arg: { limit: { ref: 'value', key: 'b.c', path: ['b', 'c'] } } },
                                { name: 'max', arg: { limit: { ref: 'value', key: 'b.c', path: ['b', 'c'] } } },
                                { name: 'length', arg: { limit: { ref: 'value', key: 'b.c', path: ['b', 'c'] } } }
                            ]
                        }
                    },
                    dependencies: [{
                        type: 'with',
                        key: 'a',
                        peers: ['b']
                    },
                    {
                        type: 'without',
                        key: 'b',
                        peers: ['c']
                    }]
                }
            }]
        });
    });

    describe('create()', () => {

        it('throws when key is missing', () => {

            expect(() => {

                Joi.ref(5);
            }).to.throw('Invalid reference key: 5');
        });

        it('finds root with default separator', () => {

            expect(Joi.ref('a.b.c').root).to.equal('a');
        });

        it('finds root with default separator and options', () => {

            expect(Joi.ref('a.b.c', {}).root).to.equal('a');
        });

        it('finds root with custom separator', () => {

            expect(Joi.ref('a+b+c', { separator: '+' }).root).to.equal('a');
        });
    });
});
