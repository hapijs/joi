// Load modules

var NodeUtil = require('util');
var BaseType = require('./base');
var Utils = require('../utils');
var Email = require('./email');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.StringType();
};


module.exports.StringType = internals.StringType = function () {

    internals.StringType.super_.call(this);
    Utils.mixin(this, BaseType);
    return this;
};

NodeUtil.inherits(internals.StringType, BaseType);


internals.StringType.prototype.__name = 'String';
internals.StringType.prototype.__defaultValids = [undefined];
internals.StringType.prototype.__defaultInvalids = [null, ''];


internals.StringType.prototype._base = function () {

    return function (value, obj, key, errors, keyPath) {

        var result = typeof value === 'string' || value === null || typeof value === 'undefined';

        if (!result) {
            errors.add('the value of ' + key + ' must be a string', keyPath);
        }

        return result;
    };
};


internals.StringType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};


internals.StringType.prototype.emptyOk = function () {

    this.allow('');
    this.__modifiers.add('emptyOk');
    return this;
};


internals.StringType.prototype._min = function (n) {

    Utils.assert((!isNaN(n) && ((n | 0) === parseFloat(n))), 'In Types.String.min(n), the n must be an integer.');
    Utils.assert(n >= 0, 'In Types.String.min(n), the n must be a non-negative integer.');
    this.__valids.remove(undefined);

    return function (value, obj, key, errors, keyPath) {

        var result = value !== null && typeof value !== 'undefined' && (value.length >= n);
        if (!result) {
            errors.add('the value of ' + key + ' must be at least ' + n + ' characters long', keyPath);
        }

        return result;
    };
};


internals.StringType.prototype.min = function (n) {

    this.add('min', this._min(n), arguments);
    return this;
};


internals.StringType.prototype._max = function (n) {

    Utils.assert((!isNaN(n) && ((n | 0) == parseFloat(n))), 'In Types.String.max(n), the n must be an integer');
    Utils.assert(n >= 0, 'In Types.String.max(n), the n must be a non-negative integer');
    this.__valids.remove(undefined);

    return function (value, obj, key, errors, keyPath) {

        var result = value !== null && typeof value !== 'undefined' && (value.length <= n);
        if (!result) {
            errors.add('the value of ' + key + ' must be less than (or equal to) ' + n + ' characters long', keyPath);
        }

        return result;
    };
};


internals.StringType.prototype.max = function (n) {

    this.add('max', this._max(n), arguments);
    return this;
};


internals.StringType.prototype._regex = function (n) {

    Utils.assert(n instanceof RegExp, 'In Types.String.regex(n), the n must be a RegExp');

    return function (value, obj, key, errors, keyPath) {

        var result = (value.match(n) !== null);
        if (!result) {
            errors.add('the value of ' + key + ' must match the RegExp ' + n.toString(), keyPath);
        }
        return result;
    };
};


internals.StringType.prototype.regex = function (pattern) {

    this.add('regex', this._regex(pattern), arguments);
    return this;
};


internals.StringType.prototype._date = function () {

    return function (value, obj, key, errors, keyPath) {

        errors = errors || {};
        errors.add = errors.add || function () { };
        value = (isNaN(Number(value)) === false) ? +value : value;
        var converted = new Date(value);

        var result = (!isNaN(converted.getTime()));
        if (!result) {
            errors.add('the value of ' + key + ' must be a valid JavaScript Date format', keyPath);
        }
        return result;
    };
};


internals.StringType.prototype.date = function () {

    this.add('date', this._date.apply(arguments), arguments);
    return this;
};


internals.StringType.prototype.alphanum = function (spacesEnabled) {

    spacesEnabled = (spacesEnabled === null) ? true : spacesEnabled;
    var pattern = null;
    if (spacesEnabled) {
        pattern = /^[\w\s]+$/;
    }
    else {
        pattern = /^[a-zA-Z0-9]+$/;
    }

    this.regex(pattern);
    return this;
};


internals.StringType.prototype._email = function (regex) {

    return function (value, obj, key, errors, keyPath) {

        var result = (value.match(regex) !== null);
        if (!result) {
            errors.add('The value of ' + key + ' must be a valid email', keyPath);
        }
        return result;
    };
};


internals.StringType.prototype.email = function () {

    this.add('email', this._email(Email._regex), arguments);
    return this;
};