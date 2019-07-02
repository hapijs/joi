'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('lazy', () => {

    it('should require a function', () => {

        expect(() => Joi.lazy()).to.throw('You must provide a function as first argument');
        expect(() => Joi.lazy(true)).to.throw('You must provide a function as first argument');
    });

    it('validates a schema is returned', async () => {

        const fn = () => true;
        const schema = Joi.lazy(fn);
        const err = await expect(schema.validate('bar')).to.reject('schema error: lazy schema function must return a schema');
        expect(err.details).to.equal([{
            message: 'schema error: lazy schema function must return a schema',
            path: [],
            type: 'lazy.schema',
            context: { label: 'value', schema: true, value: 'bar' }
        }]);
    });

    it('checks options', () => {

        expect(() => Joi.lazy(() => { }, false)).to.throw('Options must be an object');
        expect(() => Joi.lazy(() => { }, true)).to.throw('Options must be an object');
        expect(() => Joi.lazy(() => { }, [])).to.throw('Options must be an object');
        expect(() => Joi.lazy(() => { }, { oce: true })).to.throw('Options contain unknown keys: oce');
        expect(() => Joi.lazy(() => { }, { once: 'foo' })).to.throw('Option "once" must be a boolean');
        expect(() => Joi.lazy(() => { }, {})).to.not.throw();
        expect(() => Joi.lazy(() => { }, { once: true })).to.not.throw();
    });

    describe('validate()', () => {

        it('validates a recursive schema', () => {

            let callCount = 0;
            const schema = Joi.object({
                name: Joi.string().required(),
                children: Joi.array().items(Joi.lazy(() => {

                    callCount++;
                    return schema;
                }))
            });

            Helper.validate(schema, [
                [{ name: 'foo' }, true],
                [{ name: 'foo', children: [] }, true],
                [{ name: 'foo', children: [{ name: 'bar' }] }, true],
                [{ name: 'foo', children: [{ name: 'bar', children: [{ name: 'baz' }] }] }, true],
                [{ name: 'foo', children: [{ name: 'bar', children: [{ name: 'baz', children: [{ name: 'qux' }] }] }] }, true],
                [{ name: 'foo', children: [{ name: 'bar', children: [{ name: 'baz', children: [{ name: 42 }] }] }] }, false, null, {
                    message: '"children[0].children[0].children[0].name" must be a string',
                    details: [{
                        message: '"children[0].children[0].children[0].name" must be a string',
                        path: ['children', 0, 'children', 0, 'children', 0, 'name'],
                        type: 'string.base',
                        context: { value: 42, label: 'children[0].children[0].children[0].name', key: 'name' }
                    }]
                }]
            ]);

            expect(callCount).to.equal(1);
        });

        it('validates a recursive schema with once disabled', () => {

            let callCount = 0;
            const lazy = () => {

                callCount++;
                return schema;
            };

            const schema = Joi.object({
                name: Joi.string().required(),
                children: Joi.array().items(Joi.lazy(lazy, { once: false }))
            });

            Helper.validate(schema, [
                [{ name: 'foo' }, true],
                [{ name: 'foo', children: [] }, true],
                [{ name: 'foo', children: [{ name: 'bar' }] }, true],
                [{ name: 'foo', children: [{ name: 'bar', children: [{ name: 'baz' }] }] }, true],
                [{ name: 'foo', children: [{ name: 'bar', children: [{ name: 'baz', children: [{ name: 'qux' }] }] }] }, true],
                [{ name: 'foo', children: [{ name: 'bar', children: [{ name: 'baz', children: [{ name: 42 }] }] }] }, false, null, {
                    message: '"children[0].children[0].children[0].name" must be a string',
                    details: [{
                        message: '"children[0].children[0].children[0].name" must be a string',
                        path: ['children', 0, 'children', 0, 'children', 0, 'name'],
                        type: 'string.base',
                        context: { value: 42, label: 'children[0].children[0].children[0].name', key: 'name' }
                    }]
                }]
            ]);

            expect(callCount).to.equal(9);
        });

        it('validates a schema with when()', () => {

            let callCount = 0;
            const lazy = () => {

                callCount++;
                return schema;
            };

            const schema = Joi.object({
                must: Joi.boolean().required(),
                child: Joi.lazy(lazy)
                    .when('must', { is: true, then: Joi.required() })
            });

            Helper.validate(schema, [
                [{ must: false }, true],
                [{ must: false, child: { must: false } }, true],
                [{ must: true, child: { must: false } }, true],
                [{ must: true, child: { must: true, child: { must: false } } }, true]
            ]);

            expect(callCount).to.equal(1);
        });

        it('errors on concat of lazy to lazy', () => {

            expect(() => Joi.lazy(() => null).concat(Joi.lazy(() => null))).to.throw('Cannot merge type lazy with another type: lazy');
        });
    });

    describe('describe()', () => {

        it('describes schema', () => {

            const lazy = () => schema;
            const schema = Joi.object({
                name: Joi.string().required(),
                children: Joi.array().items(Joi.lazy(lazy).description('person'))
            });

            expect(schema.describe()).to.equal({
                type: 'object',
                children: {
                    children: {
                        type: 'array',
                        flags: {
                            sparse: false
                        },
                        items: [
                            {
                                type: 'lazy',
                                description: 'person',
                                schema: lazy,
                                once: true
                            }
                        ]
                    },
                    name: {
                        type: 'string',
                        flags: { presence: 'required' },
                        invalids: ['']
                    }
                }
            });
        });
    });
});
