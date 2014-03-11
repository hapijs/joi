// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Number = function () {

    Any.call(this);
    this._type = 'number';

    this._base(function (value, state, options) {

        if ((typeof value === 'number' || typeof value === 'string') && !isNaN(+value)) {
            return null;
        }

        return Errors.create('number.base', { value: value }, state, options);
    });
};

Utils.inherits(internals.Number, Any);


internals.Number.create = function () {

    return new internals.Number();
};


internals.Number.prototype._convert = function (value) {
    if (typeof value === 'string') {
        var number = parseFloat(value);
        if (isNaN(number) || !isFinite(value)) {
            return NaN;
        }

        return number;
    }

    return value;
};


internals.Number.prototype.min = function (limit) {

    Utils.assert((!isNaN(limit) && ((limit | 0) === parseFloat(limit))), 'limit must be an integer');

    this._test('min', limit, function (value, state, options) {

        if (isNaN(value) || value >= limit) {
            return null;
        }

        return Errors.create('number.min', { value: limit }, state, options);
    });

    return this;
};


internals.Number.prototype.max = function (limit) {

    Utils.assert((!isNaN(limit) && ((limit | 0) === parseFloat(limit))), 'limit must be an integer');

    this._test('max', limit, function (value, state, options) {

        if (value <= limit) {
            return null;
        }

        return Errors.create('number.max', { value: limit }, state, options);
    });

    return this;
};


internals.Number.prototype.integer = function () {

    this._test('integer', undefined, function (value, state, options) {

        if (!isNaN(value) && ((value | 0) === parseFloat(value))) {
            return null;
        }

        return Errors.create('number.int', { value: value }, state, options);
    });

    return this;
};


internals.Number.prototype.negative = function () {

    this._test('negative', undefined, function (value, state, options) {

        if (value < 0) {
            return null;
        }

        return Errors.create('number.negative', { value: value }, state, options);
    });

    return this;
};


internals.Number.prototype.positive = function () {

    this._test('positive', undefined, function (value, state, options) {

        if (value > 0) {
            return null;
        }

        return Errors.create('number.positive', { value: value }, state, options);
    });

    return this;
};
