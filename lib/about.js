'use strict';

const Hoek = require('@hapi/hoek');

const Ref = require('./ref');


const internals = {
    flags: ['empty', 'default', 'lazy', 'label']
};


exports.describe = function (schema) {

    const description = {
        type: schema._type
    };

    const flags = Object.keys(schema._flags);
    if (flags.length) {
        if (internals.flags.some((flag) => schema._flags.hasOwnProperty(flag))) {
            description.flags = {};
            for (const flag of flags) {
                if (flag === 'empty') {
                    description.flags[flag] = schema._flags[flag].describe();
                }
                else if (flag === 'default') {
                    if (Ref.isRef(schema._flags[flag])) {
                        description.flags[flag] = schema._flags[flag].toString();
                    }
                    else if (typeof schema._flags[flag] === 'function') {
                        description.flags[flag] = {
                            description: schema._flags[flag].description,
                            function: schema._flags[flag]
                        };
                    }
                    else {
                        description.flags[flag] = schema._flags[flag];
                    }
                }
                else if (flag !== 'lazy' &&
                    flag !== 'label') {

                    description.flags[flag] = schema._flags[flag];
                }
            }
        }
        else {
            description.flags = schema._flags;
        }
    }

    if (schema._settings) {
        description.options = Hoek.clone(schema._settings);
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

    const valids = schema._valids.values();
    if (valids.length) {
        description.valids = valids.map((v) => {

            return Ref.isRef(v) ? v.toString() : v;
        });
    }

    const invalids = schema._invalids.values();
    if (invalids.length) {
        description.invalids = invalids.map((v) => {

            return Ref.isRef(v) ? v.toString() : v;
        });
    }

    description.rules = [];

    for (const test of schema._tests) {
        const item = { name: test.name };

        let arg = test.arg;
        if (arg !== undefined) {
            if (test.rule) {
                const keys = Object.keys(arg);
                if (keys.length === 1) {
                    arg = arg[keys[0]];
                }
            }

            item.arg = Ref.isRef(arg) ? arg.toString() : arg;
        }

        const options = test.options;
        if (options) {
            if (options.hasRef) {
                item.arg = {};
                const keys = Object.keys(test.arg);
                for (const key of keys) {
                    const value = test.arg[key];
                    item.arg[key] = Ref.isRef(value) ? value.toString() : value;
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
