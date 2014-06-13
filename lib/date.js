// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Hoek = require('hoek');


// Declare internals

var internals = {};


internals.Date = function () {

    Any.call(this);
    this._type = 'date';
};

Hoek.inherits(internals.Date, Any);


internals.Date.prototype._base = function (value, state, options) {

    var result = {
        value: (options.convert && internals.toDate(value)) || value
    };

    result.errors = (result.value instanceof Date && !isNaN(result.value.getTime())) ? null : Errors.create('date.base', null, state, options);
    return result;
};


internals.toDate = function (value) {

    if (value instanceof Date) {
        return value;
    }

    if (typeof value === 'string' ||
        Hoek.isInteger(value)) {

        if (typeof value === 'string' &&
            /^\d+$/.test(value)) {

            value = parseInt(value, 10);
        }

        var date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    return null;
};


internals.Date.prototype.min = function (date) {

    date = internals.toDate(date);
    Hoek.assert(date, 'Invalid date format');

    return this._test('min', date, function (value, state, options) {

        if (value.getTime() >= date.getTime()) {
            return null;
        }

        return Errors.create('date.min', { limit: date }, state, options);
    });
};


internals.Date.prototype.max = function (date) {

    date = internals.toDate(date);
    Hoek.assert(date, 'Invalid date format');

    return this._test('max', date, function (value, state, options) {

        if (value.getTime() <= date.getTime()) {
            return null;
        }

        return Errors.create('date.max', { limit: date }, state, options);
    });
};


module.exports = new internals.Date();
