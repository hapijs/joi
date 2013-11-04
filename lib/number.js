// Load modules

var Base = require('./base');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.Number();
};


internals.Number = function () {

    Base.call(this);
    this._name = 'Number';

    this._test(function (value, state, options) {

        if ((typeof value === 'number' || typeof value === 'string') && !isNaN(+value)) {
            return null;
        }

        return Base.error('number.base', { value: value }, state);
    });
};

Utils.inherits(internals.Number, Base);


internals.Number.prototype._convert = function (value) {

    if (typeof value === 'string' && value) {
        return Number(value);
    }

    return value;
};


internals.Number.prototype.min = function (n) {

    Utils.assert((!isNaN(n) && ((n | 0) === parseFloat(n))), 'In Types.Number.min(n), the n must be an integer.');

    this._test(function (value, state, options) {

        if (isNaN(value) || value >= n) {
            return null;
        }

        return Base.error('number.min', { value: n }, state);
    });

    return this;
};


internals.Number.prototype.max = function (n) {

    Utils.assert((!isNaN(n) && ((n | 0) === parseFloat(n))), 'In Types.Number.max(n), the n must be an integer.');

    this._test(function (value, state, options) {

        if (value <= n) {
            return null;
        }

        return Base.error('number.max', { value: n }, state);
    });

    return this;
};


internals.Number.prototype.integer = function () {

    this._test(function (value, state, options) {

        if (!isNaN(value) && ((value | 0) === parseFloat(value))) {
            return null;
        }

        return Base.error('number.int', { value: value }, state);
    });

    return this;
};
