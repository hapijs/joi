// Load modules

var Hoek = require('hoek');
// Type modules are delay-loaded to prevent circular dependencies


// Declare internals

var internals = {
    any: require('./any').create(),
    date: require('./date').create(),
    string: require('./string').create(),
    number: require('./number').create(),
    boolean: require('./boolean').create(),
    alt: null,
    object: null
};


exports.schema = function (config) {

    internals.alt = internals.alt || require('./alternatives').create();
    internals.object = internals.object || require('./object').create();

    if (config &&
        typeof config === 'object') {

        if (config.isJoi) {
            return config;
        }

        if (Array.isArray(config)) {
            return internals.alt.attempt(config);
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

    if (typeof config === 'function' &&     // ref()
        config.isJoi) {

        return internals.any.valid(config);
    }

    Hoek.assert(config === null, 'Invalid schema content:', config);

    return internals.any.valid(null);
};
