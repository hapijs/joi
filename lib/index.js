// Load modules

var Errors = require('./errors');
var Utils = require('./utils');


// Declare internals

var internals = {};


exports.Types = exports.types = {
    Array: require('./array'),
    Any: require('./any'),
    Base: require('./base'),
    Boolean: require('./boolean'),
    Date: require('./date'),
    Function: require('./function'),
    Number: require('./number'),
    Object: require('./object'),
    String: require('./string')
};


exports.validate = function (object, schema, options) {

    Utils.assert(typeof schema === 'object' && !Array.isArray(schema), 'Schema must be a non-array object');

    if (schema instanceof exports.types.Base) {
        return schema.validate(object, options);
    }

    return exports.types.Object(schema).validate(object, options);
};


