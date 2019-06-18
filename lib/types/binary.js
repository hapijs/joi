'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');


const internals = {};


internals.Binary = class extends Any {

    constructor() {

        super();
        this._type = 'binary';
    }

    _coerce(value, state, prefs) {

        if (typeof value !== 'string') {
            return;
        }

        try {
            return { value: Buffer.from(value, this._flags.encoding) };
        }
        catch (ignoreErr) { }
    }

    _base(value, state, prefs) {

        if (Buffer.isBuffer(value)) {
            return { value };
        }

        return {
            value,
            errors: this.createError('binary.base', value, null, state, prefs)
        };
    }

    encoding(encoding) {

        Hoek.assert(Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

        return this._flag('encoding', encoding);
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

        if (Common.compare(value.length, limit, operator)) {
            return value;
        }

        return helpers.error('binary.' + alias, { limit: args.limit, value });
    }
};


module.exports = new internals.Binary();
