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

    it('links schema nodes', () => {

        const schema = Joi.object({
            a: [Joi.string(), Joi.number()],
            b: Joi.link('a')
        });

        expect(schema.validate({ a: 1, b: 2 }).error).to.not.exist();
        expect(schema.validate({ a: '1', b: '2' }).error).to.not.exist();
        expect(schema.validate({ a: [1], b: '2' }).error).to.be.an.error('"a" must be one of [string, number]');
    });

    it('links schema cousin nodes', () => {

        const schema = Joi.object({
            a: [Joi.string(), Joi.number()],
            b: {
                c: Joi.link('...a')
            }
        });

        expect(schema.validate({ a: 1, b: { c: 2 } }).error).to.not.exist();
        expect(schema.validate({ a: '1', b: { c: '2' } }).error).to.not.exist();
        expect(schema.validate({ a: [1], b: { c: '2' } }).error).to.be.an.error('"a" must be one of [string, number]');
    });

    it('links schema cousin nodes (root)', () => {

        const schema = Joi.object({
            a: [Joi.string(), Joi.number()],
            b: {
                c: Joi.link('/a')
            }
        });

        expect(schema.validate({ a: 1, b: { c: 2 } }).error).to.not.exist();
        expect(schema.validate({ a: '1', b: { c: '2' } }).error).to.not.exist();
        expect(schema.validate({ a: [1], b: { c: '2' } }).error).to.be.an.error('"a" must be one of [string, number]');
    });

    it('validates a recursive schema', () => {

        const schema = Joi.object({
            name: Joi.string().required(),
            keys: Joi.array()
                .items(Joi.link('...'))
        });

        expect(schema.validate({ name: 'foo', keys: [{ name: 'bar' }] }).error).to.not.exist();

        Helper.validate(schema, [
            [{ name: 'foo' }, true],
            [{ name: 'foo', keys: [] }, true],
            [{ name: 'foo', keys: [{ name: 'bar' }] }, true],
            [{ name: 'foo', keys: [{ name: 'bar', keys: [{ name: 'baz' }] }] }, true],
            [{ name: 'foo', keys: [{ name: 'bar', keys: [{ name: 'baz', keys: [{ name: 'qux' }] }] }] }, true],
            [{ name: 'foo', keys: [{ name: 'bar', keys: [{ name: 'baz', keys: [{ name: 42 }] }] }] }, false, null, {
                message: '"keys[0].keys[0].keys[0].name" must be a string',
                details: [{
                    message: '"keys[0].keys[0].keys[0].name" must be a string',
                    path: ['keys', 0, 'keys', 0, 'keys', 0, 'name'],
                    type: 'string.base',
                    context: { value: 42, label: 'keys[0].keys[0].keys[0].name', key: 'name' }
                }]
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
            [{ name: 'foo', keys: [{ name: 'bar', keys: [{ name: 'baz', keys: [{ name: 42 }] }] }] }, false, null, {
                message: '"keys[0].keys[0].keys[0].name" must be a string',
                details: [{
                    message: '"keys[0].keys[0].keys[0].name" must be a string',
                    path: ['keys', 0, 'keys', 0, 'keys', 0, 'name'],
                    type: 'string.base',
                    context: { value: 42, label: 'keys[0].keys[0].keys[0].name', key: 'name' }
                }]
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

        expect(schema.validate({ a: 1, b: 2, c: 3 }).error).to.not.exist();
        expect(schema.validate({ a: '1', b: '2', c: 3 }).error).to.not.exist();
        expect(schema.validate({ a: [1], b: '2' }).error).to.be.an.error('"a" must be one of [string, number]');
    });

    it('errors on invalid reference', () => {

        expect(() => Joi.link('.')).to.throw('Link cannot reference itself');
    });

    it('errors on invalid reference type', () => {

        expect(() => Joi.link('$x')).to.throw('Invalid reference type');
    });

    it('errors on out of boundaries reference', () => {

        const schema = Joi.object({
            x: Joi.link('...')
        });

        expect(schema.validate({ x: 123 }).error).to.be.an.error('"x" contains link reference "ref:..." outside of schema boundaries');
    });

    it('errors on missing reference', () => {

        const schema = Joi.object({
            x: Joi.link('y')
        });

        expect(schema.validate({ x: 123 }).error).to.be.an.error('"x" contains link reference to non-existing "ref:y" schema');
    });

    it('errors on missing reference', () => {

        const schema = Joi.object({
            x: Joi.link('y'),
            y: Joi.link('z'),
            z: Joi.any()
        });

        expect(schema.validate({ x: 123 }).error).to.be.an.error('"x" contains link reference to another link "ref:y"');
    });

    describe('when()', () => {

        it('validates a schema with when()', () => {

            const schema = Joi.object({
                must: Joi.boolean().required(),
                child: Joi.link('..')
                    .when('must', { is: true, then: Joi.required() })
            });

            Helper.validate(schema, [
                [{ must: false }, true],
                [{ must: false, child: { must: false } }, true],
                [{ must: true, child: { must: false } }, true],
                [{ must: true, child: { must: true, child: { must: false } } }, true]
            ]);
        });
    });

    describe('concat()', () => {

        it('errors on concat of link to link', () => {

            expect(() => Joi.link('..').concat(Joi.link('..'))).to.throw('Cannot merge type link with another type: link');
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
