// Load modules

var Errors = require('./errors');
var Utils = require('./utils');
var Any = require('./any');


// Declare internals

var internals = {};


internals.create = function (Type) {

    return function (arg) {

        return new Type(arg);
    };
};


exports.types = {
    any: internals.create(Any),
    array: internals.create(require('./array')),
    bool: internals.create(require('./boolean')),
    date: internals.create(require('./date')),
    func: internals.create(require('./function')),
    number: internals.create(require('./number')),
    object: internals.create(require('./object')),
    string: internals.create(require('./string'))
};


// Backwards compatibility

exports.Types = exports.types;
exports.types.Any = exports.types.any;
exports.types.Array = exports.types.array;
exports.types.Boolean = exports.types.bool;
exports.types.Date = exports.types.date;
exports.types.Function = exports.types.func;
exports.types.Number = exports.types.number;
exports.types.Object = exports.types.object;
exports.types.String = exports.types.string;


exports.validate = function (object, schema, options) {

    Utils.assert(typeof schema === 'object' && !Array.isArray(schema), 'Schema must be a non-array object');

    if (schema instanceof Any) {
        return schema.validate(object, options);
    }

    return exports.types.Object(schema).validate(object, options);
};


