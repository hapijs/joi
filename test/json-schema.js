'use strict';

const Joi = require('..');
const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helper = require('./helper');


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('jsonSchema', () => {

    describe('any', () => {

        it('represents empty schema', () => {

            Helper.validateJsonSchema(Joi.any(), {});
        });

        it('represents conditional schema as anyOf', () => {

            Helper.validateJsonSchema(Joi.any().when('a', { is: 1, then: Joi.string(), otherwise: Joi.number() }), {
                anyOf: [
                    { type: 'string', minLength: 1 },
                    { type: 'number' }
                ]
            });
        });

        it('represents conditional schema with only then as anyOf', () => {

            Helper.validateJsonSchema(Joi.any().when('a', { is: 1, then: Joi.string() }), {
                anyOf: [
                    { type: 'string', minLength: 1 },
                    {}
                ]
            });
        });

        it('represents conditional schema with only otherwise as anyOf', () => {

            Helper.validateJsonSchema(Joi.any().when('a', { is: 1, otherwise: Joi.number() }), {
                anyOf: [
                    { type: 'number' },
                    {}
                ]
            });
        });

        it('represents multiple conditional schemas as anyOf', () => {

            Helper.validateJsonSchema(Joi.any()
                .when('a', { is: 1, then: Joi.string() })
                .when('b', { is: 2, then: Joi.number() }), {
                anyOf: [
                    { type: 'string', minLength: 1 },
                    {},
                    { type: 'number' }
                ]
            });
        });

        it('represents conditional schema with switch as anyOf', () => {

            Helper.validateJsonSchema(Joi.any().when('a', {
                switch: [
                    { is: 1, then: Joi.string() },
                    { is: 2, then: Joi.number() }
                ],
                otherwise: Joi.boolean()
            }), {
                anyOf: [
                    { type: 'string', minLength: 1 },
                    { type: 'number' },
                    { type: 'boolean' }
                ]
            });
        });

        it('represents nested conditional schema with only then as anyOf', () => {

            Helper.validateJsonSchema(Joi.any().description('test').when('a', { is: 1, then: Joi.string() }), {
                anyOf: [
                    {
                        type: 'string',
                        description: 'test',
                        minLength: 1
                    },
                    {
                        description: 'test'
                    }
                ]
            });
        });

        it('represents conditional schema with Joi.any() then as anyOf', () => {

            Helper.validateJsonSchema(Joi.any().when('a', { is: 1, then: Joi.any() }), {
                anyOf: [
                    {}
                ]
            });
        });

        it('represents conditional schema with string then as anyOf', () => {

            Helper.validateJsonSchema(Joi.any().when('a', { is: 1, then: Joi.string() }), {
                anyOf: [
                    { type: 'string', minLength: 1 },
                    {}
                ]
            });
        });

        it('represents conditional schema with string min length then as anyOf', () => {

            Helper.validateJsonSchema(Joi.string().when('a', { is: 1, then: Joi.string().min(5) }), {
                anyOf: [
                    { type: 'string', minLength: 5 },
                    { type: 'string', minLength: 1 }
                ]
            });
        });

        it('represents conditional schema with description and valids then as anyOf', () => {

            Helper.validateJsonSchema(Joi.string().valid('a', 'b').when('c', { is: 1, then: Joi.string().description('d') }), {
                anyOf: [
                    { enum: ['a', 'b'], type: 'string', description: 'd' },
                    { enum: ['a', 'b'], type: 'string' }
                ]
            });
        });

        it('represents conditional schema with number otherwise as anyOf', () => {

            Helper.validateJsonSchema(Joi.any().when('a', { is: 1, otherwise: Joi.number() }), {
                anyOf: [
                    { type: 'number' },
                    {}
                ]
            });
        });

        it('represents conditional schema with string valid then as anyOf', () => {

            Helper.validateJsonSchema(Joi.string().valid('a').when('c', { is: 1, then: Joi.string().valid('b') }), {
                anyOf: [
                    { type: 'string', enum: ['a', 'b'] },
                    { type: 'string', enum: ['a'] }
                ]
            });
        });

        it('flattens nested anyOf from multiple sources', () => {

            Helper.validateJsonSchema(Joi.string().allow(1).when('a', { is: 1, then: Joi.string().min(10) }), {
                anyOf: [
                    {
                        anyOf: [
                            { type: 'string', minLength: 10 },
                            { enum: [1] }
                        ]
                    },
                    {
                        anyOf: [
                            { type: 'string', minLength: 1 },
                            { enum: [1] }
                        ]
                    }
                ]
            });
        });

        it('represents conditional schema with then Joi.any() as anyOf', () => {

            Helper.validateJsonSchema(Joi.any().when('a', { is: 1, then: Joi.any(), otherwise: Joi.number() }), {
                anyOf: [
                    {},
                    { type: 'number' }
                ]
            });
        });

        it('represents conditional schema with otherwise Joi.any() as anyOf', () => {

            Helper.validateJsonSchema(Joi.any().when('a', { is: 1, then: Joi.number(), otherwise: Joi.any() }), {
                anyOf: [
                    { type: 'number' },
                    {}
                ]
            });
        });

        it('represents description', () => {

            Helper.validateJsonSchema(Joi.any().description('foo').default('bar').default(() => 'baz'), {
                description: 'foo'
            });
        });

        it('represents examples', () => {

            Helper.validateJsonSchema(Joi.string().example('a').example('b'), {
                type: 'string',
                minLength: 1,
                examples: ['a', 'b']
            });
        });

        it('represents supported meta keywords', () => {

            Helper.validateJsonSchema(Joi.string().meta({
                title: 'Greeting',
                format: 'banana',
                contentEncoding: 'base64',
                contentMediaType: 'text/plain',
                readOnly: true,
                writeOnly: true,
                deprecated: true,
                examples: ['hi'],
                $comment: 'schema note'
            }), {
                type: 'string',
                minLength: 1,
                title: 'Greeting',
                format: 'banana',
                contentEncoding: 'base64',
                contentMediaType: 'text/plain',
                readOnly: true,
                writeOnly: true,
                deprecated: true,
                examples: ['hi'],
                $comment: 'schema note'
            });
        });

        it('merges meta examples without overriding validator-derived schema keywords', () => {

            Helper.validateJsonSchema(Joi.string().email().example('a@example.com').meta({
                format: 'banana',
                examples: ['b@example.com']
            }), {
                type: 'string',
                minLength: 1,
                format: 'email',
                examples: ['a@example.com', 'b@example.com']
            });
        });

        it('ignores non-object meta values', () => {

            Helper.validateJsonSchema(Joi.string().meta(null).meta('string').meta([1, 2]), {
                type: 'string',
                minLength: 1
            });
        });

        it('ignores unsupported and undefined meta keys', () => {

            Helper.validateJsonSchema(Joi.string().meta({ unknownKey: 'value', title: undefined }), {
                type: 'string',
                minLength: 1
            });
        });

        it('ignores non-array and empty meta examples', () => {

            Helper.validateJsonSchema(Joi.string().meta({ examples: 'not-an-array' }), {
                type: 'string',
                minLength: 1
            });

            Helper.validateJsonSchema(Joi.string().meta({ examples: [] }), {
                type: 'string',
                minLength: 1
            });
        });

        it('deduplicates meta examples with existing examples', () => {

            Helper.validateJsonSchema(Joi.string().example('hello').meta({ examples: ['hello', 'world'] }), {
                type: 'string',
                minLength: 1,
                examples: ['hello', 'world']
            });
        });

        it('represents description with null allowed', () => {

            Helper.validateJsonSchema(Joi.allow(null).description('foobar'), {
                description: 'foobar'
            });
        });

        it('represents description with null and number allowed', () => {

            Helper.validateJsonSchema(Joi.allow(null, 1).description('foobar'), {
                description: 'foobar'
            });
        });

        it('represents string with number allowed as anyOf', () => {

            Helper.validateJsonSchema(Joi.string().allow(1), {
                anyOf: [
                    { type: 'string', minLength: 1 },
                    { enum: [1] }
                ]
            });
        });

        it('represents description for string with number allowed as anyOf', () => {

            Helper.validateJsonSchema(Joi.string().description('foo').allow(1), {
                anyOf: [
                    { type: 'string', minLength: 1, description: 'foo' },
                    { enum: [1] }
                ]
            });
        });

        it('represents number only with allowed value', () => {

            Helper.validateJsonSchema(Joi.any().allow(1).only(), {
                type: 'number',
                enum: [1]
            });
        });

        it('represents number with valid value', () => {

            Helper.validateJsonSchema(Joi.any().valid(1), {
                type: 'number',
                enum: [1]
            });
        });

        it('represents null only', () => {

            Helper.validateJsonSchema(Joi.allow(null), {});
        });

        it('represents any null only', () => {

            Helper.validateJsonSchema(Joi.any().allow(null), {});
        });

        it('avoids duplicate types when merging null', () => {

            Helper.validateJsonSchema(Joi.string().allow(null), { type: ['string', 'null'], minLength: 1 });
        });

        it('avoids duplicate types when merging null and valid', () => {

            Helper.validateJsonSchema(Joi.string().valid('a').allow(null), { type: ['string', 'null'], enum: ['a'] });
        });

        it('represents valids with multiple types', () => {

            Helper.validateJsonSchema(Joi.valid('a', 'b'), { enum: ['a', 'b'], type: 'string' });
        });

        it('represents mixed string and number valids', () => {

            Helper.validateJsonSchema(Joi.valid('a', 1), { type: ['string', 'number'], enum: ['a', 1] });
        });

        it('represents boolean valids', () => {

            Helper.validateJsonSchema(Joi.valid(true, false), { type: 'boolean', enum: [true, false] });
        });

        it('represents object valids', () => {

            Helper.validateJsonSchema(Joi.valid({}), { enum: [{}] });
        });

        it('represents single number valid', () => {

            Helper.validateJsonSchema(Joi.any().valid(1), { type: 'number', enum: [1] });
        });

        it('represents multi-type valids', () => {

            Helper.validateJsonSchema(Joi.valid('a', 1, true), { type: ['string', 'number', 'boolean'], enum: ['a', 1, true] });
        });

        it('represents any with allowed multi-type values', () => {

            Helper.validateJsonSchema(Joi.any().allow(null, 'a', 1), {});
        });

        it('represents any with allowed string and number', () => {

            Helper.validateJsonSchema(Joi.any().allow('a', 1), {});
        });

        it('represents any with allowed string', () => {

            Helper.validateJsonSchema(Joi.any().allow('a'), {});
        });

        it('represents string with allowed multi-type values', () => {

            Helper.validateJsonSchema(Joi.string().allow(null, 1), {
                anyOf: [
                    { type: 'null' },
                    { type: 'string', minLength: 1 },
                    { enum: [1] }
                ]
            });
        });

        it('represents string with allowed null and min length', () => {

            Helper.validateJsonSchema(Joi.string().allow(null).min(5), { type: ['string', 'null'], minLength: 5 });
        });

        it('represents inferred types for valids', () => {

            Helper.validateJsonSchema(Joi.compile('foo'), { enum: ['foo'], type: 'string' });
        });

        it('represents multiple number valids', () => {

            Helper.validateJsonSchema(Joi.valid(1, 2), { type: 'number', enum: [1, 2] });
        });

        it('represents single boolean valid', () => {

            Helper.validateJsonSchema(Joi.valid(true), { type: 'boolean', enum: [true] });
        });

        it('represents inferred mixed string and number valids', () => {

            Helper.validateJsonSchema(Joi.valid('foo', 1), { type: ['string', 'number'], enum: ['foo', 1] });
        });

        it('represents inferred mixed string and null valids', () => {

            Helper.validateJsonSchema(Joi.valid('foo', null), { type: ['string', 'null'], enum: ['foo'] });
        });

        it('represents string schema with number valid as number type', () => {

            Helper.validateJsonSchema(Joi.string().valid(1), { type: 'number', enum: [1] });
        });

        it('represents string schema with mixed number and string valids', () => {

            Helper.validateJsonSchema(Joi.string().valid(1, 'a'), { type: ['number', 'string'], enum: [1, 'a'] });
        });

        it('represents string schema with min length and number valid', () => {

            Helper.validateJsonSchema(Joi.string().min(5).valid(1), { type: 'number', enum: [1] });
        });

        it('represents string schema with min length and string valid', () => {

            Helper.validateJsonSchema(Joi.string().min(5).valid('abcde'), { type: 'string', enum: ['abcde'], minLength: 5 });
        });

        it('represents string schema with ip and number valid', () => {

            Helper.validateJsonSchema(Joi.string().ip().valid(1), { type: 'number', enum: [1] });
        });

        it('represents date schema with number valid', () => {

            Helper.validateJsonSchema(Joi.date().valid(1), { type: 'number', enum: [1] });
        });

        it('represents date schema with min and number valid', () => {

            Helper.validateJsonSchema(Joi.date().min('2020-01-01').valid(1), { type: 'number', enum: [1] });
        });

        it('represents null only valid', () => {

            Helper.validateJsonSchema(Joi.valid(null), { type: 'null' });
        });

        it('represents string schema with null valid', () => {

            Helper.validateJsonSchema(Joi.string().valid(null), { type: 'null' });
        });

        it('represents string schema with object valid', () => {

            Helper.validateJsonSchema(Joi.string().valid({}), { enum: [{}] });
        });

        it('represents string schema with multiple number valids', () => {

            Helper.validateJsonSchema(Joi.string().valid(1, 2), { type: 'number', enum: [1, 2] });
        });

        it('represents string schema with multiple number and string valids', () => {

            Helper.validateJsonSchema(Joi.string().valid(1, 2, 'a'), { type: ['number', 'string'], enum: [1, 2, 'a'] });
        });

        it('represents string schema with mixed number and boolean valids', () => {

            Helper.validateJsonSchema(Joi.string().valid(1, true), { type: ['number', 'boolean'], enum: [1, true] });
        });

        it('represents string schema with mixed number and string valids (reordered)', () => {

            Helper.validateJsonSchema(Joi.string().valid(1, 'a', 2), { type: ['number', 'string'], enum: [1, 'a', 2] });
        });

        it('represents string schema with mixed number and boolean valids (reordered)', () => {

            Helper.validateJsonSchema(Joi.string().valid(1, true, 2), { type: ['number', 'boolean'], enum: [1, true, 2] });
        });

        it('represents string schema with mixed number and object valids', () => {

            Helper.validateJsonSchema(Joi.string().valid(1, {}), { type: 'number', enum: [1, {}] });
        });

        it('represents string schema with multiple numbers and object valid', () => {

            Helper.validateJsonSchema(Joi.string().valid(1, 2, {}), { type: 'number', enum: [1, 2, {}] });
        });

        it('represents string only with number valid', () => {

            Helper.validateJsonSchema(Joi.string().valid(1), { type: 'number', enum: [1] });
        });

        it('represents string only with allowed string', () => {

            Helper.validateJsonSchema(Joi.string().valid('a'), { type: 'string', enum: ['a'] });
        });

        it('represents empty any valids', () => {

            Helper.validateJsonSchema(Joi.any().valid(), {});
        });

        it('represents empty any allowed', () => {

            Helper.validateJsonSchema(Joi.any().allow(), {});
        });

        it('represents any only with null allowed', () => {

            Helper.validateJsonSchema(Joi.any().allow(null).only(), { type: 'null' });
        });

        it('represents null compile only', () => {

            Helper.validateJsonSchema(Joi.compile(null).only(), { type: 'null' });
        });

        it('represents valids with objects', () => {

            Helper.validateJsonSchema(Joi.valid({}), { enum: [{}] });
        });

        it('represents valids with string and object', () => {

            Helper.validateJsonSchema(Joi.any().valid('a', {}), { type: 'string', enum: ['a', {}] });
        });

        it('represents valids with string, number and object', () => {

            Helper.validateJsonSchema(Joi.any().valid('a', 1, {}), { type: ['string', 'number'], enum: ['a', 1, {}] });
        });

        it('represents invalid values as not enum', () => {

            Helper.validateJsonSchema(Joi.string().invalid('foo', 'bar'), {
                type: 'string',
                minLength: 1,
                not: { enum: ['foo', 'bar'] }
            });

            Helper.validateJsonSchema(Joi.number().invalid(0), {
                type: 'number',
                not: { enum: [0] }
            });

            Helper.validateJsonSchema(Joi.number().invalid(null), {
                type: 'number'
            });
        });
    });

    describe('alternatives', () => {

        it('represents alternatives as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.string()), { anyOf: [{ minLength: 1, type: 'string' }] });
        });

        it('represents multiple alternatives as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.string(), Joi.number()), { anyOf: [{ type: 'string', minLength: 1 }, { type: 'number' }] });
        });

        it('represents alternatives with null as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.string().allow(null), Joi.number()), {
                anyOf: [
                    { type: ['string', 'null'], minLength: 1 },
                    { type: 'number' }
                ]
            });
        });

        it('represents alternatives with Joi.any() as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.any()), { anyOf: [{}] });
        });

        it('represents alternatives with mixed types as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.string(), Joi.valid(1, true)), {
                anyOf: [
                    { type: 'string', minLength: 1 },
                    { type: ['number', 'boolean'], enum: [1, true] }
                ]
            });
        });

        it('represents alternatives with string and null as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.string().allow(null)), { anyOf: [{ type: ['string', 'null'], minLength: 1 }] });
        });

        it('represents alternatives with object as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.object()), { anyOf: [{ type: 'object' }] });
        });

        it('represents alternatives with symbol as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.symbol()), { anyOf: [{}] });
        });

        it('represents alternatives with conditional otherwise as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().conditional('a', { is: 1, then: Joi.string(), otherwise: Joi.number() }), {
                anyOf: [
                    { type: 'string', minLength: 1 },
                    { type: 'number' }
                ]
            });
        });

        it('represents alternatives with switch as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().conditional('a', {
                switch: [
                    { is: 1, then: Joi.string() }
                ],
                otherwise: Joi.number()
            }), {
                anyOf: [
                    { type: 'string', minLength: 1 },
                    { type: 'number' }
                ]
            });
        });

        it('represents alternatives with otherwise only as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().conditional('a', { is: 1, otherwise: Joi.number() }), {
                anyOf: [
                    { type: 'number' }
                ]
            });
        });

        it('represents alternatives with then Joi.any() as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().conditional('a', { is: 1, then: Joi.any(), otherwise: Joi.number() }), {
                anyOf: [
                    {},
                    { type: 'number' }
                ]
            });
        });

        it('represents alternatives with otherwise Joi.any() as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().conditional('a', { is: 1, then: Joi.number(), otherwise: Joi.any() }), {
                anyOf: [
                    { type: 'number' },
                    {}
                ]
            });
        });

        it('represents alternatives with when (not conditional) as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().when('a', { is: 1, then: Joi.alternatives().try(Joi.number()) }), {
                anyOf: [
                    {
                        anyOf: [
                            {
                                type: 'number'
                            }
                        ]
                    },
                    {}
                ]
            });
        });

        it('represents alternatives try and when with description as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.boolean()).when('a', { is: 1, then: Joi.any().description('foo') }).description('bar'), {
                anyOf: [
                    {
                        description: 'foo',
                        anyOf: [
                            { type: 'boolean' }
                        ]
                    },
                    {
                        description: 'bar',
                        anyOf: [
                            { type: 'boolean' }
                        ]
                    }
                ]
            });
        });

        it('represents alternatives with when otherwise description as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().when('a', { is: 1, otherwise: Joi.any().description('a') }), {
                anyOf: [
                    { description: 'a' },
                    {}
                ]
            });
        });

        it('represents alternatives with when switch description as anyOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().when('a', { switch: [{ is: 1, then: Joi.any().description('b') }] }), {
                anyOf: [
                    { description: 'b' },
                    {}
                ]
            });
        });

        it('flattens nested anyOf from try and when', () => {

            Helper.validateJsonSchema(Joi.alternatives()
                .try(Joi.boolean())
                .conditional('a', { is: 1, then: Joi.string() }), {
                anyOf: [
                    { type: 'boolean' },
                    { type: 'string', minLength: 1 }
                ]
            });
        });

        it('represents match one as oneOf', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.string(), Joi.number()).match('one'), { oneOf: [{ type: 'string', minLength: 1 }, { type: 'number' }] });
        });

        it('represents match all as allOf', () => {

            Helper.validateJsonSchema(
                Joi.alternatives().try(
                    Joi.object({ a: Joi.string() }).unknown(true),
                    Joi.object({ b: Joi.number() }).unknown(true)
                ).match('all'),
                {
                    allOf: [
                        { type: 'object', properties: { a: { type: 'string', minLength: 1 } } },
                        { type: 'object', properties: { b: { type: 'number' } } }
                    ]
                }
            );
        });

        it('represents match all as allOf with strict objects', () => {

            Helper.validateJsonSchema(
                Joi.alternatives().try(
                    Joi.object({ a: Joi.string() }),
                    Joi.object({ b: Joi.number() })
                ).match('all'),
                {
                    allOf: [
                        { type: 'object', properties: { a: { type: 'string', minLength: 1 } }, additionalProperties: false },
                        { type: 'object', properties: { b: { type: 'number' } }, additionalProperties: false }
                    ]
                }
            );
        });

        it('represents empty schema when no alternatives provided', () => {

            Helper.validateJsonSchema(Joi.alternatives(), {});
        });

        it('represents alternatives with ref conditional', () => {

            Helper.validateJsonSchema(Joi.alternatives().conditional(Joi.ref('a'), { is: 1, then: Joi.string() }), {
                anyOf: [
                    { type: 'string', minLength: 1 }
                ]
            });
        });

        it('represents anyOf with description', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.string(), Joi.any().description('foo')), { anyOf: [{ type: 'string', minLength: 1 }, { description: 'foo' }] });
        });

        it('represents anyOf with single description', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.any().description('foo')), { anyOf: [{ description: 'foo' }] });
        });

        it('represents anyOf with allowed values', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.string()).allow(1), {
                anyOf: [
                    { type: 'string', minLength: 1 },
                    { enum: [1] }
                ]
            });
        });

        it('represents anyOf with allowed null', () => {

            Helper.validateJsonSchema(Joi.alternatives().try(Joi.string()).allow(null), {
                anyOf: [
                    { type: 'null' },
                    { type: 'string', minLength: 1 }
                ]
            });
        });
    });

    describe('array', () => {

        it('represents basic array', () => {

            Helper.validateJsonSchema(Joi.array().min(1).max(5).unique(), {
                type: 'array',
                minItems: 1,
                maxItems: 5,
                uniqueItems: true
            });

            Helper.validateJsonSchema(Joi.array().min(0).max(0), {
                type: 'array',
                minItems: 0,
                maxItems: 0
            });
        });

        it('represents array without constraints when valid is used (min)', () => {

            Helper.validateJsonSchema(Joi.array().min(1).valid(true), { enum: [true], type: 'boolean' });
        });

        it('represents array without constraints when valid is used (max)', () => {

            Helper.validateJsonSchema(Joi.array().max(1).valid(true), { enum: [true], type: 'boolean' });
        });

        it('represents array without constraints when valid is used (length)', () => {

            Helper.validateJsonSchema(Joi.array().length(1).valid(true), { enum: [true], type: 'boolean' });
        });

        it('represents array without constraints when valid is used (unique)', () => {

            Helper.validateJsonSchema(Joi.array().unique().valid(true), { enum: [true], type: 'boolean' });
        });

        it('represents nullable array (min)', () => {

            Helper.validateJsonSchema(Joi.array().items(Joi.string()).min(2).allow(null), {
                type: ['array', 'null'],
                items: { type: 'string', minLength: 1 },
                minItems: 2
            });
        });

        it('represents nullable array (max)', () => {

            Helper.validateJsonSchema(Joi.array().items(Joi.string()).max(2).allow(null), {
                type: ['array', 'null'],
                items: { type: 'string', minLength: 1 },
                maxItems: 2
            });
        });

        it('represents nullable array (length)', () => {

            Helper.validateJsonSchema(Joi.array().items(Joi.string()).length(2).allow(null), {
                type: ['array', 'null'],
                items: { type: 'string', minLength: 1 },
                minItems: 2,
                maxItems: 2
            });
        });

        it('represents nullable array (unique)', () => {

            Helper.validateJsonSchema(Joi.array().items(Joi.string()).unique().allow(null), {
                type: ['array', 'null'],
                items: { type: 'string', minLength: 1 },
                uniqueItems: true
            });
        });

        it('represents array with multiple items types', () => {

            Helper.validateJsonSchema(Joi.array().items(Joi.string(), Joi.number()), {
                type: 'array',
                items: {
                    anyOf: [
                        { type: 'string', minLength: 1 },
                        { type: 'number' }
                    ]
                }
            });
        });

        it('represents array with contains', () => {

            Helper.validateJsonSchema(Joi.array().has(Joi.string()), {
                type: 'array',
                contains: {
                    type: 'string',
                    minLength: 1
                }
            });
        });

        it('represents array with multiple contains', () => {

            Helper.validateJsonSchema(Joi.array().has(Joi.string()).has(Joi.number()), {
                type: 'array',
                allOf: [
                    {
                        contains: {
                            type: 'string',
                            minLength: 1
                        }
                    },
                    {
                        contains: {
                            type: 'number'
                        }
                    }
                ]
            });
        });

        it('represents array with prefixItems', () => {

            Helper.validateJsonSchema(Joi.array().ordered(Joi.string(), Joi.number()), {
                type: 'array',
                prefixItems: [
                    { type: 'string', minLength: 1 },
                    { type: 'number' }
                ],
                unevaluatedItems: false,
                minItems: 2,
                maxItems: 2
            });
        });

        it('represents array with prefixItems and items', () => {

            expect((Joi.array().ordered(Joi.string()).items(Joi.number()))['~standard'].jsonSchema.input()).to.equal({
                type: 'array',
                prefixItems: [
                    { type: 'string', minLength: 1 }
                ],
                unevaluatedItems: { type: 'number' },
                minItems: 1
            });

            expect((Joi.array().ordered(Joi.string()).items(Joi.number(), Joi.boolean()))['~standard'].jsonSchema.input()).to.equal({
                type: 'array',
                prefixItems: [
                    { type: 'string', minLength: 1 }
                ],
                unevaluatedItems: {
                    anyOf: [
                        { type: 'number' },
                        { type: 'boolean' }
                    ]
                },
                minItems: 1
            });
        });

        it('represents array with no items rule', () => {

            Helper.validateJsonSchema(Joi.array().items(), { type: 'array' });
        });

        it('represents array with constraints', () => {

            Helper.validateJsonSchema(Joi.array().min(1).max(10).length(5).unique(), { type: 'array', minItems: 5, maxItems: 5, uniqueItems: true });
        });

        it('skips array constraints with ref arguments', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.number(),
                b: Joi.array().min(Joi.ref('a'))
            }), {
                type: 'object',
                properties: {
                    a: { type: 'number' },
                    b: { type: 'array' }
                },
                additionalProperties: false
            });
        });

        it('omits items: false when unevaluatedItems is used', () => {

            Helper.validateJsonSchema(Joi.array().ordered(Joi.string()), {
                type: 'array',
                prefixItems: [{ type: 'string', minLength: 1 }],
                unevaluatedItems: false,
                minItems: 1,
                maxItems: 1
            });
        });

        it('represents array with single()', () => {

            Helper.validateJsonSchema(Joi.array().items(Joi.string()).single(), {
                anyOf: [
                    {
                        type: 'array',
                        items: { type: 'string', minLength: 1 }
                    },
                    { type: 'string', minLength: 1 }
                ]
            });
        });

        it('represents array with single() and multiple items', () => {

            Helper.validateJsonSchema(Joi.array().items(Joi.string(), Joi.number()).single(), {
                anyOf: [
                    {
                        type: 'array',
                        items: {
                            anyOf: [
                                { type: 'string', minLength: 1 },
                                { type: 'number' }
                            ]
                        }
                    },
                    {
                        anyOf: [
                            { type: 'string', minLength: 1 },
                            { type: 'number' }
                        ]
                    }
                ]
            });
        });


        it('represents array with single() and items (for coverage)', () => {

            const schema = Joi.array().items(Joi.string()).single();
            const json = schema.$_jsonSchema();
            Code.expect(json).to.equal({
                anyOf: [
                    {
                        type: 'array',
                        items: { type: 'string', minLength: 1 }
                    },
                    { type: 'string', minLength: 1 }
                ]
            });
        });

        it('represents array with single() and no items/ordered', () => {

            Helper.validateJsonSchema(Joi.array().single(), {
                type: 'array'
            });
        });
    });

    describe('binary', () => {

        it('represents basic binary', () => {

            Helper.validateJsonSchema(Joi.binary().min(10).max(100), {
                type: 'string',
                format: 'binary',
                minLength: 10,
                maxLength: 100
            });
        });

        it('represents binary with constraints', () => {

            Helper.validateJsonSchema(Joi.binary().min(1).max(10).length(5).custom(() => {}), { type: 'string', format: 'binary', minLength: 5, maxLength: 5 });
        });

        it('represents binary encoding', () => {

            Helper.validateJsonSchema(Joi.binary().encoding('base64').min(3), {
                type: 'string',
                format: 'binary',
                contentEncoding: 'base64',
                minLength: 3
            });
        });
    });

    describe('boolean', () => {

        it('represents basic boolean', () => {

            Helper.validateJsonSchema(Joi.boolean(), { type: 'boolean' });
        });
    });

    describe('date', () => {

        it('represents basic date', () => {

            const expected = { format: 'date-time', type: 'string' };
            Helper.validateJsonSchema(Joi.date(), expected);
            Helper.validateJsonSchema(Joi.date().iso(), expected);
        });

        it('represents date with constraints', () => {

            const d1 = new Date(1741708800000);
            const d2 = new Date(1741795200000);

            Helper.validateJsonSchema(Joi.date().min(d1).max(d2).greater(d1).less(d2), {
                type: 'string',
                format: 'date-time',
                'x-constraint': {
                    min: d1.toISOString(),
                    max: d2.toISOString(),
                    greater: d1.toISOString(),
                    less: d2.toISOString()
                }
            });

            Helper.validateJsonSchema(Joi.date().min(d1).max(d2).greater(d1).less(d2).only(), {
                type: 'string',
                format: 'date-time',
                'x-constraint': {
                    greater: d1.toISOString(),
                    less: d2.toISOString(),
                    min: d1.toISOString(),
                    max: d2.toISOString()
                }
            });

            Helper.validateJsonSchema(Joi.date().min('now').max('now').greater('now').less('now'), {
                type: 'string',
                format: 'date-time'
            });
        });

        it('represents date with valid rule', () => {

            Helper.validateJsonSchema(Joi.date().valid(new Date(1741708800000)), {
                type: 'string',
                format: 'date-time',
                enum: [new Date(1741708800000)]
            });
        });

        it('represents javascript timestamp', () => {

            Helper.validateJsonSchema(Joi.date().timestamp('javascript'), {
                type: 'number',
                minimum: -100e6 * 24 * 60 * 60 * 1000,     // 100 million days in ms (ECMA-262 §21.4.1.1)
                maximum: 100e6 * 24 * 60 * 60 * 1000
            });
        });

        it('represents unix timestamp', () => {

            Helper.validateJsonSchema(Joi.date().timestamp('unix'), {
                type: 'number',
                minimum: -100e6 * 24 * 60 * 60,            // 100 million days in seconds
                maximum: 100e6 * 24 * 60 * 60
            });
        });

        it('represents timestamp() default as javascript', () => {

            Helper.validateJsonSchema(Joi.date().timestamp(), {
                type: 'number',
                minimum: -100e6 * 24 * 60 * 60 * 1000,     // 100 million days in ms (ECMA-262 §21.4.1.1)
                maximum: 100e6 * 24 * 60 * 60 * 1000
            });
        });
    });

    describe('number', () => {

        it('represents basic number', () => {

            Helper.validateJsonSchema(Joi.number().integer().min(1).max(100).multiple(5), {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                multipleOf: 5
            });

            Helper.validateJsonSchema(Joi.number().integer().only(), {
                type: 'integer'
            });

            Helper.validateJsonSchema(Joi.number().multiple(5), {
                type: 'number',
                multipleOf: 5
            });

            Helper.validateJsonSchema(Joi.number().min(0).max(0), {
                type: 'number',
                minimum: 0,
                maximum: 0
            });
        });

        it('represents number with exclusive constraints', () => {

            Helper.validateJsonSchema(Joi.number().greater(1).less(100), {
                type: 'number',
                exclusiveMinimum: 1,
                exclusiveMaximum: 100
            });
        });

        it('represents number with positive/negative constraints', () => {

            Helper.validateJsonSchema(Joi.number().positive(), {
                type: 'number',
                exclusiveMinimum: 0
            });

            Helper.validateJsonSchema(Joi.number().positive().only(), {
                type: 'number',
                exclusiveMinimum: 0
            });

            Helper.validateJsonSchema(Joi.number().negative(), {
                type: 'number',
                exclusiveMaximum: 0
            });

            Helper.validateJsonSchema(Joi.number().positive().multiple(3), {
                type: 'number',
                multipleOf: 3,
                exclusiveMinimum: 0
            });

            Helper.validateJsonSchema(Joi.number().multiple(3).positive(), {
                type: 'number',
                multipleOf: 3,
                exclusiveMinimum: 0
            });
        });

        it('represents number.port() constraints', () => {

            Helper.validateJsonSchema(Joi.number().port(), {
                type: 'integer',
                minimum: 0,
                maximum: 65535
            });
        });

        it('represents number.precision() as multipleOf', () => {

            Helper.validateJsonSchema(Joi.number().precision(2), { type: 'number', multipleOf: 0.01 });
            Helper.validateJsonSchema(Joi.number().precision(0), { type: 'number', multipleOf: 1 });
            Helper.validateJsonSchema(Joi.number().precision(3), { type: 'number', multipleOf: 0.001 });
        });

        it('skips number constraints with ref arguments', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.number(),
                b: Joi.number().min(Joi.ref('a'))
            }), {
                type: 'object',
                properties: {
                    a: { type: 'number' },
                    b: { type: 'number' }
                },
                additionalProperties: false
            });

            Helper.validateJsonSchema(Joi.object({
                a: Joi.number(),
                b: Joi.number().max(Joi.ref('a'))
            }), {
                type: 'object',
                properties: {
                    a: { type: 'number' },
                    b: { type: 'number' }
                },
                additionalProperties: false
            });

            Helper.validateJsonSchema(Joi.object({
                a: Joi.number(),
                b: Joi.number().greater(Joi.ref('a'))
            }), {
                type: 'object',
                properties: {
                    a: { type: 'number' },
                    b: { type: 'number' }
                },
                additionalProperties: false
            });

            Helper.validateJsonSchema(Joi.object({
                a: Joi.number(),
                b: Joi.number().less(Joi.ref('a'))
            }), {
                type: 'object',
                properties: {
                    a: { type: 'number' },
                    b: { type: 'number' }
                },
                additionalProperties: false
            });
        });

        it('represents number with valids', () => {

            Helper.validateJsonSchema(Joi.number().valid(1, 2, 3), {
                type: 'number',
                enum: [1, 2, 3]
            });

            Helper.validateJsonSchema(Joi.number().min(10).valid(10, 11), {
                type: 'number',
                enum: [10, 11],
                minimum: 10
            });

            Helper.validateJsonSchema(Joi.number().max(10).valid(9, 10), {
                type: 'number',
                enum: [9, 10],
                maximum: 10
            });

            Helper.validateJsonSchema(Joi.number().greater(10).valid(11, 12), {
                type: 'number',
                enum: [11, 12],
                exclusiveMinimum: 10
            });

            Helper.validateJsonSchema(Joi.number().less(10).valid(8, 9), {
                type: 'number',
                enum: [8, 9],
                exclusiveMaximum: 10
            });

            Helper.validateJsonSchema(Joi.number().multiple(5).valid(5, 10), {
                type: 'number',
                enum: [5, 10],
                multipleOf: 5
            });
        });
    });

    describe('object', () => {

        it('represents basic object', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string().required(),
                b: Joi.number()
            }).unknown(false), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'number' }
                },
                required: ['a'],
                additionalProperties: false
            });
        });

        it('represents object with pattern properties', () => {

            Helper.validateJsonSchema(Joi.object().pattern(/^s/, Joi.string()), {
                type: 'object',
                patternProperties: {
                    '^s': { type: 'string', minLength: 1 }
                },
                additionalProperties: false
            });

            Helper.validateJsonSchema(Joi.object().pattern(Joi.any(), Joi.string()), {
                type: 'object',
                additionalProperties: { type: 'string', minLength: 1 }
            });

            Helper.validateJsonSchema(Joi.object().pattern(/^s/, Joi.string()).unknown(false), {
                type: 'object',
                patternProperties: {
                    '^s': { type: 'string', minLength: 1 }
                },
                additionalProperties: false
            });

            Helper.validateJsonSchema(Joi.object()
                .pattern(/^s/, Joi.string())
                .pattern(/^n/, Joi.number()), {
                type: 'object',
                patternProperties: {
                    '^s': { type: 'string', minLength: 1 },
                    '^n': { type: 'number' }
                },
                additionalProperties: false
            });

            Helper.validateJsonSchema(Joi.object().pattern(Joi.string().min(5), Joi.number()), {
                type: 'object',
                patternProperties: {
                    '.*': { type: 'number' }
                },
                additionalProperties: false
            });

            const customJoi = Joi.extend({
                type: 'customAny',
                base: Joi.any()
            });

            Helper.validateJsonSchema(Joi.object().pattern(customJoi.customAny(), Joi.number()), {
                type: 'object',
                patternProperties: {
                    '.*': { type: 'number' }
                },
                additionalProperties: false
            });
        });

        it('represents object with property constraints', () => {

            Helper.validateJsonSchema(Joi.object().min(2), {
                type: 'object',
                minProperties: 2
            });

            Helper.validateJsonSchema(Joi.object().max(5), {
                type: 'object',
                maxProperties: 5
            });

            Helper.validateJsonSchema(Joi.object().length(3), {
                type: 'object',
                minProperties: 3,
                maxProperties: 3
            });

            Helper.validateJsonSchema(Joi.object().min(2).max(5), {
                type: 'object',
                minProperties: 2,
                maxProperties: 5
            });

            Helper.validateJsonSchema(Joi.object().min(0).max(0), {
                type: 'object',
                minProperties: 0,
                maxProperties: 0
            });

            Helper.validateJsonSchema(Joi.object().min(2).max(5).only(), {
                type: 'object',
                additionalProperties: false,
                minProperties: 2,
                maxProperties: 5
            });

            Helper.validateJsonSchema(Joi.object().length(3).only(), {
                type: 'object',
                additionalProperties: false,
                minProperties: 3,
                maxProperties: 3
            });
        });

        it('sorts required properties in objects', () => {

            Helper.validateJsonSchema(Joi.object({
                z: Joi.string().required(),
                a: Joi.string().required()
            }), {
                type: 'object',
                properties: {
                    z: { type: 'string', minLength: 1 },
                    a: { type: 'string', minLength: 1 }
                },
                required: ['a', 'z'],
                additionalProperties: false
            });
        });

        it('excludes forbidden keys from properties', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string().required(),
                secret: Joi.any().forbidden()
            }), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 }
                },
                required: ['a'],
                additionalProperties: false
            });
        });

        it('represents with() dependency as dependentRequired', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string()
            }).with('a', 'b'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentRequired: { a: ['b'] }
            });
        });

        it('represents with() dependency with multiple peers', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string()
            }).with('a', ['b', 'c']), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentRequired: { a: ['b', 'c'] }
            });
        });

        it('merges repeated with() dependencies for the same key', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string()
            }).with('a', 'b').with('a', 'c'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentRequired: { a: ['b', 'c'] }
            });
        });

        it('represents multiple with() dependencies', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string()
            }).with('a', 'b').with('b', 'c'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentRequired: { a: ['b'], b: ['c'] }
            });
        });

        it('represents and() dependency as bidirectional dependentRequired', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string()
            }).and('a', 'b'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentRequired: { a: ['b'], b: ['a'] }
            });

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string()
            }).and('a', 'b', 'c'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentRequired: { a: ['b', 'c'], b: ['a', 'c'], c: ['a', 'b'] }
            });
        });

        it('merges repeated and() dependencies', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string(),
                d: Joi.string()
            }).and('a', 'b').and('a', 'c', 'd'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 },
                    d: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentRequired: {
                    a: ['b', 'c', 'd'],
                    b: ['a'],
                    c: ['a', 'd'],
                    d: ['a', 'c']
                }
            });
        });

        it('deduplicates overlapping and() dependency peers', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string(),
                d: Joi.string()
            }).and('a', 'b', 'c').and('a', 'b', 'd'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 },
                    d: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentRequired: {
                    a: ['b', 'c', 'd'],
                    b: ['a', 'c', 'd'],
                    c: ['a', 'b'],
                    d: ['a', 'b']
                }
            });
        });

        it('represents nand() dependency', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string()
            }).nand('a', 'b'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                not: { properties: { a: true, b: true }, required: ['a', 'b'] }
            });
        });

        it('represents multiple nand() dependencies', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string()
            }).nand('a', 'b').nand('a', 'c'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                allOf: [
                    { not: { properties: { a: true, b: true }, required: ['a', 'b'] } },
                    { not: { properties: { a: true, c: true }, required: ['a', 'c'] } }
                ]
            });
        });

        it('represents three nand() dependencies via allOf', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string(),
                d: Joi.string()
            }).nand('a', 'b').nand('a', 'c').nand('a', 'd'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 },
                    d: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                allOf: [
                    { not: { properties: { a: true, b: true }, required: ['a', 'b'] } },
                    { not: { properties: { a: true, c: true }, required: ['a', 'c'] } },
                    { not: { properties: { a: true, d: true }, required: ['a', 'd'] } }
                ]
            });
        });

        it('represents or() dependency', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string()
            }).or('a', 'b'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                anyOf: [
                    { properties: { a: true }, required: ['a'] },
                    { properties: { b: true }, required: ['b'] }
                ]
            });
        });

        it('represents multiple or() dependencies', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string(),
                d: Joi.string()
            }).or('a', 'b').or('c', 'd'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 },
                    d: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                allOf: [
                    {
                        anyOf: [
                            { properties: { a: true }, required: ['a'] },
                            { properties: { b: true }, required: ['b'] }
                        ]
                    },
                    {
                        anyOf: [
                            { properties: { c: true }, required: ['c'] },
                            { properties: { d: true }, required: ['d'] }
                        ]
                    }
                ]
            });
        });

        it('represents xor() dependency', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string()
            }).xor('a', 'b'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                oneOf: [
                    { properties: { a: true }, required: ['a'] },
                    { properties: { b: true }, required: ['b'] }
                ]
            });
        });

        it('represents multiple xor() dependencies', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string(),
                d: Joi.string()
            }).xor('a', 'b').xor('c', 'd'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 },
                    d: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                allOf: [
                    {
                        oneOf: [
                            { properties: { a: true }, required: ['a'] },
                            { properties: { b: true }, required: ['b'] }
                        ]
                    },
                    {
                        oneOf: [
                            { properties: { c: true }, required: ['c'] },
                            { properties: { d: true }, required: ['d'] }
                        ]
                    }
                ]
            });
        });

        it('represents oxor() dependency', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string()
            }).oxor('a', 'b'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                oneOf: [
                    { not: { anyOf: [{ properties: { a: true }, required: ['a'] }, { properties: { b: true }, required: ['b'] }] } },
                    { properties: { a: true }, required: ['a'] },
                    { properties: { b: true }, required: ['b'] }
                ]
            });
        });

        it('represents multiple oxor() dependencies', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string(),
                d: Joi.string()
            }).oxor('a', 'b').oxor('c', 'd'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 },
                    d: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                allOf: [
                    {
                        oneOf: [
                            { not: { anyOf: [{ properties: { a: true }, required: ['a'] }, { properties: { b: true }, required: ['b'] }] } },
                            { properties: { a: true }, required: ['a'] },
                            { properties: { b: true }, required: ['b'] }
                        ]
                    },
                    {
                        oneOf: [
                            { not: { anyOf: [{ properties: { c: true }, required: ['c'] }, { properties: { d: true }, required: ['d'] }] } },
                            { properties: { c: true }, required: ['c'] },
                            { properties: { d: true }, required: ['d'] }
                        ]
                    }
                ]
            });
        });

        it('represents with() and and() dependencies together', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string()
            }).with('a', 'b').and('b', 'c'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentRequired: { a: ['b'], b: ['c'], c: ['b'] }
            });
        });

        it('represents with() and without() dependencies together', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string()
            }).with('a', 'b').without('a', 'c'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentRequired: { a: ['b'] },
                dependentSchemas: {
                    a: { properties: { c: false } }
                }
            });
        });

        it('represents without() dependency as dependentSchemas', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string()
            }).without('a', 'b'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentSchemas: {
                    a: { properties: { b: false } }
                }
            });

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string()
            }).without('a', 'b').without('b', 'c'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentSchemas: {
                    a: { properties: { b: false } },
                    b: { properties: { c: false } }
                }
            });
        });

        it('merges repeated without() dependencies for the same key', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string()
            }).without('a', 'b').without('a', 'c'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                dependentSchemas: {
                    a: { properties: { b: false, c: false } }
                }
            });
        });

        it('excludes stripped keys in output mode', () => {

            const schema = Joi.object({
                a: Joi.string().required(),
                password: Joi.string().strip()
            });

            Helper.validateJsonSchema(schema, {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    password: { type: 'string', minLength: 1 }
                },
                required: ['a'],
                additionalProperties: false
            }, {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 }
                },
                required: ['a'],
                additionalProperties: false
            });
        });

        it('merges invalid() with other not-based object constraints', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string()
            }).nand('a', 'b').invalid({ foo: 'bar' }), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                allOf: [
                    { not: { properties: { a: true, b: true }, required: ['a', 'b'] } },
                    { not: { enum: [{ foo: 'bar' }] } }
                ]
            });
        });

        it('merges invalid() with existing allOf-based object constraints', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string()
            }).nand('a', 'b').nand('a', 'c').invalid({ foo: 'bar' }), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { type: 'string', minLength: 1 },
                    c: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                allOf: [
                    { not: { properties: { a: true, b: true }, required: ['a', 'b'] } },
                    { not: { properties: { a: true, c: true }, required: ['a', 'c'] } },
                    { not: { enum: [{ foo: 'bar' }] } }
                ]
            });
        });

        it('represents complex nested object', () => {

            const schema = Joi.object({
                user: Joi.object({
                    id: Joi.number().integer().required(),
                    name: Joi.string().required()
                }).required(),
                tags: Joi.array().items(Joi.string()).default([])
            });

            const inputExpected = {
                type: 'object',
                properties: {
                    user: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            name: { type: 'string', minLength: 1 }
                        },
                        required: ['id', 'name'],
                        additionalProperties: false
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string', minLength: 1 },
                        default: []
                    }
                },
                required: ['user'],
                additionalProperties: false
            };

            Helper.validateJsonSchema(schema, inputExpected, {
                ...inputExpected,
                required: ['tags', 'user']
            });
        });

        it('marks required properties based on default values', () => {

            const schema = Joi.object({
                a: Joi.string().default('foo'),
                b: Joi.alternatives().try(
                    Joi.string().default('bar'),
                    Joi.number()
                ),
                c: Joi.array().items(Joi.string().default('baz')),
                d: Joi.array().ordered(Joi.number().default(1)),
                e: Joi.alternatives().try(
                    Joi.array().items(Joi.number().default(2))
                ),
                f: Joi.number()
            });

            const output = schema['~standard'].jsonSchema.output();
            expect(output.required).to.equal(['a']);

            const input = schema['~standard'].jsonSchema.input();
            expect(input.required).to.be.undefined();
        });
    });

    describe('string', () => {

        it('represents basic string', () => {

            Helper.validateJsonSchema(Joi.string().description('A string').default('foo'), {
                type: 'string',
                description: 'A string',
                default: 'foo',
                minLength: 1
            });
        });

        it('represents string with constraints', () => {

            Helper.validateJsonSchema(Joi.string().min(5).max(10).pattern(/^[a-z]+$/).email(), {
                type: 'string',
                minLength: 5,
                maxLength: 10,
                pattern: '^[a-z]+$',
                format: 'email'
            });
        });

        it('represents string with valids', () => {

            Helper.validateJsonSchema(Joi.string().valid('a', 'b'), {
                type: 'string',
                enum: ['a', 'b']
            });

            Helper.validateJsonSchema(Joi.string().valid(''), {
                type: 'string',
                enum: ['']
            });

            const schemaNoValids = Joi.string().min(1);
            schemaNoValids._valids = null;
            Helper.validateJsonSchema(schemaNoValids, {
                type: 'string',
                minLength: 1
            });

            Helper.validateJsonSchema(Joi.string().allow(''), {
                type: 'string'
            });

            Helper.validateJsonSchema(Joi.string().min(5).valid('abcde'), {
                type: 'string',
                enum: ['abcde'],
                minLength: 5
            });

            Helper.validateJsonSchema(Joi.string().max(5).valid('abcde'), {
                type: 'string',
                enum: ['abcde'],
                maxLength: 5
            });

            Helper.validateJsonSchema(Joi.string().length(5).valid('abcde'), {
                type: 'string',
                enum: ['abcde'],
                minLength: 5,
                maxLength: 5
            });

            Helper.validateJsonSchema(Joi.string().pattern(/abc/).valid('abc'), {
                type: 'string',
                enum: ['abc'],
                pattern: 'abc'
            });

            Helper.validateJsonSchema(Joi.string().email().valid('a@b.com'), {
                type: 'string',
                enum: ['a@b.com'],
                format: 'email'
            });

            Helper.validateJsonSchema(Joi.string().guid().valid('550e8400-e29b-41d4-a716-446655440000'), {
                type: 'string',
                enum: ['550e8400-e29b-41d4-a716-446655440000'],
                format: 'uuid'
            });

            Helper.validateJsonSchema(Joi.string().ip().valid('127.0.0.1'), {
                type: 'string',
                format: 'ip',
                enum: ['127.0.0.1']
            });

            Helper.validateJsonSchema(Joi.string().valid('a'), { enum: ['a'], type: 'string' });
        });

        it('represents string with formats', () => {

            Helper.validateJsonSchema(Joi.string().length(5).pattern(/foo/).email().hostname().uri().uuid().guid(), {
                type: 'string',
                minLength: 5,
                maxLength: 5,
                pattern: 'foo',
                format: 'uuid'
            });

            Helper.validateJsonSchema(Joi.string().ip(), { type: 'string', minLength: 1, format: 'ip' });
            Helper.validateJsonSchema(Joi.string().ip({ version: 'ipv4' }), { type: 'string', minLength: 1, format: 'ipv4' });
            Helper.validateJsonSchema(Joi.string().ip({ version: ['ipv4', 'ipv6'] }), { type: 'string', minLength: 1, format: 'ip' });
            Helper.validateJsonSchema(Joi.string().base64(), { type: 'string', minLength: 1, format: 'base64' });
            Helper.validateJsonSchema(Joi.string().dataUri(), { type: 'string', minLength: 1, format: 'data-uri' });
            Helper.validateJsonSchema(Joi.string().email(), { type: 'string', minLength: 1, format: 'email' });
            Helper.validateJsonSchema(Joi.string().guid(), { type: 'string', minLength: 1, format: 'uuid' });
            Helper.validateJsonSchema(Joi.string().hex(), { type: 'string', minLength: 1, format: 'hex' });
            Helper.validateJsonSchema(Joi.string().hostname(), { type: 'string', minLength: 1, format: 'hostname' });
            Helper.validateJsonSchema(Joi.string().isoDate(), { type: 'string', minLength: 1, format: 'date-time' });
            Helper.validateJsonSchema(Joi.string().isoDuration(), { type: 'string', minLength: 1, format: 'duration' });
            Helper.validateJsonSchema(Joi.string().token(), { type: 'string', minLength: 1, format: 'token' });
            Helper.validateJsonSchema(Joi.string().domain({ tlds: false }), {
                type: 'string',
                minLength: 1,
                pattern: '^(?=.{1,256}$)(?:(?=[^.]{1,63}\\.)[A-Za-z0-9\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?\\.){1,}(?=[^.]{1,63}$)[A-Za-z\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?$'
            });
            Helper.validateJsonSchema(Joi.string().domain({ allowUnicode: false, tlds: false }), {
                type: 'string',
                minLength: 1,
                pattern: '^(?=.{1,256}$)(?:(?=[^.]{1,63}\\.)[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.){1,}(?=[^.]{1,63}$)[A-Za-z](?:[A-Za-z0-9-]*[A-Za-z0-9])?$'
            });
            Helper.validateJsonSchema(Joi.string().domain({ minDomainSegments: 3, tlds: false }), {
                type: 'string',
                minLength: 1,
                pattern: '^(?=.{1,256}$)(?:(?=[^.]{1,63}\\.)[A-Za-z0-9\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?\\.){2,}(?=[^.]{1,63}$)[A-Za-z\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?$'
            });
            Helper.validateJsonSchema(Joi.string().domain({ maxDomainSegments: 3, tlds: false }), {
                type: 'string',
                minLength: 1,
                pattern: '^(?=.{1,256}$)(?:(?=[^.]{1,63}\\.)[A-Za-z0-9\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?\\.){1,2}(?=[^.]{1,63}$)[A-Za-z\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?$'
            });
            Helper.validateJsonSchema(Joi.string().domain({ allowUnderscore: true, tlds: false }), {
                type: 'string',
                minLength: 1,
                pattern: '^(?=.{1,256}$)(?:(?=[^.]{1,63}\\.)[A-Za-z0-9_\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?\\.){1,}(?=[^.]{1,63}$)[A-Za-z\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?$'
            });
            Helper.validateJsonSchema(Joi.string().domain({ allowFullyQualified: true, tlds: false }), {
                type: 'string',
                minLength: 1,
                pattern: '^(?=.{1,256}$)(?:(?=[^.]{1,63}\\.)[A-Za-z0-9\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?\\.){1,}(?=[^.]{1,63}(?:\\.?$))[A-Za-z\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?\\.?$'
            });
            Helper.validateJsonSchema(Joi.string().domain({ tlds: { allow: ['com'] } }), {
                type: 'string',
                minLength: 1,
                pattern: '^(?=.{1,256}$)(?:(?=[^.]{1,63}\\.)[A-Za-z0-9\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?\\.){1,}(?=[^.]{1,63}$)(?:[cC][oO][mM])$'
            });
            Helper.validateJsonSchema(Joi.string().domain({ tlds: { deny: ['com'] } }), {
                type: 'string',
                minLength: 1,
                pattern: '^(?=.{1,256}$)(?:(?=[^.]{1,63}\\.)[A-Za-z0-9\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?\\.){1,}(?!(?:[cC][oO][mM])$)(?=[^.]{1,63}$)[A-Za-z\\u0080-\\u{10FFFF}](?:[A-Za-z0-9\\u0080-\\u{10FFFF}-]*[A-Za-z0-9\\u0080-\\u{10FFFF}])?$'
            });

            const defaultDomain = Joi.string().domain()['~standard'].jsonSchema.input();
            expect(defaultDomain.type).to.equal('string');
            expect(defaultDomain.minLength).to.equal(1);
            expect(defaultDomain.pattern).to.be.a.string();
            Helper.validateJsonSchemaValues(defaultDomain, [
                ['example.com', true],
                ['ä.com', true],
                ['𐍈.com', true],
                ['🦄.com', true],
                ['example.КОМ', true],
                ['localhost', false],
                ['example.local', false],
                [`${'a'.repeat(63)}.com`, true],
                [`${'a'.repeat(64)}.com`, false],
                [`${Array(50).fill('abcd').join('.')}.com`, true],
                [`${Array(51).fill('abcd').join('.')}.com`, false]
            ]);

            const asciiDomain = Joi.string().domain({ allowUnicode: false })['~standard'].jsonSchema.input();
            expect(asciiDomain.type).to.equal('string');
            expect(asciiDomain.minLength).to.equal(1);
            expect(asciiDomain.pattern).to.be.a.string();
            Helper.validateJsonSchemaValues(asciiDomain, [
                ['example.com', true],
                ['ä.com', false]
            ]);

            const minSegmentsDomain = Joi.string().domain({ minDomainSegments: 3 })['~standard'].jsonSchema.input();
            expect(minSegmentsDomain.type).to.equal('string');
            expect(minSegmentsDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(minSegmentsDomain, [
                ['a.b.com', true],
                ['a.com', false]
            ]);

            const maxSegmentsDomain = Joi.string().domain({ maxDomainSegments: 3 })['~standard'].jsonSchema.input();
            expect(maxSegmentsDomain.type).to.equal('string');
            expect(maxSegmentsDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(maxSegmentsDomain, [
                ['a.b.com', true],
                ['a.b.c.com', false]
            ]);

            const underscoreDomain = Joi.string().domain({ allowUnderscore: true })['~standard'].jsonSchema.input();
            expect(underscoreDomain.type).to.equal('string');
            expect(underscoreDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(underscoreDomain, [
                ['_sip._tcp.example.com', true]
            ]);

            const fqdnDomain = Joi.string().domain({ allowFullyQualified: true })['~standard'].jsonSchema.input();
            expect(fqdnDomain.type).to.equal('string');
            expect(fqdnDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(fqdnDomain, [
                ['example.com.', true]
            ]);

            const anyTldDomain = Joi.string().domain({ tlds: false })['~standard'].jsonSchema.input();
            expect(anyTldDomain.type).to.equal('string');
            expect(anyTldDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(anyTldDomain, [
                ['example.local', true]
            ]);

            const allowedTldDomain = Joi.string().domain({ tlds: { allow: ['com'] } })['~standard'].jsonSchema.input();
            expect(allowedTldDomain.type).to.equal('string');
            expect(allowedTldDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(allowedTldDomain, [
                ['example.com', true],
                ['example.net', false],
                ['example.COM', true]
            ]);

            const deniedTldDomain = Joi.string().domain({ tlds: { deny: ['com'] } })['~standard'].jsonSchema.input();
            expect(deniedTldDomain.type).to.equal('string');
            expect(deniedTldDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(deniedTldDomain, [
                ['example.com', false],
                ['example.net', true]
            ]);

            const unicodeAllowedAsciiDomain = Joi.string().domain({ allowUnicode: false, tlds: { allow: ['कॉम'] } })['~standard'].jsonSchema.input();
            expect(unicodeAllowedAsciiDomain.type).to.equal('string');
            expect(unicodeAllowedAsciiDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(unicodeAllowedAsciiDomain, [
                ['example.कॉम', false],
                ['example.xn--11b4c3d', false]
            ]);

            const deniedFqdnDomain = Joi.string().domain({
                tlds: { deny: ['com'] },
                allowFullyQualified: true
            })['~standard'].jsonSchema.input();
            expect(deniedFqdnDomain.type).to.equal('string');
            expect(deniedFqdnDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(deniedFqdnDomain, [
                ['example.com', false],
                ['example.com.', false],
                ['example.net', true],
                ['example.net.', true]
            ]);

            const idnTldDomain = Joi.string().domain({
                tlds: { allow: ['xn--11b4c3d'] }
            })['~standard'].jsonSchema.input();
            expect(idnTldDomain.type).to.equal('string');
            expect(idnTldDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(idnTldDomain, [
                ['example.xn--11b4c3d', true],
                ['example.कॉम', true],
                ['example.com', false]
            ]);

            // Uppercase TLD values are filtered out (canonical form is lowercase)
            const upperTldDomain = Joi.string().domain({
                tlds: { allow: ['COM'] }
            })['~standard'].jsonSchema.input();
            expect(upperTldDomain.type).to.equal('string');
            expect(upperTldDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(upperTldDomain, [
                ['example.com', false],
                ['example.COM', false]
            ]);

            // Uppercase deny TLD is filtered, producing no denied lookahead
            const upperDenyDomain = Joi.string().domain({
                tlds: { deny: ['COM'] }
            })['~standard'].jsonSchema.input();
            expect(upperDenyDomain.type).to.equal('string');
            expect(upperDenyDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(upperDenyDomain, [
                ['example.com', true],
                ['example.net', true]
            ]);

            // Invalid punycode TLD where domainToUnicode returns empty string
            const invalidPunycodeDomain = Joi.string().domain({
                tlds: { allow: ['xn--abc'] }
            })['~standard'].jsonSchema.input();
            expect(invalidPunycodeDomain.type).to.equal('string');
            expect(invalidPunycodeDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(invalidPunycodeDomain, [
                ['example.xn--abc', true],
                ['example.com', false]
            ]);

            // IDN TLD with ß (multi-char uppercase: ß → SS)
            const esszettDomain = Joi.string().domain({
                tlds: { allow: ['xn--gro-7ka'] }
            })['~standard'].jsonSchema.input();
            expect(esszettDomain.type).to.equal('string');
            expect(esszettDomain.minLength).to.equal(1);
            Helper.validateJsonSchemaValues(esszettDomain, [
                ['example.xn--gro-7ka', true],
                ['example.groß', true],
                ['example.com', false]
            ]);
        });

        it('represents string with various options', () => {

            Helper.validateJsonSchema(Joi.string().alphanum(), { type: 'string', minLength: 1, pattern: '^[a-zA-Z0-9]+$' });
            Helper.validateJsonSchema(Joi.string().allow(''), { type: 'string' });
            Helper.validateJsonSchema(Joi.string().min(0), { type: 'string' });
            Helper.validateJsonSchema(Joi.string().length(0), { type: 'string', minLength: 0, maxLength: 0 });

            Helper.validateJsonSchema(Joi.string().allow(1), {
                anyOf: [
                    { type: 'string', minLength: 1 },
                    { enum: [1] }
                ]
            });

            Helper.validateJsonSchema(Joi.string().allow('a'), { type: 'string', minLength: 1 });
        });

        it('skips string constraints with ref arguments', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.number(),
                b: Joi.string().min(Joi.ref('a'))
            }), {
                type: 'object',
                properties: {
                    a: { type: 'number' },
                    b: { type: 'string', minLength: 1 }
                },
                additionalProperties: false
            });

            Helper.validateJsonSchema(Joi.object({
                a: Joi.number(),
                b: Joi.string().max(Joi.ref('a'))
            }), {
                type: 'object',
                properties: {
                    a: { type: 'number' },
                    b: { type: 'string', minLength: 1 }
                },
                additionalProperties: false
            });

            Helper.validateJsonSchema(Joi.object({
                a: Joi.number(),
                b: Joi.string().length(Joi.ref('a'))
            }), {
                type: 'object',
                properties: {
                    a: { type: 'number' },
                    b: { type: 'string', minLength: 1 }
                },
                additionalProperties: false
            });
        });

        it('represents nullable string', () => {

            Helper.validateJsonSchema(Joi.string().allow(null), { type: ['string', 'null'], minLength: 1 });
        });
    });

    describe('preferences', () => {

        it('respects allowUnknown preference', () => {

            Helper.validateJsonSchema(
                Joi.object({ a: Joi.string() }).prefs({ allowUnknown: true }),
                {
                    type: 'object',
                    properties: { a: { type: 'string', minLength: 1 } }
                }
            );
        });

        it('propagates allowUnknown preference to nested objects', () => {

            Helper.validateJsonSchema(
                Joi.object({
                    nested: Joi.object({ x: Joi.string() })
                }).prefs({ allowUnknown: true }),
                {
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'object',
                            properties: { x: { type: 'string', minLength: 1 } }
                        }
                    }
                }
            );
        });

        it('explicit unknown(false) overrides allowUnknown preference', () => {

            Helper.validateJsonSchema(
                Joi.object({ a: Joi.string() }).unknown(false).prefs({ allowUnknown: true }),
                {
                    type: 'object',
                    properties: { a: { type: 'string', minLength: 1 } },
                    additionalProperties: false
                }
            );
        });

        it('respects stripUnknown preference in output mode', () => {

            const schema = Joi.object({ a: Joi.string() }).prefs({ stripUnknown: true });

            Helper.validateJsonSchema(schema, {
                type: 'object',
                properties: { a: { type: 'string', minLength: 1 } }
            }, {
                type: 'object',
                properties: { a: { type: 'string', minLength: 1 } },
                additionalProperties: false
            });
        });

        it('does not strip unknown object keys in output mode when only array stripping is enabled', () => {

            const schema = Joi.object({ a: Joi.string() }).prefs({ allowUnknown: true, stripUnknown: { arrays: true } });

            Helper.validateJsonSchema(schema, {
                type: 'object',
                properties: { a: { type: 'string', minLength: 1 } }
            });
        });

        it('respects presence: required preference', () => {

            Helper.validateJsonSchema(
                Joi.object({
                    a: Joi.string(),
                    b: Joi.number()
                }).prefs({ presence: 'required' }),
                {
                    type: 'object',
                    properties: {
                        a: { type: 'string', minLength: 1 },
                        b: { type: 'number' }
                    },
                    required: ['a', 'b'],
                    additionalProperties: false
                }
            );
        });

        it('respects presence: forbidden preference', () => {

            Helper.validateJsonSchema(
                Joi.object({
                    a: Joi.string(),
                    b: Joi.number()
                }).prefs({ presence: 'forbidden' }),
                {
                    type: 'object',
                    properties: {},
                    additionalProperties: false
                }
            );
        });

        it('explicit presence flag overrides presence preference', () => {

            Helper.validateJsonSchema(
                Joi.object({
                    a: Joi.string().optional(),
                    b: Joi.number()
                }).prefs({ presence: 'required' }),
                {
                    type: 'object',
                    properties: {
                        a: { type: 'string', minLength: 1 },
                        b: { type: 'number' }
                    },
                    required: ['b'],
                    additionalProperties: false
                }
            );
        });

        it('respects noDefaults preference in output mode', () => {

            const schema = Joi.object({
                a: Joi.string().default('foo'),
                b: Joi.number()
            }).prefs({ noDefaults: true });

            const expected = {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1, default: 'foo' },
                    b: { type: 'number' }
                },
                additionalProperties: false
            };

            Helper.validateJsonSchema(schema, expected, expected);
        });
    });

    describe('target', () => {

        it('represents nullable schemas with draft-2020-12 target', () => {

            expect(Joi.any().allow(null, {})['~standard'].jsonSchema.input({ target: 'draft-2020-12' })).to.equal({});
        });

        it('errors on unsupported target', () => {

            const schema = Joi.any();
            const js = schema['~standard'].jsonSchema;
            expect(() => js.input({ target: 'invalid' })).to.throw('Unsupported JSON Schema target: invalid');

            const stringJs = Joi.string()['~standard'].jsonSchema;
            expect(() => stringJs.input({ target: 'unsupported' })).to.throw('Unsupported JSON Schema target: unsupported');
            expect(() => stringJs.output({ target: 'unsupported' })).to.throw('Unsupported JSON Schema target: unsupported');
        });

        it('accepts draft-2020-12 target', () => {

            const js = Joi.string()['~standard'].jsonSchema;
            expect(js.input({ target: 'draft-2020-12' })).to.be.an.object();
            expect(js.output({ target: 'draft-2020-12' })).to.be.an.object();
        });
    });

    describe('extensions', () => {

        it('represents custom rule jsonSchema', () => {

            const custom = Joi.extend({
                type: 'string',
                base: Joi.string(),
                rules: {
                    foo: {
                        method() {

                            return this.$_addRule('foo');
                        },
                        jsonSchema(rule, res) {

                            res.foo = true;
                            return res;
                        }
                    }
                }
            });

            Helper.validateJsonSchema(custom.string().foo(), {
                type: 'string',
                minLength: 1,
                foo: true
            });
        });

        it('represents custom type jsonSchema', () => {

            const custom = Joi.extend({
                type: 'banana',
                base: Joi.any(),
                jsonSchema(schema, res) {

                    res.type = 'string';
                    res.format = 'banana';
                    return res;
                }
            });

            Helper.validateJsonSchema(custom.banana(), {
                type: 'string',
                format: 'banana'
            });
        });

        it('represents custom rule with options jsonSchema', () => {

            const custom = Joi.extend({
                type: 'number',
                base: Joi.number(),
                rules: {
                    divisible: {
                        method(base) {

                            return this.$_addRule({ name: 'divisible', args: { base } });
                        },
                        args: [
                            {
                                name: 'base',
                                ref: true,
                                assert: (value) => typeof value === 'number' && value > 0,
                                message: 'must be a positive number'
                            }
                        ],
                        jsonSchema(rule, res) {

                            res.multipleOf = rule.args.base;
                            return res;
                        }
                    }
                }
            });

            Helper.validateJsonSchema(custom.number().divisible(5), {
                type: 'number',
                multipleOf: 5
            });
        });

        it('represents custom type allow null jsonSchema', () => {

            const custom = Joi.extend({
                type: 'foo',
                base: Joi.any(),
                jsonSchema(schema, res) {

                    res.description = 'foo';
                    return res;
                }
            });

            Helper.validateJsonSchema(custom.foo().allow(null), {
                anyOf: [
                    { type: 'null' },
                    { description: 'foo' }
                ]
            });
        });
    });

    describe('object', () => {

        it('represents empty object for Joi.object()', () => {

            Helper.validateJsonSchema(Joi.object(), {
                type: 'object'
            });
        });

        it('represents properties for Joi.object({ a: Joi.string() })', () => {

            Helper.validateJsonSchema(Joi.object({ a: Joi.string() }), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 }
                },
                additionalProperties: false
            });
        });

        it('represents required for Joi.object({ a: Joi.required() })', () => {

            Helper.validateJsonSchema(Joi.object({ a: Joi.required() }), {
                type: 'object',
                properties: {
                    a: {}
                },
                required: ['a'],
                additionalProperties: false
            });
        });

        it('represents patternProperties for Joi.object().pattern(/a/, Joi.number())', () => {

            Helper.validateJsonSchema(Joi.object().pattern(/a/, Joi.number()), {
                type: 'object',
                patternProperties: {
                    a: { type: 'number' }
                },
                additionalProperties: false
            });
        });

        it('represents additionalProperties: true for Joi.object().unknown(true)', () => {

            Helper.validateJsonSchema(Joi.object().unknown(true), {
                type: 'object'
            });
        });

        it('represents additionalProperties: false for Joi.object().unknown(false)', () => {

            Helper.validateJsonSchema(Joi.object().unknown(false), {
                type: 'object',
                additionalProperties: false
            });
        });

        it('represents additionalProperties for Joi.object().pattern(Joi.any(), Joi.number())', () => {

            Helper.validateJsonSchema(Joi.object().pattern(Joi.any(), Joi.number()), {
                type: 'object',
                additionalProperties: { type: 'number' }
            });
        });

        it('represents patternProperties for Joi.object().pattern(Joi.string(), Joi.number())', () => {

            Helper.validateJsonSchema(Joi.object().pattern(Joi.string(), Joi.number()), {
                type: 'object',
                patternProperties: {
                    '.*': { type: 'number' }
                },
                additionalProperties: false
            });
        });

        it('represents required for Joi.object({ a: Joi.string().default("foo") }) only in output mode', () => {

            const schema = Joi.object({
                a: Joi.string().default('foo')
            });

            Helper.validateJsonSchema(schema, {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1, default: 'foo' }
                },
                additionalProperties: false
            }, {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1, default: 'foo' }
                },
                required: ['a'],
                additionalProperties: false
            });
        });

        it('represents required for Joi.object({ a: Joi.string().required() })', () => {

            const schema = Joi.object({
                a: Joi.string().required()
            });

            Helper.validateJsonSchema(schema, {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 }
                },
                required: ['a'],
                additionalProperties: false
            });
        });

        it('represents nested object properties', () => {

            const schema = Joi.object({
                a: Joi.object({
                    b: Joi.string().required()
                }).required()
            });

            Helper.validateJsonSchema(schema, {
                type: 'object',
                properties: {
                    a: {
                        type: 'object',
                        properties: {
                            b: { type: 'string', minLength: 1 }
                        },
                        required: ['b'],
                        additionalProperties: false
                    }
                },
                required: ['a'],
                additionalProperties: false
            });
        });

        it('represents nested array with items', () => {

            const schema = Joi.object({
                a: Joi.array().items(
                    Joi.object({
                        b: Joi.string().required()
                    })
                )
            });

            Helper.validateJsonSchema(schema, {
                type: 'object',
                properties: {
                    a: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                b: { type: 'string', minLength: 1 }
                            },
                            required: ['b'],
                            additionalProperties: false
                        }
                    }
                },
                additionalProperties: false
            });
        });

        it('represents complex alternatives with multiple conditions', () => {

            const schema = Joi.any().when('a', { is: 1, then: Joi.string() }).when('a', { is: 2, then: Joi.number() });

            Helper.validateJsonSchema(schema, {
                anyOf: [
                    { type: 'string', minLength: 1 },
                    {},
                    { type: 'number' }
                ]
            });
        });

        it('represents complex alternatives with multiple conditions on object', () => {

            const schema = Joi.object({
                a: Joi.any(),
                b: Joi.any()
                    .when('a', { is: 1, then: Joi.string() })
                    .when('a', { is: 2, then: Joi.number() })
            });

            Helper.validateJsonSchema(schema, {
                type: 'object',
                properties: {
                    a: {},
                    b: {
                        anyOf: [
                            { type: 'string', minLength: 1 },
                            {},
                            { type: 'number' }
                        ]
                    }
                },
                additionalProperties: false
            });
        });
    });

    describe('symbol', () => {

        it('represents empty schema for Joi.symbol()', () => {

            Helper.validateJsonSchema(Joi.symbol(), {});
        });

        it('represents anyOf for Joi.symbol().map()', () => {

            const s1 = Symbol('1');
            const s2 = Symbol('2');
            Helper.validateJsonSchema(Joi.symbol().map({ a: s1, b: s2 }), {
                anyOf: [
                    { const: 'a' },
                    { const: 'b' }
                ]
            });
        });

        it('represents anyOf for Joi.symbol().map() with mixed keys', () => {

            const s1 = Symbol('1');
            const s2 = Symbol('2');
            Helper.validateJsonSchema(Joi.symbol().map([[1, s1], [true, s2]]), {
                anyOf: [
                    { const: 1 },
                    { const: true }
                ]
            });
        });
    });

    describe('link', () => {

        it('represents Joi.link() to a local schema', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.link('#type.a')
            }).id('type'), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { $ref: '#/properties/a' }
                },
                additionalProperties: false
            });
        });

        it('represents Joi.link() to a root schema', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string(),
                b: Joi.link('a')
            }), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: {
                        $ref: '#/properties/a'
                    }
                },
                additionalProperties: false
            });
        });

        it('represents Joi.link() with shared schema', () => {

            const shared = Joi.number().id('shared');
            const schema = Joi.object({
                a: Joi.link('#shared')
            }).shared(shared);

            Helper.validateJsonSchema(schema, {
                type: 'object',
                properties: {
                    a: { $ref: '#/$defs/shared' }
                },
                additionalProperties: false,
                $defs: {
                    shared: { type: 'number' }
                }
            });
        });

        it('represents Joi.link() with nested shared schema', () => {

            const shared = Joi.number().id('shared');
            const nestedShared = Joi.boolean().id('nestedShared');
            const schema = Joi.object({
                a: Joi.link('#shared'),
                b: Joi.object({
                    c: Joi.link('#nestedShared')
                }).shared(nestedShared)
            }).shared(shared);

            Helper.validateJsonSchema(schema, {
                type: 'object',
                properties: {
                    a: { $ref: '#/$defs/shared' },
                    b: {
                        type: 'object',
                        properties: {
                            c: { $ref: '#/$defs/nestedShared' }
                        },
                        additionalProperties: false
                    }
                },
                additionalProperties: false,
                $defs: {
                    shared: { type: 'number' },
                    nestedShared: { type: 'boolean' }
                }
            });
        });

        it('represents Joi.link() to root anchored ref', () => {

            Helper.validateJsonSchema(Joi.object({
                a: [Joi.string(), Joi.number()],
                b: {
                    c: Joi.link('/a')
                }
            }), {
                type: 'object',
                properties: {
                    a: {
                        anyOf: [
                            { type: 'string', minLength: 1 },
                            { type: 'number' }
                        ]
                    },
                    b: {
                        type: 'object',
                        properties: {
                            c: {
                                $ref: '#/properties/a'
                            }
                        },
                        additionalProperties: false
                    }
                },
                additionalProperties: false
            });
        });

        it('represents Joi.link() to a child schema with id but without shared', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string().id('aSchema'),
                b: Joi.link('#aSchema')
            }), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { $ref: '#/$defs/aSchema' }
                },
                additionalProperties: false,
                $defs: {
                    aSchema: { type: 'string', minLength: 1 }
                }
            });
        });

        it('keeps defs for stripped child schemas referenced by links', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string().id('aSchema').strip(),
                b: Joi.link('#aSchema')
            }), {
                type: 'object',
                properties: {
                    a: { type: 'string', minLength: 1 },
                    b: { $ref: '#/$defs/aSchema' }
                },
                additionalProperties: false,
                $defs: {
                    aSchema: { type: 'string', minLength: 1 }
                }
            }, {
                type: 'object',
                properties: {
                    b: { $ref: '#/$defs/aSchema' }
                },
                additionalProperties: false,
                $defs: {
                    aSchema: { type: 'string', minLength: 1 }
                }
            });
        });

        it('keeps defs for forbidden child schemas referenced by links', () => {

            Helper.validateJsonSchema(Joi.object({
                a: Joi.string().id('aSchema').forbidden(),
                b: Joi.link('#aSchema')
            }), {
                type: 'object',
                properties: {
                    b: { $ref: '#/$defs/aSchema' }
                },
                additionalProperties: false,
                $defs: {
                    aSchema: { type: 'string', minLength: 1 }
                }
            });
        });

        it('represents Joi.link() with uninitialized schema', () => {

            Helper.validateJsonSchema(Joi.link(), {});
        });
    });
});
