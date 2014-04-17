// Load modules

var Hoek = require('hoek');
var Any = require('./any');
var Cast = require('./cast');


// Declare internals

var internals = {};


exports.any = new Any();
exports.alternatives = exports.alt = require('./alternatives');
exports.array = require('./array');
exports.boolean = exports.bool = require('./boolean');
exports.binary = require('./binary');
exports.date = require('./date');
exports.func = require('./function');
exports.number = require('./number');
exports.object = require('./object');
exports.string = require('./string');
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
