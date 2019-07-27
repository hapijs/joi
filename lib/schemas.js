'use strict';

const Joi = require('./index');

const Messages = require('./messages');


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
            Joi.string().invalid(...Object.keys(Messages.errors)),
            Joi.object().ref()
        ],
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

exports.extension = Joi.object({
    base: [
        Joi.object().schema(),
        Joi.func()
    ],
    name: Joi.string().required(),
    coerce: Joi.func().minArity(1).maxArity(3),
    pre: Joi.func().minArity(1).maxArity(3),
    messages: Joi.object(),
    rules: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        setup: Joi.func().arity(1),
        validate: Joi.func().arity(4),
        params: Joi.object().when('params', {           // Self referencing when() instead of alternatives for better error messages
            is: Joi.object().schema(),
            then: Joi.object().schema('object'),
            otherwise: Joi.object().pattern(/.*/, Joi.object().schema())
        })
    })
        .or('setup', 'validate'))
})
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
    flags: {
        cast: Joi.string(),
        default: internals.desc.entity,
        description: Joi.string(),
        empty: Joi.link('/'),
        encoding: Joi.string(),
        failover: internals.desc.entity,
        format: Joi.string().valid('iso', 'javascript', 'unix'),
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
    },
    preferences: {
        allowUnknown: Joi.boolean(),
        abortEarly: Joi.boolean(),
        cache: Joi.boolean(),
        convert: Joi.boolean(),
        dateFormat: Joi.valid('date', 'iso', 'string', 'time', 'utc'),
        errors: {
            escapeHtml: Joi.boolean(),
            language: [
                Joi.string().invalid(...Object.keys(Messages.errors)),
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

    // Inners

    keys: Joi.object().pattern(/.*/, Joi.link('/')),
    link: internals.desc.ref
})
    .pattern(/^[a-z]\w*$/, Joi.any());
