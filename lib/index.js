// Load modules

var Utils = require('./utils');
var Any = require('./any');
var Cast = require('./cast');


// Declare internals

var internals = {};


exports.any = Any.create;
exports.alternatives = exports.alt = require('./alternatives').create;
exports.array = require('./array').create;
exports.boolean = exports.bool = require('./boolean').create;
exports.date = require('./date').create;
exports.func = require('./function').create;
exports.number = require('./number').create;
exports.object = require('./object').create;
exports.string = require('./string').create;


exports.types = exports.Types = {
    any: exports.any,
    alternatives: exports.alternatives,
    array: exports.array,
    boolean: exports.boolean,
    date: exports.date,
    func: exports.func,
    number: exports.number,
    object: exports.object,
    string: exports.string
};


// Backwards compatibility

exports.types.Any = exports.types.any;
exports.types.Array = exports.types.array;
exports.types.Boolean = exports.types.boolean;
exports.types.Date = exports.types.date;
exports.types.Function = exports.types.func;
exports.types.Number = exports.types.number;
exports.types.Object = exports.types.object;
exports.types.String = exports.types.string;


exports.validate = function (object, schema, options) {

    return Cast.schema(schema).validate(object, options);
};


exports.validateCallback = function (object, schema, options, callback) {       // Not actually async, just callback interface

    var err = exports.validate(object, schema, options);
    return callback(err);
};


exports.describe = function (schema) {

    Utils.assert(typeof schema === 'object', 'Schema must be an object');

    if (typeof schema.describe === 'function') {
        return schema.describe();
    }

    return exports.object(schema).describe();
};

