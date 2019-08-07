'use strict';

const Assert = require('@hapi/hoek/lib/assert');

const ObjectType = require('./object');


const internals = {};


module.exports = ObjectType.extend({

    type: 'function',

    properties: {
        typeof: 'function'
    },

    // Rules

    rules: {
        arity: {
            method: function (n) {

                Assert(Number.isSafeInteger(n) && n >= 0, 'n must be a positive integer');

                return this.$_addRule({ name: 'arity', args: { n } });
            },
            validate: function (value, helpers, { n }) {

                if (value.length === n) {
                    return value;
                }

                return helpers.error('function.arity', { n });
            }
        },

        class: {
            method: function () {

                return this.$_addRule('class');
            },
            validate: function (value, helpers) {

                if ((/^\s*class\s/).test(value.toString())) {
                    return value;
                }

                return helpers.error('function.class', { value });
            }
        },

        minArity: {
            method: function (n) {

                Assert(Number.isSafeInteger(n) && n > 0, 'n must be a strict positive integer');

                return this.$_addRule({ name: 'minArity', args: { n } });
            },
            validate: function (value, helpers, { n }) {

                if (value.length >= n) {
                    return value;
                }

                return helpers.error('function.minArity', { n });
            }
        },

        maxArity: {
            method: function (n) {

                Assert(Number.isSafeInteger(n) && n >= 0, 'n must be a positive integer');

                return this.$_addRule({ name: 'maxArity', args: { n } });
            },
            validate: function (value, helpers, { n }) {

                if (value.length <= n) {
                    return value;
                }

                return helpers.error('function.maxArity', { n });
            }
        }
    },

    // Cast

    cast: {
        map: null           // Disable object cast
    },

    // Errors

    messages: {
        'function.arity': '"{{#label}}" must have an arity of {{#n}}',
        'function.class': '"{{#label}}" must be a class',
        'function.maxArity': '"{{#label}}" must have an arity lesser or equal to {{#n}}',
        'function.minArity': '"{{#label}}" must have an arity greater or equal to {{#n}}'
    }
});
