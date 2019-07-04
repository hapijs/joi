'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('./common');
const Messages = require('./messages');


const internals = {};


exports.describe = function (schema) {

    // Type

    const description = {
        type: schema._type,
        flags: {}
    };

    // Flags

    for (const flag in schema._flags) {
        if (flag[0] === '_') {
            continue;
        }

        const value = schema._flags[flag];
        switch (flag) {

            case 'description':
                description.description = value;
                break;

            case 'empty':
                description.flags[flag] = value.describe();
                break;

            case 'default':
            case 'failover':
                if (Common.isResolvable(value)) {
                    description.flags[flag] = value.describe();
                }
                else if (typeof value === 'function') {
                    description.flags[flag] = {
                        description: value.description,
                        function: value
                    };
                }
                else {
                    description.flags[flag] = { value };
                }

                break;

            case 'label':
                description.label = value;
                break;

            case 'unit':
                description.unit = value;
                break;

            default:
                description.flags[flag] = value;
                break;
        }
    }

    if (!Object.keys(description.flags).length) {
        delete description.flags;
    }

    // Preferences

    if (schema._preferences) {
        description.options = Hoek.clone(schema._preferences, { shallow: ['messages'] });
        if (description.options.messages) {
            description.options.messages = Messages.decompile(description.options.messages);
        }
    }

    // Valids

    const valids = schema._valids ? schema._valids.values() : [];
    if (valids.length) {
        description.valids = internals.values(valids);
    }

    const invalids = schema._invalids ? schema._invalids.values() : [];
    if (invalids.length) {
        description.invalids = internals.values(invalids);
    }

    // Meta properties

    if (schema._inners.notes.length) {
        description.notes = schema._inners.notes.slice();
    }

    if (schema._inners.tags.length) {
        description.tags = schema._inners.tags.slice();
    }

    if (schema._inners.meta.length) {
        description.meta = schema._inners.meta.slice();
    }

    if (schema._inners.examples) {
        description.examples = schema._inners.examples.slice();
    }

    // Alterations

    if (schema._inners.alterations) {
        description.alterations = schema._inners.alterations.slice();
    }

    // Externals

    if (schema._inners.externals) {
        description.externals = schema._inners.externals.slice();
    }

    // Rules

    description.rules = [];

    for (const test of schema._tests) {
        if (test.name === 'items') {
            continue;
        }

        const item = { name: test.name };

        if (test.args) {
            item.args = {};
            for (const key in test.args) {
                const arg = test.args[key];
                if (key === 'options' &&
                    !Object.keys(arg).length) {

                    continue;
                }

                item.args[key] = Common.isResolvable(arg) || Common.isSchema(arg) ? arg.describe() : arg;
            }

            if (!Object.keys(item.args).length) {
                delete item.args;
            }
        }

        const options = test.options;
        if (options) {
            if (options.hasRef) {
                item.args = {};
                const keys = Object.keys(test.args);
                for (const key of keys) {
                    const value = test.args[key];
                    item.args[key] = Common.isResolvable(value) ? value.describe() : value;
                }
            }

            if (typeof options.description === 'string') {
                item.description = options.description;
            }
            else if (typeof options.description === 'function') {
                item.description = options.description(item.args);
            }
        }

        description.rules.push(item);
    }

    if (!description.rules.length) {
        delete description.rules;
    }

    // Extension

    if (schema._baseType) {
        description.base = schema._baseType.describe();
    }

    return description;
};


internals.values = function (values) {

    const normalized = [];

    for (const value of values) {
        normalized.push(Common.isResolvable(value) ? value.describe() : (value && typeof value === 'object' ? { value } : value));
    }

    return normalized;
};
