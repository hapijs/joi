'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');


const internals = {};


internals.Symbol = Any.extend({

    type: 'symbol',

    // Initialize

    initialize: function () {

        this._inners.map = new internals.Map();
    },

    // Coerce

    coerce: {
        method: function (value, state, prefs) {

            const lookup = this._inners.map.get(value);
            if (lookup) {
                value = lookup;
            }

            if (!this._flags.only ||
                typeof value === 'symbol') {

                return { value };
            }

            return { value, errors: this.createError('symbol.map', value, { map: this._inners.map }, state, prefs) };
        }
    },

    // Base validation

    validate: function (value, state, prefs) {

        if (typeof value !== 'symbol') {
            return { value, errors: this.createError('symbol.base', value, null, state, prefs) };
        }
    },

    // Rules

    rules: {

        map: {
            method: function (iterable) {

                if (iterable &&
                    !iterable[Symbol.iterator] &&
                    typeof iterable === 'object') {

                    iterable = Object.entries(iterable);
                }

                Hoek.assert(iterable && iterable[Symbol.iterator], 'Iterable must be an iterable or object');

                const obj = this.clone();

                const symbols = [];
                for (const entry of iterable) {
                    Hoek.assert(entry && entry[Symbol.iterator], 'Entry must be an iterable');
                    const [key, value] = entry;

                    Hoek.assert(typeof key !== 'object' && typeof key !== 'function' && typeof key !== 'symbol', 'Key must not be an object, function, or Symbol');
                    Hoek.assert(typeof value === 'symbol', 'Value must be a Symbol');

                    obj._inners.map.set(key, value);
                    symbols.push(value);
                }

                return obj.valid(...symbols);
            }
        }
    },

    // Build

    build: function (desc) {

        let obj = this;                                     // eslint-disable-line consistent-this
        obj = obj.map(desc.map);
        return obj;
    }
});


// Helpers

internals.Map = class extends Map {

    slice() {

        return new internals.Map(this);
    }
};


module.exports = new internals.Symbol();
