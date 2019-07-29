'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');


const internals = {};


internals.Binary = Any.extend({

    type: 'binary',

    // Coerce

    coerce: {
        from: 'string',
        method: function (value, state, prefs) {

            try {
                return { value: Buffer.from(value, this._flags.encoding) };
            }
            catch (ignoreErr) { }
        }
    },

    // Base validation

    validate: function (value, state, prefs) {

        if (!Buffer.isBuffer(value)) {
            return { value, errors: this.createError('binary.base', value, null, state, prefs) };
        }
    },

    // Rules

    rules: {
        encoding: {
            method: function (encoding) {

                Hoek.assert(Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

                return this._flag('encoding', encoding);
            }
        },

        length: {
            method: function (limit) {

                return this._rule({ name: 'length', method: 'length', args: { limit }, operator: '=' });
            },

            validate: function (value, helpers, { limit }, { name, operator, args }) {

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
        },

        max: {
            method: function (limit) {

                return this._rule({ name: 'max', method: 'length', args: { limit }, operator: '<=' });
            }
        },

        min: {
            method: function (limit) {

                return this._rule({ name: 'min', method: 'length', args: { limit }, operator: '>=' });
            }
        }
    },

    // Cast

    cast: {
        from: (value) => Buffer.isBuffer(value),
        to: {
            string: function (value, options) {

                return value.toString();
            }
        }
    }
});


module.exports = new internals.Binary();
