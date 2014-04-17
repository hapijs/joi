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
    Alternatives: null,
    Object: null
};


exports.schema = function (config) {

    internals.Alternatives = internals.Alternatives || require('./alternatives');
    internals.Object = internals.Object || require('./object');

    if (config &&
        typeof config === 'object') {

        if (config.isJoi) {
            return config;
        }

        if (Array.isArray(config)) {
            return internals.Alternatives._create(config);
        }

        if (config instanceof RegExp) {
            return internals.string.regex(config);
        }

        if (config instanceof Date) {
            return internals.date.valid(config);
        }

        return internals.Object.create(config);
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

    Hoek.assert(config === null, 'Invalid schema content:', config);

    return internals.any.valid(null);
};
