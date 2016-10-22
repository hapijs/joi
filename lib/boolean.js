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
        this._inner._truthySet = new internals.Set();
        this._inner._falsySet = new internals.Set();
    }

    _base(value, state, options) {

        const result = {
            value
        };

        result.value = (this._inner._truthySet.has(value) ? true
            : (this._inner._falsySet.has(value) ? false : value));

        result.errors = (typeof result.value === 'boolean') ? null : this.createError('boolean.base', null, state, options);
        return result;
    }

    truthy() {

        const obj = this.clone();
        const values = Hoek.flatten(Array.prototype.slice.call(arguments));
        for (let i = 0; i < values.length; ++i) {
            const value = values[i];

            Hoek.assert(value !== undefined, 'Cannot call truthy/falsy with undefined');
            obj._inner._truthySet.add(value);
        }
        return obj;
    }

    falsy() {

        const obj = this.clone();
        const values = Hoek.flatten(Array.prototype.slice.call(arguments));
        for (let i = 0; i < values.length; ++i) {
            const value = values[i];

            Hoek.assert(value !== undefined, 'Cannot call truthy/falsy with undefined');
            obj._inner._falsySet.add(value);
        }
        return obj;
    }

    describe() {

        const description = Any.prototype.describe.call(this);

        if (this._inner._truthySet.values().length) {
            description.truthyValues = this._inner._truthySet.values();
        }

        if (this._inner._falsySet.values().length) {
            description.falsyValues = this._inner._falsySet.values();
        }

        return description;
    }
};


module.exports = new internals.Boolean();
