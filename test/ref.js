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

    it('uses ref as a valid value', async () => {

        const ref = Joi.ref('b');
        const schema = Joi.object({
            a: ref,
            b: Joi.any()
        });

        const err = await expect(schema.validate({ a: 5, b: 6 })).to.reject();

        expect(err).to.be.an.error('child "a" fails because ["a" must be one of [ref:b]]');
        expect(err.details).to.equal([{
            message: '"a" must be one of [ref:b]',
            path: ['a'],
            type: 'any.allowOnly',
            context: { value: 5, valids: [ref], label: 'a', key: 'a' }
        }]);

        Helper.validate(schema, [
            [{ a: 5 }, false, null, {
                message: 'child "a" fails because ["a" must be one of [ref:b]]',
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

    it('uses ref as a valid value (empty key)', async () => {

        const ref = Joi.ref('');
        const schema = Joi.object({
            a: ref,
            '': Joi.any()
        });

        const err = await expect(schema.validate({ a: 5, '': 6 })).to.reject();
        expect(err).to.be.an.error('child "a" fails because ["a" must be one of [ref:]]');
        expect(err.details).to.equal([{
            message: '"a" must be one of [ref:]',
            path: ['a'],
            type: 'any.allowOnly',
            context: { value: 5, valids: [ref], label: 'a', key: 'a' }
        }]);

        Helper.validate(schema, [
            [{ a: 5 }, false, null, {
                message: 'child "a" fails because ["a" must be one of [ref:]]',
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

        expect(err).to.be.an.error('child "a" fails because ["a" must be one of [ref:b.c]]');
        expect(err.details).to.equal([{
            message: '"a" must be one of [ref:b.c]',
            path: ['a'],
            type: 'any.allowOnly',
            context: { value: 5, valids: [ref], label: 'a', key: 'a' }
        }]);

        Helper.validate(schema, [
            [{ a: 5 }, false, null, {
                message: 'child "a" fails because ["a" must be one of [ref:b.c]]',
                details: [{
                    message: '"a" must be one of [ref:b.c]',
                    path: ['a'],
                    type: 'any.allowOnly',
                    context: { value: 5, valids: [ref], label: 'a', key: 'a' }
                }]
            }],
            [{ b: { c: 5 } }, true],
            [{ a: 5, b: 5 }, false, null, {
                message: 'child "b" fails because ["b" must be an object]',
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

        Helper.validate({ a, b, c }, [
            [{ a: {} }, true],
            [{ a: { c: '5' }, b: 5 }, true],
            [{ a: { c: '5' }, b: 6, c: '6' }, true],
            [{ a: { c: '5' }, b: 7, c: '6' }, false, null, {
                message: 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]',
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
            }]
        ]);

        Helper.validate({ b, a, c }, [
            [{ a: {} }, true],
            [{ a: { c: '5' }, b: 5 }, true],
            [{ a: { c: '5' }, b: 6, c: '6' }, true],
            [{ a: { c: '5' }, b: 7, c: '6' }, false, null, {
                message: 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]',
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
            }]
        ]);

        Helper.validate({ b, c, a }, [
            [{ a: {} }, true],
            [{ a: { c: '5' }, b: 5 }, true],
            [{ a: { c: '5' }, b: 6, c: '6' }, true],
            [{ a: { c: '5' }, b: 7, c: '6' }, false, null, {
                message: 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]',
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
            }]
        ]);

        Helper.validate({ a, c, b }, [
            [{ a: {} }, true],
            [{ a: { c: '5' }, b: 5 }, true],
            [{ a: { c: '5' }, b: 6, c: '6' }, true],
            [{ a: { c: '5' }, b: 7, c: '6' }, false, null, {
                message: 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]',
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
            }]
        ]);

        Helper.validate({ c, a, b }, [
            [{ a: {} }, true],
            [{ a: { c: '5' }, b: 5 }, true],
            [{ a: { c: '5' }, b: 6, c: '6' }, true],
            [{ a: { c: '5' }, b: 7, c: '6' }, false, null, {
                message: 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]',
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
            }]
        ]);

        Helper.validate({ c, b, a }, [
            [{ a: {} }, true],
            [{ a: { c: '5' }, b: 5 }, true],
            [{ a: { c: '5' }, b: 6, c: '6' }, true],
            [{ a: { c: '5' }, b: 7, c: '6' }, false, null, {
                message: 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]',
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
            }]
        ]);
    });

    it('uses context as default value', async () => {

        const schema = Joi.object({
            a: Joi.default(Joi.ref('$x')),
            b: Joi.any()
        });

        const value = await Joi.validate({ b: 6 }, schema, { context: { x: 22 } });
        expect(value).to.equal({ a: 22, b: 6 });
    });

    it('uses context as default value with custom prefix', async () => {

        const schema = Joi.object({
            a: Joi.default(Joi.ref('%x', { contextPrefix: '%' })),
            b: Joi.any()
        });

        const value = await Joi.validate({ b: 6 }, schema, { context: { x: 22 } });
        expect(value).to.equal({ a: 22, b: 6 });
    });

    it('uses context as a valid value', async () => {

        const ref = Joi.ref('$x');
        const schema = Joi.object({
            a: ref,
            b: Joi.any()
        });

        const err = await expect(Joi.validate({ a: 5, b: 6 }, schema, { context: { x: 22 } })).to.reject();
        expect(err).to.be.an.error('child "a" fails because ["a" must be one of [context:x]]');
        expect(err.details).to.equal([{
            message: '"a" must be one of [context:x]',
            path: ['a'],
            type: 'any.allowOnly',
            context: { value: 5, valids: [ref], label: 'a', key: 'a' }
        }]);

        Helper.validateOptions(schema, [
            [{ a: 5 }, false, null, {
                message: 'child "a" fails because ["a" must be one of [context:x]]',
                details: [{
                    message: '"a" must be one of [context:x]',
                    path: ['a'],
                    type: 'any.allowOnly',
                    context: { value: 5, valids: [ref], label: 'a', key: 'a' }
                }]
            }],
            [{ a: 22 }, true],
            [{ b: 5 }, true],
            [{ a: 22, b: 5 }, true],
            [{ a: '22', b: '5' }, false, null, {
                message: 'child "a" fails because ["a" must be one of [context:x]]',
                details: [{
                    message: '"a" must be one of [context:x]',
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
                message: 'child "a" fails because ["a" is not allowed]',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [{ a: true }, false, null, {
                message: 'child "a" fails because ["a" is not allowed]',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [{}, true, { context: {} }],
            [{ a: 'x' }, false, { context: {} }, {
                message: 'child "a" fails because ["a" is not allowed]',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [{ a: true }, false, { context: {} }, {
                message: 'child "a" fails because ["a" is not allowed]',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [{}, true, { context: { x: 1 } }],
            [{ a: 'x' }, false, { context: { x: 1 } }, {
                message: 'child "a" fails because ["a" must be a boolean]',
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
                message: 'child "a" fails because ["a" is not allowed]',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [{ a: true }, false, null, {
                message: 'child "a" fails because ["a" is not allowed]',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [{}, true, { context: {} }],
            [{ a: 'x' }, false, { context: {} }, {
                message: 'child "a" fails because ["a" is not allowed]',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [{ a: true }, false, { context: {} }, {
                message: 'child "a" fails because ["a" is not allowed]',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [{}, true, { context: { x: 1 } }],
            [{ a: 'x' }, false, { context: { x: 1 } }, {
                message: 'child "a" fails because ["a" is not allowed]',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [{ a: true }, false, { context: { x: 1 } }, {
                message: 'child "a" fails because ["a" is not allowed]',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [{}, true, { context: { x: {} } }],
            [{ a: 'x' }, false, { context: { x: {} } }, {
                message: 'child "a" fails because ["a" is not allowed]',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [{ a: true }, false, { context: { x: {} } }, {
                message: 'child "a" fails because ["a" is not allowed]',
                details: [{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'any.unknown',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [{}, true, { context: { x: { y: 1 } } }],
            [{ a: 'x' }, false, { context: { x: { y: 1 } } }, {
                message: 'child "a" fails because ["a" must be a boolean]',
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
                    a: Joi.string().min(Joi.ref('a.b')).max(Joi.ref('a.b')).length(Joi.ref('a.b'))
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
                    default: 'ref:a.b'
                },
                invalids: ['context:b.c'],
                valids: ['ref:a.b']
            },
            alternatives: [{
                ref: 'ref:a.b',
                is: {
                    type: 'date',
                    rules: [
                        { name: 'min', arg: 'ref:a.b' },
                        { name: 'max', arg: 'ref:a.b' }
                    ]
                },
                then: {
                    type: 'number',
                    flags: { allowOnly: true, default: 'ref:a.b', unsafe: false },
                    valids: ['ref:a.b'],
                    invalids: ['context:b.c', Infinity, -Infinity],
                    rules: [
                        { name: 'min', arg: 'ref:a.b' },
                        { name: 'max', arg: 'ref:a.b' },
                        { name: 'greater', arg: 'ref:a.b' },
                        { name: 'less', arg: 'ref:a.b' }
                    ]
                },
                otherwise: {
                    type: 'object',
                    flags: { allowOnly: true, default: 'ref:a.b' },
                    valids: ['ref:a.b'],
                    invalids: ['context:b.c'],
                    rules: [{
                        name: 'assert',
                        arg: {
                            schema: {
                                type: 'any',
                                flags: { allowOnly: true },
                                valids: ['ref:a.b']
                            },
                            ref: 'ref:a.b'
                        }
                    }],
                    children: {
                        a: {
                            type: 'string',
                            invalids: [''],
                            rules: [
                                { name: 'min', arg: 'ref:a.b' },
                                { name: 'max', arg: 'ref:a.b' },
                                { name: 'length', arg: 'ref:a.b' }
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
