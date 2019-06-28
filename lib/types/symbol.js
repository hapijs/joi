'use strict';

const Util = require('util');

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');


const internals = {};


internals.Symbol = class extends Any {

    constructor() {

        super('symbol');

        this._inner.map = new internals.Map();
    }

    _coerce(value, state, prefs) {

        const lookup = this._inner.map.get(value);
        if (lookup) {
            value = lookup;
        }

        if (!this._flags.allowOnly ||
            typeof value === 'symbol') {

            return { value };
        }

        return { value, errors: this.createError('symbol.map', value, { map: this._inner.map }, state, prefs) };
    }

    _base(value, state, prefs) {

        if (typeof value !== 'symbol') {
            return { value, errors: this.createError('symbol.base', value, null, state, prefs) };
        }
    }

    // About

    describe() {

        const description = super.describe();
        description.map = new Map(this._inner.map);
        return description;
    }

    // Rules

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

            Hoek.assert(typeof key !== 'object' && typeof key !== 'function' && typeof key !== 'symbol', 'Key must not be an object, function, or Symbol');
            Hoek.assert(typeof value === 'symbol', 'Value must be a Symbol');
            obj._inner.map.set(key, value);
            symbols.push(value);
        }

        return obj.valid(...symbols);
    }
};


// Aliases

Common.alias(internals.Symbol, [

]);


// Casts

Common.extend(internals.Symbol, 'casts', {

});


// Rules

Common.extend(internals.Symbol, 'rules', {

});


// Helpers

internals.Map = class extends Map {

    slice() {

        return new internals.Map(this);
    }

    toString() {

        return Util.inspect(this);
    }
};


module.exports = new internals.Symbol();
