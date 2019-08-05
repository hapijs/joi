'use strict';

const Bourne = require('@hapi/bourne');
const Hoek = require('@hapi/hoek');
const Topo = require('@hapi/topo');

const Any = require('./any');
const Cast = require('../cast');
const Common = require('../common');
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

    type: 'object',

    // Initialize

    initialize: function () {

        this._inners.dependencies = null;
        this._inners.keys = null;
        this._inners.patterns = null;
        this._inners.renames = null;
    },

    args: function (schema, keys) {

        return schema.keys(keys);
    },

    // Coerce

    coerce: {
        from: 'string',
        method: function (schema, value, helpers) {

            if (value[0] !== '{' &&
                !/^\s*\{/.test(value)) {

                return;
            }

            try {
                return { value: Bourne.parse(value) };
            }
            catch (ignoreErr) { }
        }
    },

    // Base validation

    validate: function (schema, value, { error, state, prefs }) {

        const type = schema._flags._func ? 'function' : 'object';
        if (!value ||
            typeof value !== type ||
            Array.isArray(value)) {

            return { value, errors: error(type + '.base') };
        }

        // Skip if there are no other rules to test

        if (!schema._inners.renames &&
            !schema._inners.dependencies &&
            !schema._inners.keys &&                       // null allows any keys
            !schema._inners.patterns &&
            !schema._inners.externals) {

            return;
        }

        // Shallow clone value

        value = internals.clone(value, prefs);
        const errors = [];

        // Rename keys

        if (schema._inners.renames &&
            !internals.rename(schema, value, state, prefs, errors)) {

            return { value, errors };
        }

        // Anything allowed

        if (!schema._inners.keys &&                       // null allows any keys
            !schema._inners.patterns &&
            !schema._inners.dependencies) {

            return { value, errors };
        }

        // Defined keys

        const unprocessed = new Set(Object.keys(value));

        if (schema._inners.keys) {
            const ancestors = [value, ...state.ancestors];

            for (const child of schema._inners.keys) {
                const key = child.key;
                const item = value[key];

                unprocessed.delete(key);

                const localState = state.localize([...state.path, key], ancestors, child.schema);
                const result = child.schema._validate(item, localState, prefs);

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

        if (schema._inners.dependencies) {
            for (const dep of schema._inners.dependencies) {
                if (dep.key &&
                    dep.key.resolve(value, state, prefs, null, { shadow: false }) === undefined) {

                    continue;
                }

                const failed = internals.dependencies[dep.type](schema, dep, value, state, prefs);
                if (failed) {
                    const report = schema.createError(failed.code, value, failed.context, state, prefs);
                    if (prefs.abortEarly) {
                        return { value, errors: report };
                    }

                    errors.push(report);
                }
            }
        }

        return { value, errors };
    },

    // Rules

    rules: {

        and: {
            method: function (...peers /*, [options] */) {

                Common.verifyFlat(peers, 'and');

                return internals.dependency(this, 'and', null, peers);
            }
        },

        append: {
            method: function (schema) {

                if (schema === null ||
                    schema === undefined ||
                    Object.keys(schema).length === 0) {

                    return this;
                }

                return this.keys(schema);
            }
        },

        assert: {
            method: function (ref, schema, message) {

                ref = Cast.ref(ref);
                Hoek.assert(ref.type === 'global' || ref.depth > 1, 'Cannot use assertions for root level references - use direct key rules instead');
                message = message || 'pass the assertion test';
                Hoek.assert(typeof message === 'string', 'Message must be a string');

                schema = this._cast(schema, { appendPath: true });

                const path = ref.path.join('.');
                const obj = this.addRule({ name: 'assert', args: { ref, schema, message }, path });
                obj._register(schema);
                return obj;
            },
            validate: function (value, { error, prefs, state }, { ref, schema, message }, { path }) {

                const entryState = state.entry(schema, value);
                if (schema._match(ref.resolve(null, { ancestors: [value, ...state.ancestors] }), entryState, prefs)) {
                    return value;
                }

                return error('object.assert', { ref: path, message });
            },
            args: ['ref', 'schema', 'message'],
            multi: true
        },

        instance: {
            method: function (constructor, name) {

                Hoek.assert(typeof constructor === 'function', 'constructor must be a function');

                name = name || constructor.name;

                return this.addRule({ name: 'instance', args: { constructor, name } });
            },
            validate: function (value, helpers, { constructor, name }) {

                if (value instanceof constructor) {
                    return value;
                }

                return helpers.error('object.instance', { type: name, value });
            },
            args: ['constructor', 'name']
        },

        keys: {
            method: function (schema) {

                Hoek.assert(schema === undefined || typeof schema === 'object', 'Object schema must be a valid object');
                Hoek.assert(!Common.isSchema(schema), 'Object schema cannot be a joi schema');
                Hoek.assert(!this._inRuleset(), 'Cannot set key rules inside a ruleset');

                const obj = this.clone();

                if (!schema) {                                  // Allow all
                    obj._inners.keys = null;
                }
                else if (!Object.keys(schema).length) {          // Allow none
                    obj._inners.keys = [];
                }
                else {
                    obj._inners.keys = obj._inners.keys ? obj._inners.keys.filter((child) => !schema.hasOwnProperty(child.key)) : [];
                    for (const key in schema) {
                        Common.tryWithPath(() => obj._inners.keys.push({ key, schema: this._cast(schema[key]) }), key);
                    }
                }

                return obj._rebuild();
            }
        },

        length: {
            method: function (limit) {

                return this.addRule({ name: 'length', args: { limit }, operator: '=' });
            },
            validate: function (value, helpers, { limit }, { name, operator, args }) {

                if (Common.compare(Object.keys(value).length, limit, operator)) {
                    return value;
                }

                return helpers.error('object.' + name, { limit: args.limit, value });
            },
            refs: {
                limit: {
                    assert: Common.limit,
                    code: 'object.ref',
                    message: 'limit must be a positive integer or reference'
                }
            }
        },

        max: {
            method: function (limit) {

                return this.addRule({ name: 'max', method: 'length', args: { limit }, operator: '<=' });
            }
        },

        min: {
            method: function (limit) {

                return this.addRule({ name: 'min', method: 'length', args: { limit }, operator: '>=' });
            }
        },

        nand: {
            method: function (...peers /*, [options] */) {

                Common.verifyFlat(peers, 'nand');

                return internals.dependency(this, 'nand', null, peers);
            }
        },

        or: {
            method: function (...peers /*, [options] */) {

                Common.verifyFlat(peers, 'or');

                return internals.dependency(this, 'or', null, peers);
            }
        },

        oxor: {
            method: function (...peers /*, [options] */) {

                return internals.dependency(this, 'oxor', null, peers);
            }
        },

        pattern: {
            method: function (pattern, schema, options = {}) {

                const isRegExp = pattern instanceof RegExp;
                Hoek.assert(isRegExp || Common.isSchema(pattern), 'pattern must be a regex or schema');
                Hoek.assert(schema !== undefined, 'Invalid rule');
                Common.assertOptions(options, ['exclusive', 'matches']);

                if (isRegExp) {
                    Hoek.assert(!pattern.flags.includes('g') && !pattern.flags.includes('y'), 'pattern should not use global or sticky mode');
                }

                schema = this._cast(schema, { appendPath: true });

                const obj = this.clone();
                obj._inners.patterns = obj._inners.patterns || [];
                const config = { [isRegExp ? 'regex' : 'schema']: pattern, rule: schema };
                if (options.matches) {
                    config.matches = this._cast(options.matches);
                    obj._register(config.matches);
                }

                if (options.exclusive) {
                    config.exclusive = true;
                }

                obj._inners.patterns.push(config);
                obj._register(schema);
                return obj;
            }
        },

        ref: {
            method: function () {

                return this.addRule('ref');
            },
            validate: function (value, helpers) {

                if (Ref.isRef(value)) {
                    return value;
                }

                return helpers.error('object.refType', { value });
            }
        },

        rename: {
            method: function (from, to, options = {}) {

                Hoek.assert(typeof from === 'string' || from instanceof RegExp, 'Rename missing the from argument');
                Hoek.assert(typeof to === 'string' || to instanceof Template, 'Invalid rename to argument');
                Hoek.assert(to !== from, 'Cannot rename key to same name:', from);

                Common.assertOptions(options, ['alias', 'ignoreUndefined', 'override', 'multiple']);

                const obj = this.clone();

                obj._inners.renames = obj._inners.renames || [];
                for (const rename of obj._inners.renames) {
                    Hoek.assert(rename.from !== from, 'Cannot rename the same key multiple times');
                }

                if (to instanceof Template) {
                    obj._refs.register(to);
                }

                obj._inners.renames.push({
                    from,
                    to,
                    options: Hoek.applyToDefaults(internals.renameDefaults, options)
                });

                return obj;
            }
        },

        schema: {
            method: function (type = 'any') {

                return this.addRule({ name: 'schema', args: { type } });
            },
            validate: function (value, helpers, { type }) {

                if (Common.isSchema(value) &&
                    (type === 'any' || value._type === type)) {

                    return value;
                }

                return helpers.error('object.schema', { type });
            }
        },

        unknown: {
            method: function (allow) {

                return this.setFlag('unknown', allow !== false);
            }
        },

        with: {
            method: function (key, peers, options = {}) {

                return internals.dependency(this, 'with', key, peers, options);
            }
        },

        without: {
            method: function (key, peers, options = {}) {

                return internals.dependency(this, 'without', key, peers, options);
            }
        },

        xor: {
            method: function (...peers /*, [options] */) {

                Common.verifyFlat(peers, 'xor');

                return internals.dependency(this, 'xor', null, peers);
            }
        }
    },

    // Overrides

    overrides: {
        tailor(targets) {

            let obj = this.super.tailor.call(this, targets);
            if (obj === this) {
                obj = this.clone();
            }

            if (obj._inners.keys) {
                for (let i = 0; i < obj._inners.keys.length; ++i) {
                    const child = obj._inners.keys[i];
                    obj._inners.keys[i] = Object.assign({}, child, { schema: child.schema.tailor(targets) });
                }
            }

            if (obj._inners.patterns) {
                for (let i = 0; i < obj._inners.patterns.length; ++i) {
                    const pattern = obj._inners.patterns[i];
                    for (const key of ['schema', 'rule', 'matches']) {
                        if (pattern[key]) {
                            obj._inners.patterns[i] = Object.assign({}, pattern, { [key]: pattern[key].tailor(targets) });
                        }
                    }
                }
            }

            for (let i = 0; i < obj._tests.length; ++i) {
                const rule = obj._tests[i];
                if (rule.name === 'assert') {
                    const clone = Hoek.clone(rule);
                    clone.options.args.schema = clone.options.args.schema.tailor(targets);
                    clone.args = clone.options.args;
                    obj._tests[i] = clone;
                }
            }

            return obj._rebuild();
        }
    },

    // Cast

    cast: {
        from: (value) => value && typeof value === 'object',
        to: {
            map: function (value, options) {

                return new Map(Object.entries(value));
            }
        }
    },

    // Build

    build: function (desc) {

        let obj = this;                                     // eslint-disable-line consistent-this

        if (desc.keys) {
            obj = obj.keys(desc.keys);
        }

        if (desc.dependencies) {
            for (const { type, key = null, peers, options } of desc.dependencies) {
                obj = internals.dependency(obj, type, key, peers, options);
            }
        }

        if (desc.patterns) {
            for (const { regex, schema, rule, exclusive, matches } of desc.patterns) {
                obj = obj.pattern(regex || schema, rule, { exclusive, matches });
            }
        }

        if (desc.renames) {
            for (const { from, to, options } of desc.renames) {
                obj = obj.rename(from, to, options);
            }
        }

        return obj;
    },

    // Modify

    modify: function (id, schema) {

        if (this._inners.keys) {
            for (const child of this._inners.keys) {
                const childId = child.schema._flags.id || child.key;
                if (id === childId) {
                    return this.keys({ [child.key]: schema });
                }
            }
        }

        if (this._inners.patterns) {
            for (let i = 0; i < this._inners.patterns.length; ++i) {
                const pattern = this._inners.patterns[i];
                for (const key of ['schema', 'rule', 'matches']) {
                    if (pattern[key] &&
                        id === pattern[key]._flags.id) {

                        const obj = this.clone();
                        obj._inners.patterns[i] = Object.assign({}, pattern, { [key]: schema });
                        return obj._rebuild();
                    }
                }
            }
        }

        let i = 0;
        for (const rule of this._tests) {
            if (rule.name === 'assert' &&
                id === rule.options.args.schema._flags.id) {

                const obj = this.clone();
                const clone = Hoek.clone(rule);
                clone.options.args.schema = schema;
                clone.args = clone.options.args;
                obj._tests[i] = clone;
                return obj._rebuild();
            }

            ++i;
        }
    },

    rebuild: function () {

        this._resetRegistrations();

        if (this._inners.keys) {
            const topo = new Topo();

            for (const child of this._inners.keys) {
                const { schema, key } = child;
                Common.tryWithPath(() => topo.add(child, { after: schema._refs.roots(), group: key }), key);
                this._register(schema, { key });
            }

            this._inners.keys = topo.nodes;
        }

        if (this._inners.patterns) {
            for (const pattern of this._inners.patterns) {
                for (const key of ['schema', 'rule', 'matches']) {
                    this._register(pattern[key]);
                }
            }
        }

        const assertions = this._getRules('assert');
        for (const assertion of assertions) {
            this._register(assertion.args.schema);
        }

        this._ruleset = false;
        return this;
    },

    // Errors

    messages: {
        'object.and': '"{{#label}}" contains {{#presentWithLabels}} without its required peers {{#missingWithLabels}}',
        'object.assert': '"{{#label}}" is invalid because "{{#ref}}" failed to {{#message}}',
        'object.base': '"{{#label}}" must be an object',
        'object.instance': '"{{#label}}" must be an instance of "{{#type}}"',
        'object.length': '"{{#label}}" must have {{#limit}} keys',
        'object.max': '"{{#label}}" must have less than or equal to {{#limit}} keys',
        'object.min': '"{{#label}}" must have at least {{#limit}} keys',
        'object.missing': '"{{#label}}" must contain at least one of {{#peersWithLabels}}',
        'object.nand': '"{{#mainWithLabel}}" must not exist simultaneously with {{#peersWithLabels}}',
        'object.oxor': '"{{#label}}" contains a conflict between optional exclusive peers {{#peersWithLabels}}',
        'object.pattern.match': '"{{#label}}" keys failed to match pattern requirements',
        'object.ref': '"{{#label}}" references "{{#ref}}" which is not a positive integer',
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
            return Hoek.clone(value, { shallow: true });
        }

        const clone = Object.create(Object.getPrototypeOf(value));
        Object.assign(clone, value);
        return clone;
    }

    // Function

    const clone = function (...args) {

        return value.apply(this, args);
    };

    clone.prototype = Hoek.clone(value.prototype);
    Object.defineProperty(clone, 'name', { value: value.name, writable: false });
    Object.defineProperty(clone, 'length', { value: value.length, writable: false });
    Object.assign(clone, value);
    return clone;
};


internals.dependency = function (schema, type, key, peers, options) {

    Hoek.assert(key === null || typeof key === 'string', type, 'key must be a strings');

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
        Hoek.assert(typeof peer === 'string', type, 'peers must be a string or a reference');
        paths.push(Cast.ref(peer, { separator, ancestor: 0 }));
    }

    // Cast key

    if (key !== null) {
        key = Cast.ref(key, { separator, ancestor: 0 });
    }

    // Add rule

    const obj = schema.clone();
    obj._inners.dependencies = obj._inners.dependencies || [];
    obj._inners.dependencies.push(new internals.Dependency(type, key, paths, peers));
    return obj;
};


internals.dependencies = {

    and: function (schema, dep, value, state, prefs) {

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

    nand: function (schema, dep, value, state, prefs) {

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

    or: function (schema, dep, value, state, prefs) {

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

    oxor: function (schema, dep, value, state, prefs) {

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

    with: function (schema, dep, value, state, prefs) {

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

    without: function (schema, dep, value, state, prefs) {

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

    xor: function (schema, dep, value, state, prefs) {

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
        return keys.map((key) => schema.mapLabels(key));
    }

    return schema.mapLabels(keys);
};


internals.rename = function (schema, value, state, prefs, errors) {

    const renamed = {};
    for (const rename of schema._inners.renames) {
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

                errors.push(schema.createError('object.rename.multiple', value, { from, to, pattern }, state, prefs));
                if (prefs.abortEarly) {
                    return false;
                }
            }

            if (Object.prototype.hasOwnProperty.call(value, to) &&
                !rename.options.override &&
                !renamed[to]) {

                errors.push(schema.createError('object.rename.override', value, { from, to, pattern }, state, prefs));
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

    if (schema._inners.patterns) {
        let hasMatches = false;
        const matches = schema._inners.patterns.map((pattern) => {

            if (pattern.matches) {
                hasMatches = true;
                return [];
            }
        });

        const ancestors = [value];

        for (const key of unprocessed) {
            const item = value[key];
            const path = [...state.path, key];

            for (let i = 0; i < schema._inners.patterns.length; ++i) {
                const pattern = schema._inners.patterns[i];
                const match = pattern.regex ? pattern.regex.test(key) : pattern.schema._match(key, state.nest(pattern.schema), prefs);
                if (!match) {
                    continue;
                }

                unprocessed.delete(key);

                const localState = state.localize(path, ancestors, pattern.rule);
                const result = pattern.rule._validate(item, localState, prefs);
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
                if (pattern.exclusive) {
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

                const localState = state.localize(state.path, ancestors, schema._inners.patterns[i].matches);
                const result = schema._inners.patterns[i].matches._validate(match, localState, prefs);
                if (result.errors) {
                    const details = Errors.details(result.errors, { override: false });
                    details.matches = match;
                    const report = schema.createError('object.pattern.match', value, details, state, prefs);
                    if (prefs.abortEarly) {
                        return { value, errors: report };
                    }

                    errors.push(report);
                }
            }
        }
    }

    if (!unprocessed.size ||
        !schema._inners.keys && !schema._inners.patterns) {     // If no keys or patterns specified, unknown keys allowed

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
            const report = schema.createError('object.unknown', value[unprocessedKey], { child: unprocessedKey }, localState, prefs, { flags: false });
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
