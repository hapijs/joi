'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('array', () => {

    it('can be called on its own', () => {

        const array = Joi.array;
        expect(() => array()).to.throw('Must be invoked on a Joi instance.');
    });

    it('should throw an exception if arguments were passed.', () => {

        expect(
            () => Joi.array('invalid argument.')
        ).to.throw('Joi.array() does not allow arguments.');
    });

    it('converts a string to an array', async () => {

        const value = await Joi.array().validate('[1,2,3]');
        expect(value.length).to.equal(3);
    });

    it('converts a string with whitespace to an array', async () => {

        const value = await Joi.array().validate(' \n\r\t[ \n\r\t1 \n\r\t, \n\r\t2,3] \n\r\t');
        expect(value.length).to.equal(3);
    });

    it('errors on non-array string', async () => {

        const err = await expect(Joi.array().validate('{ "something": false }')).to.reject('"value" must be an array');
        expect(err.details).to.equal([{
            message: '"value" must be an array',
            path: [],
            type: 'array.base',
            context: { label: 'value', key: undefined }
        }]);
    });

    it('errors on number', async () => {

        const err = await expect(Joi.array().validate(3)).to.reject('"value" must be an array');
        expect(err.details).to.equal([{
            message: '"value" must be an array',
            path: [],
            type: 'array.base',
            context: { label: 'value', key: undefined }
        }]);
    });

    it('converts a non-array string with number type', async () => {

        const err = await expect(Joi.array().validate('3')).to.reject('"value" must be an array');
        expect(err.details).to.equal([{
            message: '"value" must be an array',
            path: [],
            type: 'array.base',
            context: { label: 'value', key: undefined }
        }]);
    });

    it('errors on a non-array string', async () => {

        const err = await expect(Joi.array().validate('asdf')).to.reject('"value" must be an array');
        expect(err.details).to.equal([{
            message: '"value" must be an array',
            path: [],
            type: 'array.base',
            context: { label: 'value', key: undefined }
        }]);
    });

    describe('items()', () => {

        it('converts members', async () => {

            const schema = Joi.array().items(Joi.number());
            const input = ['1', '2', '3'];
            const value = await schema.validate(input);
            expect(value).to.equal([1, 2, 3]);
        });

        it('shows path to errors in array items', () => {

            expect(() => {

                Joi.array().items({
                    a: {
                        b: {
                            c: {
                                d: undefined
                            }
                        }
                    }
                });
            }).to.throw(Error, 'Invalid schema content: (0.a.b.c.d)');

            expect(() => {

                Joi.array().items({ foo: 'bar' }, undefined);
            }).to.throw(Error, 'Invalid schema content: (1)');
        });

        it('allows zero size', async () => {

            const schema = Joi.object({
                test: Joi.array().items(Joi.object({
                    foo: Joi.string().required()
                }))
            });
            const input = { test: [] };

            await schema.validate(input);
        });

        it('returns the first error when only one inclusion', async () => {

            const schema = Joi.object({
                test: Joi.array().items(Joi.object({
                    foo: Joi.string().required()
                }))
            });
            const input = { test: [{ foo: 'a' }, { bar: 2 }] };

            const err = await expect(schema.validate(input)).to.reject();
            expect(err.message).to.equal('child "test" fails because ["test" at position 1 fails because [child "foo" fails because ["foo" is required]]]');
            expect(err.details).to.equal([{
                message: '"foo" is required',
                path: ['test', 1, 'foo'],
                type: 'any.required',
                context: { label: 'foo', key: 'foo' }
            }]);
        });

        it('validates multiple types added in two calls', () => {

            const schema = Joi.array()
                .items(Joi.number())
                .items(Joi.string());

            Helper.validate(schema, [
                [[1, 2, 3], true],
                [[50, 100, 1000], true],
                [[1, 'a', 5, 10], true],
                [['joi', 'everydaylowprices', 5000], true]
            ]);
        });

        it('validates multiple types with stripUnknown', () => {

            const schema = Joi.array().items(Joi.number(), Joi.string()).options({ stripUnknown: true });

            Helper.validate(schema, [
                [[1, 2, 'a'], true, null, [1, 2, 'a']],
                [[1, { foo: 'bar' }, 'a', 2], false, null, {
                    message: '"value" at position 1 does not match any of the allowed types',
                    details: [{
                        context: {
                            key: 1,
                            label: 'value',
                            pos: 1,
                            value: { foo: 'bar' }
                        },
                        message: '"value" at position 1 does not match any of the allowed types',
                        path: [1],
                        type: 'array.includes'
                    }]
                }]
            ]);
        });

        it('validates multiple types with stripUnknown (as an object)', () => {

            const schema = Joi.array().items(Joi.number(), Joi.string()).options({ stripUnknown: { arrays: true, objects: false } });

            Helper.validate(schema, [
                [[1, 2, 'a'], true, null, [1, 2, 'a']],
                [[1, { foo: 'bar' }, 'a', 2], true, null, [1, 'a', 2]]
            ]);
        });

        it('allows forbidden to restrict values', async () => {

            const schema = Joi.array().items(Joi.string().valid('four').forbidden(), Joi.string());
            const input = ['one', 'two', 'three', 'four'];

            const err = await expect(schema.validate(input)).to.reject('"value" at position 3 contains an excluded value');
            expect(err.details).to.equal([{
                message: '"value" at position 3 contains an excluded value',
                path: [3],
                type: 'array.excludes',
                context: { pos: 3, value: 'four', label: 'value', key: 3 }
            }]);
        });

        it('allows forbidden to restrict values (ref)', async () => {

            const schema = Joi.object({
                array: Joi.array().items(Joi.valid(Joi.ref('value')).forbidden(), Joi.string()),
                value: Joi.string().required()
            });

            const input = {
                array: ['one', 'two', 'three', 'four'],
                value: 'four'
            };

            const err = await expect(schema.validate(input)).to.reject('child "array" fails because ["array" at position 3 contains an excluded value]');
            expect(err.details).to.equal([{
                message: '"array" at position 3 contains an excluded value',
                path: ['array', 3],
                type: 'array.excludes',
                context: { pos: 3, value: 'four', label: 'array', key: 3 }
            }]);
        });

        it('validates that a required value exists', async () => {

            const schema = Joi.array().items(Joi.string().valid('four').required(), Joi.string());
            const input = ['one', 'two', 'three'];

            const err = await expect(schema.validate(input)).to.reject('"value" does not contain 1 required value(s)');
            expect(err.details).to.equal([{
                message: '"value" does not contain 1 required value(s)',
                path: [],
                type: 'array.includesRequiredUnknowns',
                context: { unknownMisses: 1, label: 'value', key: undefined }
            }]);
        });

        it('validates that a required value exists with abortEarly = false', async () => {

            const schema = Joi.array().items(Joi.string().valid('four').required(), Joi.string()).options({ abortEarly: false });
            const input = ['one', 'two', 'three'];

            const err = await expect(schema.validate(input)).to.reject('"value" does not contain 1 required value(s)');
            expect(err.details).to.equal([{
                message: '"value" does not contain 1 required value(s)',
                path: [],
                type: 'array.includesRequiredUnknowns',
                context: { unknownMisses: 1, label: 'value', key: undefined }
            }]);
        });

        it('does not re-run required tests that have already been matched', async () => {

            const schema = Joi.array().items(Joi.string().valid('four').required(), Joi.string());
            const input = ['one', 'two', 'three', 'four', 'four', 'four'];

            const value = await schema.validate(input);
            expect(value).to.equal(input);
        });

        it('does not re-run required tests that have already failed', async () => {

            const schema = Joi.array().items(Joi.string().valid('four').required(), Joi.boolean().required(), Joi.number());
            const input = ['one', 'two', 'three', 'four', 'four', 'four'];

            const err = await expect(schema.validate(input)).to.reject('"value" at position 0 does not match any of the allowed types');
            expect(err.details).to.equal([{
                message: '"value" at position 0 does not match any of the allowed types',
                path: [0],
                type: 'array.includes',
                context: { pos: 0, value: 'one', label: 'value', key: 0 }
            }]);
        });

        it('can require duplicates of the same schema and fail', async () => {

            const schema = Joi.array().items(Joi.string().valid('four').required(), Joi.string().valid('four').required(), Joi.string());
            const input = ['one', 'two', 'three', 'four'];

            const err = await expect(schema.validate(input)).to.reject('"value" does not contain 1 required value(s)');
            expect(err.details).to.equal([{
                message: '"value" does not contain 1 required value(s)',
                path: [],
                type: 'array.includesRequiredUnknowns',
                context: { unknownMisses: 1, label: 'value', key: undefined }
            }]);
        });

        it('can require duplicates of the same schema and pass', async () => {

            const schema = Joi.array().items(Joi.string().valid('four').required(), Joi.string().valid('four').required(), Joi.string());
            const input = ['one', 'two', 'three', 'four', 'four'];

            const value = await schema.validate(input);
            expect(value).to.equal(input);
        });

        it('continues to validate after a required match', async () => {

            const schema = Joi.array().items(Joi.string().required(), Joi.boolean());
            const input = [true, 'one', false, 'two'];

            const value = await schema.validate(input);
            expect(value).to.equal(input);
        });

        it('can use a label on a required parameter', async () => {

            const schema = Joi.array().items(Joi.string().required().label('required string'), Joi.boolean());
            const input = [true, false];

            const err = await expect(schema.validate(input)).to.reject('"value" does not contain [required string]');
            expect(err.details).to.equal([{
                message: '"value" does not contain [required string]',
                path: [],
                type: 'array.includesRequiredKnowns',
                context: { knownMisses: ['required string'], label: 'value', key: undefined }
            }]);
        });

        it('can use a label on one required parameter, and no label on another', async () => {

            const schema = Joi.array().items(Joi.string().required().label('required string'), Joi.string().required(), Joi.boolean());
            const input = [true, false];

            const err = await expect(schema.validate(input)).to.reject('"value" does not contain [required string] and 1 other required value(s)');
            expect(err.details).to.equal([{
                message: '"value" does not contain [required string] and 1 other required value(s)',
                path: [],
                type: 'array.includesRequiredBoth',
                context: {
                    knownMisses: ['required string'],
                    unknownMisses: 1,
                    label: 'value',
                    key: undefined
                }
            }]);
        });

        it('can strip matching items', async () => {

            const schema = Joi.array().items(Joi.string(), Joi.any().strip());
            const value = await schema.validate(['one', 'two', 3, 4]);
            expect(value).to.equal(['one', 'two']);
        });
    });

    describe('min()', () => {

        it('validates array size', () => {

            const schema = Joi.array().min(2);
            Helper.validate(schema, [
                [[1, 2], true],
                [[1], false, null, {
                    message: '"value" must contain at least 2 items',
                    details: [{
                        message: '"value" must contain at least 2 items',
                        path: [],
                        type: 'array.min',
                        context: { limit: 2, value: [1], label: 'value', key: undefined }
                    }]
                }]
            ]);
        });

        it('overrides rule when called multiple times', () => {

            const schema = Joi.array().min(2).min(1);
            Helper.validate(schema, [
                [[1, 2], true],
                [[1], true]
            ]);
        });

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.array().min('a');
            }).to.throw('limit must be a positive integer or reference');
        });

        it('throws when limit is not an integer', () => {

            expect(() => {

                Joi.array().min(1.2);
            }).to.throw('limit must be a positive integer or reference');
        });

        it('throws when limit is negative', () => {

            expect(() => {

                Joi.array().min(-1);
            }).to.throw('limit must be a positive integer or reference');
        });

        it('validates array size when a reference', () => {

            const ref = Joi.ref('limit');
            const schema = Joi.object().keys({
                limit: Joi.any(),
                arr: Joi.array().min(ref)
            });
            Helper.validate(schema, [
                [{
                    limit: 2,
                    arr: [1, 2]
                }, true],
                [{
                    limit: 2,
                    arr: [1]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" must contain at least ref:limit items]',
                    details: [{
                        message: '"arr" must contain at least ref:limit items',
                        path: ['arr'],
                        type: 'array.min',
                        context: { limit: ref, value: [1], label: 'arr', key: 'arr' }
                    }]
                }]
            ]);
        });

        it('handles references within a when', () => {

            const schema = Joi.object({
                limit: Joi.any(),
                arr: Joi.array(),
                arr2: Joi.when('arr', {
                    is: Joi.array().min(Joi.ref('limit')),
                    then: Joi.array()
                })
            });

            Helper.validate(schema, [
                [{
                    limit: 2,
                    arr: [1, 2],
                    arr2: [1, 2]
                }, true]
            ]);
        });

        it('validates reference is a safe integer', () => {

            const ref = Joi.ref('limit');
            const schema = Joi.object().keys({
                limit: Joi.any(),
                arr: Joi.array().min(ref)
            });
            Helper.validate(schema, [
                [{
                    limit: Math.pow(2, 53),
                    arr: [1, 2]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" references "ref:limit" which is not a positive integer]',
                    details: [{
                        message: '"arr" references "ref:limit" which is not a positive integer',
                        path: ['arr'],
                        type: 'array.ref',
                        context: { ref, label: 'arr', key: 'arr', value: Math.pow(2, 53) }
                    }]
                }],
                [{
                    limit: 'I like turtles',
                    arr: [1]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" references "ref:limit" which is not a positive integer]',
                    details: [{
                        message: '"arr" references "ref:limit" which is not a positive integer',
                        path: ['arr'],
                        type: 'array.ref',
                        context: { ref, label: 'arr', key: 'arr', value: 'I like turtles' }
                    }]
                }]
            ]);
        });
    });

    describe('max()', () => {

        it('validates array size', () => {

            const schema = Joi.array().max(1);
            Helper.validate(schema, [
                [[1, 2], false, null, {
                    message: '"value" must contain less than or equal to 1 items',
                    details: [{
                        message: '"value" must contain less than or equal to 1 items',
                        path: [],
                        type: 'array.max',
                        context: { limit: 1, value: [1, 2], label: 'value', key: undefined }
                    }]
                }],
                [[1], true]
            ]);
        });

        it('overrides rule when called multiple times', () => {

            const schema = Joi.array().max(1).max(2);
            Helper.validate(schema, [
                [[1, 2], true],
                [[1], true]
            ]);
        });

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.array().max('a');
            }).to.throw('limit must be a positive integer or reference');
        });

        it('throws when limit is not an integer', () => {

            expect(() => {

                Joi.array().max(1.2);
            }).to.throw('limit must be a positive integer or reference');
        });

        it('throws when limit is negative', () => {

            expect(() => {

                Joi.array().max(-1);
            }).to.throw('limit must be a positive integer or reference');
        });

        it('validates array size when a reference', () => {

            const ref = Joi.ref('limit');
            const schema = Joi.object().keys({
                limit: Joi.any(),
                arr: Joi.array().max(ref)
            });
            Helper.validate(schema, [
                [{
                    limit: 2,
                    arr: [1, 2]
                }, true],
                [{
                    limit: 2,
                    arr: [1, 2, 3]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" must contain less than or equal to ref:limit items]',
                    details: [{
                        message: '"arr" must contain less than or equal to ref:limit items',
                        path: ['arr'],
                        type: 'array.max',
                        context: { limit: ref, value: [1, 2, 3], label: 'arr', key: 'arr' }
                    }]
                }]
            ]);
        });

        it('handles references within a when', () => {

            const schema = Joi.object({
                limit: Joi.any(),
                arr: Joi.array(),
                arr2: Joi.when('arr', {
                    is: Joi.array().max(Joi.ref('limit')),
                    then: Joi.array()
                })
            });

            Helper.validate(schema, [
                [{
                    limit: 2,
                    arr: [1, 2],
                    arr2: [1, 2]
                }, true]
            ]);
        });

        it('validates reference is a safe integer', () => {

            const schema = Joi.object().keys({
                limit: Joi.any(),
                arr: Joi.array().max(Joi.ref('limit'))
            });
            Helper.validate(schema, [
                [{
                    limit: Math.pow(2, 53),
                    arr: [1, 2]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" references "limit" which is not a positive integer]',
                    details: [{
                        message: '"arr" references "limit" which is not a positive integer',
                        path: ['arr'],
                        type: 'array.ref',
                        context: { ref: 'limit', label: 'arr', key: 'arr' }
                    }]
                }],
                [{
                    limit: 'I like turtles',
                    arr: [1]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" references "limit" which is not a positive integer]',
                    details: [{
                        message: '"arr" references "limit" which is not a positive integer',
                        path: ['arr'],
                        type: 'array.ref',
                        context: { ref: 'limit', label: 'arr', key: 'arr' }
                    }]
                }]
            ]);
        });

    });

    describe('length()', () => {

        it('validates array size', () => {

            const schema = Joi.array().length(2);
            Helper.validate(schema, [
                [[1, 2], true],
                [[1], false, null, {
                    message: '"value" must contain 2 items',
                    details: [{
                        message: '"value" must contain 2 items',
                        path: [],
                        type: 'array.length',
                        context: { limit: 2, value: [1], label: 'value', key: undefined }
                    }]
                }]
            ]);
        });

        it('overrides rule when called multiple times', () => {

            const schema = Joi.array().length(2).length(1);
            Helper.validate(schema, [
                [[1], true],
                [[1, 2], false, null, {
                    message: '"value" must contain 1 items',
                    details: [{
                        message: '"value" must contain 1 items',
                        path: [],
                        type: 'array.length',
                        context: { limit: 1, value: [1, 2], label: 'value', key: undefined }
                    }]
                }]
            ]);
        });

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.array().length('a');
            }).to.throw('limit must be a positive integer or reference');
        });

        it('throws when limit is not an integer', () => {

            expect(() => {

                Joi.array().length(1.2);
            }).to.throw('limit must be a positive integer or reference');
        });

        it('throws when limit is negative', () => {

            expect(() => {

                Joi.array().length(-1);
            }).to.throw('limit must be a positive integer or reference');
        });

        it('validates array size when a reference', () => {

            const ref = Joi.ref('limit');
            const schema = Joi.object().keys({
                limit: Joi.any(),
                arr: Joi.array().length(ref)
            });
            Helper.validate(schema, [
                [{
                    limit: 2,
                    arr: [1, 2]
                }, true],
                [{
                    limit: 2,
                    arr: [1]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" must contain ref:limit items]',
                    details: [{
                        message: '"arr" must contain ref:limit items',
                        path: ['arr'],
                        type: 'array.length',
                        context: { limit: ref, value: [1], label: 'arr', key: 'arr' }
                    }]
                }]
            ]);
        });

        it('handles references within a when', () => {

            const schema = Joi.object({
                limit: Joi.any(),
                arr: Joi.array(),
                arr2: Joi.when('arr', {
                    is: Joi.array().length(Joi.ref('limit')),
                    then: Joi.array()
                })
            });

            Helper.validate(schema, [
                [{
                    limit: 2,
                    arr: [1, 2],
                    arr2: [1, 2]
                }, true]
            ]);
        });

        it('validates reference is a safe integer', () => {

            const schema = Joi.object().keys({
                limit: Joi.any(),
                arr: Joi.array().length(Joi.ref('limit'))
            });
            Helper.validate(schema, [
                [{
                    limit: Math.pow(2, 53),
                    arr: [1, 2]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" references "limit" which is not a positive integer]',
                    details: [{
                        message: '"arr" references "limit" which is not a positive integer',
                        path: ['arr'],
                        type: 'array.ref',
                        context: { ref: 'limit', label: 'arr', key: 'arr' }
                    }]
                }],
                [{
                    limit: 'I like turtles',
                    arr: [1]
                }, false, null, {
                    message: 'child "arr" fails because ["arr" references "limit" which is not a positive integer]',
                    details: [{
                        message: '"arr" references "limit" which is not a positive integer',
                        path: ['arr'],
                        type: 'array.ref',
                        context: { ref: 'limit', label: 'arr', key: 'arr' }
                    }]
                }]
            ]);
        });
    });

    describe('has()', () => {

        it('shows path to errors in schema', () => {

            expect(() => {

                Joi.array().has({
                    a: {
                        b: {
                            c: {
                                d: undefined
                            }
                        }
                    }
                });
            }).to.throw(Error, 'Invalid schema content: (a.b.c.d)');
        });

        it('shows errors in schema', () => {

            expect(() => {

                Joi.array().has(undefined);
            }).to.throw(Error, 'Invalid schema content: ');
        });

        it('works with object.assert', () => {

            const schema = Joi.array().items(
                Joi.object().keys({
                    a: {
                        b: Joi.string(),
                        c: Joi.number()
                    },
                    d: {
                        e: Joi.any()
                    }
                })
            ).has(Joi.object().assert('d.e', Joi.ref('a.c'), 'equal to a.c'));

            Helper.validate(schema, [
                [[{ a: { b: 'x', c: 5 }, d: { e: 5 } }], true]
            ]);
        });


        it('does not throw if assertion passes', () => {

            const schema = Joi.array().has(Joi.string());
            Helper.validate(schema, [
                [['foo'], true]
            ]);
        });

        it('throws with proper message if assertion fails on unknown schema', () => {

            const schema = Joi.array().has(Joi.string());
            Helper.validate(schema, [
                [[0], false, null, {
                    message: '"value" does not contain at least one required match',
                    details: [{
                        message: '"value" does not contain at least one required match',
                        path: [],
                        type: 'array.hasUnknown',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ]);
        });

        it('throws with proper message if assertion fails on known schema', () => {

            const schema = Joi.array().has(Joi.string().label('foo'));
            Helper.validate(schema, [
                [[0], false, null, {
                    message: '"value" does not contain at least one required match for type "foo"',
                    details: [{
                        message: '"value" does not contain at least one required match for type "foo"',
                        path: [],
                        type: 'array.hasKnown',
                        context: { label: 'value', key: undefined, patternLabel: 'foo' }
                    }]
                }]
            ]);
        });

        it('shows correct path for error', () => {

            const schema = Joi.object({
                arr: Joi.array().has(Joi.string())
            });
            Helper.validate(schema, [
                [{ arr: [0] }, false, null, {
                    message: 'child "arr" fails because ["arr" does not contain at least one required match]',
                    details: [{
                        message: '"arr" does not contain at least one required match',
                        path: ['arr'],
                        type: 'array.hasUnknown',
                        context: { label: 'arr', key: 'arr' }
                    }]
                }]
            ]);
        });

        it('supports nested arrays', () => {

            const schema = Joi.object({
                arr: Joi.array().items(
                    Joi.object({ foo: Joi.array().has(Joi.string()) })
                )
            });
            Helper.validate(schema, [
                [{ arr: [{ foo: ['bar'] }] }, true]
            ]);
        });

        it('provides accurate error message for nested arrays', () => {

            const schema = Joi.object({
                arr: Joi.array().items(
                    Joi.object({ foo: Joi.array().has(Joi.string()) })
                )
            });
            Helper.validate(schema, [
                [{ arr: [{ foo: [0] }] }, false, null, {
                    message: 'child "arr" fails because ["arr" at position 0 fails because [child "foo" fails because ["foo" does not contain at least one required match]]]',
                    details: [{
                        message: '"foo" does not contain at least one required match',
                        path: ['arr', 0, 'foo'],
                        type: 'array.hasUnknown',
                        context: { label: 'foo', key: 'foo' }
                    }]
                }]
            ]);
        });

        it('handles multiple assertions', () => {

            const schema = Joi.array().has(Joi.string()).has(Joi.number());
            Helper.validate(schema, [
                [['foo', 0], true]
            ]);

            Helper.validate(schema, [
                [['foo'], false, null, {
                    message: '"value" does not contain at least one required match',
                    details: [{
                        message: '"value" does not contain at least one required match',
                        path: [],
                        type: 'array.hasUnknown',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ]);
        });

        it('describes the pattern schema', () => {

            const schema = Joi.array().has(Joi.string()).has(Joi.number());
            expect(schema.describe()).to.equal({
                type: 'array',
                flags: { sparse: false },
                rules: [
                    { name: 'has', arg: { type: 'string', invalids: [''] } },
                    { name: 'has', arg: { type: 'number', flags: { unsafe: false }, invalids: [Infinity, -Infinity] } }
                ]
            });
        });
    });


    describe('validate()', () => {

        it('should, by default, allow undefined, allow empty array', () => {

            Helper.validate(Joi.array(), [
                [undefined, true],
                [[], true]
            ]);
        });

        it('should, when .required(), deny undefined', () => {

            Helper.validate(Joi.array().required(), [
                [undefined, false, null, {
                    message: '"value" is required',
                    details: [{
                        message: '"value" is required',
                        path: [],
                        type: 'any.required',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ]);
        });

        it('allows empty arrays', () => {

            Helper.validate(Joi.array(), [
                [undefined, true],
                [[], true]
            ]);
        });

        it('excludes values when items are forbidden', () => {

            Helper.validate(Joi.array().items(Joi.string().forbidden()), [
                [['2', '1'], false, null, {
                    message: '"value" at position 0 contains an excluded value',
                    details: [{
                        message: '"value" at position 0 contains an excluded value',
                        path: [0],
                        type: 'array.excludes',
                        context: { pos: 0, value: '2', label: 'value', key: 0 }
                    }]
                }],
                [['1'], false, null, {
                    message: '"value" at position 0 contains an excluded value',
                    details: [{
                        message: '"value" at position 0 contains an excluded value',
                        path: [0],
                        type: 'array.excludes',
                        context: { pos: 0, value: '1', label: 'value', key: 0 }
                    }]
                }],
                [[2], true]
            ]);
        });

        it('allows types to be forbidden', async () => {

            const schema = Joi.array().items(Joi.number().forbidden());

            const n = [1, 2, 'hippo'];
            const err = await expect(schema.validate(n)).to.reject('"value" at position 0 contains an excluded value');
            expect(err.details).to.equal([{
                message: '"value" at position 0 contains an excluded value',
                path: [0],
                type: 'array.excludes',
                context: { pos: 0, value: 1, label: 'value', key: 0 }
            }]);

            const m = ['x', 'y', 'z'];
            await schema.validate(m);
        });

        it('validates array of Numbers', () => {

            Helper.validate(Joi.array().items(Joi.number()), [
                [[1, 2, 3], true],
                [[50, 100, 1000], true],
                [['a', 1, 2], false, null, {
                    message: '"value" at position 0 fails because ["0" must be a number]',
                    details: [{
                        message: '"0" must be a number',
                        path: [0],
                        type: 'number.base',
                        context: { label: 0, key: 0, value: 'a' }
                    }]
                }],
                [['1', '2', 4], true]
            ]);
        });

        it('validates array of mixed Numbers & Strings', () => {

            Helper.validate(Joi.array().items(Joi.number(), Joi.string()), [
                [[1, 2, 3], true],
                [[50, 100, 1000], true],
                [[1, 'a', 5, 10], true],
                [['joi', 'everydaylowprices', 5000], true]
            ]);
        });

        it('validates array of objects with schema', () => {

            Helper.validate(Joi.array().items(Joi.object({ h1: Joi.number().required() })), [
                [[{ h1: 1 }, { h1: 2 }, { h1: 3 }], true],
                [[{ h2: 1, h3: 'somestring' }, { h1: 2 }, { h1: 3 }], false, null, {
                    message: '"value" at position 0 fails because [child "h1" fails because ["h1" is required]]',
                    details: [{
                        message: '"h1" is required',
                        path: [0, 'h1'],
                        type: 'any.required',
                        context: { label: 'h1', key: 'h1' }
                    }]
                }],
                [[1, 2, [1]], false, null, {
                    message: '"value" at position 0 fails because ["0" must be an object]',
                    details: [{
                        message: '"0" must be an object',
                        path: [0],
                        type: 'object.base',
                        context: { label: 0, key: 0, value: 1 }
                    }]
                }]
            ]);
        });

        it('errors on array of unallowed mixed types (Array)', () => {

            Helper.validate(Joi.array().items(Joi.number()), [
                [[1, 2, 3], true],
                [[1, 2, [1]], false, null, {
                    message: '"value" at position 2 fails because ["2" must be a number]',
                    details: [{
                        message: '"2" must be a number',
                        path: [2],
                        type: 'number.base',
                        context: { label: 2, key: 2, value: [1] }
                    }]
                }]
            ]);
        });

        it('errors on invalid number rule using includes', async () => {

            const schema = Joi.object({
                arr: Joi.array().items(Joi.number().integer())
            });

            const input = { arr: [1, 2, 2.1] };
            const err = await expect(schema.validate(input)).to.reject('child "arr" fails because ["arr" at position 2 fails because ["2" must be an integer]]');
            expect(err.details).to.equal([{
                message: '"2" must be an integer',
                path: ['arr', 2],
                type: 'number.integer',
                context: { value: 2.1, label: 2, key: 2 }
            }]);
        });

        it('validates an array within an object', () => {

            const schema = Joi.object({
                array: Joi.array().items(Joi.string().min(5), Joi.number().min(3))
            }).options({ convert: false });

            Helper.validate(schema, [
                [{ array: ['12345'] }, true],
                [{ array: ['1'] }, false, null, {
                    message: 'child "array" fails because ["array" at position 0 does not match any of the allowed types]',
                    details: [{
                        message: '"array" at position 0 does not match any of the allowed types',
                        path: ['array', 0],
                        type: 'array.includes',
                        context: { pos: 0, value: '1', label: 'array', key: 0 }
                    }]
                }],
                [{ array: [3] }, true],
                [{ array: ['12345', 3] }, true]
            ]);
        });

        it('should not change original value', async () => {

            const schema = Joi.array().items(Joi.number()).unique();
            const input = ['1', '2'];

            const value = await schema.validate(input);
            expect(value).to.equal([1, 2]);
            expect(input).to.equal(['1', '2']);
        });

        it('should have multiple errors if abort early is false', async () => {

            const schema = Joi.array().items(Joi.number(), Joi.object()).items(Joi.boolean().forbidden());
            const input = [1, undefined, true, 'a'];

            const err = await expect(Joi.validate(input, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('"value" must not be a sparse array. "value" at position 2 contains an excluded value. "value" at position 3 does not match any of the allowed types');
            expect(err.details).to.equal([{
                message: '"value" must not be a sparse array',
                path: [1],
                type: 'array.sparse',
                context: {
                    key: 1,
                    label: 'value'
                }
            }, {
                message: '"value" at position 2 contains an excluded value',
                path: [2],
                type: 'array.excludes',
                context: {
                    pos: 2,
                    key: 2,
                    label: 'value',
                    value: true
                }
            }, {
                message: '"value" at position 3 does not match any of the allowed types',
                path: [3],
                type: 'array.includes',
                context: {
                    pos: 3,
                    key: 3,
                    label: 'value',
                    value: 'a'
                }
            }]);
        });
    });

    describe('describe()', () => {

        it('returns an empty description when no rules are applied', () => {

            const schema = Joi.array();
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: false }
            });
        });

        it('returns an updated description when sparse rule is applied', () => {

            const schema = Joi.array().sparse();
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: true }
            });
        });

        it('returns an items array only if items are specified', () => {

            const schema = Joi.array().items().max(5);
            const desc = schema.describe();
            expect(desc.items).to.not.exist();
        });

        it('returns a recursively defined array of items when specified', () => {

            const schema = Joi.array()
                .items(Joi.number(), Joi.string())
                .items(Joi.boolean().forbidden())
                .ordered(Joi.number(), Joi.string())
                .ordered(Joi.string().required());
            const desc = schema.describe();
            expect(desc.items).to.have.length(3);
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: false },
                orderedItems: [
                    { type: 'number', invalids: [Infinity, -Infinity], flags: { unsafe: false } },
                    { type: 'string', invalids: [''] },
                    { type: 'string', invalids: [''], flags: { presence: 'required' } }
                ],
                items: [
                    { type: 'number', invalids: [Infinity, -Infinity], flags: { unsafe: false } },
                    { type: 'string', invalids: [''] },
                    { type: 'boolean', flags: { presence: 'forbidden', insensitive: true }, truthy: [true], falsy: [false] }
                ]
            });
        });
    });

    describe('unique()', () => {

        it('errors if duplicate numbers, strings, objects, binaries, functions, dates and booleans', () => {

            const buffer = Buffer.from('hello world');
            const func = function () {};
            const now = new Date();
            const schema = Joi.array().sparse().unique();

            Helper.validate(schema, [
                [[2, 2], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: 2,
                            dupePos: 0,
                            dupeValue: 2,
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[0x2, 2], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: 2,
                            dupePos: 0,
                            dupeValue: 0x2,
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [['duplicate', 'duplicate'], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: 'duplicate',
                            dupePos: 0,
                            dupeValue: 'duplicate',
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[{ a: 'b' }, { a: 'b' }], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: { a: 'b' },
                            dupePos: 0,
                            dupeValue: { a: 'b' },
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[buffer, buffer], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: buffer,
                            dupePos: 0,
                            dupeValue: buffer,
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[func, func], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: func,
                            dupePos: 0,
                            dupeValue: func,
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[now, now], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: now,
                            dupePos: 0,
                            dupeValue: now,
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[true, true], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: true,
                            dupePos: 0,
                            dupeValue: true,
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[undefined, undefined], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: undefined,
                            dupePos: 0,
                            dupeValue: undefined,
                            label: 'value',
                            key: 1
                        }
                    }]
                }]
            ]);
        });

        it('errors with the correct details', () => {

            let error = Joi.array().items(Joi.number()).unique().validate([1, 2, 3, 1, 4]).error;
            expect(error).to.be.an.error('"value" position 3 contains a duplicate value');
            expect(error.details).to.equal([{
                context: {
                    key: 3,
                    label: 'value',
                    pos: 3,
                    value: 1,
                    dupePos: 0,
                    dupeValue: 1
                },
                message: '"value" position 3 contains a duplicate value',
                path: [3],
                type: 'array.unique'
            }]);

            error = Joi.array().items(Joi.number()).unique((a, b) => a === b).validate([1, 2, 3, 1, 4]).error;
            expect(error).to.be.an.error('"value" position 3 contains a duplicate value');
            expect(error.details).to.equal([{
                context: {
                    key: 3,
                    label: 'value',
                    pos: 3,
                    value: 1,
                    dupePos: 0,
                    dupeValue: 1
                },
                message: '"value" position 3 contains a duplicate value',
                path: [3],
                type: 'array.unique'
            }]);

            error = Joi.object({ a: Joi.array().items(Joi.number()).unique() }).validate({ a: [1, 2, 3, 1, 4] }).error;
            expect(error).to.be.an.error('child "a" fails because ["a" position 3 contains a duplicate value]');
            expect(error.details).to.equal([{
                context: {
                    key: 3,
                    label: 'a',
                    pos: 3,
                    value: 1,
                    dupePos: 0,
                    dupeValue: 1
                },
                message: '"a" position 3 contains a duplicate value',
                path: ['a', 3],
                type: 'array.unique'
            }]);

            error = Joi.object({ a: Joi.array().items(Joi.number()).unique((a, b) => a === b) }).validate({ a: [1, 2, 3, 1, 4] }).error;
            expect(error).to.be.an.error('child "a" fails because ["a" position 3 contains a duplicate value]');
            expect(error.details).to.equal([{
                context: {
                    key: 3,
                    label: 'a',
                    pos: 3,
                    value: 1,
                    dupePos: 0,
                    dupeValue: 1
                },
                message: '"a" position 3 contains a duplicate value',
                path: ['a', 3],
                type: 'array.unique'
            }]);
        });

        it('ignores duplicates if they are of different types', () => {

            const schema = Joi.array().unique();

            Helper.validate(schema, [
                [[2, '2'], true]
            ]);
        });

        it('validates without duplicates', () => {

            const buffer = Buffer.from('hello world');
            const buffer2 = Buffer.from('Hello world');
            const func = function () {};
            const func2 = function () {};
            const now = new Date();
            const now2 = new Date(+now + 100);
            const schema = Joi.array().unique();

            Helper.validate(schema, [
                [[1, 2], true],
                [['s1', 's2'], true],
                [[{ a: 'b' }, { a: 'c' }], true],
                [[buffer, buffer2], true],
                [[func, func2], true],
                [[now, now2], true],
                [[true, false], true]
            ]);
        });

        it('validates using a comparator', () => {

            const schema = Joi.array().unique((left, right) => left.a === right.a);

            Helper.validate(schema, [
                [[{ a: 'b' }, { a: 'c' }], true],
                [[{ a: 'b', c: 'd' }, { a: 'c', c: 'd' }], true],
                [[{ a: 'b', c: 'd' }, { a: 'b', c: 'd' }], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: { a: 'b', c: 'd' },
                            dupePos: 0,
                            dupeValue: { a: 'b', c: 'd' },
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[{ a: 'b', c: 'c' }, { a: 'b', c: 'd' }], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: { a: 'b', c: 'd' },
                            dupePos: 0,
                            dupeValue: { a: 'b', c: 'c' },
                            label: 'value',
                            key: 1
                        }
                    }]
                }]
            ]);
        });

        it('validates using a comparator with different types', () => {

            const schema = Joi.array().items(Joi.string(), Joi.object({ a: Joi.string() })).unique((left, right) => {

                if (typeof left === 'object') {
                    if (typeof right === 'object') {
                        return left.a === right.a;
                    }

                    return left.a === right;
                }

                if (typeof right === 'object') {
                    return left === right.a;
                }

                return left === right;
            });

            Helper.validate(schema, [
                [[{ a: 'b' }, { a: 'c' }], true],
                [[{ a: 'b' }, 'c'], true],
                [[{ a: 'b' }, 'c', { a: 'd' }, 'e'], true],
                [[{ a: 'b' }, { a: 'b' }], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: { a: 'b' },
                            dupePos: 0,
                            dupeValue: { a: 'b' },
                            label: 'value',
                            key: 1
                        }
                    }]
                }],
                [[{ a: 'b' }, 'b'], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: 'b',
                            dupePos: 0,
                            dupeValue: { a: 'b' },
                            label: 'value',
                            key: 1
                        }
                    }]
                }]
            ]);
        });

        it('validates using a path comparator', () => {

            let schema = Joi.array().items(Joi.object({ id: Joi.number() })).unique('id');

            Helper.validate(schema, [
                [[{ id: 1 }, { id: 2 }, { id: 3 }], true],
                [[{ id: 1 }, { id: 2 }, {}], true],
                [[{ id: 1 }, { id: 2 }, { id: 1 }], false, null, {
                    message: '"value" position 2 contains a duplicate value',
                    details: [{
                        context: {
                            dupePos: 0,
                            dupeValue: { id: 1 },
                            key: 2,
                            label: 'value',
                            path: 'id',
                            pos: 2,
                            value: { id: 1 }
                        },
                        message: '"value" position 2 contains a duplicate value',
                        path: [2],
                        type: 'array.unique'
                    }]
                }],
                [[{ id: 1 }, { id: 2 }, {}, { id: 3 }, {}], false, null, {
                    message: '"value" position 4 contains a duplicate value',
                    details: [{
                        context: {
                            dupePos: 2,
                            dupeValue: {},
                            key: 4,
                            label: 'value',
                            path: 'id',
                            pos: 4,
                            value: {}
                        },
                        message: '"value" position 4 contains a duplicate value',
                        path: [4],
                        type: 'array.unique'
                    }]
                }]
            ]);

            schema = Joi.array().items(Joi.object({ nested: { id: Joi.number() } })).unique('nested.id');

            Helper.validate(schema, [
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, { nested: { id: 3 } }], true],
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, {}], true],
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, { nested: { id: 1 } }], false, null, {
                    message: '"value" position 2 contains a duplicate value',
                    details: [{
                        context: {
                            dupePos: 0,
                            dupeValue: { nested: { id: 1 } },
                            key: 2,
                            label: 'value',
                            path: 'nested.id',
                            pos: 2,
                            value: { nested: { id: 1 } }
                        },
                        message: '"value" position 2 contains a duplicate value',
                        path: [2],
                        type: 'array.unique'
                    }]
                }],
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, {}, { nested: { id: 3 } }, {}], false, null, {
                    message: '"value" position 4 contains a duplicate value',
                    details: [{
                        context: {
                            dupePos: 2,
                            dupeValue: {},
                            key: 4,
                            label: 'value',
                            path: 'nested.id',
                            pos: 4,
                            value: {}
                        },
                        message: '"value" position 4 contains a duplicate value',
                        path: [4],
                        type: 'array.unique'
                    }]
                }]
            ]);

            schema = Joi.array().items(Joi.object({ nested: { id: Joi.number() } })).unique('nested');

            Helper.validate(schema, [
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, { nested: { id: 3 } }], true],
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, {}], true],
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, { nested: { id: 1 } }], false, null, {
                    message: '"value" position 2 contains a duplicate value',
                    details: [{
                        context: {
                            dupePos: 0,
                            dupeValue: { nested: { id: 1 } },
                            key: 2,
                            label: 'value',
                            path: 'nested',
                            pos: 2,
                            value: { nested: { id: 1 } }
                        },
                        message: '"value" position 2 contains a duplicate value',
                        path: [2],
                        type: 'array.unique'
                    }]
                }],
                [[{ nested: { id: 1 } }, { nested: { id: 2 } }, {}, { nested: { id: 3 } }, {}], false, null, {
                    message: '"value" position 4 contains a duplicate value',
                    details: [{
                        context: {
                            dupePos: 2,
                            dupeValue: {},
                            key: 4,
                            label: 'value',
                            path: 'nested',
                            pos: 4,
                            value: {}
                        },
                        message: '"value" position 4 contains a duplicate value',
                        path: [4],
                        type: 'array.unique'
                    }]
                }]
            ]);
        });

        it('ignores undefined value when ignoreUndefined is true', () => {

            const schema = Joi.array().unique('a', { ignoreUndefined: true });

            Helper.validate(schema, [
                [[{ a: 'b' }, { a: 'c' }], true],
                [[{ c: 'd' }, { c: 'd' }], true],
                [[{ a: 'b', c: 'd' }, { a: 'b', c: 'd' }], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: { a: 'b', c: 'd' },
                            dupePos: 0,
                            dupeValue: { a: 'b', c: 'd' },
                            label: 'value',
                            key: 1,
                            path: 'a'
                        }
                    }]
                }],
                [[{ a: 'b', c: 'c' }, { a: 'b', c: 'd' }], false, null, {
                    message: '"value" position 1 contains a duplicate value',
                    details: [{
                        message: '"value" position 1 contains a duplicate value',
                        path: [1],
                        type: 'array.unique',
                        context: {
                            pos: 1,
                            value: { a: 'b', c: 'd' },
                            dupePos: 0,
                            dupeValue: { a: 'b', c: 'c' },
                            label: 'value',
                            key: 1,
                            path: 'a'
                        }
                    }]
                }]
            ]);
        });

        it('fails with invalid configs', () => {

            expect(() => {

                Joi.array().unique('id', 'invalid configs');
            }).to.throw(Error, 'configs must be an object');
            expect(() => {

                Joi.array().unique('id', {});
            }).to.not.throw();
        });

        it('fails with invalid comparator', () => {

            expect(() => {

                Joi.array().unique({});
            }).to.throw(Error, 'comparator must be a function or a string');
        });
    });

    describe('sparse()', () => {

        it('errors on undefined value', () => {

            const schema = Joi.array().items(Joi.number());

            Helper.validate(schema, [
                [[undefined], false, null, {
                    message: '"value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [0],
                        type: 'array.sparse',
                        context: { label: 'value', key: 0 }
                    }]
                }],
                [[2, undefined], false, null, {
                    message: '"value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [1],
                        type: 'array.sparse',
                        context: { label: 'value', key: 1 }
                    }]
                }]
            ]);
        });

        it('errors on undefined value after validation', () => {

            const schema = Joi.array().items(Joi.object().empty({}));

            Helper.validate(schema, [
                [[{ a: 1 }, {}, { c: 3 }], false, null, {
                    message: '"value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [1],
                        type: 'array.sparse',
                        context: { label: 'value', key: 1 }
                    }]
                }]
            ]);
        });

        it('errors on undefined value after validation with abortEarly false', () => {

            const schema = Joi.array().items(Joi.object().empty({})).options({ abortEarly: false });

            Helper.validate(schema, [
                [[{ a: 1 }, {}, 3], false, null, {
                    message: '"value" must not be a sparse array. "value" at position 2 fails because ["2" must be an object]',
                    details: [
                        {
                            message: '"value" must not be a sparse array',
                            path: [1],
                            type: 'array.sparse',
                            context: { label: 'value', key: 1 }
                        },
                        {
                            message: '"2" must be an object',
                            path: [2],
                            type: 'object.base',
                            context: { label: 2, key: 2, value: 3 }
                        }
                    ]
                }]
            ]);
        });

        it('errors on undefined value after validation with required', () => {

            const schema = Joi.array().items(Joi.object().empty({}).required());

            Helper.validate(schema, [
                [[{}, { c: 3 }], false, null, {
                    message: '"value" at position 0 fails because ["0" is required]',
                    details: [{
                        message: '"0" is required',
                        path: [0],
                        type: 'any.required',
                        context: { label: 0, key: 0 }
                    }]
                }]
            ]);
        });

        it('errors on undefined value after custom validation with required', () => {

            const customJoi = Joi.extend({
                name: 'myType',
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, options) {

                            return undefined;
                        }
                    }
                ]
            });

            const schema = Joi.array().items(customJoi.myType().foo().required());

            Helper.validate(schema, [
                [[{}, { c: 3 }], false, null, {
                    message: '"value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [0],
                        type: 'array.sparse',
                        context: { label: 'value', key: 0 }
                    }]
                }]
            ]);
        });

        it('errors on undefined value after custom validation with required and abortEarly false', () => {

            const customJoi = Joi.extend({
                name: 'myType',
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, options) {

                            return undefined;
                        }
                    }
                ]
            });

            const schema = Joi.array().items(customJoi.myType().foo().required()).options({ abortEarly: false });

            Helper.validate(schema, [
                [[{}, { c: 3 }], false, null, {
                    message: '"value" must not be a sparse array. "value" must not be a sparse array',
                    details: [
                        {
                            message: '"value" must not be a sparse array',
                            path: [0],
                            type: 'array.sparse',
                            context: { label: 'value', key: 0 }
                        },
                        {
                            message: '"value" must not be a sparse array',
                            path: [1],
                            type: 'array.sparse',
                            context: { label: 'value', key: 1 }
                        }
                    ]
                }]
            ]);
        });

        it('errors on undefined value after validation with required and abortEarly false', () => {

            const schema = Joi.array().items(Joi.object().empty({}).required()).options({ abortEarly: false });

            Helper.validate(schema, [
                [[{}, 3], false, null, {
                    message: '"value" at position 0 fails because ["0" is required]. "value" at position 1 fails because ["1" must be an object]. "value" does not contain 1 required value(s)',
                    details: [
                        {
                            message: '"0" is required',
                            path: [0],
                            type: 'any.required',
                            context: { label: 0, key: 0 }
                        },
                        {
                            message: '"1" must be an object',
                            path: [1],
                            type: 'object.base',
                            context: { label: 1, key: 1, value: 3 }
                        },
                        {
                            message: '"value" does not contain 1 required value(s)',
                            path: [],
                            type: 'array.includesRequiredUnknowns',
                            context: { unknownMisses: 1, label: 'value', key: undefined }
                        }
                    ]
                }]
            ]);
        });

        it('errors on undefined value after validation with ordered', () => {

            const schema = Joi.array().ordered(Joi.object().empty({}));

            Helper.validate(schema, [
                [[{}], false, null, {
                    message: '"value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [0],
                        type: 'array.sparse',
                        context: { label: 'value', key: 0 }
                    }]
                }]
            ]);
        });

        it('errors on undefined value after validation with ordered and abortEarly false', () => {

            const schema = Joi.array().ordered(Joi.object().empty({})).options({ abortEarly: false });

            Helper.validate(schema, [
                [[{}, 3], false, null, {
                    message: '"value" must not be a sparse array. "value" at position 1 fails because array must contain at most 1 items',
                    details: [
                        {
                            message: '"value" must not be a sparse array',
                            path: [0],
                            type: 'array.sparse',
                            context: { label: 'value', key: 0 }
                        },
                        {
                            message: '"value" at position 1 fails because array must contain at most 1 items',
                            path: [1],
                            type: 'array.orderedLength',
                            context: { pos: 1, limit: 1, label: 'value', key: 1 }
                        }
                    ]
                }]
            ]);
        });

        it('validates on undefined value with sparse', () => {

            const schema = Joi.array().items(Joi.number()).sparse();

            Helper.validate(schema, [
                [[undefined], true],
                [[2, undefined], true]
            ]);
        });

        it('validates on undefined value after validation', () => {

            const schema = Joi.array().items(Joi.object().empty({})).sparse();

            Helper.validate(schema, [
                [[{ a: 1 }, {}, { c: 3 }], true, null, [{ a: 1 }, undefined, { c: 3 }]]
            ]);
        });

        it('validates on undefined value after validation with required', () => {

            const schema = Joi.array().items(Joi.object().empty({}).required()).sparse();

            Helper.validate(schema, [
                [[{ a: 1 }, {}, { c: 3 }], false, null, {
                    message: '"value" at position 1 fails because ["1" is required]',
                    details: [{
                        message: '"1" is required',
                        path: [1],
                        type: 'any.required',
                        context: { label: 1, key: 1 }
                    }]
                }]
            ]);
        });

        it('validates on undefined value after validation with ordered', () => {

            const schema = Joi.array().ordered(Joi.object().empty({})).sparse();

            Helper.validate(schema, [
                [[{}], true, null, [undefined]]
            ]);
        });

        it('switches the sparse flag', () => {

            const schema = Joi.array().sparse();
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: true }
            });
        });

        it('switches the sparse flag with explicit value', () => {

            const schema = Joi.array().sparse(true);
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: true }
            });
        });

        it('switches the sparse flag back', () => {

            const schema = Joi.array().sparse().sparse(false);
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: false }
            });
        });

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.array().sparse();
            expect(schema.sparse()).to.shallow.equal(schema);
        });
    });

    describe('single()', () => {

        it('should allow a single element', () => {

            const schema = Joi.array().items(Joi.number()).items(Joi.boolean().forbidden()).single();

            Helper.validate(schema, [
                [[1, 2, 3], true],
                [1, true],
                [['a'], false, null, {
                    message: '"value" at position 0 fails because ["0" must be a number]',
                    details: [{
                        message: '"0" must be a number',
                        path: [0],
                        type: 'number.base',
                        context: { label: 0, key: 0, value: 'a' }
                    }]
                }],
                ['a', false, null, {
                    message: 'single value of "value" fails because ["value" must be a number]',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', key: undefined, value: 'a' }
                    }]
                }],
                [true, false, null, {
                    message: 'single value of "value" contains an excluded value',
                    details: [{
                        message: 'single value of "value" contains an excluded value',
                        path: [],
                        type: 'array.excludesSingle',
                        context: { pos: 0, value: true, label: 'value', key: undefined }
                    }]
                }]
            ]);
        });

        it('should allow a single element with multiple types', () => {

            const schema = Joi.array().items(Joi.number(), Joi.string()).single();

            Helper.validate(schema, [
                [[1, 2, 3], true],
                [1, true],
                [[1, 'a'], true],
                ['a', true],
                [true, false, null, {
                    message: 'single value of "value" does not match any of the allowed types',
                    details: [{
                        message: 'single value of "value" does not match any of the allowed types',
                        path: [],
                        type: 'array.includesSingle',
                        context: { pos: 0, value: true, label: 'value', key: undefined }
                    }]
                }]
            ]);
        });

        it('should allow nested arrays', () => {

            const schema = Joi.array().items(Joi.array().items(Joi.number())).single();

            Helper.validate(schema, [
                [[[1], [2], [3]], true],
                [[1, 2, 3], true],
                [[['a']], false, null, {
                    message: '"value" at position 0 fails because ["0" at position 0 fails because ["0" must be a number]]',
                    details: [{
                        message: '"0" must be a number',
                        path: [0, 0],
                        type: 'number.base',
                        context: { label: 0, key: 0, value: 'a' }
                    }]
                }],
                [['a'], false, null, {
                    message: '"value" at position 0 fails because ["0" must be an array]',
                    details: [{
                        message: '"0" must be an array',
                        path: [0],
                        type: 'array.base',
                        context: { label: 0, key: 0 }
                    }]
                }],
                ['a', false, null, {
                    message: 'single value of "value" fails because ["value" must be an array]',
                    details: [{
                        message: '"value" must be an array',
                        path: [],
                        type: 'array.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [1, false, null, {
                    message: 'single value of "value" fails because ["value" must be an array]',
                    details: [{
                        message: '"value" must be an array',
                        path: [],
                        type: 'array.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [true, false, null, {
                    message: 'single value of "value" fails because ["value" must be an array]',
                    details: [{
                        message: '"value" must be an array',
                        path: [],
                        type: 'array.base',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ]);
        });

        it('should allow nested arrays with multiple types', () => {

            const schema = Joi.array().items(Joi.array().items(Joi.number(), Joi.boolean())).single();

            Helper.validate(schema, [
                [[[1, true]], true],
                [[1, true], true],
                [[[1, 'a']], false, null, {
                    message: '"value" at position 0 fails because ["0" at position 1 does not match any of the allowed types]',
                    details: [{
                        message: '"0" at position 1 does not match any of the allowed types',
                        path: [0, 1],
                        type: 'array.includes',
                        context: { pos: 1, value: 'a', label: 0, key: 1 }
                    }]
                }],
                [[1, 'a'], false, null, {
                    message: '"value" at position 0 fails because ["0" must be an array]',
                    details: [{
                        message: '"0" must be an array',
                        path: [0],
                        type: 'array.base',
                        context: { label: 0, key: 0 }
                    }]
                }]
            ]);
        });

        it('switches the single flag with explicit value', () => {

            const schema = Joi.array().single(true);
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: false, single: true }
            });
        });

        it('switches the single flag back', () => {

            const schema = Joi.array().single().single(false);
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'array',
                flags: { sparse: false, single: false }
            });
        });

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.array().single();
            expect(schema.single()).to.shallow.equal(schema);
        });
    });

    describe('options()', () => {

        it('ignores stripUnknown when true', async () => {

            const schema = Joi.array().items(Joi.string()).options({ stripUnknown: true });
            await expect(schema.validate(['one', 'two', 3, 4, true, false])).to.reject('"value" at position 2 fails because ["2" must be a string]');
        });

        it('respects stripUnknown (as an object)', async () => {

            const schema = Joi.array().items(Joi.string()).options({ stripUnknown: { arrays: true, objects: false } });
            const value = await schema.validate(['one', 'two', 3, 4, true, false]);
            expect(value).to.equal(['one', 'two']);
        });
    });

    describe('ordered()', () => {

        it('shows path to errors in array ordered items', () => {

            expect(() => {

                Joi.array().ordered({
                    a: {
                        b: {
                            c: {
                                d: undefined
                            }
                        }
                    }
                });
            }).to.throw(Error, 'Invalid schema content: (0.a.b.c.d)');

            expect(() => {

                Joi.array().ordered({ foo: 'bar' }, undefined);
            }).to.throw(Error, 'Invalid schema content: (1)');
        });

        it('validates input against items in order', async () => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().required()]);
            const input = ['s1', 2];
            const value = await schema.validate(input);
            expect(value).to.equal(['s1', 2]);
        });

        it('validates input with optional item', async () => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().required(), Joi.number()]);
            const input = ['s1', 2, 3];

            const value = await schema.validate(input);
            expect(value).to.equal(['s1', 2, 3]);
        });

        it('validates input without optional item', async () => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().required(), Joi.number()]);
            const input = ['s1', 2];

            const value = await schema.validate(input);
            expect(value).to.equal(['s1', 2]);
        });

        it('validates input without optional item', async () => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().required(), Joi.number()]).sparse(true);
            const input = ['s1', 2, undefined];

            const value = await schema.validate(input);
            expect(value).to.equal(['s1', 2, undefined]);
        });

        it('validates input without optional item in a sparse array', async () => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number(), Joi.number().required()]).sparse(true);
            const input = ['s1', undefined, 3];

            const value = await schema.validate(input);
            expect(value).to.equal(['s1', undefined, 3]);
        });

        it('validates when input matches ordered items and matches regular items', async () => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().required()]).items(Joi.number());
            const input = ['s1', 2, 3, 4, 5];
            const value = await schema.validate(input);
            expect(value).to.equal(['s1', 2, 3, 4, 5]);
        });

        it('errors when input does not match ordered items', async () => {

            const schema = Joi.array().ordered([Joi.number().required(), Joi.string().required()]);
            const input = ['s1', 2];
            const err = await expect(schema.validate(input)).to.reject('"value" at position 0 fails because ["0" must be a number]');
            expect(err.details).to.equal([{
                message: '"0" must be a number',
                path: [0],
                type: 'number.base',
                context: { label: 0, key: 0, value: 's1' }
            }]);
        });

        it('errors when input has more items than ordered items', async () => {

            const schema = Joi.array().ordered([Joi.number().required(), Joi.string().required()]);
            const input = [1, 's2', 3];
            const err = await expect(schema.validate(input)).to.reject('"value" at position 2 fails because array must contain at most 2 items');
            expect(err.details).to.equal([{
                message: '"value" at position 2 fails because array must contain at most 2 items',
                path: [2],
                type: 'array.orderedLength',
                context: { pos: 2, limit: 2, label: 'value', key: 2 }
            }]);
        });

        it('errors when input has more items than ordered items with abortEarly = false', async () => {

            const schema = Joi.array().ordered([Joi.string(), Joi.number()]).options({ abortEarly: false });
            const input = [1, 2, 3, 4, 5];
            const err = await expect(schema.validate(input)).to.reject();
            expect(err).to.be.an.error('"value" at position 0 fails because ["0" must be a string]. "value" at position 2 fails because array must contain at most 2 items. "value" at position 3 fails because array must contain at most 2 items. "value" at position 4 fails because array must contain at most 2 items');
            expect(err.details).to.have.length(4);
            expect(err.details).to.equal([
                {
                    message: '"0" must be a string',
                    path: [0],
                    type: 'string.base',
                    context: { value: 1, label: 0, key: 0 }
                },
                {
                    message: '"value" at position 2 fails because array must contain at most 2 items',
                    path: [2],
                    type: 'array.orderedLength',
                    context: { pos: 2, limit: 2, label: 'value', key: 2 }
                },
                {
                    message: '"value" at position 3 fails because array must contain at most 2 items',
                    path: [3],
                    type: 'array.orderedLength',
                    context: { pos: 3, limit: 2, label: 'value', key: 3 }
                },
                {
                    message: '"value" at position 4 fails because array must contain at most 2 items',
                    path: [4],
                    type: 'array.orderedLength',
                    context: { pos: 4, limit: 2, label: 'value', key: 4 }
                }
            ]);
        });

        it('errors when input has less items than ordered items', async () => {

            const schema = Joi.array().ordered([Joi.number().required(), Joi.string().required()]);
            const input = [1];
            const err = await expect(schema.validate(input)).to.reject('"value" does not contain 1 required value(s)');
            expect(err.details).to.equal([{
                message: '"value" does not contain 1 required value(s)',
                path: [],
                type: 'array.includesRequiredUnknowns',
                context: { unknownMisses: 1, label: 'value', key: undefined }
            }]);
        });

        it('errors when input matches ordered items but not matches regular items', async () => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().required()]).items(Joi.number()).options({ abortEarly: false });
            const input = ['s1', 2, 3, 4, 's5'];
            const err = await expect(schema.validate(input)).to.reject('"value" at position 4 fails because ["4" must be a number]');
            expect(err.details).to.equal([{
                message: '"4" must be a number',
                path: [4],
                type: 'number.base',
                context: { label: 4, key: 4, value: 's5' }
            }]);
        });

        it('errors when input does not match ordered items but matches regular items', async () => {

            const schema = Joi.array().ordered([Joi.string(), Joi.number()]).items(Joi.number()).options({ abortEarly: false });
            const input = [1, 2, 3, 4, 5];
            const err = await expect(schema.validate(input)).to.reject('"value" at position 0 fails because ["0" must be a string]');
            expect(err.details).to.equal([{
                message: '"0" must be a string',
                path: [0],
                type: 'string.base',
                context: { value: 1, label: 0, key: 0 }
            }]);
        });

        it('errors when input does not match ordered items not matches regular items', async () => {

            const schema = Joi.array().ordered([Joi.string(), Joi.number()]).items(Joi.string()).options({ abortEarly: false });
            const input = [1, 2, 3, 4, 5];
            const err = await expect(schema.validate(input)).to.reject();
            expect(err).to.be.an.error('"value" at position 0 fails because ["0" must be a string]. "value" at position 2 fails because ["2" must be a string]. "value" at position 3 fails because ["3" must be a string]. "value" at position 4 fails because ["4" must be a string]');
            expect(err.details).to.have.length(4);
            expect(err.details).to.equal([
                {
                    message: '"0" must be a string',
                    path: [0],
                    type: 'string.base',
                    context: { value: 1, label: 0, key: 0 }
                },
                {
                    message: '"2" must be a string',
                    path: [2],
                    type: 'string.base',
                    context: { value: 3, label: 2, key: 2 }
                },
                {
                    message: '"3" must be a string',
                    path: [3],
                    type: 'string.base',
                    context: { value: 4, label: 3, key: 3 }
                },
                {
                    message: '"4" must be a string',
                    path: [4],
                    type: 'string.base',
                    context: { value: 5, label: 4, key: 4 }
                }
            ]);
        });

        it('errors but continues when abortEarly is set to false', async () => {

            const schema = Joi.array().ordered([Joi.number().required(), Joi.string().required()]).options({ abortEarly: false });
            const input = ['s1', 2];
            const err = await expect(schema.validate(input)).to.reject();
            expect(err).to.be.an.error('"value" at position 0 fails because ["0" must be a number]. "value" at position 1 fails because ["1" must be a string]');
            expect(err.details).to.have.length(2);
            expect(err.details).to.equal([
                {
                    message: '"0" must be a number',
                    path: [0],
                    type: 'number.base',
                    context: { label: 0, key: 0, value: 's1' }
                },
                {
                    message: '"1" must be a string',
                    path: [1],
                    type: 'string.base',
                    context: { value: 2, label: 1, key: 1 }
                }
            ]);
        });

        it('errors on sparse arrays and continues when abortEarly is set to false', () => {

            const schema = Joi.array().ordered(
                Joi.number().min(0),
                Joi.string().min(2),
                Joi.number().max(0),
                Joi.string().max(3)
            ).options({ abortEarly: false });

            Helper.validate(schema, [
                [[0, 'ab', 0, 'ab'], true],
                [[undefined, 'foo', 2, 'bar'], false, null, {
                    message: '"value" must not be a sparse array. "value" at position 2 fails because ["2" must be less than or equal to 0]',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [0],
                        type: 'array.sparse',
                        context: { key: 0, label: 'value' }
                    }, {
                        message: '"2" must be less than or equal to 0',
                        path: [2],
                        type: 'number.max',
                        context: { key: 2, label: 2, limit: 0, value: 2 }
                    }]
                }],
                [[undefined, 'foo', 2, undefined], false, null, {
                    message: '"value" must not be a sparse array. "value" at position 2 fails because ["2" must be less than or equal to 0]. "value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [0],
                        type: 'array.sparse',
                        context: { key: 0, label: 'value' }
                    }, {
                        message: '"2" must be less than or equal to 0',
                        path: [2],
                        type: 'number.max',
                        context: { key: 2, label: 2, limit: 0, value: 2 }
                    }, {
                        message: '"value" must not be a sparse array',
                        path: [3],
                        type: 'array.sparse',
                        context: { key: 3, label: 'value' }
                    }]
                }]
            ]);
        });

        it('errors on forbidden items and continues when abortEarly is set to false', () => {

            const schema = Joi.array().items(Joi.bool().forbidden()).ordered(
                Joi.number().min(0),
                Joi.string().min(2),
                Joi.number().max(0),
                Joi.string().max(3)
            ).options({ abortEarly: false });

            Helper.validate(schema, [
                [[0, 'ab', 0, 'ab'], true],
                [[undefined, 'foo', 2, 'bar'], false, null, {
                    message: '"value" must not be a sparse array. "value" at position 2 fails because ["2" must be less than or equal to 0]',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [0],
                        type: 'array.sparse',
                        context: { key: 0, label: 'value' }
                    }, {
                        message: '"2" must be less than or equal to 0',
                        path: [2],
                        type: 'number.max',
                        context: { key: 2, label: 2, limit: 0, value: 2 }
                    }]
                }],
                [[undefined, 'foo', 2, undefined], false, null, {
                    message: '"value" must not be a sparse array. "value" at position 2 fails because ["2" must be less than or equal to 0]. "value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [0],
                        type: 'array.sparse',
                        context: { key: 0, label: 'value' }
                    }, {
                        message: '"2" must be less than or equal to 0',
                        path: [2],
                        type: 'number.max',
                        context: { key: 2, label: 2, limit: 0, value: 2 }
                    }, {
                        message: '"value" must not be a sparse array',
                        path: [3],
                        type: 'array.sparse',
                        context: { key: 3, label: 'value' }
                    }]
                }],
                [[undefined, false, 2, undefined], false, null, {
                    message: '"value" must not be a sparse array. "value" at position 1 contains an excluded value. "value" at position 2 fails because ["2" must be less than or equal to 0]. "value" must not be a sparse array',
                    details: [{
                        message: '"value" must not be a sparse array',
                        path: [0],
                        type: 'array.sparse',
                        context: { key: 0, label: 'value' }
                    }, {
                        message: '"value" at position 1 contains an excluded value',
                        path: [1],
                        type: 'array.excludes',
                        context: { key: 1, label: 'value', pos: 1, value: false }
                    }, {
                        message: '"2" must be less than or equal to 0',
                        path: [2],
                        type: 'number.max',
                        context: { key: 2, label: 2, limit: 0, value: 2 }
                    }, {
                        message: '"value" must not be a sparse array',
                        path: [3],
                        type: 'array.sparse',
                        context: { key: 3, label: 'value' }
                    }]
                }]
            ]);
        });

        it('strips item', async () => {

            const schema = Joi.array().ordered([Joi.string().required(), Joi.number().strip(), Joi.number().required()]);
            const input = ['s1', 2, 3];
            const value = await schema.validate(input);
            expect(value).to.equal(['s1', 3]);
        });

        it('strips multiple items', async () => {

            const schema = Joi.array().ordered([Joi.string().strip(), Joi.number(), Joi.number().strip()]);
            const input = ['s1', 2, 3];
            const value = await schema.validate(input);
            expect(value).to.equal([2]);
        });
    });
});
