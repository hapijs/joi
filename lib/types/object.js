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


internals.Object = class extends Any {

    constructor() {

        super('object');

        this._inners.keys = null;
        this._inners.renames = null;
        this._inners.dependencies = null;
        this._inners.patterns = null;
    }

    _init(keys) {

        return this.keys(keys);
    }

    _coerce(value, state, prefs) {

        if (value[0] !== '{' &&
            !/^\s*\{/.test(value)) {

            return;
        }

        try {
            return { value: Bourne.parse(value) };
        }
        catch (ignoreErr) { }
    }

    _base(value, state, prefs) {

        const type = this._flags._func ? 'function' : 'object';
        if (!value ||
            typeof value !== type ||
            Array.isArray(value)) {

            return { value, errors: this.createError(type + '.base', value, null, state, prefs) };
        }

        // Skip if there are no other rules to test

        if (!this._inners.renames &&
            !this._inners.dependencies &&
            !this._inners.keys &&                       // null allows any keys
            !this._inners.patterns &&
            !this._inners.externals) {

            return;
        }

        // Shallow clone value

        value = internals.clone(value, prefs);

        // Rename keys

        const errors = [];

        if (this._inners.renames &&
            !this._rename(value, state, prefs, errors)) {

            return { value, errors };
        }

        // Validate schema

        if (!this._inners.keys &&                       // null allows any keys
            !this._inners.patterns &&
            !this._inners.dependencies) {

            return { value, errors };
        }

        const unprocessed = new Set(Object.keys(value));

        if (this._inners.keys) {
            const strips = [];
            const ancestors = [value, ...state.ancestors];

            for (const child of this._inners.keys) {
                const key = child.key;
                const item = value[key];

                unprocessed.delete(key);

                const localState = this._state([...state.path, key], ancestors, state);
                const result = child.schema._validate(item, localState, prefs);

                if (result.errors) {
                    if (prefs.abortEarly) {
                        return { value, errors: result.errors };
                    }

                    errors.push(...result.errors);
                }
                else {
                    if (child.schema._flags.strip ||
                        result.value === undefined && item !== undefined) {     // Was and remained undefined

                        strips.push(key);
                        value[key] = result.outcome;                            // Temporarily retained the validated value for references
                    }
                    else if (result.value !== undefined) {
                        value[key] = result.value;
                    }
                }
            }

            for (const key of strips) {
                delete value[key];
            }
        }

        // Unknown keys

        if (unprocessed.size &&
            this._inners.patterns) {

            let hasMatches = false;
            const matches = this._inners.patterns.map((pattern) => {

                if (pattern.matches) {
                    hasMatches = true;
                    return [];
                }
            });

            const ancestors = [value];

            for (const key of unprocessed) {
                const localState = this._state([...state.path, key], ancestors, state);
                const item = value[key];

                for (let i = 0; i < this._inners.patterns.length; ++i) {
                    const pattern = this._inners.patterns[i];
                    const match = pattern.regex ? pattern.regex.test(key) : pattern.schema._match(key, state, prefs);
                    if (!match) {
                        continue;
                    }

                    unprocessed.delete(key);

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
                const localState = this._state(state.path, ancestors, state);
                for (let i = 0; i < matches.length; ++i) {
                    const match = matches[i];
                    if (!match) {
                        continue;
                    }

                    const result = this._inners.patterns[i].matches._validate(match, localState, prefs);
                    if (result.errors) {
                        const details = Errors.details(result.errors, { override: false });
                        details.matches = match;
                        const report = this.createError('object.pattern.match', value, details, state, prefs);
                        if (prefs.abortEarly) {
                            return { value, errors: report };
                        }

                        errors.push(report);
                    }
                }
            }
        }

        if (unprocessed.size &&
            (this._inners.keys || this._inners.patterns)) {             // If no keys or patterns specified, unknown keys allowed

            if (prefs.stripUnknown && !this._flags.unknown ||
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

            const forbidUnknown = !Common.default(this._flags.unknown, prefs.allowUnknown);
            if (forbidUnknown) {
                for (const unprocessedKey of unprocessed) {
                    const localState = this._state([...state.path, unprocessedKey], [], state, { flags: false });
                    const report = this.createError('object.unknown', value[unprocessedKey], { child: unprocessedKey }, localState, prefs);
                    if (prefs.abortEarly) {
                        return { value, errors: report };
                    }

                    errors.push(report);
                }
            }
        }

        // Validate dependencies

        if (this._inners.dependencies) {
            for (const dep of this._inners.dependencies) {
                if (dep.key &&
                    dep.key.resolve(value, state, prefs) === undefined) {

                    continue;
                }

                const failed = internals.dependencies[dep.type](this, dep, value, state, prefs);
                if (failed) {
                    const localState = dep.key ? this._state([...state.path, ...dep.key.path], null, state) : this._state(state.path, null, state);
                    const report = this.createError(failed.code, value, failed.context, localState, prefs);
                    if (prefs.abortEarly) {
                        return { value, errors: report };
                    }

                    errors.push(report);
                }
            }
        }

        return { value, errors };
    }

    _override(id, schema) {

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
        for (const test of this._tests) {
            if (test.name === 'assert' &&
                id === test.rule._options.args.schema._flags.id) {

                const obj = this.clone();
                const clone = Hoek.clone(test);
                clone.rule._options.args.schema = schema;
                clone.args = clone.rule._options.args;
                obj._tests[i] = clone;
                return obj._rebuild();
            }

            ++i;
        }
    }

    // Rules

    and(...peers /*, [options] */) {

        Common.verifyFlat(peers, 'and');

        return this._dependency('and', null, peers);
    }

    append(schema) {

        if (schema === null ||
            schema === undefined ||
            Object.keys(schema).length === 0) {

            return this;
        }

        return this.keys(schema);
    }

    assert(ref, schema, message) {

        ref = Cast.ref(ref);
        Hoek.assert(ref.type === 'global' || ref.depth > 1, 'Cannot use assertions for root level references - use direct key rules instead');
        message = message || 'pass the assertion test';
        Hoek.assert(typeof message === 'string', 'Message must be a string');

        schema = Cast.schema(this._root, schema, { appendPath: true });

        const key = ref.path[ref.path.length - 1];
        const path = ref.path.join('.');

        const obj = this._rule('assert', { args: { ref, schema, message }, key, path, multi: true });
        obj._register(schema);
        return obj;
    }

    instance(constructor, name = constructor.name) {

        Hoek.assert(typeof constructor === 'function', 'type must be a constructor function');

        const typeData = { name, ctor: constructor };
        return this._rule('instance', { args: { typeData } });
    }

    keys(schema) {

        Hoek.assert(schema === null || schema === undefined || typeof schema === 'object', 'Object schema must be a valid object');
        Hoek.assert(!schema || !Common.isSchema(schema), 'Object schema cannot be a joi schema');
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
                Common.tryWithPath(() => obj._inners.keys.push({ key, schema: Cast.schema(this._root, schema[key]) }), key);
            }
        }

        return obj._rebuild();
    }

    length(limit) {

        return this._length('length', limit, '=');
    }

    max(limit) {

        return this._length('max', limit, '<=');
    }

    min(limit) {

        return this._length('min', limit, '>=');
    }

    nand(...peers /*, [options] */) {

        Common.verifyFlat(peers, 'nand');

        return this._dependency('nand', null, peers);
    }

    or(...peers /*, [options] */) {

        Common.verifyFlat(peers, 'or');

        return this._dependency('or', null, peers);
    }

    oxor(...peers /*, [options] */) {

        return this._dependency('oxor', null, peers);
    }

    pattern(pattern, schema, options = {}) {

        const isRegExp = pattern instanceof RegExp;
        Hoek.assert(isRegExp || Common.isSchema(pattern), 'pattern must be a regex or schema');
        Hoek.assert(schema !== undefined, 'Invalid rule');
        Common.assertOptions(options, ['exclusive', 'matches']);

        if (isRegExp) {
            Hoek.assert(!pattern.flags.includes('g') && !pattern.flags.includes('y'), 'pattern should not use global or sticky mode');
        }

        schema = Cast.schema(this._root, schema, { appendPath: true });

        const obj = this.clone();
        obj._inners.patterns = obj._inners.patterns || [];
        const config = { [isRegExp ? 'regex' : 'schema']: pattern, rule: schema };
        if (options.matches) {
            config.matches = Cast.schema(this._root, options.matches);
            obj._register(config.matches);
        }

        if (options.exclusive) {
            config.exclusive = true;
        }

        obj._inners.patterns.push(config);
        obj._register(schema);
        return obj;
    }

    ref() {

        return this._rule('ref');
    }

    rename(from, to, options = {}) {

        Hoek.assert(typeof from === 'string' || from instanceof RegExp, 'Rename missing the from argument');
        Hoek.assert(typeof to === 'string' || to instanceof Template, 'Invalid rename to argument');
        Hoek.assert(to !== from, 'Cannot rename key to same name:', from);

        Common.assertOptions(options, ['alias', 'ignoreUndefined', 'override', 'multiple']);

        this._inners.renames = this._inners.renames || [];
        for (const rename of this._inners.renames) {
            Hoek.assert(rename.from !== from, 'Cannot rename the same key multiple times');
        }

        const obj = this.clone();

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

    schema(type = 'any') {

        return this._rule('schema', { args: { type } });
    }

    unknown(allow) {

        return this._flag('unknown', allow !== false);
    }

    with(key, peers, options = {}) {

        return this._dependency('with', key, peers, options);
    }

    without(key, peers, options = {}) {

        return this._dependency('without', key, peers, options);
    }

    xor(...peers /*, [options] */) {

        Common.verifyFlat(peers, 'xor');

        return this._dependency('xor', null, peers);
    }

    // Helpers

    tailor(targets) {

        let obj = super.tailor(targets);
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
            const test = obj._tests[i];
            if (test.name === 'assert') {
                const clone = Hoek.clone(test);
                clone.rule._options.args.schema = clone.rule._options.args.schema.tailor(targets);
                clone.args = clone.rule._options.args;
                obj._tests[i] = clone;
            }
        }

        return obj._rebuild();
    }

    // Internals

    _dependency(type, key, peers, options) {

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

        const obj = this.clone();
        obj._inners.dependencies = obj._inners.dependencies || [];
        obj._inners.dependencies.push(new internals.Dependency(type, key, paths, peers));
        return obj;
    }

    _length(name, limit, operator) {

        const refs = {
            limit: {
                assert: (value) => Number.isSafeInteger(value) && value >= 0,
                code: 'object.ref',
                message: 'limit must be a positive integer or reference'
            }
        };

        return this._rule(name, { rule: 'length', refs, args: { limit }, operator });
    }

    _rebuild() {

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
    }

    _rename(value, state, prefs, errors) {

        const renamed = {};
        for (const rename of this._inners.renames) {
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

                    errors.push(this.createError('object.rename.multiple', value, { from, to, pattern }, state, prefs));
                    if (prefs.abortEarly) {
                        return false;
                    }
                }

                if (Object.prototype.hasOwnProperty.call(value, to) &&
                    !rename.options.override &&
                    !renamed[to]) {

                    errors.push(this.createError('object.rename.override', value, { from, to, pattern }, state, prefs));
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
    }
};


internals.Object.prototype._coerce.type = 'string';


// Aliases

Common.alias(internals.Object, [

]);


// Casts

Common.extend(internals.Object, 'casts', {

    [Common.symbols.castFrom]: (value) => value && typeof value === 'object',

    map: function (value, options) {

        return new Map(Object.entries(value));
    }
});


// Rules

Common.extend(internals.Object, 'rules', {

    assert: {
        method: function (value, { error, prefs, state }, { ref, schema, message }, { path }) {

            const entryState = schema._stateEntry(state, value);
            if (schema._match(ref.resolve(null, { ancestors: [value, ...state.ancestors] }), entryState, prefs)) {
                return value;
            }

            return error('object.assert', { ref: path, message });
        },
        args: ['ref', 'schema', 'message']
    },

    instance: function (value, helpers, { typeData }) {

        if (value instanceof typeData.ctor) {
            return value;
        }

        return helpers.error('object.instance', { type: typeData.name, value });
    },

    length: function (value, helpers, { limit }, { alias, operator, args }) {

        if (Common.compare(Object.keys(value).length, limit, operator)) {
            return value;
        }

        return helpers.error('object.' + alias, { limit: args.limit, value });
    },

    ref: function (value, helpers) {

        if (Ref.isRef(value)) {
            return value;
        }

        return helpers.error('object.refType', { value });
    },

    schema: function (value, helpers, { type }) {

        if (Common.isSchema(value) &&
            (type === 'any' || value._type === type)) {

            return value;
        }

        return helpers.error('object.schema', { type });
    }
});


// Helpers

internals.keysToLabels = function (schema, keys) {

    if (Array.isArray(keys)) {
        return keys.map((key) => schema.mapLabels(key));
    }

    return schema.mapLabels(keys);
};


internals.dependencies = {

    and: function (schema, dep, value, state, prefs) {

        const missing = [];
        const present = [];
        const count = dep.peers.length;
        for (const peer of dep.peers) {
            if (peer.resolve(value, state, prefs) === undefined) {
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
            if (peer.resolve(value, state, prefs) !== undefined) {
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
            if (peer.resolve(value, state, prefs) !== undefined) {
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
            if (peer.resolve(value, state, prefs) !== undefined) {
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
            if (peer.resolve(value, state, prefs) === undefined) {
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
            if (peer.resolve(value, state, prefs) !== undefined) {
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
            if (peer.resolve(value, state, prefs) !== undefined) {
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


internals.Dependency = class {

    constructor(type, key, peers, paths) {

        this.type = type;
        this.key = key;
        this.peers = peers;
        this.paths = paths;
    }

    describe() {

        return {
            type: this.type,
            key: this.key.key,
            peers: this.paths
        };
    }
};


module.exports = new internals.Object();
