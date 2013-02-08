// Load modules

var BaseType = require('./base');
var StringType = require('./string');
var NumberType = require('./number');
var BooleanType = require('./boolean');
var ArrayType = require('./array');
var ObjectType = require('./object');
var FunctionType = require('./function');


// Declare internals

var internals = {};


internals.Types = function () {

    // Load types

    this.Base = BaseType;
    this.String = StringType;
    this.Number = NumberType;
    this.Boolean = BooleanType;
    this.Array = ArrayType;
    this.Object = ObjectType;
    this.Function = FunctionType;

    return this;
};


module.exports = new internals.Types();


internals.Types.prototype.mutatorMethods = {

    rename: 1
};


internals.Types.prototype.validate = function (key, type, object, validator, placeholder) {

    var value = object[key];

    // Convert value from String if necessary

    var T = this[type];
    var converter = T().convert || null;
    if (typeof converter !== 'undefined' &&
        converter !== null) {

        value = converter(value);
    }

    // Set request-scoped error writer
    //   errors stored as placeholder.validationErrors = []
    if (placeholder) {
        placeholder.add = this.Base.prototype.RequestErrorFactory(placeholder);
    }

    var result = validator(value, object, key, placeholder);

    if (placeholder) {
        // Remove from request object when finished
        delete placeholder.add;
    }

    return result;
};