'use strict';

const Assert = require('@hapi/hoek/lib/assert');

const Any = require('./any');
const Common = require('../common');


const internals = {};


module.exports = Any.extend({

    type: 'binary',

    // Coerce

    coerce: {
        from: 'string',
        method: function (schema, value, helpers) {

            try {
                return { value: Buffer.from(value, schema._flags.encoding) };
            }
            catch (ignoreErr) { }
        }
    },

    // Base validation

    validate: function (schema, value, { error }) {

        if (!Buffer.isBuffer(value)) {
            return { value, errors: error('binary.base') };
        }
    },

    // Rules

    rules: {
        encoding: {
            method: function (encoding) {

                Assert(Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

                return this.$_setFlag('encoding', encoding);
            }
        },

        length: {
            method: function (limit) {

                return this.$_addRule({ name: 'length', method: 'length', args: { limit }, operator: '=' });
            },
            validate: function (value, helpers, { limit }, { name, operator, args }) {

                if (Common.compare(value.length, limit, operator)) {
                    return value;
                }

                return helpers.error('binary.' + name, { limit: args.limit, value });
            },
            args: [
                {
                    name: 'limit',
                    ref: true,
                    assert: Common.limit,
                    message: 'must be a positive integer'
                }
            ]
        },

        max: {
            method: function (limit) {

                return this.$_addRule({ name: 'max', method: 'length', args: { limit }, operator: '<=' });
            }
        },

        min: {
            method: function (limit) {

                return this.$_addRule({ name: 'min', method: 'length', args: { limit }, operator: '>=' });
            }
        }
    },

    // Cast

    cast: {
        string: {
            from: (value) => Buffer.isBuffer(value),
            to: function (value, helpers) {

                return value.toString();
            }
        }
    },

    // Errors

    messages: {
        'binary.base': '"{{#label}}" must be a buffer or a string',
        'binary.length': '"{{#label}}" must be {{#limit}} bytes',
        'binary.max': '"{{#label}}" must be less than or equal to {{#limit}} bytes',
        'binary.min': '"{{#label}}" must be at least {{#limit}} bytes'
    }
});
