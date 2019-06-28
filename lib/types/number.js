'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');
const Values = require('../values');


const internals = {
    numberRx: /^\s*[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e([+-]?\d+))?\s*$/i,
    precisionRx: /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/
};


internals.Number = class extends Any {

    constructor() {

        super('number');

        this._flags.unsafe = false;
        this._invalids = new Values([Infinity, -Infinity]);
    }

    _coerce(value, state, prefs) {

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

    _base(value, state, prefs) {

        if (!internals.isNumber(value)) {
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
    }

    // Rules

    greater(limit) {

        return this._compare('greater', limit, '>');
    }

    integer() {

        return this._rule('integer');
    }

    less(limit) {

        return this._compare('less', limit, '<');
    }

    max(limit) {

        return this._compare('max', limit, '<=');
    }

    min(limit) {

        return this._compare('min', limit, '>=');
    }

    multiple(base) {

        const refs = {
            base: {
                assert: (value) => typeof value === 'number' && isFinite(value) && value > 0,
                code: 'number.ref',
                message: 'multiple must be a number greater than 0'
            }
        };

        return this._rule('multiple', { args: { base }, refs, multi: true });
    }

    negative() {

        return this._rule('sign', { args: { sign: 'negative' } });
    }

    port() {

        return this._rule('port');
    }

    positive() {

        return this._rule('sign', { args: { sign: 'positive' } });
    }

    precision(limit) {

        Hoek.assert(Number.isSafeInteger(limit), 'limit must be an integer');

        return this._rule('precision', { args: { limit }, convert: true });
    }

    unsafe(enabled = true) {

        Hoek.assert(typeof enabled === 'boolean', 'enabled must be a boolean');

        return this._flag('unsafe', enabled);
    }

    // Internals

    _compare(name, limit, operator) {

        const refs = {
            limit: {
                assert: internals.isNumber,
                code: 'number.ref',
                message: 'limit must be a number or reference'
            }
        };

        return this._rule(name, { rule: 'compare', refs, args: { limit }, operator });
    }
};


internals.Number.prototype._coerce.type = 'string';


// Aliases

Common.alias(internals.Number, [

]);


// Casts

Common.extend(internals.Number, 'casts', {

    [Common.symbols.castFrom]: (value) => typeof value === 'number',

    string: function (value, options) {

        return value.toString();
    }
});


// Rules

Common.extend(internals.Number, 'rules', {

    compare: function (value, helpers, { limit }, { alias, operator, args }) {

        if (Common.compare(value, limit, operator)) {
            return value;
        }

        return helpers.error('number.' + alias, { limit: args.limit, value });
    },

    integer: function (value, helpers) {

        if (Math.trunc(value) - value === 0) {
            return value;
        }

        return helpers.error('number.integer');
    },

    multiple: function (value, helpers, { base }, options) {

        if (value % base === 0) {
            return value;
        }

        return helpers.error('number.multiple', { multiple: options.args.base, value });
    },

    port: function (value, helpers) {

        if (Number.isSafeInteger(value) &&
            value >= 0 &&
            value <= 65535) {

            return value;
        }

        return helpers.error('number.port');
    },

    precision: function (value, helpers, { limit }) {

        const places = value.toString().match(internals.precisionRx);
        const decimals = Math.max((places[1] ? places[1].length : 0) - (places[2] ? parseInt(places[2], 10) : 0), 0);
        if (decimals <= limit) {
            return value;
        }

        return helpers.error('number.precision', { limit, value });
    },

    sign: function (value, helpers, { sign }) {

        if (sign === 'negative' && value < 0 ||
            sign === 'positive' && value > 0) {

            return value;
        }

        return helpers.error(`number.${sign}`);
    }
});


// Helpers

internals.isNumber = function (value) {

    return !isNaN(value) && typeof value === 'number';
};


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
