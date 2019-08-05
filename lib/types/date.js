'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');
const Template = require('../template');


const internals = {};


module.exports = Any.extend({

    type: 'date',

    // Coerce

    coerce: {
        from: ['number', 'string'],
        method: function (schema, value, helpers) {

            return { value: internals.parse(value, schema._flags.format) || value };
        }
    },

    // Base validation

    validate: function (schema, value, { error, prefs }) {

        if (value instanceof Date &&
            !isNaN(value.getTime())) {

            return;
        }

        if (!prefs.convert) {
            return { value, errors: error('date.strict') };
        }

        const format = schema._flags.format;
        const code = !format ? 'date.base' : (format === 'iso' ? 'date.isoDate' : `date.timestamp.${format}`);
        return { value, errors: error(code) };
    },

    // Rules

    rules: {

        compare: {
            method: false,
            validate: function (value, helpers, { date }, { name, operator, args }) {

                const to = date === 'now' ? Date.now() : date.getTime();
                if (Common.compare(value.getTime(), to, operator)) {
                    return value;
                }

                return helpers.error('date.' + name, { limit: args.date, value });
            },
            args: [
                {
                    name: 'date',
                    ref: true,
                    normalize: (date) => {

                        return date === 'now' ? date : internals.parse(date);
                    },
                    assert: (date) => date !== null,
                    message: 'must have a valid date format'
                }
            ]
        },

        format: {
            method: function (format) {

                Hoek.assert(['iso', 'javascript', 'unix'].includes(format), 'Unknown date format', format);

                return this.setFlag('format', format);
            }
        },

        greater: {
            method: function (date) {

                return this.addRule({ name: 'greater', method: 'compare', args: { date }, operator: '>' });
            }
        },

        iso: {
            method: function () {

                return this.format('iso');
            }
        },

        less: {
            method: function (date) {

                return this.addRule({ name: 'less', method: 'compare', args: { date }, operator: '<' });
            }
        },

        max: {
            method: function (date) {

                return this.addRule({ name: 'max', method: 'compare', args: { date }, operator: '<=' });
            }
        },

        min: {
            method: function (date) {

                return this.addRule({ name: 'min', method: 'compare', args: { date }, operator: '>=' });
            }
        },

        timestamp: {
            method: function (type = 'javascript') {

                Hoek.assert(['javascript', 'unix'].includes(type), '"type" must be one of "javascript, unix"');

                return this.format(type);
            }
        }
    },

    // Cast

    cast: {
        from: (value) => value instanceof Date,
        to: {
            number: function (value) {

                return value.getTime();
            },

            string: function (value, { prefs }) {

                return Template.date(value, prefs);
            }
        }
    },

    // Errors

    messages: {
        'date.base': '"{{#label}}" must be a number of milliseconds or valid date string',
        'date.greater': '"{{#label}}" must be greater than "{{#limit}}"',
        'date.isoDate': '"{{#label}}" must be a valid ISO 8601 date',
        'date.less': '"{{#label}}" must be less than "{{#limit}}"',
        'date.max': '"{{#label}}" must be less than or equal to "{{#limit}}"',
        'date.min': '"{{#label}}" must be larger than or equal to "{{#limit}}"',
        'date.strict': '"{{#label}}" must be a valid date',
        'date.timestamp.javascript': '"{{#label}}" must be a valid timestamp or number of milliseconds',
        'date.timestamp.unix': '"{{#label}}" must be a valid timestamp or number of seconds'
    }
});


// Helpers

internals.parse = function (value, format) {

    if (value instanceof Date) {
        return value;
    }

    if (typeof value !== 'string' &&
        (isNaN(value) || !isFinite(value))) {

        return null;
    }

    // ISO

    if (format === 'iso') {
        if (!Common.isIsoDate(value)) {
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
