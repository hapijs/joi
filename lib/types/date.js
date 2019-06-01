'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Utils = require('../utils');


const internals = {
    isoDate: /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/,
    invalidDate: new Date('')
};


internals.Date = class extends Any {

    constructor() {

        super();

        this._type = 'date';
    }

    _coerce(value, state, options) {

        return {
            value: internals.Date.toDate(value, this._flags.format, this._flags.timestamp, this._flags.multiplier) || value
        };
    }

    _base(value, state, options) {

        const result = { value };

        if (result.value instanceof Date &&
            !isNaN(result.value.getTime())) {

            return { value };
        }

        if (!options.convert) {
            return { value, errors: this.createError('date.strict', { value }, state, options) };
        }

        const type = internals.isIsoDate(this._flags.format) ? 'isoDate'
            : (this._flags.timestamp ? `timestamp.${this._flags.timestamp}` : 'base');

        return {
            value,
            errors: this.createError(`date.${type}`, { value }, state, options)
        };
    }

    static toDate(value, format, timestamp, multiplier) {

        if (value instanceof Date) {
            return value;
        }

        if (typeof value === 'string' ||
            (typeof value === 'number' && !isNaN(value) && isFinite(value))) {

            const isIsoDate = format && internals.isIsoDate(format);
            if (!isIsoDate &&
                typeof value === 'string' &&
                /^[+-]?\d+(\.\d+)?$/.test(value)) {

                value = parseFloat(value);
            }

            let date;
            if (isIsoDate) {
                date = format.test(value) ? new Date(value.toString()) : internals.invalidDate;
            }
            else if (timestamp) {
                date = /^\s*$/.test(value) ? internals.invalidDate : new Date(value * multiplier);
            }
            else {
                date = new Date(value);
            }

            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        return null;
    }

    iso() {

        if (this._flags.format === internals.isoDate) {
            return this;
        }

        const obj = this.clone();
        obj._flags.format = internals.isoDate;
        return obj;
    }

    less(date) {

        return this._compare('less', date, '<');
    }

    max(date) {

        return this._compare('max', date, '<=');
    }

    min(date) {

        return this._compare('min', date, '>=');
    }

    greater(date) {

        return this._compare('greater', date, '>');
    }

    timestamp(type = 'javascript') {

        const allowed = ['javascript', 'unix'];
        Hoek.assert(allowed.includes(type), '"type" must be one of "' + allowed.join('", "') + '"');

        if (this._flags.timestamp === type) {
            return this;
        }

        const obj = this.clone();
        obj._flags.timestamp = type;
        obj._flags.multiplier = type === 'unix' ? 1000 : 1;
        return obj;
    }

    _compare(name, date, operator) {

        const refs = {
            date: {
                normalize: (d) => {

                    return d === 'now' ? d : internals.Date.toDate(d);
                },
                assert: (d) => d !== null,
                code: 'date.ref',
                message: 'Invalid date format'
            }
        };

        return this._rule(name, { rule: 'compare', refs, args: { date }, operator });
    }

    _isIsoDate(value) {

        return internals.isoDate.test(value);
    }
};


internals.Date.prototype._rules = {

    compare: function (value, helpers, { date }, { alias, operator, args }) {

        const to = date === 'now' ? Date.now() : date.getTime();
        if (Utils.compare(value.getTime(), to, operator)) {
            return value;
        }

        return helpers.error('date.' + alias, { limit: args.date, value });
    }
};


internals.isoString = internals.isoDate.toString();


internals.isIsoDate = function (date) {

    return date && date.toString() === internals.isoString;
};


module.exports = new internals.Date();
