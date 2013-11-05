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

exports.any = internals.create(Any);
exports.array = internals.create(require('./array'));
exports.bool = internals.create(require('./boolean'));
exports.date = internals.create(require('./date'));
exports.func = internals.create(require('./function'));
exports.number = internals.create(require('./number'));
exports.object = internals.create(require('./object'));
exports.string = internals.create(require('./string'));


exports.types = exports.Types = {
    any: exports.any,
    array: exports.array,
    bool: exports.bool,
    date: exports.date,
    func: exports.func,
    number: exports.number,
    object: exports.object,
    string: exports.string
};


// Backwards compatibility

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


