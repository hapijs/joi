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

    return JSON.parse(value);
};


internals.ObjectType.prototype._base = function () {

    var self = this;

    return function (value) {

        if (typeof value !== 'object') {
            return false;
        }

        var valid = false;

        self._traverse(value, self._config, function (isValid) {

            if (!isValid) {
                return false;
            }

            valid = isValid;
        });

        return valid;
    };
};


internals.ObjectType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};


internals.ObjectType.prototype._traverse = function (obj, config, callback) {

    var self = this;

    var traversing = false;

    Object.keys(config).forEach(function (key) {

        var itemConfig = config[key];
        var value = obj ? obj[key] : null;

        if (itemConfig.type === 'Object') {
            traversing = true;
            self._traverse(value, itemConfig._config, callback);
        }
        else if (typeof itemConfig.validate === 'function' &&
            itemConfig.validate(value) === false) {

            traversing = true;
            return callback(false);
        }
    });

    if (!traversing) {
        callback(true);
    }
};