// Load modules

var Base = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.String();
};


internals.String = function () {

    Base.call(this);
    this._name = 'String';
    this._invalids.add('');

    this._test('base', function (value, obj, key, errors, keyPath) {

        var result = typeof value === 'string' || value === null || typeof value === 'undefined';
        if (!result) {
            errors.addLocalized('string.base', key, null, keyPath);
        }

        return result;
    });
};

Utils.inherits(internals.String, Base);


internals.String.prototype.emptyOk = function () {

    this.allow('');
    this._modifiers.add('emptyOk');
    return this;
};


internals.min = function (n) {

    Utils.assert((!isNaN(n) && ((n | 0) === parseFloat(n))), 'In Types.String.min(n), the n must be an integer');
    Utils.assert(n >= 0, 'In Types.String.min(n), the n must be a non-negative integer');

    return function (value, obj, key, errors, keyPath) {

        var result = value !== null && typeof value !== 'undefined' && (value.length >= n);
        if (!result) {
            errors.addLocalized('string.min', key, { value: n }, keyPath);
        }

        return result;
    };
};


internals.String.prototype.min = function (n) {

    this._valids.remove(undefined);
    this._test('min', internals.min(n));
    return this;
};


internals.max = function (n) {

    Utils.assert((!isNaN(n) && ((n | 0) == parseFloat(n))), 'In Types.String.max(n), the n must be an integer');
    Utils.assert(n >= 0, 'In Types.String.max(n), the n must be a non-negative integer');

    return function (value, obj, key, errors, keyPath) {

        var result = value !== null && (value.length <= n);
        if (!result) {
            errors.addLocalized('string.max', key, { value: n }, keyPath);
        }

        return result;
    };
};


internals.String.prototype.max = function (n) {

    this._test('max', internals.max(n));
    return this;
};


internals.regex = function (n) {

    Utils.assert(n instanceof RegExp, 'In Types.String.regex(n), the n must be a RegExp');

    return function (value, obj, key, errors, keyPath) {

        if (typeof (value) === 'undefined') {
            return null;
        }
        var result = (value.match(n) !== null);
        if (!result) {
            errors.addLocalized('string.regex', key, { value: n.toString() }, keyPath);
        }
        return result;
    };
};


internals.String.prototype.regex = function (pattern) {

    this._test('regex', internals.regex(pattern));
    return this;
};


internals.date = function () {

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


internals.String.prototype.date = function () {

    this._test('date', internals.date.apply(arguments));
    return this;
};


internals.String.prototype.alphanum = function (spacesEnabled) {

    spacesEnabled = (spacesEnabled === null) ? true : spacesEnabled;
    var pattern = (spacesEnabled ? /^[\w\s]+$/ : /^[a-zA-Z0-9]+$/);
    this.regex(pattern);
    return this;
};


internals.email = function () {

    var regex = /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/;

    return function (value, obj, key, errors, keyPath) {

        var result = (value.match(regex) !== null);
        if (!result) {
            errors.addLocalized('string.email', key, null, keyPath);
        }

        return result;
    };
};


internals.String.prototype.email = function () {

    this._test('email', internals.email());
    return this;
};
