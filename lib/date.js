// Load modules

var Base = require('./base');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.Date();
};


internals.Date = function () {

    Base.call(this);
    this._name = 'Date';

    this._test(function (value, state, options) {

        if (value instanceof Date) {
            return null;
        }

        return Base.error('date.base', { value: value }, state);
    });
};

Utils.inherits(internals.Date, Base);


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

    this._test(function (value, state, options) {

        if (value.getTime() >= date.getTime()) {
            return null;
        }

        return Base.error('date.min', { value: n }, state);
    });

    return this;
};


internals.Date.prototype.max = function (date) {

    date = internals.toDate(date);
    Utils.assert(date, 'Invalid date format');

    this._test(function (value, state, options) {

        if (value.getTime() <= date.getTime()) {
            return null;
        }

        return Base.error('date.max', { value: n }, state);
    });

    return this;
};
