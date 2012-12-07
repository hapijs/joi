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

    return function (value, qs, key, req) {

        if (typeof value !== 'number' && typeof value !== 'string') {
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

    return function (value, qs, key, req) {

        req = req || {};
        req.add = req.add || function () { };

        var result = (isNaN(value) || value >= n);
        if (result === false) {
            req.add('the value of `' + key + '` must be larger than (or equal to) ' + n);
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

    return function (value, qs, key, req) {

        req = req || {};
        req.add = req.add || function () { };

        var result = (value <= n);
        if (result === false) {
            req.add('the value of `' + key + '` must be less than (or equal to) ' + n);
        }
        return result;
    };
};


internals.NumberType.prototype.max = function (n) {

    this.add('max', this._max(n), arguments);
    return this;
};


internals.NumberType.prototype._integer = function () {

    return function (value, qs, key, req) {

        req = req || {};
        req.add = req.add || function () { };

        var result = (!isNaN(value) && ((value | 0) === parseFloat(value)));
        if (result === false) {
            req.add('the value of `' + key + '` must be an integer');
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
    return function (value, qs, key, req) {

        req = req || {};
        req.add = req.add || function () { };

        var result = (!isInt(value));
        if (result === false) {
            req.add('the value of `' + key + '` must be a float or double');
        }
        return result;
    };
};


internals.NumberType.prototype.float = function () {

    this.add('float', this._float(), arguments);
    return this;
};

