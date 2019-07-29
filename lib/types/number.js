'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');
const Values = require('../values');


const internals = {
    numberRx: /^\s*[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e([+-]?\d+))?\s*$/i,
    precisionRx: /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/
};


internals.Number = Any.extend({

    type: 'number',

    // Initialize

    initialize: function () {

        this._flags.unsafe = false;
        this._invalids = new Values([Infinity, -Infinity]);
    },

    // Coerce

    coerce: {
        from: 'string',
        method: function (value, state, prefs) {

            const matches = value.match(internals.numberRx);
            if (!matches) {
                return;
            }

            value = value.trim();
            const result = { value: parseFloat(value) };

            if (!this._flags.unsafe) {
                if (value.includes('e')) {
                    const constructed = internals.normalizeExponent(`${result.value / Math.pow(10, matches[1])}e${matches[1]}`);
                    if (constructed !== internals.normalizeExponent(value)) {
                        result.errors = this.createError('number.unsafe', value, null, state, prefs);
                        return result;
                    }
                }
                else {
                    const string = result.value.toString();
                    if (string.includes('e')) {
                        return result;
                    }

                    if (string !== internals.normalizeDecimal(value)) {
                        result.errors = this.createError('number.unsafe', value, null, state, prefs);
                        return result;
                    }
                }
            }

            return result;
        }
    },

    // Base validation

    validate: function (value, state, prefs) {

        if (!Common.isNumber(value)) {
            return { value, errors: this.createError('number.base', value, null, state, prefs) };
        }

        const result = { value };

        if (prefs.convert) {
            const rule = this._uniqueRules.get('precision');
            if (rule) {
                const precision = Math.pow(10, rule.args.limit);                    // This is conceptually equivalent to using toFixed but it should be much faster
                result.value = Math.round(result.value * precision) / precision;
            }
        }

        if (!this._flags.unsafe &&
            (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER)) {

            result.errors = this.createError('number.unsafe', value, null, state, prefs);
        }

        return result;
    },

    // Rules

    rules: {

        compare: {
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

                return this._rule({ name: 'greater', method: 'compare', args: { limit }, operator: '>' });
            }
        },

        integer: {
            method: function () {

                return this._rule('integer');
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

                return this._rule({ name: 'less', method: 'compare', args: { limit }, operator: '<' });
            }
        },

        max: {
            method: function (limit) {

                return this._rule({ name: 'max', method: 'compare', args: { limit }, operator: '<=' });
            }
        },

        min: {
            method: function (limit) {

                return this._rule({ name: 'min', method: 'compare', args: { limit }, operator: '>=' });
            }
        },

        multiple: {
            method: function (base) {

                return this._rule({ name: 'multiple', args: { base } });
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

                return this._rule('port');
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

                return this._rule({ name: 'precision', args: { limit } });
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

                return this._rule({ name: 'sign', args: { sign } });
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

                return this._flag('unsafe', enabled);
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


module.exports = new internals.Number();
