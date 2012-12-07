// Load modules

var NodeUtil = require('util');
var BaseType = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.ObjectType();
};


module.exports.ObjectType = internals.ObjectType = function () {

    internals.ObjectType.super_.call(this);
    Utils.mixin(this, BaseType);
    return this;
};

NodeUtil.inherits(internals.ObjectType, BaseType);


internals.ObjectType.prototype.__name = 'Object';


internals.ObjectType.prototype.convert = function (value) {

    return JSON.parse(value);
};


internals.ObjectType.prototype._base = function () {

    return function (value) {

        return (value === null || typeof value === 'object');
    };
};


internals.ObjectType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};

