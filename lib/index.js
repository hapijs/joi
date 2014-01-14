// Load modules

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
exports.boolean = exports.bool = internals.create(require('./boolean'));
exports.date = internals.create(require('./date'));
exports.func = internals.create(require('./function'));
exports.number = internals.create(require('./number'));
exports.object = internals.create(require('./object'));
exports.string = internals.create(require('./string'));


exports.types = exports.Types = {
    any: exports.any,
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

    Utils.assert(typeof schema === 'object', 'Schema must be an object');

    if (typeof schema.validate === 'function') {
        return schema.validate(object, options);
    }

    return exports.object(schema).validate(object, options);
};


exports.describe = function (schema) {

    Utils.assert(typeof schema === 'object', 'Schema must be an object');

    if (typeof schema.describe === 'function') {
        return schema.describe();
    }

    return exports.object(schema).describe();
};

