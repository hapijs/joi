// Load modules

var Utils = require('./utils');
// Object and Alternatives are delayed loaded


// Declare internals

var internals = {
    Object: null,
    Alternatives: null
};


exports.schema = function (config) {

    Utils.assert(typeof config === 'object', 'Schema must be an object');

    internals.Object = internals.Object || require('./object');
    internals.Alternatives = internals.Alternatives || require('./alternatives');

    var schema = (typeof config._validate === 'function' ? config
                                                         : (Array.isArray(config) ? internals.Alternatives._create(config)
                                                                                  : new internals.Object(config)));
    return schema;
};
