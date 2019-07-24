'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('./common');
const Messages = require('./messages');
const Ref = require('./ref');
const Template = require('./template');

let Schemas;


const internals = {};


exports.describe = function (schema) {

    // Type

    const desc = {
        type: schema._flags._func ? 'func' : schema._type,
        flags: {},
        rules: []
    };

    // Flags

    for (const flag in schema._flags) {
        if (flag[0] !== '_' &&
            schema._flags[flag] !== internals.flagDefaults(desc.type, flag)) {

            desc.flags[flag] = internals.describe(schema._flags[flag]);
        }
    }

    if (!Object.keys(desc.flags).length) {
        delete desc.flags;
    }

    // Preferences

    if (schema._preferences) {
        desc.preferences = Hoek.clone(schema._preferences, { shallow: ['messages'] });
        if (desc.preferences.messages) {
            desc.preferences.messages = Messages.decompile(desc.preferences.messages);
        }
    }

    // Allow / Invalid

    if (schema._valids) {
        desc.allow = schema._valids.describe();
    }

    if (schema._invalids) {
        const clean = schema._root[schema._type]();
        if (!Hoek.deepEqual(schema._invalids, clean._invalids)) {
            desc.invalid = schema._invalids.describe();
        }
    }

    // Rules

    for (const test of schema._tests) {
        if (test.name === 'items') {
            continue;
        }

        const item = { name: test.name };

        for (const custom of ['keep', 'message', 'warn']) {
            if (test[custom] !== undefined) {
                item[custom] = internals.describe(test[custom]);
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

        desc.rules.push(item);
    }

    if (!desc.rules.length) {
        delete desc.rules;
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
                desc[inner] = [...items.entries()];
            }

            continue;
        }

        if (Common.isValues(items)) {
            if (items.length) {
                desc[inner] = items.describe();
            }

            continue;
        }

        if (!items.length &&
            inner !== 'keys') {
            continue;
        }

        let normalized = [];
        for (const item of items) {
            normalized.push(internals.describe(item));
        }

        if (inner === 'keys') {
            const mapped = {};
            for (const item of normalized) {
                mapped[item.key] = item.schema;
            }

            normalized = mapped;
        }

        desc[inner] = inner === 'link' ? normalized[0] : normalized;
    }

    internals.validate(schema._root, desc);
    return desc;
};


internals.describe = function (item, options = {}) {

    if (item === Common.symbols.deepDefault) {
        return { special: 'deep' };
    }

    if (typeof item !== 'object') {
        return item;
    }

    if (options.assign === 'options' ||
        Array.isArray(item)) {

        return Hoek.clone(item);
    }

    if (item instanceof Date) {
        return item.toISOString();
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

        normalized[key] = internals.describe(value, { assign: key });
    }

    return normalized;
};


exports.build = function (joi, desc) {

    const builder = new internals.Builder(joi);
    return builder.parse(desc);
};


internals.Builder = class {

    constructor(joi) {

        this.joi = joi;
    }

    parse(desc) {

        internals.validate(this.joi, desc);

        // Type

        let schema = this.joi[desc.type]();

        // Flags

        if (desc.flags) {
            for (const flag in desc.flags) {
                schema = schema[flag](this.build(desc.flags[flag]));
            }
        }

        // Preferences

        if (desc.preferences) {
            schema = schema.preferences(this.structure(desc.preferences));
        }

        // Allow / Invalid

        if (desc.allow) {
            schema = schema.allow(...this.build(desc.allow));
        }

        if (desc.invalid) {
            schema = schema.invalid(...this.build(desc.invalid));
        }

        // Rules

        if (desc.rules) {
            for (const rule of desc.rules) {
                Hoek.assert(typeof schema[rule.name] === 'function', 'Invalid rule', rule.name, 'for type', desc.type);

                const args = [];
                if (rule.args) {
                    const built = {};
                    for (const key in rule.args) {
                        built[key] = this.build(rule.args[key], { assign: key });
                    }

                    const keys = Object.keys(built);
                    const definition = schema._rules[rule.name] && schema._rules[rule.name].args;
                    if (definition) {
                        Hoek.assert(keys.length <= definition.length, 'Invalid number of arguments for', desc.type, rule.name, '(expected up to', definition.length, ', found', keys.length, ')');
                        for (const arg of definition) {
                            args.push(built[arg]);
                        }
                    }
                    else {
                        Hoek.assert(keys.length === 1, 'Invalid number of arguments for', desc.type, rule.name, '(expected up to 1, found', keys.length, ')');
                        args.push(built[keys[0]]);
                    }
                }

                // Apply

                schema = schema[rule.name](...args);

                // Ruleset

                const options = {};
                for (const custom of ['keep', 'message', 'warn']) {
                    if (rule[custom] !== undefined) {
                        options[custom] = this.build(rule[custom]);
                    }
                }

                if (Object.keys(options).length) {
                    schema = schema.rule(options);
                }

                //const options = test.options;
                //if (options) {
                //    if (typeof options.description === 'string') {
                //        item.description = options.description;
                //    }
                //    else if (typeof options.description === 'function') {
                //        item.description = options.description(item.args);
                //    }
                //}
            }
        }

        // Inners

        const inners = {};
        for (const key in desc) {
            if (['allow', 'flags', 'invalid', 'keys', 'preferences', 'rules', 'type'].includes(key)) {
                continue;
            }

            if (['items', 'ordered'].includes(key)) {
                inners[key] = desc[key].map((item) => this.parse(item));
                continue;
            }

            if (['falsy', 'truthy'].includes(key)) {
                inners[key] = desc[key].map((item) => this.build(item));
                continue;
            }

            if (key === 'link') {
                inners.link = this.build(desc.link);
                continue;
            }

            const values = this.structure(desc[key]);
            if (['examples', 'externals', 'metas', 'notes', 'tags'].includes(key)) {
                for (const value of values) {
                    schema = schema[key.slice(0, -1)](value);
                }
            }
            else if (key === 'alterations') {
                const alter = {};
                for (const { target, adjuster } of values) {
                    alter[target] = adjuster;
                }

                schema = schema.alter(alter);
            }
            else {
                inners[key] = values;
            }
        }

        if (desc.keys) {
            inners.keys = {};
            for (const key in desc.keys) {
                inners.keys[key] = this.parse(desc.keys[key]);
            }
        }

        if (typeof schema._build === 'function' &&
            Object.keys(inners).length) {

            schema = schema._build(inners);
        }

        return schema;
    }

    build(desc, options = {}) {

        if (desc === null) {
            return null;
        }

        if (Array.isArray(desc)) {
            return desc.map((item) => this.build(item));
        }

        if (options.assign === 'options') {
            return Hoek.clone(desc);
        }

        if (options.assign === 'regex') {
            return internals.regex(desc);
        }

        if (typeof desc !== 'object') {
            return desc;
        }

        if (desc.function) {
            return { [Common.symbols.literal]: true, literal: desc.function };
        }

        if (options.assign === 'ref') {
            return Ref.build(desc);
        }

        if (desc.ref) {
            return Ref.build(desc.ref);
        }

        if (desc.regex) {
            return internals.regex(desc.regex);
        }

        if (desc.special) {
            Hoek.assert(['deep'].includes(desc.special), 'Unknown special value', desc.special);
            return Common.symbols.deepDefault;
        }

        if (desc.type) {
            return this.parse(desc);
        }

        if (desc.value) {
            return Hoek.clone(desc.value);
        }

        if (desc.template) {
            return Template.build(desc);
        }
    }

    structure(desc) {

        if (typeof desc !== 'object') {
            return desc;
        }

        if (Array.isArray(desc)) {
            return desc.map((item) => this.structure(item));
        }

        const normalized = {};
        for (const key in desc) {
            let value = this.build(desc[key], { assign: key });
            if (value === undefined) {
                value = this.structure(desc[key]);
            }

            normalized[key] = value;
        }

        return normalized;
    }
};


internals.regex = function (string) {

    const end = string.lastIndexOf('/');
    const exp = string.slice(1, end);
    const flags = string.slice(end + 1);
    return new RegExp(exp, flags);
};


internals.validate = function (joi, desc) {

    Schemas = Schemas || require('./schemas');

    joi.assert(desc, Schemas.description);
};


internals.flagDefaults = function (type, flag) {

    if (type === 'boolean' &&
        flag === 'insensitive') {

        return true;
    }

    if (['insensitive', 'only', 'single', 'sparse', 'strip', 'truncate', 'unknown', 'unsafe'].includes(flag)) {
        return false;
    }
};
