'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('./common');
const Ref = require('./ref');


const internals = {
    exclude: ['lazy', 'label']
};


exports.describe = function (schema) {

    const description = {
        type: schema._type,
        [Common.symbols.schema]: schema
    };

    const flags = Object.keys(schema._flags).filter((name) => name[0] !== '_' && !internals.exclude.includes(name));
    if (flags.length) {
        description.flags = {};
        for (const flag of flags) {
            const value = schema._flags[flag];
            switch (flag) {

                case 'empty':
                    description.flags[flag] = value.describe();
                    break;

                case 'default':
                case 'failover':
                    if (Ref.isRef(value)) {
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

                default:
                    description.flags[flag] = value;
                    break;
            }
        }
    }

    if (schema._preferences) {
        description.options = Hoek.clone(schema._preferences);
    }

    if (schema._baseType) {
        description.base = schema._baseType.describe();
    }

    if (schema._description) {
        description.description = schema._description;
    }

    if (schema._notes.length) {
        description.notes = schema._notes;
    }

    if (schema._tags.length) {
        description.tags = schema._tags;
    }

    if (schema._meta.length) {
        description.meta = schema._meta;
    }

    if (schema._examples.length) {
        description.examples = schema._examples;
    }

    if (schema._unit) {
        description.unit = schema._unit;
    }

    const valids = schema._valids ? schema._valids.values() : [];
    if (valids.length) {
        description.valids = valids.map((v) => {

            return Ref.isRef(v) ? v.describe() : v;
        });
    }

    const invalids = schema._invalids ? schema._invalids.values() : [];
    if (invalids.length) {
        description.invalids = invalids.map((v) => {

            return Ref.isRef(v) ? v.describe() : v;
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
                            args[key] = Ref.isRef(inner) ? inner.describe() : inner;
                        }
                    }

                    arg = args;
                }
            }

            if (arg !== undefined) {
                item.arg = Ref.isRef(arg) ? arg.describe() : arg;
            }
        }

        const options = test.options;
        if (options) {
            if (options.hasRef) {
                item.arg = {};
                const keys = Object.keys(test.arg);
                for (const key of keys) {
                    const value = test.arg[key];
                    item.arg[key] = Ref.isRef(value) ? value.describe() : value;
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

    const label = schema._getLabel();
    if (label) {
        description.label = label;
    }

    return description;
};
