'use strict';

const ApplyToDefaults = require('@hapi/hoek/lib/applyToDefaults');
const Assert = require('@hapi/hoek/lib/assert');
const Clone = require('@hapi/hoek/lib/clone');
const Topo = require('@hapi/topo');

const Any = require('./any');
const Common = require('../common');
const Compile = require('../compile');
const Errors = require('../errors');
const Ref = require('../ref');
const Template = require('../template');


const internals = {
    renameDefaults: {
        alias: false,                   // Keep old value in place
        multiple: false,                // Allow renaming multiple keys into the same target
        override: false                 // Overrides an existing key
    }
};


module.exports = Any.extend({

    type: '_keys',

    properties: {
        typeof: 'object'
    },

    flags: {

        unknown: { default: false }
    },

    initialize(schema) {

        schema.$_terms.dependencies = null;
        schema.$_terms.keys = null;
        schema.$_terms.patterns = null;
        schema.$_terms.renames = null;
    },

    args(schema, keys) {

        return schema.keys(keys);
    },

    validate(schema, value, { error, state, prefs }) {

        if (!value ||
            typeof value !== schema.$_property('typeof') ||
            Array.isArray(value)) {

            return { value, errors: error('object.base', { type: schema.$_property('typeof') }) };
        }

        // Skip if there are no other rules to test

        if (!schema.$_terms.renames &&
            !schema.$_terms.dependencies &&
            !schema.$_terms.keys &&                       // null allows any keys
            !schema.$_terms.patterns &&
            !schema.$_terms.externals) {

            return;
        }

        // Shallow clone value

        value = internals.clone(value, prefs);
        const errors = [];

        // Rename keys

        if (schema.$_terms.renames &&
            !internals.rename(schema, value, state, prefs, errors)) {

            return { value, errors };
        }

        // Anything allowed

        if (!schema.$_terms.keys &&                       // null allows any keys
            !schema.$_terms.patterns &&
            !schema.$_terms.dependencies) {

            return { value, errors };
        }

        // Defined keys

        const unprocessed = new Set(Object.keys(value));

        if (schema.$_terms.keys) {
            const ancestors = [value, ...state.ancestors];

            for (const child of schema.$_terms.keys) {
                const key = child.key;
                const item = value[key];

                unprocessed.delete(key);

                const localState = state.localize([...state.path, key], ancestors, child.schema);
                const result = child.schema.$_validate(item, localState, prefs);

                if (result.errors) {
                    if (prefs.abortEarly) {
                        return { value, errors: result.errors };
                    }

                    errors.push(...result.errors);
                }
                else if (child.schema._flags.result === 'strip' ||
                    result.value === undefined && item !== undefined) {

                    delete value[key];
                }
                else if (result.value !== undefined) {
                    value[key] = result.value;
                }
            }
        }

        // Unknown keys

        if (unprocessed.size) {
            const early = internals.unknown(schema, value, unprocessed, errors, state, prefs);
            if (early) {
                return early;
            }
        }

        // Validate dependencies

        if (schema.$_terms.dependencies) {
            for (const dep of schema.$_terms.dependencies) {
                if (dep.key &&
                    dep.key.resolve(value, state, prefs, null, { shadow: false }) === undefined) {

                    continue;
                }

                const failed = internals.dependencies[dep.type](schema, dep, value, state, prefs);
                if (failed) {
                    const report = schema.$_createError(failed.code, value, failed.context, state, prefs);
                    if (prefs.abortEarly) {
                        return { value, errors: report };
                    }

                    errors.push(report);
                }
            }
        }

        return { value, errors };
    },

    rules: {

        and: {
            method(...peers /*, [options] */) {

                Common.verifyFlat(peers, 'and');

                return internals.dependency(this, 'and', null, peers);
            }
        },

        append: {
            method(schema) {

                if (schema === null ||
                    schema === undefined ||
                    Object.keys(schema).length === 0) {

                    return this;
                }

                return this.keys(schema);
            }
        },

        assert: {
            method(subject, schema, message) {

                if (!Template.isTemplate(subject)) {
                    subject = Compile.ref(subject);
                    Assert(subject.type === 'global' || subject.depth > 1, 'Cannot use assertions for root level references - use direct key rules instead');
                }

                Assert(message === undefined || typeof message === 'string', 'Message must be a string');

                schema = this.$_compile(schema, { appendPath: true });

                const obj = this.$_addRule({ name: 'assert', args: { subject, schema, message } });
                obj.$_mutateRegister(schema);
                return obj;
            },
            validate(value, { error, prefs, state }, { subject, schema, message }) {

                const entryState = state.entry(schema, value);
                if (schema.$_match(subject.resolve(null, { ancestors: [value, ...state.ancestors] }), entryState, prefs)) {
                    return value;
                }

                return error('object.assert', { subject, message });
            },
            args: ['subject', 'schema', 'message'],
            multi: true
        },

        instance: {
            method(constructor, name) {

                Assert(typeof constructor === 'function', 'constructor must be a function');

                name = name || constructor.name;

                return this.$_addRule({ name: 'instance', args: { constructor, name } });
            },
            validate(value, helpers, { constructor, name }) {

                if (value instanceof constructor) {
                    return value;
                }

                return helpers.error('object.instance', { type: name, value });
            },
            args: ['constructor', 'name']
        },

        keys: {
            method(schema) {

                Assert(schema === undefined || typeof schema === 'object', 'Object schema must be a valid object');
                Assert(!Common.isSchema(schema), 'Object schema cannot be a joi schema');

                const obj = this.clone();

                if (!schema) {                                      // Allow all
                    obj.$_terms.keys = null;
                }
                else if (!Object.keys(schema).length) {             // Allow none
                    obj.$_terms.keys = [];
                }
                else {
                    obj.$_terms.keys = obj.$_terms.keys ? obj.$_terms.keys.filter((child) => !schema.hasOwnProperty(child.key)) : [];
                    for (const key in schema) {
                        Common.tryWithPath(() => obj.$_terms.keys.push({ key, schema: this.$_compile(schema[key]) }), key);
                    }
                }

                return obj.$_mutateRebuild();
            }
        },

        length: {
            method(limit) {

                return this.$_addRule({ name: 'length', args: { limit }, operator: '=' });
            },
            validate(value, helpers, { limit }, { name, operator, args }) {

                if (Common.compare(Object.keys(value).length, limit, operator)) {
                    return value;
                }

                return helpers.error('object.' + name, { limit: args.limit, value });
            },
            args: [
                {
                    name: 'limit',
                    ref: true,
                    assert: Common.limit,
                    message: 'must be a positive integer'
                }
            ]
        },

        max: {
            method(limit) {

                return this.$_addRule({ name: 'max', method: 'length', args: { limit }, operator: '<=' });
            }
        },

        min: {
            method(limit) {

                return this.$_addRule({ name: 'min', method: 'length', args: { limit }, operator: '>=' });
            }
        },

        nand: {
            method(...peers /*, [options] */) {

                Common.verifyFlat(peers, 'nand');

                return internals.dependency(this, 'nand', null, peers);
            }
        },

        or: {
            method(...peers /*, [options] */) {

                Common.verifyFlat(peers, 'or');

                return internals.dependency(this, 'or', null, peers);
            }
        },

        oxor: {
            method(...peers /*, [options] */) {

                return internals.dependency(this, 'oxor', null, peers);
            }
        },

        pattern: {
            method(pattern, schema, options = {}) {

                const isRegExp = pattern instanceof RegExp;
                Assert(isRegExp || Common.isSchema(pattern), 'pattern must be a regex or schema');
                Assert(schema !== undefined, 'Invalid rule');
                Common.assertOptions(options, ['fallthrough', 'matches']);

                if (isRegExp) {
                    Assert(!pattern.flags.includes('g') && !pattern.flags.includes('y'), 'pattern should not use global or sticky mode');
                }

                schema = this.$_compile(schema, { appendPath: true });

                const obj = this.clone();
                obj.$_terms.patterns = obj.$_terms.patterns || [];
                const config = { [isRegExp ? 'regex' : 'schema']: pattern, rule: schema };
                if (options.matches) {
                    config.matches = this.$_compile(options.matches);
                    obj.$_mutateRegister(config.matches);
                }

                if (options.fallthrough) {
                    config.fallthrough = true;
                }

                obj.$_terms.patterns.push(config);
                obj.$_mutateRegister(schema);
                return obj;
            }
        },

        ref: {
            method() {

                return this.$_addRule('ref');
            },
            validate(value, helpers) {

                if (Ref.isRef(value)) {
                    return value;
                }

                return helpers.error('object.refType', { value });
            }
        },

        rename: {
            method(from, to, options = {}) {

                Assert(typeof from === 'string' || from instanceof RegExp, 'Rename missing the from argument');
                Assert(typeof to === 'string' || to instanceof Template, 'Invalid rename to argument');
                Assert(to !== from, 'Cannot rename key to same name:', from);

                Common.assertOptions(options, ['alias', 'ignoreUndefined', 'override', 'multiple']);

                const obj = this.clone();

                obj.$_terms.renames = obj.$_terms.renames || [];
                for (const rename of obj.$_terms.renames) {
                    Assert(rename.from !== from, 'Cannot rename the same key multiple times');
                }

                if (to instanceof Template) {
                    obj.$_mutateRegister(to);
                }

                obj.$_terms.renames.push({
                    from,
                    to,
                    options: ApplyToDefaults(internals.renameDefaults, options)
                });

                return obj;
            }
        },

        schema: {
            method(type = 'any') {

                return this.$_addRule({ name: 'schema', args: { type } });
            },
            validate(value, helpers, { type }) {

                if (Common.isSchema(value) &&
                    (type === 'any' || value.type === type)) {

                    return value;
                }

                return helpers.error('object.schema', { type });
            }
        },

        unknown: {
            method(allow) {

                return this.$_setFlag('unknown', allow !== false);
            }
        },

        with: {
            method(key, peers, options = {}) {

                return internals.dependency(this, 'with', key, peers, options);
            }
        },

        without: {
            method(key, peers, options = {}) {

                return internals.dependency(this, 'without', key, peers, options);
            }
        },

        xor: {
            method(...peers /*, [options] */) {

                Common.verifyFlat(peers, 'xor');

                return internals.dependency(this, 'xor', null, peers);
            }
        }
    },

    overrides: {

        default(value, options) {

            if (value === undefined) {
                value = Common.symbols.deepDefault;
            }

            return this.$_super.default(value, options);
        },

        tailor(targets) {

            let obj = this.$_super.tailor(targets);
            if (obj === this) {
                obj = this.clone();
            }

            if (obj.$_terms.keys) {
                for (let i = 0; i < obj.$_terms.keys.length; ++i) {
                    const child = obj.$_terms.keys[i];
                    obj.$_terms.keys[i] = Object.assign({}, child, { schema: child.schema.tailor(targets) });
                }
            }

            if (obj.$_terms.patterns) {
                for (let i = 0; i < obj.$_terms.patterns.length; ++i) {
                    const pattern = obj.$_terms.patterns[i];
                    for (const key of ['schema', 'rule', 'matches']) {
                        if (pattern[key]) {
                            obj.$_terms.patterns[i] = Object.assign({}, pattern, { [key]: pattern[key].tailor(targets) });
                        }
                    }
                }
            }

            obj = obj.$_replaceRules('assert', (rule) => {

                const clone = Clone(rule);
                clone.args.schema = clone.args.schema.tailor(targets);
                return clone;
            });

            return obj.$_mutateRebuild();
        }
    },

    fork(schema, id, replacement) {

        if (schema.$_terms.keys) {
            for (const child of schema.$_terms.keys) {
                const childId = child.schema._flags.id || child.key;
                if (id === childId) {
                    return schema.keys({ [child.key]: replacement });
                }
            }
        }

        if (schema.$_terms.patterns) {
            for (let i = 0; i < schema.$_terms.patterns.length; ++i) {
                const pattern = schema.$_terms.patterns[i];
                for (const key of ['schema', 'rule', 'matches']) {
                    if (pattern[key] &&
                        id === pattern[key]._flags.id) {

                        const obj = schema.clone();
                        obj.$_terms.patterns[i] = Object.assign({}, pattern, { [key]: replacement });
                        return obj.$_mutateRebuild();
                    }
                }
            }
        }

        const modified = schema.$_replaceRules('assert', (rule) => {

            if (id === rule.args.schema._flags.id) {
                const clone = Clone(rule);
                clone.args.schema = replacement;
                return clone;
            }
        });

        if (modified !== schema) {
            return modified;
        }
    },

    rebuild(schema) {

        if (schema.$_terms.keys) {
            const topo = new Topo();

            for (const child of schema.$_terms.keys) {
                Common.tryWithPath(() => topo.add(child, { after: child.schema.$_rootReferences(), group: child.key }), child.key);
                schema.$_mutateRegister(child.schema, { key: child.key });
            }

            schema.$_terms.keys = new internals.Keys(...topo.nodes);
        }

        if (schema.$_terms.patterns) {
            for (const pattern of schema.$_terms.patterns) {
                for (const key of ['schema', 'rule', 'matches']) {
                    schema.$_mutateRegister(pattern[key]);
                }
            }
        }

        const assertions = schema.$_getRules('assert');
        for (const assertion of assertions) {
            schema.$_mutateRegister(assertion.args.schema);
        }

        return schema;
    },

    manifest: {

        terms: {
            keys: { mapped: 'key' }
        },

        build(obj, desc) {

            if (desc.keys) {
                obj = obj.keys(desc.keys);
            }

            if (desc.dependencies) {
                for (const { type, key = null, peers, options } of desc.dependencies) {
                    obj = internals.dependency(obj, type, key, peers, options);
                }
            }

            if (desc.patterns) {
                for (const { regex, schema, rule, fallthrough, matches } of desc.patterns) {
                    obj = obj.pattern(regex || schema, rule, { fallthrough, matches });
                }
            }

            if (desc.renames) {
                for (const { from, to, options } of desc.renames) {
                    obj = obj.rename(from, to, options);
                }
            }

            return obj;
        }
    },

    messages: {
        'object.and': '"{{#label}}" contains {{#presentWithLabels}} without its required peers {{#missingWithLabels}}',
        'object.assert': '"{{#label}}" is invalid because {if(#subject.key, `"` + #subject.key + `" failed to ` + (#message || "pass the assertion test"), #message || "the assertion failed")}',
        'object.base': '"{{#label}}" must be of type {{#type}}',
        'object.instance': '"{{#label}}" must be an instance of "{{#type}}"',
        'object.length': '"{{#label}}" must have {{#limit}} keys',
        'object.max': '"{{#label}}" must have less than or equal to {{#limit}} keys',
        'object.min': '"{{#label}}" must have at least {{#limit}} keys',
        'object.missing': '"{{#label}}" must contain at least one of {{#peersWithLabels}}',
        'object.nand': '"{{#mainWithLabel}}" must not exist simultaneously with {{#peersWithLabels}}',
        'object.oxor': '"{{#label}}" contains a conflict between optional exclusive peers {{#peersWithLabels}}',
        'object.pattern.match': '"{{#label}}" keys failed to match pattern requirements',
        'object.refType': '"{{#label}}" must be a Joi reference',
        'object.rename.multiple': '"{{#label}}" cannot rename "{{#from}}" because multiple renames are disabled and another key was already renamed to "{{#to}}"',
        'object.rename.override': '"{{#label}}" cannot rename "{{#from}}" because override is disabled and target "{{#to}}" exists',
        'object.schema': '"{{#label}}" must be a Joi schema of {{#type}} type',
        'object.unknown': '"{{#label}}" is not allowed',
        'object.with': '"{{#mainWithLabel}}" missing required peer "{{#peerWithLabel}}"',
        'object.without': '"{{#mainWithLabel}}" conflict with forbidden peer "{{#peerWithLabel}}"',
        'object.xor': '"{{#label}}" contains a conflict between exclusive peers {{#peersWithLabels}}'
    }
});


// Helpers

internals.clone = function (value, prefs) {

    // Object

    if (typeof value === 'object') {
        if (prefs.nonEnumerables) {
            return Clone(value, { shallow: true });
        }

        const clone = Object.create(Object.getPrototypeOf(value));
        Object.assign(clone, value);
        return clone;
    }

    // Function

    const clone = function (...args) {

        return value.apply(this, args);
    };

    clone.prototype = Clone(value.prototype);
    Object.defineProperty(clone, 'name', { value: value.name, writable: false });
    Object.defineProperty(clone, 'length', { value: value.length, writable: false });
    Object.assign(clone, value);
    return clone;
};


internals.dependency = function (schema, type, key, peers, options) {

    Assert(key === null || typeof key === 'string', type, 'key must be a strings');

    // Extract options from peers array

    if (!options) {
        options = peers.length > 1 && typeof peers[peers.length - 1] === 'object' ? peers.pop() : {};
    }

    Common.assertOptions(options, ['separator']);

    peers = [].concat(peers);

    // Cast peer paths

    const separator = Common.default(options.separator, '.');
    const paths = [];
    for (const peer of peers) {
        Assert(typeof peer === 'string', type, 'peers must be a string or a reference');
        paths.push(Compile.ref(peer, { separator, ancestor: 0 }));
    }

    // Cast key

    if (key !== null) {
        key = Compile.ref(key, { separator, ancestor: 0 });
    }

    // Add rule

    const obj = schema.clone();
    obj.$_terms.dependencies = obj.$_terms.dependencies || [];
    obj.$_terms.dependencies.push(new internals.Dependency(type, key, paths, peers));
    return obj;
};


internals.dependencies = {

    and(schema, dep, value, state, prefs) {

        const missing = [];
        const present = [];
        const count = dep.peers.length;
        for (const peer of dep.peers) {
            if (peer.resolve(value, state, prefs, null, { shadow: false }) === undefined) {
                missing.push(peer.key);
            }
            else {
                present.push(peer.key);
            }
        }

        if (missing.length !== count &&
            present.length !== count) {

            return {
                code: 'object.and',
                context: {
                    present,
                    presentWithLabels: internals.keysToLabels(schema, present),
                    missing,
                    missingWithLabels: internals.keysToLabels(schema, missing)
                }
            };
        }
    },

    nand(schema, dep, value, state, prefs) {

        const present = [];
        for (const peer of dep.peers) {
            if (peer.resolve(value, state, prefs, null, { shadow: false }) !== undefined) {
                present.push(peer.key);
            }
        }

        if (present.length !== dep.peers.length) {
            return;
        }

        const main = dep.paths[0];
        const values = dep.paths.slice(1);
        return {
            code: 'object.nand',
            context: {
                main,
                mainWithLabel: internals.keysToLabels(schema, main),
                peers: values,
                peersWithLabels: internals.keysToLabels(schema, values)
            }
        };
    },

    or(schema, dep, value, state, prefs) {

        for (const peer of dep.peers) {
            if (peer.resolve(value, state, prefs, null, { shadow: false }) !== undefined) {
                return;
            }
        }

        return {
            code: 'object.missing',
            context: {
                peers: dep.paths,
                peersWithLabels: internals.keysToLabels(schema, dep.paths)
            }
        };
    },

    oxor(schema, dep, value, state, prefs) {

        const present = [];
        for (const peer of dep.peers) {
            if (peer.resolve(value, state, prefs, null, { shadow: false }) !== undefined) {
                present.push(peer.key);
            }
        }

        if (!present.length ||
            present.length === 1) {

            return;
        }

        const context = { peers: dep.paths, peersWithLabels: internals.keysToLabels(schema, dep.paths) };
        context.present = present;
        context.presentWithLabels = internals.keysToLabels(schema, present);
        return { code: 'object.oxor', context };
    },

    with(schema, dep, value, state, prefs) {

        for (const peer of dep.peers) {
            if (peer.resolve(value, state, prefs, null, { shadow: false }) === undefined) {
                return {
                    code: 'object.with',
                    context: {
                        main: dep.key.key,
                        mainWithLabel: internals.keysToLabels(schema, dep.key.key),
                        peer: peer.key,
                        peerWithLabel: internals.keysToLabels(schema, peer.key)
                    }
                };
            }
        }
    },

    without(schema, dep, value, state, prefs) {

        for (const peer of dep.peers) {
            if (peer.resolve(value, state, prefs, null, { shadow: false }) !== undefined) {
                return {
                    code: 'object.without',
                    context: {
                        main: dep.key.key,
                        mainWithLabel: internals.keysToLabels(schema, dep.key.key),
                        peer: peer.key,
                        peerWithLabel: internals.keysToLabels(schema, peer.key)
                    }
                };
            }
        }
    },

    xor(schema, dep, value, state, prefs) {

        const present = [];
        for (const peer of dep.peers) {
            if (peer.resolve(value, state, prefs, null, { shadow: false }) !== undefined) {
                present.push(peer.key);
            }
        }

        if (present.length === 1) {
            return;
        }

        const context = { peers: dep.paths, peersWithLabels: internals.keysToLabels(schema, dep.paths) };
        if (present.length === 0) {
            return { code: 'object.missing', context };
        }

        context.present = present;
        context.presentWithLabels = internals.keysToLabels(schema, present);
        return { code: 'object.xor', context };
    }
};


internals.keysToLabels = function (schema, keys) {

    if (Array.isArray(keys)) {
        return keys.map((key) => schema.$_mapLabels(key));
    }

    return schema.$_mapLabels(keys);
};


internals.rename = function (schema, value, state, prefs, errors) {

    const renamed = {};
    for (const rename of schema.$_terms.renames) {
        const matches = [];
        const pattern = typeof rename.from !== 'string';

        if (!pattern) {
            if (Object.prototype.hasOwnProperty.call(value, rename.from) &&
                (value[rename.from] !== undefined || !rename.options.ignoreUndefined)) {

                matches.push(rename);
            }
        }
        else {
            for (const from in value) {
                if (value[from] === undefined &&
                    rename.options.ignoreUndefined) {

                    continue;
                }

                if (from === rename.to) {
                    continue;
                }

                const match = rename.from.exec(from);
                if (!match) {
                    continue;
                }

                matches.push({ from, to: rename.to, match });
            }
        }

        for (const match of matches) {
            const from = match.from;
            let to = match.to;
            if (to instanceof Template) {
                to = to.render(value, state, prefs, match.match);
            }

            if (from === to) {
                continue;
            }

            if (!rename.options.multiple &&
                renamed[to]) {

                errors.push(schema.$_createError('object.rename.multiple', value, { from, to, pattern }, state, prefs));
                if (prefs.abortEarly) {
                    return false;
                }
            }

            if (Object.prototype.hasOwnProperty.call(value, to) &&
                !rename.options.override &&
                !renamed[to]) {

                errors.push(schema.$_createError('object.rename.override', value, { from, to, pattern }, state, prefs));
                if (prefs.abortEarly) {
                    return false;
                }
            }

            if (value[from] === undefined) {
                delete value[to];
            }
            else {
                value[to] = value[from];
            }

            renamed[to] = true;

            if (!rename.options.alias) {
                delete value[from];
            }
        }
    }

    return true;
};


internals.unknown = function (schema, value, unprocessed, errors, state, prefs) {

    if (schema.$_terms.patterns) {
        let hasMatches = false;
        const matches = schema.$_terms.patterns.map((pattern) => {

            if (pattern.matches) {
                hasMatches = true;
                return [];
            }
        });

        const ancestors = [value];

        for (const key of unprocessed) {
            const item = value[key];
            const path = [...state.path, key];

            for (let i = 0; i < schema.$_terms.patterns.length; ++i) {
                const pattern = schema.$_terms.patterns[i];
                const match = pattern.regex ? pattern.regex.test(key) : pattern.schema.$_match(key, state.nest(pattern.schema), prefs);
                if (!match) {
                    continue;
                }

                unprocessed.delete(key);

                const localState = state.localize(path, ancestors, pattern.rule);
                const result = pattern.rule.$_validate(item, localState, prefs);
                if (result.errors) {
                    if (prefs.abortEarly) {
                        return { value, errors: result.errors };
                    }

                    errors.push(...result.errors);
                }

                if (pattern.matches) {
                    matches[i].push(key);
                }

                value[key] = result.value;
                if (!pattern.fallthrough) {
                    break;
                }
            }
        }

        // Validate pattern matches rules

        if (hasMatches) {
            for (let i = 0; i < matches.length; ++i) {
                const match = matches[i];
                if (!match) {
                    continue;
                }

                const localState = state.localize(state.path, ancestors, schema.$_terms.patterns[i].matches);
                const result = schema.$_terms.patterns[i].matches.$_validate(match, localState, prefs);
                if (result.errors) {
                    const details = Errors.details(result.errors, { override: false });
                    details.matches = match;
                    const report = schema.$_createError('object.pattern.match', value, details, state, prefs);
                    if (prefs.abortEarly) {
                        return { value, errors: report };
                    }

                    errors.push(report);
                }
            }
        }
    }

    if (!unprocessed.size ||
        !schema.$_terms.keys && !schema.$_terms.patterns) {     // If no keys or patterns specified, unknown keys allowed

        return;
    }

    if (prefs.stripUnknown && !schema._flags.unknown ||
        prefs.skipFunctions) {

        const stripUnknown = prefs.stripUnknown ? (prefs.stripUnknown === true ? true : !!prefs.stripUnknown.objects) : false;

        for (const key of unprocessed) {
            if (stripUnknown) {
                delete value[key];
                unprocessed.delete(key);
            }
            else if (typeof value[key] === 'function') {
                unprocessed.delete(key);
            }
        }
    }

    const forbidUnknown = !Common.default(schema._flags.unknown, prefs.allowUnknown);
    if (forbidUnknown) {
        for (const unprocessedKey of unprocessed) {
            const localState = state.localize([...state.path, unprocessedKey], []);
            const report = schema.$_createError('object.unknown', value[unprocessedKey], { child: unprocessedKey }, localState, prefs, { flags: false });
            if (prefs.abortEarly) {
                return { value, errors: report };
            }

            errors.push(report);
        }
    }
};


internals.Dependency = class {

    constructor(type, key, peers, paths) {

        this.type = type;
        this.key = key;
        this.peers = peers;
        this.paths = paths;
    }

    describe() {

        const desc = {
            type: this.type,
            peers: this.paths
        };

        if (this.key !== null) {
            desc.key = this.key.key;
        }

        if (this.peers[0].separator !== '.') {
            desc.options = { separator: this.peers[0].separator };
        }

        return desc;
    }
};


internals.Keys = class extends Array {

    concat(source) {

        const result = this.slice();

        const keys = new Map();
        for (let i = 0; i < result.length; ++i) {
            keys.set(result[i].key, i);
        }

        for (const item of source) {
            const key = item.key;
            const pos = keys.get(key);
            if (pos >= 0) {
                result[pos] = { key, schema: result[pos].schema.concat(item.schema) };
            }
            else {
                result.push(item);
            }
        }

        return result;
    }
};
