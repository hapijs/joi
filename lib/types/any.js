// Load modules

var BaseType = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.AnyType();
};


module.exports.AnyType = internals.AnyType = function () {

    internals.AnyType.super_.call(this);
    Utils.mixin(this, BaseType);
    return this;
};

Utils.inherits(internals.AnyType, BaseType);


internals.AnyType.prototype.__name = "Any";


internals.AnyType.prototype._base = function() {

    return function(value, obj, key, errors, keyPath) {

        return true;                                        // null is not allowed by default
    };
};

internals.AnyType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};