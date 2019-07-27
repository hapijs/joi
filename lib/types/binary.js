'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');


const internals = {};


internals.Binary = class extends Any {

    constructor() {

        super('binary');
    }

    _coerce(value, state, prefs) {

        try {
            return { value: Buffer.from(value, this._flags.encoding) };
        }
        catch (ignoreErr) { }
    }

    _base(value, state, prefs) {

        if (!Buffer.isBuffer(value)) {
            return { value, errors: this.createError('binary.base', value, null, state, prefs) };
        }
    }

    // Rules

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

    // Internals

    _length(name, limit, operator) {

        return this._rule({ name, method: 'length', args: { limit }, operator });
    }
};


internals.Binary.prototype._coerce.type = 'string';


// Aliases

Common.alias(internals.Binary, [

]);


// Casts

Common.extend(internals.Binary, 'casts', {

    [Common.symbols.castFrom]: (value) => Buffer.isBuffer(value),

    string: function (value, options) {

        return value.toString();
    }
});


// Rules

Common.extend(internals.Binary, 'rules', {

    length: {
        method: function (value, helpers, { limit }, { name, operator, args }) {

            if (Common.compare(value.length, limit, operator)) {
                return value;
            }

            return helpers.error('binary.' + name, { limit: args.limit, value });
        },
        refs: {
            limit: {
                assert: Common.limit,
                code: 'binary.ref',
                message: 'limit must be a positive integer or reference'
            }
        }
    }
});


module.exports = new internals.Binary();
