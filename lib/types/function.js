// Load modules

var NodeUtil = require('util');
var BaseType = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.FunctionType();
};


module.exports.FunctionType = internals.FunctionType = function () {

    internals.FunctionType.super_.call(this);
    Utils.mixin(this, BaseType);
    return this;
};

NodeUtil.inherits(internals.FunctionType, BaseType);


internals.FunctionType.prototype.__name = "Function";


internals.FunctionType.prototype._base = function() {

    return function(value, obj, key, errors, keyPath) {

        var result = (value === null || typeof value === "function");

        if (!result) {
            errors.add('the value of ' + key + ' must be a Function', keyPath);
        }

        return result;
    };
};

internals.FunctionType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};