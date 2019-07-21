'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');
const Template = require('../template');


const internals = {
    isoDate: /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/
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
            value: internals.parse(value, this._flags.format) || value
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

        const format = this._flags.format;
        const code = !format ? 'date.base' : (format === 'iso' ? 'date.isoDate' : `date.timestamp.${format}`);
        return { value, errors: this.createError(code, value, null, state, prefs) };
    }

    // Rules

    format(format) {

        Hoek.assert(['iso', 'javascript', 'unix'].includes(format), 'Unknown date format', format);

        return this._flag('format', format);
    }

    greater(date) {

        return this._compare('greater', date, '>');
    }

    iso() {

        return this.format('iso');
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

        return this.format(type);
    }

    // Internals

    _compare(name, date, operator) {

        const refs = {
            date: {
                normalize: (d) => {

                    return d === 'now' ? d : internals.parse(d);
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

internals.parse = function (value, format) {

    if (value instanceof Date) {
        return value;
    }

    if (typeof value !== 'string' &&
        (typeof value !== 'number' || isNaN(value) || !isFinite(value))) {

        return null;
    }

    // ISO

    if (format === 'iso') {
        if (!internals.isoDate.test(value)) {
            return null;
        }

        return internals.date(value.toString());
    }

    // Normalize number string

    if (typeof value === 'string' &&
        /^[+-]?\d+(\.\d+)?$/.test(value)) {

        value = parseFloat(value);
    }

    // Timestamp

    if (format) {
        if (/^\s*$/.test(value)) {
            return null;
        }

        return internals.date(value * (format === 'unix' ? 1000 : 1));
    }

    // Plain

    return internals.date(value);
};


internals.date = function (value) {

    const date = new Date(value);
    if (!isNaN(date.getTime())) {
        return date;
    }

    return null;
};


module.exports = new internals.Date();
