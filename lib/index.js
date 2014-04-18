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
exports.ref = require('./ref').create;


exports.validate = function (object, schema, options, callback) {

    return Cast.schema(schema).validate(object, options, callback);
};


exports.describe = function (schema) {

    return Cast.schema(schema).describe();
};


exports.compile = function (schema) {

    return Cast.schema(schema);
};
