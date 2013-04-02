// Load modules

var NodeUtil = require('util');
var BaseType = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.NumberType();
};


module.exports.NumberType = internals.NumberType = function () {

    internals.NumberType.super_.call(this);
    Utils.mixin(this, BaseType);
    return this;
};

NodeUtil.inherits(internals.NumberType, BaseType);


internals.NumberType.prototype.__name = 'Number';


internals.NumberType.prototype.convert = function (value) {

    if (typeof value === 'string') {
        return Number(value);
    }

    return value;
};


internals.NumberType.prototype._base = function () {

    return function (value, obj, key, errors, keyPath) {

        if (typeof value !== 'number' && typeof value !== 'string') {
            errors.add('the value of ' + key + ' must be a number', keyPath);
            return false;
        }

        return !isNaN(+value);
    };
};


internals.NumberType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};


internals.NumberType.prototype._min = function (n) {

    Utils.assert((!isNaN(n) && ((n | 0) === parseFloat(n))), 'In Types.Number.min(n), the n must be an integer.');

    return function (value, obj, key, errors, keyPath) {

        var result = (isNaN(value) || value >= n);
        if (!result) {
            errors.add('the value of ' + key + ' must be larger than (or equal to) ' + n, keyPath);
        }

        return result;
    };
};


internals.NumberType.prototype.min = function (n) {

    this.add('min', this._min(n), arguments);
    return this;
};


internals.NumberType.prototype._max = function (n) {

    Utils.assert((!isNaN(n) && ((n | 0) === parseFloat(n))), 'In Types.Number.max(n), the n must be an integer.');

    return function (value, obj, key, errors, keyPath) {

        var result = (value <= n);
        if (!result) {
            errors.add('the value of ' + key + ' must be less than (or equal to) ' + n, keyPath);
        }
        return result;
    };
};


internals.NumberType.prototype.max = function (n) {

    this.add('max', this._max(n), arguments);
    return this;
};


internals.NumberType.prototype._integer = function () {

    return function (value, obj, key, errors, keyPath) {

        var result = (!isNaN(value) && ((value | 0) === parseFloat(value)));
        if (!result) {
            errors.add('the value of ' + key + ' must be an integer', keyPath);
        }

        return result;
    };
};


internals.NumberType.prototype.integer = function () {

    this.add('integer', this._integer(), arguments);
    return this;
};


internals.NumberType.prototype._float = function () {

    var isInt = this._integer();
    return function (value, obj, key, errors, keyPath) {

        var result = (!isInt(value, obj, key, errors, keyPath));
        if (!result) {
            errors.add('the value of ' + key + ' must be a float or double', keyPath);
        }

        return result;
    };
};


internals.NumberType.prototype.float = function () {

    this.add('float', this._float(), arguments);
    return this;
};

