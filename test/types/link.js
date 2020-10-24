'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('link', () => {

    it('errors on uninitialized link', () => {

        expect(() => Joi.link().validate(1)).to.throw('Uninitialized link schema');
    });

    it('links named schema (explicit)', () => {

        const schema = Joi.object({
            a: [Joi.string(), Joi.number()],
            b: Joi.link('#type.a')
        })
            .id('type');

        Helper.validate(schema, [
            [{ a: 1, b: 2 }, true],
            [{ a: '1', b: '2' }, true],
            [{ a: [1], b: '2' }, false, '"a" must be one of [string, number]']
        ]);
    });

    it('links named schema (by ref)', () => {

        const schema = Joi.object({
            a: [Joi.string(), Joi.number()],
            b: Joi.link().ref('#type.a')
        })
            .id('type');

        Helper.validate(schema, [
            [{ a: 1, b: 2 }, true],
            [{ a: '1', b: '2' }, true],
            [{ a: [1], b: '2' }, false, '"a" must be one of [string, number]']
        ]);
    });

    it('links named schema (implicit)', () => {

        const schema = Joi.object({
            a: Joi.object({
                b: Joi.object({
                    c: Joi.object({
                        d: Joi.link('#a.e.f')
                    })
                }),
                e: Joi.object({
                    f: [Joi.string(), Joi.number()]
                })
            })
        });

        Helper.validate(schema, [
            [{ a: { b: { c: { d: '1' } }, e: { f: '2' } } }, true],
            [{ a: { b: { c: { d: 1 } }, e: { f: 2 } } }, true],
            [{ a: { b: { c: { d: {} } }, e: { f: 2 } } }, false, '"a.b.c.d" must be one of [string, number]']
        ]);
    });

    it('links shared schema', () => {

        const shared = Joi.number().id('shared');

        const schema = Joi.object({
            a: [Joi.string(), Joi.link('#shared')],
            b: Joi.link('#type.a')
        })
            .shared(Joi.any().id('ignore'))
            .shared(shared)
            .id('type');

        Helper.validate(schema, [
            [{ a: 1, b: 2 }, true],
            [{ a: '1', b: '2' }, true],
            [{ a: [1], b: '2' }, false, '"a" must be one of [string, number]']
        ]);
    });

    it('links schema nodes', () => {

        const schema = Joi.object({
            a: [Joi.string(), Joi.number()],
            b: Joi.link('a')
        });

        Helper.validate(schema, [
            [{ a: 1, b: 2 }, true],
            [{ a: '1', b: '2' }, true],
            [{ a: [1], b: '2' }, false, '"a" must be one of [string, number]']
        ]);
    });

    it('links schema cousin nodes', () => {

        const schema = Joi.object({
            a: [Joi.string(), Joi.number()],
            b: {
                c: Joi.link('...a')
            }
        });

        Helper.validate(schema, [
            [{ a: 1, b: { c: 2 } }, true],
            [{ a: '1', b: { c: '2' } }, true],
            [{ a: [1], b: { c: '2' } }, false, '"a" must be one of [string, number]']
        ]);
    });

    it('links schema cousin nodes (root)', () => {

        const schema = Joi.object({
            a: [Joi.string(), Joi.number()],
            b: {
                c: Joi.link('/a')
            }
        });

        Helper.validate(schema, [
            [{ a: 1, b: { c: 2 } }, true],
            [{ a: '1', b: { c: '2' } }, true],
            [{ a: [1], b: { c: '2' } }, false, '"a" must be one of [string, number]']
        ]);
    });

    it('validates a recursive schema', () => {

        const schema = Joi.object({
            name: Joi.string().required(),
            keys: Joi.array()
                .items(Joi.link('...'))         // .item .array .schema
        });

        expect(schema.validate({ name: 'foo', keys: [{ name: 'bar' }] }).error).to.not.exist();

        Helper.validate(schema, [
            [{ name: 'foo' }, true],
            [{ name: 'foo', keys: [] }, true],
            [{ name: 'foo', keys: [{ name: 'bar' }] }, true],
            [{ name: 'foo', keys: [{ name: 'bar', keys: [{ name: 'baz' }] }] }, true],
            [{ name: 'foo', keys: [{ name: 'bar', keys: [{ name: 'baz', keys: [{ name: 'qux' }] }] }] }, true],
            [{ name: 'foo', keys: [{ name: 'bar', keys: [{ name: 'baz', keys: [{ name: 42 }] }] }] }, false, {
                message: '"keys[0].keys[0].keys[0].name" must be a string',
                path: ['keys', 0, 'keys', 0, 'keys', 0, 'name'],
                type: 'string.base',
                context: { value: 42, label: 'keys[0].keys[0].keys[0].name', key: 'name' }
            }]
        ]);
    });

    it('validates a recursive schema (root)', () => {

        const schema = Joi.object({
            name: Joi.string().required(),
            keys: Joi.array()
                .items(Joi.link('/'))
        });

        expect(schema.validate({ name: 'foo', keys: [{ name: 'bar' }] }).error).to.not.exist();

        Helper.validate(schema, [
            [{ name: 'foo' }, true],
            [{ name: 'foo', keys: [] }, true],
            [{ name: 'foo', keys: [{ name: 'bar' }] }, true],
            [{ name: 'foo', keys: [{ name: 'bar', keys: [{ name: 'baz' }] }] }, true],
            [{ name: 'foo', keys: [{ name: 'bar', keys: [{ name: 'baz', keys: [{ name: 'qux' }] }] }] }, true],
            [{ name: 'foo', keys: [{ name: 'bar', keys: [{ name: 'baz', keys: [{ name: 42 }] }] }] }, false, {
                message: '"keys[0].keys[0].keys[0].name" must be a string',
                path: ['keys', 0, 'keys', 0, 'keys', 0, 'name'],
                type: 'string.base',
                context: { value: 42, label: 'keys[0].keys[0].keys[0].name', key: 'name' }
            }]
        ]);
    });

    it('caches resolved schema', () => {

        const link = Joi.link('x');
        const schema = Joi.object({
            a: {
                y: link,
                x: 1
            },
            b: {
                y: link,
                x: 2
            }
        });

        Helper.validate(schema, [
            [{ a: { y: 1 }, b: { y: 1 } }, true],
            [{ a: { y: 1 }, b: { y: 2 } }, false, '"b.y" must be [1]']
        ]);
    });

    it('re-resolves schema', () => {

        const link = Joi.link('x').relative();
        const schema = Joi.object({
            a: {
                y: link,
                x: 1
            },
            b: {
                y: link,
                x: 2
            }
        });

        Helper.validate(schema, [
            [{ a: { y: 1 }, b: { y: 2 } }, true],
            [{ a: { y: 1 }, b: { y: 1 } }, false, '"b.y" must be [2]']
        ]);
    });

    it('validates a recursive schema (in alternatives)', () => {

        const schema = Joi.object({
            happy: Joi.boolean().required(),
            children: Joi.object()
                .pattern(/.*/, [
                    'none',
                    Joi.link('....')        // .alternatives .child .children .schema
                ])
        });

        Helper.validate(schema, [
            [{ happy: true }, true],
            [{ happy: true, children: { a: 'none' } }, true],
            [{ happy: true, children: { a: { happy: false } } }, true],
            [{ happy: true, children: { a: { happy: false }, b: { happy: true }, c: 'none' } }, true],
            [{ happy: true, children: { a: { happy: false }, b: { happy: true }, c: {} } }, false, {
                context: { key: 'happy', label: 'children.c.happy' },
                message: '"children.c.happy" is required',
                path: ['children', 'c', 'happy'],
                type: 'any.required'
            }]
        ]);
    });

    it('concats schemas with links', () => {

        const a = Joi.object({
            a: [Joi.string(), Joi.number()],
            b: Joi.link('a')
        });

        const b = Joi.object({ c: Joi.number() });

        const schema = b.concat(a);

        Helper.validate(schema, [
            [{ a: 1, b: 2, c: 3 }, true],
            [{ a: '1', b: '2', c: 3 }, true],
            [{ a: [1], b: '2' }, false, '"a" must be one of [string, number]']
        ]);
    });

    it('errors on invalid reference', () => {

        expect(() => Joi.link('.')).to.throw('Link cannot reference itself');
    });

    it('errors on invalid reference type', () => {

        expect(() => Joi.link('$x')).to.throw('Invalid reference type: global');
    });

    it('errors on out of boundaries reference', () => {

        const schema = Joi.object({
            x: Joi.link('...')
        });

        expect(() => schema.validate({ x: 123 })).to.throw('"x" contains link reference "ref:..." which is outside of schema boundaries');
    });

    it('errors on missing reference (relative)', () => {

        const schema = Joi.object({
            x: Joi.link('y')
        });

        expect(() => schema.validate({ x: 123 })).to.throw('"x" contains link reference "ref:y" to non-existing schema');
    });

    it('errors on missing reference (named)', () => {

        const schema = Joi.object({
            x: Joi.link('#y')
        });

        expect(() => schema.validate({ x: 123 })).to.throw('"x" contains link reference "ref:local:y" which is outside of schema boundaries');
    });

    it('errors on referenced link', () => {

        const schema = Joi.object({
            x: Joi.link('y'),
            y: Joi.link('z'),
            z: Joi.any()
        });

        expect(() => schema.validate({ x: 123 })).to.throw('"x" contains link reference "ref:y" which is another link');
    });

    describe('when()', () => {

        it('validates a schema with when()', () => {

            const schema = Joi.object({
                must: Joi.boolean().required(),
                child: Joi.link('..')
                    .when('must', { then: Joi.required() })
            });

            Helper.validate(schema, [
                [{ must: false }, true],
                [{ must: false, child: { must: false } }, true],
                [{ must: true, child: { must: false } }, true],
                [{ must: true, child: { must: true, child: { must: false } } }, true]
            ]);
        });

        it('changes the resolved schema', () => {

            const schema = Joi.object({
                category: Joi.valid('x', 'y').required(),
                subs: Joi.array()
                    .items(Joi.link('#unit').when('...category', { is: 'y', then: Joi.object({ subs: Joi.forbidden() }) }))
                    .min(1)
            })
                .id('unit');

            Helper.validate(schema, [
                [{ category: 'x', subs: [{ category: 'x' }] }, true],
                [{ category: 'y', subs: [{ category: 'x' }] }, true],
                [{ category: 'y', subs: [{ category: 'x', subs: [{ category: 'x' }] }] }, false, {
                    message: '"subs[0].subs" is not allowed',
                    path: ['subs', 0, 'subs'],
                    type: 'any.unknown',
                    context: { label: 'subs[0].subs', value: [{ category: 'x' }], key: 'subs' }
                }]
            ]);
        });
    });

    describe('concat()', () => {

        it('errors on concat of link to link', () => {

            expect(() => Joi.link('..').concat(Joi.link('..'))).to.throw('Cannot merge type link with another link');
        });

        it('combines link with any', () => {

            const a = Joi.object({
                x: Joi.link('..')
            });

            const b = Joi.object({
                x: Joi.forbidden()
            });

            Helper.validate(a, [
                [{ x: {} }, true]
            ]);

            Helper.validate(a.concat(b), [
                [{ x: {} }, false, '"x" is not allowed']
            ]);
        });

        it('applies concat after ref resolved', () => {

            const shared = Joi.object({
                a: Joi.number()
            })
                .id('shared');

            const schema = Joi.object({
                x: Joi.link('#shared')
                    .concat(Joi.object({ a: 3 }))
            })
                .shared(shared);

            Helper.validate(schema, [
                [{ x: { a: 3 } }, true],
                [{ x: { a: 2 } }, false, {
                    message: '"x.a" must be [3]',
                    path: ['x', 'a'],
                    type: 'any.only',
                    context: { label: 'x.a', value: 2, key: 'a', valids: [3] }
                }]
            ]);
        });

        it('applies concat after ref resolved (with when)', () => {

            const shared = Joi.object({
                a: Joi.number()
            })
                .id('shared');

            const schema = Joi.object({
                w: Joi.boolean(),
                x: Joi.link('#shared')
                    .when('w', { then: Joi.object({ a: 4 }) })
                    .concat(Joi.object({ a: Joi.valid(3) }))
            })
                .shared(shared);

            Helper.validate(schema, [
                [{ x: { a: 3 } }, true],
                [{ w: true, x: { a: 3 } }, true],
                [{ w: true, x: { a: 4 } }, true],
                [{ x: { a: 2 } }, false, {
                    message: '"x.a" must be [3]',
                    path: ['x', 'a'],
                    type: 'any.only',
                    context: { label: 'x.a', value: 2, key: 'a', valids: [3] }
                }]
            ]);
        });

        it('combines link and linked whens', () => {

            const schema = Joi.object({
                type: Joi.valid('a', 'b').required()
            })
                .when('.type', [
                    {
                        is: 'a',
                        then: Joi.object({
                            x: Joi.boolean()
                        })
                    },
                    {
                        is: 'b',
                        then: Joi.object({
                            y: Joi.link('#root').concat(Joi.object({ type: 'a' }))
                        })
                    }
                ])
                .id('root');

            Helper.validate(schema, [
                [{ type: 'b', y: { type: 'a' } }, true],
                [{ type: 'b', y: { type: 'a', x: true } }, true]
            ]);
        });
    });

    describe('describe()', () => {

        it('describes link', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.link('a')
            });

            expect(schema.describe()).to.equal({
                type: 'object',
                keys: {
                    a: {
                        type: 'string'
                    },
                    b: {
                        type: 'link',
                        link: {
                            ref: { path: ['a'] }
                        }
                    }
                }
            });
        });
    });
});
