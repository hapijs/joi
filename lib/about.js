'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('./common');
const Messages = require('./messages');


const internals = {
    exclude: ['lazy']
};


exports.describe = function (schema) {

    const description = {
        type: schema._type,
        [Common.symbols.schema]: schema
    };

    const flags = Object.keys(schema._flags).filter((name) => !internals.exclude.includes(name));
    if (flags.length) {
        description.flags = {};
        for (const flag of flags) {
            if (flag[0] === '_') {
                continue;
            }

            const value = schema._flags[flag];
            switch (flag) {

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
                        description.flags[flag] = value;
                    }

                    break;

                case 'label':
                    description.label = value;
                    break;

                default:
                    description.flags[flag] = value;
                    break;
            }
        }

        if (!Object.keys(description.flags).length) {
            delete description.flags;
        }
    }

    if (schema._preferences) {
        description.options = Hoek.clone(schema._preferences, { shallow: ['messages'] });
        if (description.options.messages) {
            description.options.messages = Messages.decompile(description.options.messages);
        }
    }

    if (schema._baseType) {
        description.base = schema._baseType.describe();
    }

    if (schema._description) {
        description.description = schema._description;
    }

    if (schema._notes.length) {
        description.notes = schema._notes.slice();
    }

    if (schema._tags.length) {
        description.tags = schema._tags.slice();
    }

    if (schema._meta.length) {
        description.meta = schema._meta.slice();
    }

    if (schema._examples.length) {
        description.examples = schema._examples.slice();
    }

    if (schema._unit) {
        description.unit = schema._unit;
    }

    const valids = schema._valids ? schema._valids.values() : [];
    if (valids.length) {
        description.valids = valids.map((v) => {

            return Common.isResolvable(v) ? v.describe() : v;
        });
    }

    const invalids = schema._invalids ? schema._invalids.values() : [];
    if (invalids.length) {
        description.invalids = invalids.map((v) => {

            return Common.isResolvable(v) ? v.describe() : v;
        });
    }

    description.rules = [];

    for (const test of schema._tests) {
        if (test.name === 'items') {
            continue;
        }

        const item = { name: test.name };

        let arg = test.arg;
        if (arg !== undefined) {
            if (test.rule) {
                const keys = Object.keys(arg);
                if (keys.length === 1) {
                    arg = arg[keys[0]];
                }
                else {
                    const args = {};
                    for (const key of keys) {
                        const inner = arg[key];
                        if (inner !== undefined) {
                            args[key] = Common.isResolvable(inner) ? inner.describe() : inner;
                        }
                    }

                    arg = args;
                }
            }

            if (arg !== undefined) {
                item.arg = Common.isResolvable(arg) ? arg.describe() : arg;
            }
        }

        const options = test.options;
        if (options) {
            if (options.hasRef) {
                item.arg = {};
                const keys = Object.keys(test.arg);
                for (const key of keys) {
                    const value = test.arg[key];
                    item.arg[key] = Common.isResolvable(value) ? value.describe() : value;
                }
            }

            if (typeof options.description === 'string') {
                item.description = options.description;
            }
            else if (typeof options.description === 'function') {
                item.description = options.description(item.arg);
            }
        }

        description.rules.push(item);
    }

    if (!description.rules.length) {
        delete description.rules;
    }

    return description;
};
