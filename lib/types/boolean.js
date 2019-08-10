'use strict';

const Assert = require('@hapi/hoek/lib/assert');

const Any = require('./any');
const Common = require('../common');
const Values = require('../values');


const internals = {};


internals.isBool = function (value) {

    return typeof value === 'boolean';
};


module.exports = Any.extend({

    type: 'boolean',

    initialize(schema) {

        schema._flags.insensitive = true;
        schema.$_terms.truthy = new Values();
        schema.$_terms.falsy = new Values();
    },

    coerce(schema, value, helpers) {

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

    validate(schema, value, { error }) {

        if (typeof value !== 'boolean') {
            return { value, errors: error('boolean.base') };
        }
    },

    rules: {
        truthy: {
            method(...values) {

                Common.verifyFlat(values, 'truthy');

                const obj = this.clone();
                for (let i = 0; i < values.length; ++i) {
                    const value = values[i];

                    Assert(value !== undefined, 'Cannot call truthy with undefined');
                    obj.$_terms.truthy.add(value);
                }

                return obj;
            }
        },

        falsy: {
            method(...values) {

                Common.verifyFlat(values, 'falsy');

                const obj = this.clone();
                for (let i = 0; i < values.length; ++i) {
                    const value = values[i];

                    Assert(value !== undefined, 'Cannot call falsy with undefined');
                    obj.$_terms.falsy.add(value);
                }

                return obj;
            }
        },

        insensitive: {
            method(enabled) {

                return this.$_setFlag('insensitive', enabled !== false);
            }
        }
    },

    cast: {
        number: {
            from: internals.isBool,
            to(value, helpers) {

                return value ? 1 : 0;
            }
        },
        string: {
            from: internals.isBool,
            to(value, helpers) {

                return value ? 'true' : 'false';
            }
        }
    },

    manifest: {

        build(obj, desc) {

            if (desc.truthy) {
                obj = obj.truthy(...desc.truthy);
            }

            if (desc.falsy) {
                obj = obj.falsy(...desc.falsy);
            }

            return obj;
        }
    },

    messages: {
        'boolean.base': '"{{#label}}" must be a boolean'
    }
});
