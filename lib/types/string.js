// Load modules

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

Utils.inherits(internals.StringType, BaseType);


internals.StringType.prototype.__name = 'String';
internals.StringType.prototype.__defaultValids = [undefined];
internals.StringType.prototype.__defaultInvalids = [null, ''];


internals.StringType.prototype._base = function () {

    return function (value, obj, key, errors, keyPath) {

        var result = typeof value === 'string' || value === null || typeof value === 'undefined';

        if (!result) {
            errors.addLocalized('string.base', key, null, keyPath);
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
            errors.addLocalized('string.min', key, {
                value: n
            }, keyPath);
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

    return function (value, obj, key, errors, keyPath) {

        var result = value !== null && (value.length <= n);
        if (!result) {
            errors.addLocalized('string.max', key, {
                value: n
            }, keyPath);
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

        if (typeof(value) === 'undefined') {
          return null;
        }
        var result = (value.match(n) !== null);
        if (!result) {
            errors.addLocalized('string.regex', key, {
                value: n.toString()
            }, keyPath);
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
        errors.addLocalized = errors.addLocalized || function () { };
        value = (isNaN(Number(value)) === false) ? +value : value;
        var converted = new Date(value);

        var result = (!isNaN(converted.getTime()));
        if (!result) {
            errors.addLocalized('string.date', key, null, keyPath);
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
            errors.addLocalized('string.email', key, null, keyPath);
        }
        return result;
    };
};


internals.StringType.prototype.email = function () {

    this.add('email', this._email(Email._regex), arguments);
    return this;
};
