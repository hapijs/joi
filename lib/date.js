// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Hoek = require('hoek');


// Declare internals

var internals = {};


module.exports = internals.Date = function () {

    Any.call(this);
    this._type = 'date';

    this._base(function (value, state, options) {

        if (value instanceof Date) {
            return null;
        }

        return Errors.create('date.base', { value: value }, state, options);
    });
};

Hoek.inherits(internals.Date, Any);


internals.Date.create = function () {

    return new internals.Date();
};


internals.toDate = function (value) {

    var number = Number(value);
    if (!isNaN(number)) {
        value = number;
    }

    var date = new Date(value);
    if (!isNaN(date.getTime())) {
        return date;
    }

    return null;
};


internals.Date.prototype._convert = function (value) {

    return (internals.toDate(value) || value);
};


internals.Date.prototype.min = function (date) {

    date = internals.toDate(date);
    Hoek.assert(date, 'Invalid date format');

    return this._test('min', date, function (value, state, options) {

        if (value.getTime() >= date.getTime()) {
            return null;
        }

        return Errors.create('date.min', { value: date }, state, options);
    });
};


internals.Date.prototype.max = function (date) {

    date = internals.toDate(date);
    Hoek.assert(date, 'Invalid date format');

    return this._test('max', date, function (value, state, options) {

        if (value.getTime() <= date.getTime()) {
            return null;
        }

        return Errors.create('date.max', { value: date }, state, options);
    });
};
