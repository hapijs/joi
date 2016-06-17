'use strict';

// Load modules

const Any = require('./any');


// Declare internals

const internals = {};


internals.Boolean = class extends Any {
    constructor() {

        super();
        this._type = 'boolean';
    }

    _base(value, state, options) {

        const result = {
            value
        };

        if (typeof value === 'string' &&
            options.convert) {

            const lower = value.toLowerCase();
            result.value = (lower === 'true' || lower === 'yes' || lower === 'on' || lower === '1' ? true
                                                            : (lower === 'false' || lower === 'no' || lower === 'off' || lower === '0' ? false : value));
        }

        if (typeof value === 'number' &&
            options.convert) {

            result.value = (value === 1 ? true
                    : (value === 0 ? false : value));
        }

        result.errors = (typeof result.value === 'boolean') ? null : this.createError('boolean.base', null, state, options);
        return result;
    }
};


module.exports = new internals.Boolean();
