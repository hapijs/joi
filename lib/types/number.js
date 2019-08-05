'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');


const internals = {
    numberRx: /^\s*[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e([+-]?\d+))?\s*$/i,
    precisionRx: /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/
};


module.exports = Any.extend({

    type: 'number',

    // Initialize

    initialize: function () {

        this._flags.unsafe = false;
    },

    // Coerce

    coerce: {
        from: 'string',
        method: function (schema, value, { error }) {

            const matches = value.match(internals.numberRx);
            if (!matches) {
                return;
            }

            value = value.trim();
            const result = { value: parseFloat(value) };

            if (!schema._flags.unsafe) {
                if (value.includes('e')) {
                    const constructed = internals.normalizeExponent(`${result.value / Math.pow(10, matches[1])}e${matches[1]}`);
                    if (constructed !== internals.normalizeExponent(value)) {
                        result.errors = error('number.unsafe');
                        return result;
                    }
                }
                else {
                    const string = result.value.toString();
                    if (string.includes('e')) {
                        return result;
                    }

                    if (string !== internals.normalizeDecimal(value)) {
                        result.errors = error('number.unsafe');
                        return result;
                    }
                }
            }

            return result;
        }
    },

    // Base validation

    validate: function (schema, value, { error, prefs }) {

        if (value === Infinity ||
            value === -Infinity) {

            return { value, errors: error('number.infinity') };
        }

        if (!Common.isNumber(value)) {
            return { value, errors: error('number.base') };
        }

        const result = { value };

        if (prefs.convert) {
            const rule = schema.getRule('precision');
            if (rule) {
                const precision = Math.pow(10, rule.args.limit);                    // This is conceptually equivalent to using toFixed but it should be much faster
                result.value = Math.round(result.value * precision) / precision;
            }
        }

        if (!schema._flags.unsafe &&
            (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER)) {

            result.errors = error('number.unsafe');
        }

        return result;
    },

    // Rules

    rules: {

        compare: {
            method: false,
            validate: function (value, helpers, { limit }, { name, operator, args }) {

                if (Common.compare(value, limit, operator)) {
                    return value;
                }

                return helpers.error('number.' + name, { limit: args.limit, value });
            },
            refs: {
                limit: {
                    assert: Common.isNumber,
                    code: 'number.ref',
                    message: 'limit must be a number or reference'
                }
            }
        },

        greater: {
            method: function (limit) {

                return this.addRule({ name: 'greater', method: 'compare', args: { limit }, operator: '>' });
            }
        },

        integer: {
            method: function () {

                return this.addRule('integer');
            },
            validate: function (value, helpers) {

                if (Math.trunc(value) - value === 0) {
                    return value;
                }

                return helpers.error('number.integer');
            }
        },

        less: {
            method: function (limit) {

                return this.addRule({ name: 'less', method: 'compare', args: { limit }, operator: '<' });
            }
        },

        max: {
            method: function (limit) {

                return this.addRule({ name: 'max', method: 'compare', args: { limit }, operator: '<=' });
            }
        },

        min: {
            method: function (limit) {

                return this.addRule({ name: 'min', method: 'compare', args: { limit }, operator: '>=' });
            }
        },

        multiple: {
            method: function (base) {

                return this.addRule({ name: 'multiple', args: { base } });
            },
            validate: function (value, helpers, { base }, options) {

                if (value % base === 0) {
                    return value;
                }

                return helpers.error('number.multiple', { multiple: options.args.base, value });
            },
            refs: {
                base: {
                    assert: (value) => typeof value === 'number' && isFinite(value) && value > 0,
                    code: 'number.ref',
                    message: 'multiple must be a number greater than 0'
                }
            },
            multi: true
        },

        negative: {
            method: function () {

                return this.sign('negative');
            }
        },

        port: {
            method: function () {

                return this.addRule('port');
            },
            validate: function (value, helpers) {

                if (Number.isSafeInteger(value) &&
                    value >= 0 &&
                    value <= 65535) {

                    return value;
                }

                return helpers.error('number.port');
            }
        },

        positive: {
            method: function () {

                return this.sign('positive');
            }
        },

        precision: {
            method: function (limit) {

                Hoek.assert(Number.isSafeInteger(limit), 'limit must be an integer');

                return this.addRule({ name: 'precision', args: { limit } });
            },
            validate: function (value, helpers, { limit }) {

                const places = value.toString().match(internals.precisionRx);
                const decimals = Math.max((places[1] ? places[1].length : 0) - (places[2] ? parseInt(places[2], 10) : 0), 0);
                if (decimals <= limit) {
                    return value;
                }

                return helpers.error('number.precision', { limit, value });
            },
            convert: true
        },

        sign: {
            method: function (sign) {

                Hoek.assert(['negative', 'positive'].includes(sign), 'Invalid sign', sign);

                return this.addRule({ name: 'sign', args: { sign } });
            },
            validate: function (value, helpers, { sign }) {

                if (sign === 'negative' && value < 0 ||
                    sign === 'positive' && value > 0) {

                    return value;
                }

                return helpers.error(`number.${sign}`);
            }
        },

        unsafe: {
            method: function (enabled = true) {

                Hoek.assert(typeof enabled === 'boolean', 'enabled must be a boolean');

                return this.setFlag('unsafe', enabled);
            }
        }
    },

    // Cast

    cast: {
        from: (value) => typeof value === 'number',
        to: {
            string: function (value, options) {

                return value.toString();
            }
        }
    },

    // Errors

    messages: {
        'number.base': '"{{#label}}" must be a number',
        'number.greater': '"{{#label}}" must be greater than {{#limit}}',
        'number.infinity': '"{{#label}}" cannot be infinity',
        'number.integer': '"{{#label}}" must be an integer',
        'number.less': '"{{#label}}" must be less than {{#limit}}',
        'number.max': '"{{#label}}" must be less than or equal to {{#limit}}',
        'number.min': '"{{#label}}" must be larger than or equal to {{#limit}}',
        'number.multiple': '"{{#label}}" must be a multiple of {{#multiple}}',
        'number.negative': '"{{#label}}" must be a negative number',
        'number.port': '"{{#label}}" must be a valid port',
        'number.positive': '"{{#label}}" must be a positive number',
        'number.precision': '"{{#label}}" must have no more than {{#limit}} decimal places',
        'number.ref': '"{{#label}}" references "{{#ref}}" which is not a number',
        'number.unsafe': '"{{#label}}" must be a safe number'
    }
});


// Helpers

internals.normalizeExponent = function (str) {

    return str
        .replace(/\.(\d*[1-9])?0+e/, '.$1e')
        .replace(/\.e/, 'e')
        .replace(/e\+/, 'e')
        .replace(/^\+/, '')
        .replace(/^(-?)0+([1-9])/, '$1$2');
};


internals.normalizeDecimal = function (str) {

    str = str
        .replace(/^\+/, '')
        .replace(/\.0+$/, '')
        .replace(/^(-?)\.([^\.]*)$/, '$10.$2')
        .replace(/^(-?)0+([1-9])/, '$1$2');

    if (str.includes('.') &&
        str.endsWith('0')) {

        str = str.replace(/0+$/, '');
    }

    return str;
};
