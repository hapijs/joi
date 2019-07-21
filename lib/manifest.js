'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('./common');
const Messages = require('./messages');
const Ref = require('./ref');
const Template = require('./template');

let Schemas;


const internals = {
    flagDefaults: {
        allowOnly: false,
        allowUnknown: false,
        cast: false,
        func: false,
        insensitive: false,
        once: true,
        presence: 'optional',
        sparse: false,
        strip: false,
        timestamp: false,
        truncate: false,
        unsafe: false
    }
};


exports.describe = function (schema) {

    // Type

    const description = {
        type: schema._type,
        flags: {}
    };

    // Flags

    for (const flag in schema._flags) {
        if (flag[0] !== '_' &&
            schema._flags[flag] !== internals.flagDefaults[flag]) {

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

        for (const custom of ['keep', 'message', 'warn']) {
            if (test[custom] !== undefined) {
                item[custom] = test[custom];
            }
        }

        if (test.args) {
            item.args = {};
            for (const key in test.args) {
                const arg = test.args[key];
                if (key === 'options' &&
                    !Object.keys(arg).length) {

                    continue;
                }

                item.args[key] = internals.describe(arg, { assign: key });
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
            normalized.push(internals.describe(item, { inner: true }));
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

    internals.validate(schema._root, description);
    return description;
};


exports.build = function (joi, desc) {

    internals.validate(joi, desc);

    // Type

    const schema = joi[desc.type]().clone();

    // Flags

    if (desc.flags) {
        for (const flag in desc.flags) {
            schema._flags[flag] = internals.build(desc.flags[flag]);
        }
    }

    schema._ruleset = false;
    return schema;

    /*

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

        for (const custom of ['keep', 'message', 'warn']) {
            if (test[custom] !== undefined) {
                item[custom] = test[custom];
            }
        }

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
            normalized.push(internals.describe(item));
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
    */
};


internals.describe = function (item, options = {}) {

    if (item === Common.symbols.deepDefault) {
        return { special: 'deep' };
    }

    if (!item ||
        typeof item !== 'object' ||
        options.assign === 'options') {

        return item;
    }

    if (Array.isArray(item)) {
        return item;
    }

    if (item instanceof RegExp) {
        if (options.assign === 'regex') {
            return item.toString();
        }

        return { regex: item.toString() };
    }

    if (item[Common.symbols.literal]) {
        return { function: item.literal, options: { literal: true } };
    }

    if (typeof item.describe === 'function') {
        if (options.assign === 'ref') {
            return item.describe().ref;
        }

        return item.describe();
    }

    const normalized = {};
    for (const key in item) {
        const value = item[key];
        if (value === undefined ||
            value === null) {

            continue;
        }

        normalized[key] = internals.describe(value, { inner: options.inner, assign: key });
    }

    return options.inner ? normalized : { value: normalized };
};


internals.build = function (desc, key) {

    if (key === 'object') {
        return Hoek.clone(desc);
    }

    if (typeof desc !== 'object') {
        return desc;
    }

    if (desc.value) {
        return Hoek.clone(desc.value);
    }

    if (desc.special) {
        Hoek.assert(['deep'].includes(desc.special), 'Unknown special value', desc.special);
        return Common.symbols.deepDefault;
    }

    if (key === 'ref') {
        return Ref.build(desc);
    }

    if (desc.ref) {
        return Ref.build(desc.ref);
    }

    Hoek.assert(desc.template, 'Unknown description value');

    return Template.build(desc);
};


internals.validate = function (joi, desc) {

    Schemas = Schemas || require('./schemas');

    joi.assert(desc, Schemas.description);
};
