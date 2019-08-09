'use strict';

const Joi = require('./index');


const internals = {};


// Preferences

exports.preferences = Joi.object({
    allowUnknown: Joi.boolean(),
    abortEarly: Joi.boolean(),
    cache: Joi.boolean(),
    context: Joi.object(),
    convert: Joi.boolean(),
    dateFormat: Joi.valid('date', 'iso', 'string', 'time', 'utc'),
    errors: {
        escapeHtml: Joi.boolean(),
        language: [
            Joi.string(),
            Joi.object().ref()
        ],
        render: Joi.boolean(),
        stack: Joi.boolean(),
        wrapArrays: Joi.boolean()
    },
    externals: Joi.boolean(),
    messages: Joi.object(),
    noDefaults: Joi.boolean(),
    nonEnumerables: Joi.boolean(),
    presence: Joi.valid('required', 'optional', 'forbidden'),
    skipFunctions: Joi.boolean(),
    stripUnknown: Joi.object({
        arrays: Joi.boolean(),
        objects: Joi.boolean()
    })
        .or('arrays', 'objects')
        .allow(true, false),
    warnings: Joi.boolean()
})
    .strict();


// Extensions

internals.nameRx = /^[a-zA-Z0-9]+$/;


internals.rule = Joi.object({
    alias: Joi.array().items(Joi.string().pattern(internals.nameRx)).single(),
    method: Joi.func().allow(false),
    validate: Joi.func(),
    args: Joi.array().items(
        Joi.string(),
        Joi.object({
            name: Joi.string().pattern(internals.nameRx).required(),
            ref: Joi.boolean(),
            assert: Joi.alternatives([Joi.func(), Joi.object().schema()]).when('ref', { is: true, then: Joi.required() }),
            normalize: Joi.func(),
            message: Joi.string().when('assert', { is: Joi.func(), then: Joi.required() })
        })
    ),
    multi: Joi.boolean(),
    convert: Joi.boolean()
});


exports.extension = Joi.object({
    type: Joi.string().required(),

    args: Joi.func(),
    base: Joi.object().schema(),
    build: Joi.func().arity(2),
    coerce: [
        Joi.func().maxArity(3),
        Joi.object({ method: Joi.func().maxArity(3).required(), from: Joi.array().items(Joi.string()).single() })
    ],
    initialize: Joi.func().arity(1),
    messages: [Joi.object(), Joi.string()],
    modify: Joi.func().arity(3),
    prepare: Joi.func().maxArity(3),
    rebuild: Joi.func().arity(1),
    rules: Joi.object().pattern(internals.nameRx, internals.rule),
    validate: Joi.func().maxArity(3)
})
    .and('modify', 'rebuild')
    .strict();


exports.extensions = Joi.array().items(Joi.object(), Joi.func().arity(1)).strict();


// Manifest

internals.desc = {

    buffer: Joi.object({
        buffer: Joi.string()
    }),

    func: Joi.object({
        function: Joi.func().required(),
        options: {
            literal: true
        }
    }),

    ref: Joi.object({
        ref: Joi.object({
            type: Joi.valid('value', 'global', 'local'),
            path: Joi.array().required(),
            separator: Joi.string().length(1).allow(false),
            ancestor: Joi.number().min(0).integer().allow('root'),
            map: Joi.array().items(Joi.array().length(2)).min(1),
            adjust: Joi.func(),
            iterables: Joi.boolean()
        })
            .required()
    }),

    regex: Joi.object({
        regex: Joi.string().min(3)
    }),

    special: Joi.object({
        special: Joi.valid('deep').required()
    }),

    template: Joi.object({
        template: Joi.string().required(),
        options: Joi.object()
    }),

    value: Joi.object({
        value: Joi.alternatives([Joi.object(), Joi.array()]).required()
    })
};


internals.desc.entity = Joi.alternatives([
    Joi.boolean(),
    Joi.func(),
    Joi.number(),
    Joi.string(),
    internals.desc.buffer,
    internals.desc.func,
    internals.desc.ref,
    internals.desc.regex,
    internals.desc.special,
    internals.desc.template,
    internals.desc.value,
    Joi.link('/')
]);


internals.desc.values = Joi.array()
    .items(
        null,
        Joi.boolean(),
        Joi.func(),
        Joi.number().allow(Infinity, -Infinity),
        Joi.string().allow(''),
        Joi.symbol(),
        internals.desc.buffer,
        internals.desc.func,
        internals.desc.ref,
        internals.desc.regex,
        internals.desc.template,
        internals.desc.value
    );


internals.desc.messages = Joi.object()
    .pattern(/.+/, [
        Joi.string(),
        internals.desc.template,
        Joi.object().pattern(/.+/, [Joi.string(), internals.desc.template])
    ]);


exports.description = Joi.object({
    type: Joi.string().required(),
    flags: Joi.object({
        cast: Joi.string(),
        default: internals.desc.entity,
        description: Joi.string(),
        empty: Joi.link('/'),
        encoding: Joi.string(),
        failover: internals.desc.entity,
        format: Joi.string().allow('iso', 'javascript', 'unix'),
        id: Joi.string(),
        insensitive: Joi.boolean(),
        label: Joi.string(),
        only: true,
        presence: Joi.string().valid('optional', 'required', 'forbidden'),
        result: Joi.string().valid('raw', 'strip'),
        single: Joi.boolean(),
        sparse: Joi.boolean(),
        strip: Joi.boolean(),
        truncate: Joi.boolean(),
        unit: Joi.string(),
        unknown: true,
        unsafe: Joi.boolean()
    })
        .unknown(),
    preferences: {
        allowUnknown: Joi.boolean(),
        abortEarly: Joi.boolean(),
        cache: Joi.boolean(),
        convert: Joi.boolean(),
        dateFormat: Joi.valid('date', 'iso', 'string', 'time', 'utc'),
        errors: {
            escapeHtml: Joi.boolean(),
            language: [
                Joi.string(),
                internals.desc.ref
            ],
            wrapArrays: Joi.boolean()
        },
        externals: Joi.boolean(),
        messages: internals.desc.messages,
        noDefaults: Joi.boolean(),
        nonEnumerables: Joi.boolean(),
        presence: Joi.valid('required', 'optional', 'forbidden'),
        skipFunctions: Joi.boolean(),
        stripUnknown: Joi.object({
            arrays: Joi.boolean(),
            objects: Joi.boolean()
        })
            .or('arrays', 'objects')
            .allow(true, false),
        warnings: Joi.boolean()
    },
    allow: internals.desc.values,
    invalid: internals.desc.values,
    rules: Joi.array().min(1).items({
        name: Joi.string().required(),
        args: Joi.object().min(1),
        keep: Joi.boolean(),
        message: [
            Joi.string(),
            internals.desc.messages
        ],
        warn: Joi.boolean()
    }),

    // Terms

    keys: Joi.object().pattern(/.*/, Joi.link('/')),
    link: internals.desc.ref
})
    .pattern(/^[a-z]\w*$/, Joi.any());
