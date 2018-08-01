'use strict';

// Load modules

const Lab = require('lab');
const Joi = require('../..');
const Lazy = require('../../lib/types/lazy/index');
const Helper = require('../helper');


// Declare internals

const internals = {};


// Test shortcuts

const { describe, it, expect } = exports.lab = Lab.script();


describe('lazy', () => {

    describe('set()', () => {

        it('should require a function', () => {

            expect(() => Joi.lazy()).to.throw('You must provide a function as first argument');
            expect(() => Joi.lazy(true)).to.throw('You must provide a function as first argument');
        });

        it('should validate a schema is set', async () => {

            const schema = Lazy;
            const err = await expect(schema.validate('bar')).to.reject('schema error: lazy schema must be set');
            expect(err.details).to.equal([{
                message: 'schema error: lazy schema must be set',
                path: [],
                type: 'lazy.base',
                context: { label: 'value', key: undefined }
            }]);
        });

        it('should validate a schema is returned', async () => {

            const schema = Joi.lazy(() => true, 'foo');
            const err = await expect(schema.validate('bar')).to.reject('schema error: lazy schema function must return a schema');
            expect(err.details).to.equal([{
                message: 'schema error: lazy schema function must return a schema',
                path: [],
                type: 'lazy.schema',
                context: { label: 'value', key: undefined }
            }]);
        });

    });

    describe('validate()', () => {

        it('should validate a recursive schema', () => {

            const schema = Joi.object({
                name: Joi.string().required(),
                children: Joi.array().items(Joi.lazy(() => schema))
            });

            Helper.validate(schema, [
                [{ name: 'foo' }, true],
                [{ name: 'foo', children: [] }, true],
                [{ name: 'foo', children: [{ name: 'bar' }] }, true],
                [{ name: 'foo', children: [{ name: 'bar', children: [{ name: 'baz' }] }] }, true],
                [{ name: 'foo', children: [{ name: 'bar', children: [{ name: 'baz', children: [{ name: 'qux' }] }] }] }, true],
                [{ name: 'foo', children: [{ name: 'bar', children: [{ name: 'baz', children: [{ name: 42 }] }] }] }, false, null, {
                    message: 'child "children" fails because ["children" at position 0 fails because [child "children" fails because ["children" at position 0 fails because [child "children" fails because ["children" at position 0 fails because [child "name" fails because ["name" must be a string]]]]]]]',
                    details: [{
                        message: '"name" must be a string',
                        path: ['children', 0, 'children', 0, 'children', 0, 'name'],
                        type: 'string.base',
                        context: { value: 42, label: 'name', key: 'name' }
                    }]
                }]
            ]);
        });

        it('should validate a schema with arguments', () => {

            const schema = Joi.object({
                name: Joi.string().required(),
                age: Joi.lazy((oldest) => Joi.number().max(oldest), 150)
            });

            Helper.validate(schema, [
                [{ name: 'foo' }, true],
                [{ name: 'foo', age: 200 }, false, null, {
                    message: 'child "age" fails because ["age" must be less than or equal to 150]',
                    details: [{
                        message: '"age" must be less than or equal to 150',
                        path: ['age'],
                        type: 'number.max',
                        context: { value: 200, label: 'age', key: 'age', limit: 150 }
                    }]
                }]
            ]);
        });

        it('should validate a schema with ref arguments', () => {

            const schema = Joi.object({
                name: Joi.string().required(),
                age: Joi.lazy((oldest, name) => {

                    if (name === '张三丰') {
                        return Joi.number().max(oldest + 100);
                    }
                    return Joi.number().max(oldest);
                }, 150, Joi.ref('name'))
            });

            Helper.validate(schema, [
                [{ name: 'foo' }, true],
                [{ name: 'foo', age: 200 }, false, null, {
                    message: 'child "age" fails because ["age" must be less than or equal to 150]',
                    details: [{
                        message: '"age" must be less than or equal to 150',
                        path: ['age'],
                        type: 'number.max',
                        context: { value: 200, label: 'age', key: 'age', limit: 150 }
                    }]
                }],
                [{ name: '张三丰', age: 200 }, true]
            ]);
        });

        it('should validate a schema with ref arguments in when', () => {

            const schema = Joi.object({
                surname: Joi.string().required(),
                name: Joi.string().required(),
                age: Joi.any().when('surname', {
                    is: Joi.lazy((name) => {

                        if (name === '张三丰') {
                            return Joi.any();
                        }
                        return Joi.string().valid('张');
                    }, Joi.ref('name')),
                    then: Joi.lazy((oldest, name) => {

                        if (name === '张三丰') {
                            return Joi.number().max(oldest + 100);
                        }
                        return Joi.number().max(oldest);
                    }, 150, Joi.ref('name')),
                    otherwise: Joi.number().max(120)
                })
            });

            Helper.validate(schema, [
                [{ surname: 'f', name: 'foo' }, true],
                [{ surname: 'f', name: 'foo', age: 200 }, false, null, {
                    message: 'child "age" fails because ["age" must be less than or equal to 120]',
                    details: [{
                        message: '"age" must be less than or equal to 120',
                        path: ['age'],
                        type: 'number.max',
                        context: { value: 200, label: 'age', key: 'age', limit: 120 }
                    }]
                }],
                [{ surname: '刘', name: '刘三三', age: 140 }, false, null, {
                    message: 'child "age" fails because ["age" must be less than or equal to 120]',
                    details: [{
                        message: '"age" must be less than or equal to 120',
                        path: ['age'],
                        type: 'number.max',
                        context: { value: 140, label: 'age', key: 'age', limit: 120 }
                    }]
                }],
                [{ surname: '张', name: '张三三', age: 140 }, true],
                [{ surname: '张', name: '张三丰', age: 200 }, true]
            ]);
        });
    });

    describe('describe()', () => {

        it('should be able to describe with description', () => {

            const schema = Joi.object({
                name: Joi.string().required(),
                children: Joi.array().items(Joi.lazy(() => schema).description('person'))
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
                                flags: {}
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
