'use strict';

// Load modules

const Any = require('../any');
const Hoek = require('hoek');


// Declare internals

const internals = {};


internals.Map = class extends Map {

    slice() {

        return new internals.Map(this);
    }

    toString() {

        const entries = [...this].map(([key, symbol]) => {

            key = typeof key === 'symbol' ? key.toString() : JSON.stringify(key);
            return `${key} => ${symbol.toString()}`;
        });

        return `Map { ${entries.join(', ')} }`;
    }
};


internals.Symbol = class extends Any {

    constructor() {

        super();
        this._type = 'symbol';
        this._inner.map = new internals.Map();
    }

    _base(value, state, options) {

        if (options.convert) {
            const lookup = this._inner.map.get(value);
            if (lookup) {
                value = lookup;
            }

            if (this._flags.allowOnly) {
                return {
                    value,
                    errors: (typeof value === 'symbol') ? null : this.createError('symbol.map', { map: this._inner.map }, state, options)
                };
            }
        }

        return {
            value,
            errors: (typeof value === 'symbol') ? null : this.createError('symbol.base', null, state, options)
        };
    }

    map(iterable) {

        if (iterable && !iterable[Symbol.iterator] && typeof iterable === 'object') {
            iterable = Object.entries(iterable);
        }

        Hoek.assert(iterable && iterable[Symbol.iterator], 'Iterable must be an iterable or object');
        const obj = this.clone();

        const symbols = [];
        for (const entry of iterable) {
            Hoek.assert(entry && entry[Symbol.iterator], 'Entry must be an iterable');
            const [key, value] = entry;

            Hoek.assert(typeof key !== 'object' && typeof key !== 'function', 'Key must be a simple type');
            Hoek.assert(typeof value === 'symbol', 'Value must be a Symbol');
            obj._inner.map.set(key, value);
            symbols.push(value);
        }

        return obj.valid(...symbols);
    }

    describe() {

        const description = Any.prototype.describe.call(this);
        description.map = new Map(this._inner.map);
        return description;
    }
};


module.exports = new internals.Symbol();
