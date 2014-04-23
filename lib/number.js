// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Hoek = require('hoek');


// Declare internals

var internals = {};


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

    result.errors = (typeof result.value === 'number' && !isNaN(result.value)) ? null : Errors.create('number.base', null, state, options);
    return result;
};


internals.Number.prototype.min = function (limit) {

    Hoek.assert(Hoek.isInteger(limit), 'limit must be an integer');

    return this._test('min', limit, function (value, state, options) {

        if (value >= limit) {
            return null;
        }

        return Errors.create('number.min', { limit: limit }, state, options);
    });
};


internals.Number.prototype.max = function (limit) {

    Hoek.assert(Hoek.isInteger(limit), 'limit must be an integer');

    return this._test('max', limit, function (value, state, options) {

        if (value <= limit) {
            return null;
        }

        return Errors.create('number.max', { limit: limit }, state, options);
    });
};


internals.Number.prototype.integer = function () {

    return this._test('integer', undefined, function (value, state, options) {

        return Hoek.isInteger(value) ? null : Errors.create('number.integer', null, state, options);
    });
};


internals.Number.prototype.negative = function () {

    return this._test('negative', undefined, function (value, state, options) {

        if (value < 0) {
            return null;
        }

        return Errors.create('number.negative', null, state, options);
    });
};


internals.Number.prototype.positive = function () {

    return this._test('positive', undefined, function (value, state, options) {

        if (value > 0) {
            return null;
        }

        return Errors.create('number.positive', null, state, options);
    });
};


module.exports = new internals.Number();
