'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');
const Values = require('../values');


const internals = {};


internals.isBool = function (value) {

    return typeof value === 'boolean';
};


module.exports = Any.extend({

    type: 'boolean',

    // Initialize

    initialize: function (schema) {

        schema._flags.insensitive = true;
        schema.$_terms.truthy = new Values();
        schema.$_terms.falsy = new Values();
    },

    // Coerce

    coerce: function (schema, value, helpers) {

        if (typeof value === 'boolean') {
            return;
        }

        if (typeof value === 'string') {
            const normalized = schema._flags.insensitive ? value.toLowerCase() : value;
            value = normalized === 'true' ? true : (normalized === 'false' ? false : value);
        }

        if (typeof value !== 'boolean') {
            value = schema.$_terms.truthy.has(value, null, null, schema._flags.insensitive) ||
                (schema.$_terms.falsy.has(value, null, null, schema._flags.insensitive) ? false : value);
        }

        return { value };
    },

    // Base validation

    validate: function (schema, value, { error }) {

        if (typeof value !== 'boolean') {
            return { value, errors: error('boolean.base') };
        }
    },

    // Rules

    rules: {
        truthy: {
            method: function (...values) {

                Common.verifyFlat(values, 'truthy');

                const obj = this.clone();
                for (let i = 0; i < values.length; ++i) {
                    const value = values[i];

                    Hoek.assert(value !== undefined, 'Cannot call truthy with undefined');
                    obj.$_terms.truthy.add(value);
                }

                return obj;
            }
        },

        falsy: {
            method: function (...values) {

                Common.verifyFlat(values, 'falsy');

                const obj = this.clone();
                for (let i = 0; i < values.length; ++i) {
                    const value = values[i];

                    Hoek.assert(value !== undefined, 'Cannot call falsy with undefined');
                    obj.$_terms.falsy.add(value);
                }

                return obj;
            }
        },

        insensitive: {
            method: function (enabled) {

                return this.$_setFlag('insensitive', enabled !== false);
            }
        }
    },

    // Cast

    cast: {
        number: {
            from: internals.isBool,
            to: function (value, helpers) {

                return value ? 1 : 0;
            }
        },
        string: {
            from: internals.isBool,
            to: function (value, helpers) {

                return value ? 'true' : 'false';
            }
        }
    },

    // Build

    build: function (obj, desc) {

        if (desc.truthy) {
            obj = obj.truthy(...desc.truthy);
        }

        if (desc.falsy) {
            obj = obj.falsy(...desc.falsy);
        }

        return obj;
    },

    // Errors

    messages: {
        'boolean.base': '"{{#label}}" must be a boolean'
    }
});
