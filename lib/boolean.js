'use strict';

// Load modules

const Any = require('./any');
const Hoek = require('hoek');


// Declare internals

const internals = {};


internals.Boolean = function () {

    Any.call(this);
    this._type = 'boolean';
};

Hoek.inherits(internals.Boolean, Any);


internals.Boolean.prototype._base = function (value, state, options) {

    const result = {
        value
    };

    if (typeof value === 'string' &&
        options.convert) {

        const lower = value.toLowerCase();
        result.value = (lower === 'true' || lower === 'yes' || lower === 'on' ? true
                                                                              : (lower === 'false' || lower === 'no' || lower === 'off' ? false : value));
    }

    result.errors = (typeof result.value === 'boolean') ? null : this.createError('boolean.base', null, state, options);
    return result;
};


module.exports = new internals.Boolean();
