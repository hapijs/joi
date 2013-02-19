// Load modules

var NodeUtil = require('util');
var BaseType = require('./base');
var Utils = require('../utils');
var Validator = require('../');


// Declare internals

var internals = {};


module.exports = internals.createType = function (config) {

    return new internals.ObjectType(config);
};


module.exports.ObjectType = internals.ObjectType = function (config) {

    internals.ObjectType.super_.call(this);
    Utils.mixin(this, BaseType);

    this._config = config || {};

    return this;
};

NodeUtil.inherits(internals.ObjectType, BaseType);


internals.ObjectType.prototype.__name = 'Object';
internals.ObjectType.prototype.__defaultValids = [null];


internals.ObjectType.prototype.convert = function (value) {

    return (typeof value === 'object' || typeof value === 'undefined') ? value : JSON.parse(value);
};


internals.ObjectType.prototype._base = function () {

    var self = this;

    return function (value, key, obj, errors) {

        if (typeof value !== 'object') {
            return false;
        }

        return self._traverse(value, self._config, errors);
    };
};


internals.ObjectType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};


internals.ObjectType.prototype._traverse = function (obj, config, errors) {

    var self = this;

    var keys = Object.keys(config);

    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var itemConfig = config[key];
        var value = obj ? obj[key] : null;

        if (typeof itemConfig.validate === 'function' &&
            itemConfig.validate(value, key, itemConfig, errors) === false) {

            return false;
        }

        if (itemConfig.type === 'Object') {
            self._traverse(value, itemConfig._config);
        }
    }

    return true;
};