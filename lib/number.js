'use strict';

// Load modules

const Any = require('./any');
const Ref = require('./ref');
const Hoek = require('hoek');


// Declare internals

const internals = {
    precisionRx: /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/,
    precision: function (num) {

        const places = num.toString().match(this.precisionRx);
        return Math.max((places[1] ? places[1].length : 0) - (places[2] ? parseInt(places[2], 10) : 0), 0);
    }
};


internals.Number = class extends Any {

    constructor() {

        super();
        this._type = 'number';
        this._invalids.add(Infinity);
        this._invalids.add(-Infinity);
    }

    _base(value, state, options) {

        const result = {
            errors: null,
            value
        };

        if (typeof value === 'string' &&
            options.convert) {

            const number = parseFloat(value);
            result.value = (isNaN(number) || !isFinite(value)) ? NaN : number;
        }

        const isNumber = typeof result.value === 'number' && !isNaN(result.value);

        if (options.convert && 'precision' in this._flags && isNumber) {

            // This is conceptually equivalent to using toFixed but it should be much faster
            const precision = Math.pow(10, this._flags.precision);
            result.value = Math.round(result.value * precision) / precision;
        }

        result.errors = isNumber ? null : this.createError('number.base', null, state, options);
        return result;
    }

    multiple(base) {

        const isRef = Ref.isRef(base);

        return this._test('multiple', base, (value, state, options) => {

            let divisor;
            if (isRef) {
                divisor = base(state.parent, options);
                if (typeof divisor !== 'number') {
                    return this.createError('number.ref', { ref: base.key }, state, options);
                }

                if (divisor === 0) {
                    return this.createError('number.refZero', { ref: base.key }, state, options);
                }
            }
            else {
                divisor = base;
                if ((typeof divisor !== 'number') || (divisor === 0)) {
                    return this.createError('number.illegalMultiple', { ref: base.key }, state, options);
                }
            }

            const mult = Math.pow(10, Math.max(internals.precision(value), internals.precision(divisor)));

            if ((value * mult) % (divisor * mult) === 0) {
                return null;
            }

            return this.createError('number.multiple', { multiple: base, value }, state, options);
        });
    }

    integer() {

        return this._test('integer', undefined, function (value, state, options) {

            return Hoek.isInteger(value) ? null : this.createError('number.integer', { value }, state, options);
        });
    }

    negative() {

        return this._test('negative', undefined, function (value, state, options) {

            if (value < 0) {
                return null;
            }

            return this.createError('number.negative', { value }, state, options);
        });
    }

    positive() {

        return this._test('positive', undefined, function (value, state, options) {

            if (value > 0) {
                return null;
            }

            return this.createError('number.positive', { value }, state, options);
        });
    }

    precision(limit) {

        Hoek.assert(Hoek.isInteger(limit), 'limit must be an integer');
        Hoek.assert(!('precision' in this._flags), 'precision already set');

        const obj = this._test('precision', limit, function (value, state, options) {

            const places = value.toString().match(internals.precisionRx);
            const decimals = Math.max((places[1] ? places[1].length : 0) - (places[2] ? parseInt(places[2], 10) : 0), 0);
            if (decimals <= limit) {
                return null;
            }

            return this.createError('number.precision', { limit, value }, state, options);
        });

        obj._flags.precision = limit;
        return obj;
    }

};


internals.compare = function (type, compare) {

    return function (limit) {

        const isRef = Ref.isRef(limit);
        const isNumber = typeof limit === 'number' && !isNaN(limit);

        Hoek.assert(isNumber || isRef, 'limit must be a number or reference');

        return this._test(type, limit, function (value, state, options) {

            let compareTo;
            if (isRef) {
                compareTo = limit(state.parent, options);

                if (!(typeof compareTo === 'number' && !isNaN(compareTo))) {
                    return this.createError('number.ref', { ref: limit.key }, state, options);
                }
            }
            else {
                compareTo = limit;
            }

            if (compare(value, compareTo)) {
                return null;
            }

            return this.createError('number.' + type, { limit: compareTo, value }, state, options);
        });
    };
};


internals.Number.prototype.min = internals.compare('min', (value, limit) => value >= limit);
internals.Number.prototype.max = internals.compare('max', (value, limit) => value <= limit);
internals.Number.prototype.greater = internals.compare('greater', (value, limit) => value > limit);
internals.Number.prototype.less = internals.compare('less', (value, limit) => value < limit);


module.exports = new internals.Number();
