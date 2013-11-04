// Load modules

var Errors = require('./errors');
var Utils = require('./utils');


// Declare internals

var internals = {};


exports.Types = exports.types = {
    Base: require('./base'),
    String: require('./string'),
    Number: require('./number'),
    Boolean: require('./boolean'),
    Array: require('./array'),
    Object: require('./object'),
    Function: require('./function'),
    Any: require('./any')
};


exports.validate = function (object, schema, options) {

    Utils.assert(typeof schema === 'object' && !Array.isArray(schema), 'Schema must be a non-array object');

    if (schema instanceof exports.types.Base) {
        return schema.validate(object, options);
    }

    return exports.types.Object(schema).validate(object, options);
};


