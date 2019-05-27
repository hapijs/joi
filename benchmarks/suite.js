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
            { id: '1', level: 'info' },
            { id: '2', level: 'warning' }
        ],
        (schema, value) => {

            return schema.validate(value, { convert: false });
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
            { id: '1', level: 'info' },
            { id: '2', level: 'warning' }
        ],
        (schema, value) => {

            return schema.validate(value);
        }
    ],
    [
        'JSON object',
        () => [
            Joi.object({
                id: Joi.string().required(),
                level: Joi.string()
                    .valid(['debug', 'info', 'notice'])
                    .required()
            }).unknown(false),
            '{ "id": "1", "level": "info" }',
            'invalid'
        ],
        (schema, value) => {

            return schema.validate(value, { convert: true });
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
    ],
    [
        'Schema creation with long valid() list',
        () => {

            const list = [];
            for (let i = 10000; i < 50000; ++i) {
                list.push(i.toString());
            }

            return [list.filter((x) => !['12345', '23456', '34567', '456789'].includes(x))];
        },
        (list) => {

            Joi.object().keys({
                foo: Joi.string().valid(list)
            });
        }
    ],
    [
        'String with long valid() list',
        () => {

            const list = [];
            for (let i = 10000; i < 50000; ++i) {
                list.push(i.toString());
            }

            const schema = Joi.string().valid(list);

            let i = 0;
            const value = () => {

                return `${10000 + (++i % 40000)}`;
            };

            return [schema, value, () => '5000'];
        },
        (schema, value) => {

            return schema.validate(value());
        }
    ]
];
