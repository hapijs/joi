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

    return function (value, obj, key, errors, keyPath) {

        if (typeof value !== 'object') {
            errors.add('the value of `' + key + '` must be an object', keyPath);
            return false;
        }

        return self._traverse(value, self._config, errors, keyPath);
    };
};


internals.ObjectType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};


internals.ObjectType.prototype._traverse = function (topObj, topConfig, errors, topKeyPath) {

    var self = this;

    var traverse = function (obj, config, errors, keyPath) {

        var keys = Object.keys(config);

        for (var i = 0, il = keys.length; i < il; ++i) {
            var key = keys[i];
            var itemConfig = config[key];
            var value = obj ? obj[key] : null;
            keyPath = keyPath ? topKeyPath + '.' + key : key;

            if (typeof itemConfig.validate === 'function' &&
                itemConfig.validate(value, key, itemConfig, errors, keyPath) === false) {

                return false;
            }

            if (itemConfig.type === 'Object') {
                traverse(value, itemConfig._config, errors, topKeyPath);
            }
        }

        return true;
    };

    return traverse(topObj, topConfig, errors, topKeyPath);
};