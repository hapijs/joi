// Load modules

var Base = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.Number();
};


internals.Number = function () {

    Base.call(this);
    this._name = 'Number';

    this._test('base', function (value, obj, key, errors, keyPath) {

        if ((typeof value !== 'number' && typeof value !== 'string') || isNaN(+value)) {
            errors.addLocalized('number.base', key, { value: value }, keyPath);
            return false;
        }

        return true;
    });
};

Utils.inherits(internals.Number, Base);


internals.Number.prototype._convert = function (value) {

    if (typeof value === 'string') {
        return Number(value);
    }

    return value;
};


internals.min = function (n) {

    Utils.assert((!isNaN(n) && ((n | 0) === parseFloat(n))), 'In Types.Number.min(n), the n must be an integer.');

    return function (value, obj, key, errors, keyPath) {

        var result = (isNaN(value) || value >= n);
        if (!result) {
            errors.addLocalized('number.min', key, { value: n }, keyPath);
        }

        return result;
    };
};


internals.Number.prototype.min = function (n) {

    this._test('min', internals.min(n));
    return this;
};


internals.max = function (n) {

    Utils.assert((!isNaN(n) && ((n | 0) === parseFloat(n))), 'In Types.Number.max(n), the n must be an integer.');

    return function (value, obj, key, errors, keyPath) {

        var result = (value <= n);
        if (!result) {
            errors.addLocalized('number.max', key, { value: n }, keyPath);
        }

        return result;
    };
};


internals.Number.prototype.max = function (n) {

    this._test('max', internals.max(n));
    return this;
};


internals.integer = function () {

    return function (value, obj, key, errors, keyPath) {

        var result = (!isNaN(value) && ((value | 0) === parseFloat(value)));
        if (!result) {
            errors.addLocalized('number.int', key, { value: value }, keyPath);
        }

        return result;
    };
};


internals.Number.prototype.integer = function () {

    this._test('integer', internals.integer());
    return this;
};
