// Load modules

var Any = require('./any');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Date = function () {

    Any.call(this);
    this._type = 'date';

    this._test(function (value, state, options) {

        if (value instanceof Date) {
            return null;
        }

        return Any.error('date.base', { value: value }, state);
    });
};

Utils.inherits(internals.Date, Any);


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
    Utils.assert(date, 'Invalid date format');

    this._test('min', date, function (value, state, options) {

        if (value.getTime() >= date.getTime()) {
            return null;
        }

        return Any.error('date.min', { value: date }, state);
    });

    return this;
};


internals.Date.prototype.max = function (date) {

    date = internals.toDate(date);
    Utils.assert(date, 'Invalid date format');

    this._test('max', date, function (value, state, options) {

        if (value.getTime() <= date.getTime()) {
            return null;
        }

        return Any.error('date.max', { value: date }, state);
    });

    return this;
};
