// Load modules

var BaseType = require('./base');
var StringType = require('./string');
var NumberType = require('./number');
var BooleanType = require('./boolean');
var ArrayType = require('./array');
var ObjectType = require('./object');
var FunctionType = require('./function');
var AnyType = require('./any');


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
    this.Any = AnyType;

    return this;
};


module.exports = new internals.Types();


internals.Types.prototype.mutatorMethods = {

    rename: 1
};


internals.Types.prototype.validate = function (key, type, object, validator, errors) {

    var value = object[key];
    errors = errors || {};
    errors.add = errors.add || function () { };

    // Convert value from String if necessary

    var T = this[type];
    var converter = T().convert || null;
    if (typeof converter !== 'undefined' &&
        converter !== null) {

        value = converter(value);
    }

    // Set request-scoped error writer
    //   errors stored as placeholder.validationErrors = []
    if (errors) {
        errors.add = errors.add || this.Base.prototype.RequestErrorFactory(errors);
    }

    var result = validator(value, object, key, errors, key);

    if (errors) {
        // Remove from request object when finished
        delete errors.add;
    }

    return result;
};