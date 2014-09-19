// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Hoek = require('hoek');
var Moment = require('moment');


// Declare internals

var internals = {};

internals.invalidDate = new Date('');

internals.Date = function () {

    Any.call(this);
    this._type = 'date';
};

Hoek.inherits(internals.Date, Any);


internals.Date.prototype._base = function (value, state, options) {

    var result = {
        value: (options.convert && internals.toDate(value, this._flags.format)) || value
    };

    if (result.value instanceof Date && !isNaN(result.value.getTime())) {
        result.errors = null;
    }
    else {
        result.errors = Errors.create(this._flags.format === Moment.ISO_8601 ? 'date.isoDate' : 'date.base', null, state, options);
    }

    return result;
};


internals.toDate = function (value, format) {

    if (value instanceof Date) {
        return value;
    }

    if (typeof value === 'string' ||
        Hoek.isInteger(value)) {

        if (typeof value === 'string' &&
            /^\d+$/.test(value)) {

            value = parseInt(value, 10);
        }

        var date;
        if (format) {
            date = Moment(value, format, format !== Moment.ISO_8601);
            date = date.isValid() ? date.toDate() : internals.invalidDate;
        }
        else {
            date = new Date(value);
        }

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

internals.Date.prototype.format = function (format) {

    Hoek.assert(typeof format === 'string' || (Array.isArray(format) && format.every(function (f) {

        return typeof f === 'string';
    })), 'Invalid format.');

    var obj = this.clone();
    obj._flags.format = format;
    return obj;
};

internals.Date.prototype.iso = function () {

    var obj = this.clone();
    obj._flags.format = Moment.ISO_8601;
    return obj;
}

module.exports = new internals.Date();
