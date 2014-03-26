// Load modules

var Hoek = require('hoek');
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


exports.validate = function (object, schema, options) {

    return Cast.schema(schema).validate(object, options);
};


exports.validateCallback = function (object, schema, options, callback) {       // Not actually async, just callback interface

    var err = exports.validate(object, schema, options);
    return callback(err);
};


exports.describe = function (schema) {

    Hoek.assert(typeof schema === 'object', 'Schema must be an object');

    if (typeof schema.describe === 'function') {
        return schema.describe();
    }

    return exports.object(schema).describe();
};


exports.compile = function (schema) {

    return Cast.schema(schema);
};