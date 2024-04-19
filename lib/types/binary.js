'use strict';

const Assert = require('@hapi/hoek/lib/assert');

const Any = require('./any');
const Common = require('../common');


const internals = {};


module.exports = Any.extend({

    type: 'binary',

    coerce: {
        from: ['string', 'object'],
        method(value, { schema }) {

            if (typeof value === 'string' || (value !== null && value.type === 'Buffer')) {
                try {
                    return { value: Buffer.from(value, schema._flags.encoding) };
                }
                catch (ignoreErr) { }
            }
        }
    },

    validate(value, { error }) {

        if (!Buffer.isBuffer(value)) {
            return { value, errors: error('binary.base') };
        }
    },

    rules: {
        encoding: {
            method(encoding) {

                Assert(Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

                return this.$_setFlag('encoding', encoding);
            }
        },

        length: {
            method(limit) {

                return this.$_addRule({ name: 'length', method: 'length', args: { limit }, operator: '=' });
            },
            validate(value, helpers, { limit }, { name, operator, args }) {

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
            method(limit) {

                return this.$_addRule({ name: 'max', method: 'length', args: { limit }, operator: '<=' });
            }
        },

        min: {
            method(limit) {

                return this.$_addRule({ name: 'min', method: 'length', args: { limit }, operator: '>=' });
            }
        }
    },

    cast: {
        string: {
            from: (value) => Buffer.isBuffer(value),
            to(value, helpers) {

                return value.toString();
            }
        }
    },

    messages: {
        /**
         * @category errors
         * @summary The value is either not a Buffer or could not be cast to a Buffer from a string.
         */
        'binary.base': '{{#label}} must be a buffer or a string',
        /**
         * @category errors
         * @summary The buffer was not of the specified length.
         * @description Additional local context properties:
         * ```ts
         * {
         *     limit: number // Length that was expected for this buffer
         * }
         * ```
         */
        'binary.length': '{{#label}} must be {{#limit}} bytes',
        /**
         * @category errors
         * @summary The buffer contains more bytes than expected.
         * @description Additional local context properties:
         * ```ts
         * {
         *     limit: number // Maximum length that was expected for this buffer
         * }
         * ```
         */

        'binary.max': '{{#label}} must be less than or equal to {{#limit}} bytes',
        /**
         * @category errors
         * @summary The buffer contains less bytes than expected.
         * @description Additional local context properties:
         * ```ts
         * {
         *     limit: number // Minimum length that was expected for this buffer
         * }
         * ```
         */
        'binary.min': '{{#label}} must be at least {{#limit}} bytes'
    }
});
