// Load modules

var BaseType = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function (refClass) {

    return new internals.ExtendsType(refClass);
};


module.exports.ExtendsType = internals.ExtendsType = function (refClass) {

    internals.ExtendsType.super_.call(this);
    Utils.mixin(this, BaseType);

    if (!(refClass instanceof Function)) {
        throw Error("Extends only accepts a function for reference.");
    }

    this._refClass = refClass;

    // this._refClassName = refClass.name;

    return this;
};

Utils.inherits(internals.ExtendsType, BaseType);


internals.ExtendsType.prototype.__name = 'Extends';


internals.ExtendsType.prototype._base = function () {

    var self = this;

    return function(value, obj, key, errors, keyPath) {

        var result = (value === null || value.prototype instanceof self._refClass);

        if (!result) {
            errors.addLocalized('extends.base', key, null, keyPath);
        }

        return result;
    };
};

internals.ExtendsType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};