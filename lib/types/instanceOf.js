// Load modules

var BaseType = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function (refClass) {

    return new internals.InstanceOfType(refClass);
};


module.exports.InstanceOfType = internals.InstanceOfType = function (refClass) {

    internals.InstanceOfType.super_.call(this);
    Utils.mixin(this, BaseType);

    if (!refClass instanceof Function) {
        throw Error("InstanceOf accepts a function as reference.");
    }

    this._refClass = refClass;

    // this._refClassName = refClass.name;

    return this;
};

Utils.inherits(internals.InstanceOfType, BaseType);


internals.InstanceOfType.prototype.__name = 'InstanceOf';


internals.InstanceOfType.prototype._base = function () {

    var self = this;

    return function(value, obj, key, errors, keyPath) {

        var result = (value === null || value instanceof self._refClass);

        if (!result) {
            errors.addLocalized('instanceOf.base', key, null, keyPath);
        }

        return result;
    };
};

internals.InstanceOfType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};