'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');


const internals = {};


internals.Map = class extends Map {

    slice() {

        return new internals.Map(this);
    }
};


module.exports = Any.extend({

    type: 'symbol',

    // Initialize

    initialize: function () {

        this._inners.map = new internals.Map();
    },

    // Coerce

    coerce: {
        method: function (schema, value, { error }) {

            const lookup = schema._inners.map.get(value);
            if (lookup) {
                value = lookup;
            }

            if (!schema._flags.only ||
                typeof value === 'symbol') {

                return { value };
            }

            return { value, errors: error('symbol.map', { map: schema._inners.map }) };
        }
    },

    // Base validation

    validate: function (schema, value, { error }) {

        if (typeof value !== 'symbol') {
            return { value, errors: error('symbol.base') };
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

                    Hoek.assert(typeof key !== 'object' && typeof key !== 'function' && typeof key !== 'symbol', 'Key must not be of type object, function, or Symbol');
                    Hoek.assert(typeof value === 'symbol', 'Value must be a Symbol');

                    obj._inners.map.set(key, value);
                    symbols.push(value);
                }

                return obj.valid(...symbols);
            }
        }
    },

    // Build

    build: function (obj, desc) {

        obj = obj.map(desc.map);
        return obj;
    },

    // Errors

    messages: {
        'symbol.base': '"{{#label}}" must be a symbol',
        'symbol.map': '"{{#label}}" must be one of {{#map}}'
    }
});
