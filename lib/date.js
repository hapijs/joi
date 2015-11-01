'use strict';

// Load modules

const Any = require('./any');
const Errors = require('./errors');
const Ref = require('./ref');
const Hoek = require('hoek');
const Moment = require('moment');


// Declare internals

const internals = {};

internals.isoDate = /^(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/;
internals.invalidDate = new Date('');
internals.isIsoDate = (() => {

    const isoString = internals.isoDate.toString();

    return (date) => {

        return date && (date.toString() === isoString);
    };
})();

internals.Date = function () {

    Any.call(this);
    this._type = 'date';
};

Hoek.inherits(internals.Date, Any);


internals.Date.prototype._base = function (value, state, options) {

    const result = {
        value: (options.convert && internals.toDate(value, this._flags.format)) || value
    };

    if (result.value instanceof Date && !isNaN(result.value.getTime())) {
        result.errors = null;
    }
    else {
        result.errors = Errors.create(internals.isIsoDate(this._flags.format) ? 'date.isoDate' : 'date.base', null, state, options);
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
            /^[+-]?\d+$/.test(value)) {

            value = parseInt(value, 10);
        }

        let date;
        if (format) {
            if (internals.isIsoDate(format)) {
                date = format.test(value) ? new Date(value) : internals.invalidDate;
            }
            else {
                date = Moment(value, format, true);
                date = date.isValid() ? date.toDate() : internals.invalidDate;
            }
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


internals.compare = function (type, compare) {

    return function (date) {

        const isNow = date === 'now';
        const isRef = Ref.isRef(date);

        if (!isNow && !isRef) {
            date = internals.toDate(date);
        }

        Hoek.assert(date, 'Invalid date format');

        return this._test(type, date, (value, state, options) => {

            let compareTo;
            if (isNow) {
                compareTo = Date.now();
            }
            else if (isRef) {
                compareTo = internals.toDate(date(state.parent, options));

                if (!compareTo) {
                    return Errors.create('date.ref', { ref: date.key }, state, options);
                }

                compareTo = compareTo.getTime();
            }
            else {
                compareTo = date.getTime();
            }

            if (compare(value.getTime(), compareTo)) {
                return null;
            }

            return Errors.create('date.' + type, { limit: new Date(compareTo) }, state, options);
        });
    };
};


internals.Date.prototype.min = internals.compare('min', (value, date) => value >= date);
internals.Date.prototype.max = internals.compare('max', (value, date) => value <= date);


internals.Date.prototype.format = function (format) {

    Hoek.assert(typeof format === 'string' || (Array.isArray(format) && format.every((f) => typeof f === 'string')), 'Invalid format.');

    const obj = this.clone();
    obj._flags.format = format;
    return obj;
};

internals.Date.prototype.iso = function () {

    const obj = this.clone();
    obj._flags.format = internals.isoDate;
    return obj;
};

internals.Date.prototype._isIsoDate = function (value) {

    return internals.isoDate.test(value);
};

module.exports = new internals.Date();
