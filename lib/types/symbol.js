'use strict';

const Assert = require('@hapi/hoek/lib/assert');

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

    initialize(schema) {

        schema.$_terms.map = new internals.Map();
    },

    // Coerce

    coerce: {
        method(schema, value, { error }) {

            const lookup = schema.$_terms.map.get(value);
            if (lookup) {
                value = lookup;
            }

            if (!schema._flags.only ||
                typeof value === 'symbol') {

                return { value };
            }

            return { value, errors: error('symbol.map', { map: schema.$_terms.map }) };
        }
    },

    // Base validation

    validate(schema, value, { error }) {

        if (typeof value !== 'symbol') {
            return { value, errors: error('symbol.base') };
        }
    },

    // Rules

    rules: {
        map: {
            method(iterable) {

                if (iterable &&
                    !iterable[Symbol.iterator] &&
                    typeof iterable === 'object') {

                    iterable = Object.entries(iterable);
                }

                Assert(iterable && iterable[Symbol.iterator], 'Iterable must be an iterable or object');

                const obj = this.clone();

                const symbols = [];
                for (const entry of iterable) {
                    Assert(entry && entry[Symbol.iterator], 'Entry must be an iterable');
                    const [key, value] = entry;

                    Assert(typeof key !== 'object' && typeof key !== 'function' && typeof key !== 'symbol', 'Key must not be of type object, function, or Symbol');
                    Assert(typeof value === 'symbol', 'Value must be a Symbol');

                    obj.$_terms.map.set(key, value);
                    symbols.push(value);
                }

                return obj.valid(...symbols);
            }
        }
    },

    // Build

    build(obj, desc) {

        obj = obj.map(desc.map);
        return obj;
    },

    // Errors

    messages: {
        'symbol.base': '"{{#label}}" must be a symbol',
        'symbol.map': '"{{#label}}" must be one of {{#map}}'
    }
});
