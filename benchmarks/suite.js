'use strict';

const Joi = require('../');

module.exports = [
    [
        'Simple object',
        () => [
            Joi.object({
                id: Joi.string().required(),
                level: Joi.string()
                    .valid(['debug', 'info', 'notice'])
                    .required()
            }).unknown(false),
            { id: '1', level: 'info' }
        ],
        (schema, value) => {

            schema.validate(value, { convert: false });
        }
    ],
    [
        'Simple object with inlined options',
        () => [
            Joi.object({
                id: Joi.string().required(),
                level: Joi.string()
                    .valid(['debug', 'info', 'notice'])
                    .required()
            }).unknown(false).options({ convert: false }),
            { id: '1', level: 'info' }
        ],
        (schema, value) => {

            schema.validate(value);
        }
    ],
    [
        'Schema creation',
        () =>  [],
        () => {

            return Joi.object({
                foo: Joi.array().items(
                    Joi.boolean().required(),
                    Joi.string().allow(''),
                    Joi.symbol()
                ).single().sparse().required(),
                bar: Joi.number().min(12).max(353).default(56).positive(),
                baz: Joi.date().timestamp('unix'),
                qux: [Joi.func().minArity(12).strict(), Joi.binary().max(345)],
                quxx: Joi.string().ip({ version: ['ipv6'] }),
                quxxx: [554, 'azerty', true]
            })
                .xor('foo', 'bar')
                .or('bar', 'baz')
                .pattern(/a/, Joi.lazy(() => Joi.any()))
                .pattern(/b/, Joi.when('a', {
                    is: true,
                    then: Joi.options({ language: { any: { required: 'oops' } } })
                }))
                .meta('foo')
                .strip()
                .default(() => 'foo', 'Def')
                .optional();
        }
    ]
];
