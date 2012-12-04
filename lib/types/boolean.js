// Load modules

var NodeUtil = require('util');
var BaseType = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.BooleanType();
};


module.exports.BooleanType = internals.BooleanType = function () {

    internals.BooleanType.super_.call(this);
    Utils.mixin(this, BaseType);
    return this;
};

NodeUtil.inherits(internals.BooleanType, BaseType);


internals.BooleanType.prototype.__name = 'Boolean';


internals.BooleanType.prototype.convert = function (value) {

    if (typeof value !== 'string') {
        return value;
    }

    return value.toLowerCase() === 'true';
};


internals.BooleanType.prototype._base = function () {

    return function (value, qs, key, req) {

        req = req || {};
        req.add = req.add || function () { };

        var result = (value === null || typeof value === 'boolean');
        if (!result) {
            req.add('the value of `' + key + '` must be a boolean');
        }
        return result;
    };
};


internals.BooleanType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};

