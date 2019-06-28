'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');
const Template = require('../template');


const internals = {
    isoDate: /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/,
    invalidDate: new Date('')
};


internals.Date = class extends Any {

    constructor() {

        super('date');
    }

    _coerce(value, state, prefs) {

        if (value instanceof Date) {
            return;
        }

        return {
            value: internals.Date.toDate(value, this._flags.format, this._flags.timestamp, this._flags.multiplier) || value
        };
    }

    _base(value, state, prefs) {

        if (value instanceof Date &&
            !isNaN(value.getTime())) {

            return;
        }

        if (!prefs.convert) {
            return { value, errors: this.createError('date.strict', value, null, state, prefs) };
        }

        const type = internals.isIsoDate(this._flags.format) ? 'isoDate'
            : (this._flags.timestamp ? `timestamp.${this._flags.timestamp}` : 'base');

        return { value, errors: this.createError(`date.${type}`, value, null, state, prefs) };
    }

    // Rules

    greater(date) {

        return this._compare('greater', date, '>');
    }

    iso() {

        return this._flag('format', internals.isoDate);
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

    timestamp(type = 'javascript') {

        Hoek.assert(['javascript', 'unix'].includes(type), '"type" must be one of "javascript, unix"');

        return this._flag([
            { flag: 'timestamp', value: type },
            { flag: 'multiplier', value: type === 'unix' ? 1000 : 1 }
        ]);
    }

    // Internals

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
};


// Aliases

Common.alias(internals.Date, [

]);


// Casts

Common.extend(internals.Date, 'casts', {

    [Common.symbols.castFrom]: (value) => value instanceof Date,

    number: function (value) {

        return value.getTime();
    },

    string: function (value, { prefs }) {

        return Template.date(value, prefs);
    }
});


// Rules

Common.extend(internals.Date, 'rules', {

    compare: function (value, helpers, { date }, { alias, operator, args }) {

        const to = date === 'now' ? Date.now() : date.getTime();
        if (Common.compare(value.getTime(), to, operator)) {
            return value;
        }

        return helpers.error('date.' + alias, { limit: args.date, value });
    }
});


// Helpers

internals.isoString = internals.isoDate.toString();


internals.isIsoDate = function (date) {

    return date && date.toString() === internals.isoString;
};


module.exports = new internals.Date();
