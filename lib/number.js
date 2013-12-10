// Load modules

var Any = require('./any');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Number = function () {

    Any.call(this);
    this._type = 'number';

    this._test(function (value, state, options) {

        if ((typeof value === 'number' || typeof value === 'string') && !isNaN(+value)) {
            return null;
        }

        return Any.error('number.base', { value: value }, state);
    });
};

Utils.inherits(internals.Number, Any);


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

        return Any.error('number.min', { value: limit }, state);
    });

    return this;
};


internals.Number.prototype.max = function (limit) {

    Utils.assert((!isNaN(limit) && ((limit | 0) === parseFloat(limit))), 'limit must be an integer');

    this._test('max', limit, function (value, state, options) {

        if (value <= limit) {
            return null;
        }

        return Any.error('number.max', { value: limit }, state);
    });

    return this;
};


internals.Number.prototype.integer = function () {

    this._test('integer', function (value, state, options) {

        if (!isNaN(value) && ((value | 0) === parseFloat(value))) {
            return null;
        }

        return Any.error('number.int', { value: value }, state);
    });

    return this;
};


internals.Number.prototype.negative = function () {

    this._test('negative', function (value, state, options) {

        if (value < 0) {
            return null;
        }

        return Any.error('number.negative', { value: value }, state);
    });

    return this;
};


internals.Number.prototype.positive = function () {

    this._test('positive', function (value, state, options) {

        if (value > 0) {
            return null;
        }

        return Any.error('number.positive', { value: value }, state);
    });

    return this;
};
