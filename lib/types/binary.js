'use strict';

const Hoek = require('@hapi/hoek');

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

                Hoek.assert(Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

                return this.setFlag('encoding', encoding);
            }
        },

        length: {
            method: function (limit) {

                return this.addRule({ name: 'length', method: 'length', args: { limit }, operator: '=' });
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

                return this.addRule({ name: 'max', method: 'length', args: { limit }, operator: '<=' });
            }
        },

        min: {
            method: function (limit) {

                return this.addRule({ name: 'min', method: 'length', args: { limit }, operator: '>=' });
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
    },

    // Errors

    messages: {
        'binary.base': '"{{#label}}" must be a buffer or a string',
        'binary.length': '"{{#label}}" must be {{#limit}} bytes',
        'binary.max': '"{{#label}}" must be less than or equal to {{#limit}} bytes',
        'binary.min': '"{{#label}}" must be at least {{#limit}} bytes',
        'binary.ref': '"{{#label}}" references "{{#ref}}" which is not a positive integer'
    }
});
