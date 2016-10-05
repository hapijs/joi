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
        this._inner._truthySet = [
            'true',
            'yes',
            'on',
            '1'
        ];
        this._inner._falsySet = [
            'false',
            'no',
            'off',
            '0'
        ];
    }

    _base(value, state, options) {

        const result = {
            value
        };

        if (typeof value === 'string' &&
            options.convert) {

            const lower = value.toLowerCase();
            result.value = (this._inner._truthySet.indexOf(lower) !== -1 ? true
                                                            : (this._inner._falsySet.indexOf(lower) !== -1 ? false : value));
        }

        if (typeof value === 'number' &&
            options.convert) {

            result.value = (value === 1 ? true
                    : (value === 0 ? false : value));
        }

        result.errors = (typeof result.value === 'boolean') ? null : this.createError('boolean.base', null, state, options);
        return result;
    }

    truthy(truthyValue) {

        truthyValue = Array.isArray(truthyValue) ? truthyValue : [truthyValue];

        const truthySet = truthyValue.map((value) => {

            Hoek.assert(typeof value === 'string', 'truthy value must be a string');

            return value.toLowerCase();
        });

        const obj = this.clone();
        obj._inner._truthySet = truthySet.concat(obj._truthySet);
        return obj;
    }

    falsy(falsyValue) {

        falsyValue = Array.isArray(falsyValue) ? falsyValue : [falsyValue];

        const falsySet = falsyValue.map((value) => {

            Hoek.assert(typeof value === 'string', 'falsy value must be a string');

            return value.toLowerCase();
        });

        const obj = this.clone();
        obj._inner._falsySet = falsySet.concat(obj._falsySet);
        return obj;
    }
};


module.exports = new internals.Boolean();
