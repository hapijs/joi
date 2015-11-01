'use strict';

// Load modules

const Any = require('./any');
const Errors = require('./errors');
const Hoek = require('hoek');


// Declare internals

const internals = {};


internals.Binary = function () {

    Any.call(this);
    this._type = 'binary';
};

Hoek.inherits(internals.Binary, Any);


internals.Binary.prototype._base = function (value, state, options) {

    const result = {
        value: value
    };

    if (typeof value === 'string' &&
        options.convert) {

        try {
            const converted = new Buffer(value, this._flags.encoding);
            result.value = converted;
        }
        catch (e) { }
    }

    result.errors = Buffer.isBuffer(result.value) ? null : Errors.create('binary.base', null, state, options);
    return result;
};


internals.Binary.prototype.encoding = function (encoding) {

    Hoek.assert(Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

    const obj = this.clone();
    obj._flags.encoding = encoding;
    return obj;
};


internals.Binary.prototype.min = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('min', limit, (value, state, options) => {

        if (value.length >= limit) {
            return null;
        }

        return Errors.create('binary.min', { limit: limit, value: value }, state, options);
    });
};


internals.Binary.prototype.max = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('max', limit, (value, state, options) => {

        if (value.length <= limit) {
            return null;
        }

        return Errors.create('binary.max', { limit: limit, value: value }, state, options);
    });
};


internals.Binary.prototype.length = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('length', limit, (value, state, options) => {

        if (value.length === limit) {
            return null;
        }

        return Errors.create('binary.length', { limit: limit, value: value }, state, options);
    });
};


module.exports = new internals.Binary();
