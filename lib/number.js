'use strict';

// Load modules

const Any = require('./any');
const Ref = require('./ref');
const Hoek = require('hoek');


// Declare internals

const internals = {};


internals.Number = function () {

    Any.call(this);
    this._type = 'number';
    this._invalids.add(Infinity);
    this._invalids.add(-Infinity);
};

Hoek.inherits(internals.Number, Any);

internals.compare = function (type, compare) {

    return function (limit) {

        const isRef = Ref.isRef(limit);
        const isNumber = typeof limit === 'number' && !isNaN(limit);

        Hoek.assert(isNumber || isRef, 'limit must be a number or reference');

        return this._test(type, limit, (value, state, options) => {

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


internals.Number.prototype._base = function (value, state, options) {

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
};


internals.Number.prototype.min = internals.compare('min', (value, limit) => value >= limit);
internals.Number.prototype.max = internals.compare('max', (value, limit) => value <= limit);
internals.Number.prototype.greater = internals.compare('greater', (value, limit) => value > limit);
internals.Number.prototype.less = internals.compare('less', (value, limit) => value < limit);


internals.Number.prototype.multiple = function (base) {

    Hoek.assert(Hoek.isInteger(base), 'multiple must be an integer');
    Hoek.assert(base > 0, 'multiple must be greater than 0');

    return this._test('multiple', base, (value, state, options) => {

        if (value % base === 0) {
            return null;
        }

        return this.createError('number.multiple', { multiple: base, value }, state, options);
    });
};


internals.Number.prototype.integer = function () {

    return this._test('integer', undefined, (value, state, options) => {

        return Hoek.isInteger(value) ? null : this.createError('number.integer', { value }, state, options);
    });
};


internals.Number.prototype.negative = function () {

    return this._test('negative', undefined, (value, state, options) => {

        if (value < 0) {
            return null;
        }

        return this.createError('number.negative', { value }, state, options);
    });
};


internals.Number.prototype.positive = function () {

    return this._test('positive', undefined, (value, state, options) => {

        if (value > 0) {
            return null;
        }

        return this.createError('number.positive', { value }, state, options);
    });
};


internals.precisionRx = /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/;


internals.Number.prototype.precision = function (limit) {

    Hoek.assert(Hoek.isInteger(limit), 'limit must be an integer');
    Hoek.assert(!('precision' in this._flags), 'precision already set');

    const obj = this._test('precision', limit, (value, state, options) => {

        const places = value.toString().match(internals.precisionRx);
        const decimals = Math.max((places[1] ? places[1].length : 0) - (places[2] ? parseInt(places[2], 10) : 0), 0);
        if (decimals <= limit) {
            return null;
        }

        return this.createError('number.precision', { limit, value }, state, options);
    });

    obj._flags.precision = limit;
    return obj;
};


module.exports = new internals.Number();
