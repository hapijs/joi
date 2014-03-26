// Load modules

var Hoek = require('hoek');
// Type modules are delay-loaded to prevent circular dependencies


// Declare internals

var internals = {
    Any: null,
    Alternatives: null,
    Date: null,
    Object: null,
    String: null
};


exports.schema = function (config) {

    internals.any = internals.any || require('./any').create();
    internals.Alternatives = internals.Alternatives || require('./alternatives');
    internals.Date = internals.Date || require('./date');
    internals.Object = internals.Object || require('./object');
    internals.String = internals.String || require('./string');

    if (config &&
        typeof config === 'object') {
            
        if (config.isJoi) {
            return config;
        }

        if (Array.isArray(config)) {
            return internals.Alternatives._create(config);
        }

        if (config instanceof RegExp) {
            return internals.String.create().regex(config);
        }

        if (config instanceof Date) {
            return internals.Date.create().valid(config);
        }

        return internals.Object.create(config);
    }

    Hoek.assert(config === null || typeof config === 'string' || typeof config === 'number' || typeof config === 'boolean', 'Invalid schema content:', config);

    return internals.any.valid(config);
};
