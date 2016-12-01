'use strict';

// Load modules

const Any = require('./any');
const Hoek = require('hoek');


// Declare internals

const internals = {
    Set: require('./set')
};


internals.Boolean = class extends Any {
    constructor() {

        super();
        this._type = 'boolean';
        this._flags.insensitive = true;
        this._inner.truthySet = new internals.Set();
        this._inner.falsySet = new internals.Set();
    }

    _base(value, state, options) {

        const result = {
            value
        };

        result.value = (this._inner.truthySet.has(value, null, null, this._flags.insensitive) ? true
            : (this._inner.falsySet.has(value, null, null, this._flags.insensitive) ? false : value));

        result.errors = (typeof result.value === 'boolean') ? null : this.createError('boolean.base', null, state, options);
        return result;
    }

    truthy() {

        const obj = this.clone();
        const values = Hoek.flatten(Array.prototype.slice.call(arguments));
        for (let i = 0; i < values.length; ++i) {
            const value = values[i];

            Hoek.assert(value !== undefined, 'Cannot call truthy with undefined');
            obj._inner.truthySet.add(value);
        }
        return obj;
    }

    falsy() {

        const obj = this.clone();
        const values = Hoek.flatten(Array.prototype.slice.call(arguments));
        for (let i = 0; i < values.length; ++i) {
            const value = values[i];

            Hoek.assert(value !== undefined, 'Cannot call falsy with undefined');
            obj._inner.falsySet.add(value);
        }
        return obj;
    }

    insensitive(enabled) {

        const insensitive = enabled === undefined ? true : !!enabled;

        if (insensitive !== this._flags.insensitive) {
            const obj = this.clone();
            obj._flags.insensitive = insensitive;
            return obj;
        }

        return this;
    }

    describe() {

        const description = Any.prototype.describe.call(this);
        description.truthy = [true].concat(this._inner.truthySet.values());
        description.falsy = [false].concat(this._inner.falsySet.values());
        return description;
    }
};


module.exports = new internals.Boolean();
