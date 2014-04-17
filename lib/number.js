// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Hoek = require('hoek');


// Declare internals

var internals = {};


exports.create = function () {

    return new internals.Number();
};


internals.Number = function () {

    Any.call(this);
    this._type = 'number';
};

Hoek.inherits(internals.Number, Any);


internals.Number.prototype._base = function (value, state, options) {

    var result = {
        errors: null,
        value: value
    };

    if (typeof value === 'string' &&
        options.convert) {

        var number = parseFloat(value);
        result.value = (isNaN(number) || !isFinite(value)) ? NaN : number;
    }

    result.errors = (typeof result.value === 'number' && !isNaN(result.value)) ? null : Errors.create('number.base', { value: result.value }, state, options);
    return result;
};


internals.Number.prototype.min = function (limit) {

    Hoek.assert((!isNaN(limit) && ((limit | 0) === parseFloat(limit))), 'limit must be an integer');

    return this._test('min', limit, function (value, state, options) {

        if (value >= limit) {
            return null;
        }

        return Errors.create('number.min', { value: limit }, state, options);
    });
};


internals.Number.prototype.max = function (limit) {

    Hoek.assert((!isNaN(limit) && ((limit | 0) === parseFloat(limit))), 'limit must be an integer');

    return this._test('max', limit, function (value, state, options) {

        if (value <= limit) {
            return null;
        }

        return Errors.create('number.max', { value: limit }, state, options);
    });
};


internals.Number.prototype.integer = function () {

    return this._test('integer', undefined, function (value, state, options) {

        if ((value | 0) === parseFloat(value)) {
            return null;
        }

        return Errors.create('number.int', { value: value }, state, options);
    });
};


internals.Number.prototype.negative = function () {

    return this._test('negative', undefined, function (value, state, options) {

        if (value < 0) {
            return null;
        }

        return Errors.create('number.negative', { value: value }, state, options);
    });
};


internals.Number.prototype.positive = function () {

    return this._test('positive', undefined, function (value, state, options) {

        if (value > 0) {
            return null;
        }

        return Errors.create('number.positive', { value: value }, state, options);
    });
};
