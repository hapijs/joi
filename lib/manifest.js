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
        if (flag[0] !== '_') {
            description.flags[flag] = internals.describe(schema._flags[flag]);
        }
    }

    if (!Object.keys(description.flags).length) {
        delete description.flags;
    }

    // Preferences

    if (schema._preferences) {
        description.preferences = Hoek.clone(schema._preferences, { shallow: ['messages'] });
        if (description.preferences.messages) {
            description.preferences.messages = Messages.decompile(description.preferences.messages);
        }
    }

    // Valids

    if (schema._valids) {
        description.valids = schema._valids.describe();
    }

    if (schema._invalids) {
        description.invalids = schema._invalids.describe();
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

                item.args[key] = internals.describe(arg, key);
            }

            if (!Object.keys(item.args).length) {
                delete item.args;
            }
        }

        const options = test.options;
        if (options) {
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

    // Inners

    for (const inner in schema._inners) {
        if (inner[0] === '_') {
            continue;
        }

        const items = schema._inners[inner];
        if (!items) {
            continue;
        }

        if (items instanceof Map) {
            if (items.size) {
                description[inner] = [...items.entries()];
            }

            continue;
        }

        if (Common.isValues(items)) {
            if (items.length) {
                description[inner] = items.describe();
            }

            continue;
        }

        if (!items.length) {
            continue;
        }

        let normalized = [];
        for (const item of items) {
            normalized.push(internals.inner(item));
        }

        if (inner === 'children') {
            const mapped = {};
            for (const item of normalized) {
                mapped[item.key] = item.schema;
            }

            normalized = mapped;
        }

        description[inner] = inner === 'link' ? normalized[0] : normalized;
    }

    return description;
};


internals.inner = function (item, assign) {

    if (typeof item !== 'object') {
        return item;
    }

    if (typeof item.describe === 'function') {
        if (assign === 'ref') {
            return item.describe().ref;
        }

        return item.describe();
    }

    if (Array.isArray(item)) {
        return item;
    }

    if (item instanceof RegExp) {
        return { regex: item.toString() };
    }

    const normalized = {};
    for (const key in item) {
        const value = item[key];
        if (value === undefined ||
            value === null) {

            continue;
        }

        normalized[key] = internals.inner(value, key);
    }

    return normalized;
};


internals.describe = function (value, key) {

    if (typeof value === 'function') {
        return {
            description: value.description,
            function: value
        };
    }

    if (typeof value !== 'object' ||
        key === 'options') {

        return value;
    }

    if (typeof value.describe === 'function') {
        if (key === 'ref') {
            return value.describe().ref;
        }

        return value.describe();
    }

    return { value };
};
