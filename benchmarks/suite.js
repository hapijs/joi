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
            ],
            17: () => [
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
                    .optional(),

            17: () =>

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
        'Schema creation with many keys',
        () => {

            const keys = {};
            for (let i = 0; i < 200; ++i) {
                keys[`key${i}`] = Joi.string().min(1).max(10);
            }

            return [keys];
        },
        (keys) => Joi.object(keys)
    ],
    [
        'Schema creation with many keys and sibling references',
        () => {

            const keys = {};
            for (let i = 0; i < 200; ++i) {
                keys[`key${i}`] = i && i % 10 === 0 ? Joi.number().min(Joi.ref(`key${i - 1}`)) : Joi.number();
            }

            return [keys];
        },
        (keys) => Joi.object(keys)
    ],
    [
        'Incremental schema creation',
        () => {

            const parts = [];
            for (let i = 0; i < 50; ++i) {
                parts.push({ [`key${i}`]: Joi.string().min(1).max(10) });
            }

            return [parts];
        },
        (parts) => {

            let schema = Joi.object();
            for (const part of parts) {
                schema = schema.keys(part);
            }

            return schema;
        }
    ],
    [
        'Schema creation by rule chaining',
        () => [],
        () => Joi.string().min(1).max(100).lowercase().trim().required().description('a string')
    ],
    [
        'Schema concatenation',
        () => {

            const build = (prefix) => {

                const keys = {};
                for (let i = 0; i < 25; ++i) {
                    keys[`${prefix}${i}`] = Joi.string().min(1).max(10);
                }

                return Joi.object(keys);
            };

            return [[build('left'), build('right')]];
        },
        ([left, right]) => left.concat(right)
    ],
    [
        'Schema fork',
        {
            15: false,                          // fork() was added in 16
            16: () => {

                const keys = {};
                for (let i = 0; i < 50; ++i) {
                    keys[`key${i}`] = Joi.string().min(1).max(10);
                }

                return [Joi.object(keys)];
            }
        },
        (schema) => schema.fork('key25', (key) => key.required())
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
    ],
    [
        'Dependency validation',
        () => [
            Joi.object({
                'a': Joi.string(),
                'b': Joi.string()
            }),
            { a: 'foo', b: 'bar' }
        ],
        (schema, value) => schema.validate(value)
    ],
    [
        'Parsing of exponential numbers',
        () => [
            Joi.number(),
            '+001231.0133210e003',
            '90071992547409811e-1'
        ],
        (schema, value) => schema.validate(value)
    ]
];
