'use strict';

const Joi = require('./index');


const internals = {};


exports.preferences = Joi.object({
    allowUnknown: Joi.boolean(),
    abortEarly: Joi.boolean(),
    context: Joi.object(),
    convert: Joi.boolean(),
    dateErrorFormat: Joi.string().only('date', 'iso', 'string', 'time', 'utc'),
    escapeErrors: Joi.boolean(),
    messages: Joi.object(),
    noDefaults: Joi.boolean(),
    nonEnumerables: Joi.boolean(),
    presence: Joi.string().only('required', 'optional', 'forbidden', 'ignore'),
    skipFunctions: Joi.boolean(),
    stripUnknown: [Joi.boolean(), Joi.object({ arrays: Joi.boolean(), objects: Joi.boolean() }).or('arrays', 'objects')]
})
    .strict();
