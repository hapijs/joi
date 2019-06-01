'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Utils = require('../utils');


const internals = {};


internals.Binary = class extends Any {

    constructor() {

        super();
        this._type = 'binary';
    }

    _coerce(value, state, options) {

        const result = { value };

        if (typeof value === 'string') {
            try {
                result.value = Buffer.from(value, this._flags.encoding);
            }
            catch (ignoreErr) { }
        }

        return result;
    }

    _base(value, state, options) {

        if (Buffer.isBuffer(value)) {
            return { value };
        }

        return {
            value,
            errors: this.createError('binary.base', null, state, options)
        };
    }

    encoding(encoding) {

        Hoek.assert(Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

        if (this._flags.encoding === encoding) {
            return this;
        }

        const obj = this.clone();
        obj._flags.encoding = encoding;
        return obj;
    }

    length(limit) {

        return this._length('length', limit, '=');
    }

    max(limit) {

        return this._length('max', limit, '<=');
    }

    min(limit) {

        return this._length('min', limit, '>=');
    }

    _length(name, limit, operator) {

        const refs = {
            limit: {
                assert: (value) => Number.isSafeInteger(value) && value >= 0,
                code: 'binary.ref',
                message: 'limit must be a positive integer or reference'
            }
        };

        return this._rule(name, { rule: 'length', refs, args: { limit }, operator });
    }
};


internals.Binary.prototype._rules = {

    length: function (value, helpers, { limit }, { alias, operator, args }) {

        if (Utils.compare(value.length, limit, operator)) {
            return value;
        }

        return helpers.error('binary.' + alias, { limit: args.limit, value });
    }
};


module.exports = new internals.Binary();
