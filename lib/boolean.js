'use strict';

// Load modules

const Any = require('./any');
const Hoek = require('hoek');


// Declare internals

const internals = {};


internals.Boolean = class extends Any {
    constructor() {

        super();
        this._type = 'boolean';
        this._inner._truthySet = [];
        this._inner._falsySet = [];
    }

    _base(value, state, options) {

        const result = {
            value
        };

        result.value = (this._inner._truthySet.indexOf(value) !== -1 ? true
            : (this._inner._falsySet.indexOf(value) !== -1 ? false : value));

        result.errors = (typeof result.value === 'boolean') ? null : this.createError('boolean.base', null, state, options);
        return result;
    }

    _truthy() {

        const values = Hoek.flatten(Array.prototype.slice.call(arguments));
        for (let i = 0; i < values.length; ++i) {
            const value = values[i];

            Hoek.assert(value !== undefined, 'Cannot call truthy/falsy with undefined');
            this._inner._truthySet.push(value);
        }
    }

    truthy() {

        const obj = this.clone();
        obj._truthy.apply(obj, arguments);
        return obj;
    }

    _falsy() {

        const values = Hoek.flatten(Array.prototype.slice.call(arguments));
        for (let i = 0; i < values.length; ++i) {
            const value = values[i];

            Hoek.assert(value !== undefined, 'Cannot call truthy/falsy with undefined');
            this._inner._falsySet.push(value);
        }
    }

    falsy() {

        const obj = this.clone();
        obj._falsy.apply(obj, arguments);
        return obj;
    }
};


module.exports = new internals.Boolean();
