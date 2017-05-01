'use strict';

// Load modules

const Hoek = require('hoek');
const Ref = require('./ref');

// Type modules are delay-loaded to prevent circular dependencies


// Declare internals

const internals = {
    any: null,
    date: require('./types/date'),
    string: require('./types/string'),
    number: require('./types/number'),
    boolean: require('./types/boolean'),
    alt: null,
    object: null
};


exports.schema = function (config) {

    internals.any = internals.any || new (require('./types/any'))();
    internals.alt = internals.alt || require('./types/alternatives');
    internals.object = internals.object || require('./types/object');

    if (config !== undefined && config !== null && typeof config === 'object') {

        if (config.isJoi) {
            return config;
        }

        if (Array.isArray(config)) {
            return internals.alt.try(config);
        }

        if (config instanceof RegExp) {
            return internals.string.regex(config);
        }

        if (config instanceof Date) {
            return internals.date.valid(config);
        }

        return internals.object.keys(config);
    }

    if (typeof config === 'string') {
        return internals.string.valid(config);
    }

    if (typeof config === 'number') {
        return internals.number.valid(config);
    }

    if (typeof config === 'boolean') {
        return internals.boolean.valid(config);
    }

    if (Ref.isRef(config)) {
        return internals.any.valid(config);
    }

    Hoek.assert(config === null, 'Invalid schema content:', config);

    return internals.any.valid(null);
};


exports.ref = function (id) {

    return Ref.isRef(id) ? id : Ref.create(id);
};
