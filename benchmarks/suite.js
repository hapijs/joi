'use strict';

module.exports = (Joi) => [
    [
        'Simple object',
        () => [
            Joi.object({
                id: Joi.string().required(),
                level: Joi.string()
                    .valid('debug', 'info', 'notice')
                    .required()
            }).unknown(false),
            { id: '1', level: 'info' },
            { id: '2', level: 'warning' }
        ],
        (schema, value) => schema.validate(value, { convert: false })
    ],
    [
        'Simple object with inlined prefs',
        {
            15: () => [
                Joi.object({
                    id: Joi.string().required(),
                    level: Joi.string()
                        .valid('debug', 'info', 'notice')
                        .required()
                }).unknown(false).options({ convert: false }),
                { id: '1', level: 'info' },
                { id: '2', level: 'warning' }
            ],
            16: () => [
                Joi.object({
                    id: Joi.string().required(),
                    level: Joi.string()
                        .valid('debug', 'info', 'notice')
                        .required()
                }).unknown(false).prefs({ convert: false }),
                { id: '1', level: 'info' },
                { id: '2', level: 'warning' }
            ]
        },
        (schema, value) => schema.validate(value)
    ],
    [
        'Schema creation',
        () => [],
        {
            15: () =>

                Joi.object({
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
                    .pattern(/b/, Joi.when('a', {
                        is: true,
                        then: Joi.options({ language: { 'any.required': 'oops' } })
                    }))
                    .meta('foo')
                    .strip()
                    .default(() => 'foo', 'Def')
                    .optional(),
            16: () =>

                Joi.object({
                    foo: Joi.array().items(
                        Joi.boolean().required(),
                        Joi.string().allow(''),
                        Joi.symbol()
                    ).single().sparse().required(),
                    bar: Joi.number().min(12).max(353).default(56).positive(),
                    baz: Joi.date().timestamp('unix'),
                    qux: [Joi.function().minArity(12).strict(), Joi.binary().max(345)],
                    quxx: Joi.string().ip({ version: ['ipv6'] }),
                    quxxx: [554, 'azerty', true]
                })
                    .xor('foo', 'bar')
                    .or('bar', 'baz')
                    .pattern(/b/, Joi.when('a', {
                        is: true,
                        then: Joi.prefs({ messages: { 'any.required': 'oops' } })
                    }))
                    .meta('foo')
                    .strip()
                    .default(() => 'foo')
                    .optional()
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
        (list) => Joi.object().keys({ foo: Joi.string().valid(...list) })
    ],
    [
        'String with long valid() list',
        () => {

            const list = [];
            for (let i = 10000; i < 50000; ++i) {
                list.push(i.toString());
            }

            const schema = Joi.string().valid(...list);

            let i = 0;
            const value = () => {

                return `${10000 + (++i % 40000)}`;
            };

            return [schema, value, () => '5000'];
        },
        (schema, value) => schema.validate(value())
    ],
    [
        'Complex object',
        () =>
            [
                Joi.object({
                    id: Joi.number()
                        .min(0)
                        .max(100)
                        .required(),

                    level: Joi.string()
                        .min(1)
                        .max(100)
                        .lowercase()
                        .required(),

                    tags: Joi.array()
                        .items(Joi.boolean())
                        .min(2)
                })
                    .unknown(false),
                { id: 1, level: 'info', tags: [true, false] }
            ],
        (schema, value) => schema.validate(value)
    ]
];
