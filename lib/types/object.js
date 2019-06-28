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

        this._inner.children = null;
        this._inner.renames = null;
        this._inner.dependencies = null;
        this._inner.patterns = null;
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

        const type = this._flags.func ? 'function' : 'object';
        if (!value ||
            typeof value !== type ||
            Array.isArray(value)) {

            return { value, errors: this.createError(type + '.base', value, null, state, prefs) };
        }

        // Skip if there are no other rules to test

        if (!this._inner.renames &&
            !this._inner.dependencies &&
            !this._inner.children &&                    // null allows any keys
            !this._inner.patterns) {

            return;
        }

        // Shallow clone value

        value = internals.clone(value, prefs);

        // Rename keys

        const errors = [];

        if (this._inner.renames &&
            !this._rename(value, state, prefs, errors)) {

            return { value, errors };
        }

        // Validate schema

        if (!this._inner.children &&            // null allows any keys
            !this._inner.patterns &&
            !this._inner.dependencies) {

            return { value, errors };
        }

        const unprocessed = new Set(Object.keys(value));

        if (this._inner.children) {
            const strips = [];
            const ancestors = [value, ...state.ancestors];

            for (const child of this._inner.children) {
                const key = child.key;
                const item = value[key];

                unprocessed.delete(key);

                const localState = this._state(key, [...state.path, key], ancestors, state);
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
            this._inner.patterns) {

            let hasMatches = false;
            const matches = this._inner.patterns.map((pattern) => {

                if (pattern.matches) {
                    hasMatches = true;
                    return [];
                }
            });

            const ancestors = [value];

            for (const key of unprocessed) {
                const localState = this._state(key, [...state.path, key], ancestors, state);
                const item = value[key];

                for (let i = 0; i < this._inner.patterns.length; ++i) {
                    const pattern = this._inner.patterns[i];
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
                const localState = this._state(state.key, state.path, ancestors, state);
                for (let i = 0; i < matches.length; ++i) {
                    const match = matches[i];
                    if (!match) {
                        continue;
                    }

                    const result = this._inner.patterns[i].matches._validate(match, localState, prefs);
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
            (this._inner.children || this._inner.patterns)) {               // If no keys or patterns specified, unknown keys allowed

            if (prefs.stripUnknown && !this._flags.allowUnknown ||
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

            const forbidUnknown = !Common.default(this._flags.allowUnknown, prefs.allowUnknown);
            if (forbidUnknown) {
                for (const unprocessedKey of unprocessed) {
                    const localState = this._state(unprocessedKey, [...state.path, unprocessedKey], [], state, { flags: false });
                    const report = this.createError('object.allowUnknown', value[unprocessedKey], { child: unprocessedKey }, localState, prefs);
                    if (prefs.abortEarly) {
                        return { value, errors: report };
                    }

                    errors.push(report);
                }
            }
        }

        // Validate dependencies

        if (this._inner.dependencies) {
            for (const dep of this._inner.dependencies) {
                const key = dep.key;
                const method = internals.dependencies[dep.type];
                const keyValue = key && Hoek.reach(value, key, { functions: true });

                const failed = method(this, dep, keyValue, value);
                if (failed) {
                    const localState = key ? this._state(key[key.length - 1], [...state.path, ...key], null, state) : this._state(null, state.path, null, state);
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

    // About

    describe(shallow) {

        const description = super.describe();

        if (description.rules) {
            for (const rule of description.rules) {

                // Coverage off for future-proof descriptions, only object().assert() is use right now

                if (/* $lab:coverage:off$ */rule.arg &&
                    typeof rule.arg === 'object' &&
                    rule.arg.schema &&
                    rule.arg.ref /* $lab:coverage:on$ */) {

                    rule.arg = {
                        schema: rule.arg.schema.describe(),
                        ref: rule.arg.ref
                    };
                }
            }
        }

        if (this._inner.children &&
            !shallow) {

            description.children = {};
            for (const child of this._inner.children) {
                description.children[child.key] = child.schema.describe();
            }
        }

        if (this._inner.dependencies) {
            description.dependencies = [];
            for (const dep of this._inner.dependencies) {
                const { type, orig } = dep;
                description.dependencies.push(Object.assign({ type }, orig));
            }
        }

        if (this._inner.patterns) {
            description.patterns = [];

            for (const pattern of this._inner.patterns) {
                const config = { rule: pattern.rule.describe() };

                if (pattern.regex) {
                    config.regex = pattern.regex.toString();
                }
                else {
                    config.schema = pattern.schema.describe();
                }

                if (pattern.matches) {
                    config.matches = pattern.matches.describe();
                }

                if (pattern.exclusive) {
                    config.exclusive = true;
                }

                description.patterns.push(config);
            }
        }

        if (this._inner.renames) {
            description.renames = Hoek.clone(this._inner.renames);
            for (const rename of description.renames) {
                if (rename.from instanceof RegExp) {
                    rename.from = { regex: rename.from.toString() };
                }

                if (rename.to instanceof Template) {
                    rename.to = rename.to.describe();
                }
            }
        }

        return description;
    }

    // Rules

    and(...peers) {

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

        const obj = this._rule('assert', { args: { schema, ref }, key, path, message, multi: true });
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
        Hoek.assert(!schema || !(schema instanceof Any), 'Object schema cannot be a joi schema');

        const obj = this.clone();

        if (!schema) {
            obj._inner.children = null;
            return obj;
        }

        const children = Object.keys(schema);
        if (!children.length) {
            obj._inner.children = [];
            return obj;
        }

        const topo = new Topo();
        if (obj._inner.children) {
            for (const child of obj._inner.children) {
                if (children.includes(child.key)) {
                    obj._ids.unregister(child.schema, child.key);
                }
                else {
                    topo.add(child, { after: child.schema._refs.roots(), group: child.key });       // Skipped on overrides
                }
            }
        }

        for (const key of children) {
            const child = schema[key];
            try {
                const cast = Cast.schema(this._root, child);
                topo.add({ key, schema: cast }, { after: cast._refs.roots(), group: key });
                obj._register(cast, { key });
            }
            catch (err) {
                if (err.path !== undefined) {
                    err.path = key + '.' + err.path;
                }
                else {
                    err.path = key;
                }

                throw err;
            }
        }

        obj._inner.children = topo.nodes;
        return obj;
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
        Hoek.assert(isRegExp || pattern instanceof Any, 'pattern must be a regex or schema');
        Hoek.assert(schema !== undefined, 'Invalid rule');
        Common.assertOptions(options, ['exclusive', 'matches']);

        if (isRegExp) {
            Hoek.assert(!pattern.flags.includes('g') && !pattern.flags.includes('y'), 'pattern should not use global or sticky mode');
        }

        schema = Cast.schema(this._root, schema, { appendPath: true });

        const obj = this.clone();
        obj._inner.patterns = obj._inner.patterns || [];
        const config = { [isRegExp ? 'regex' : 'schema']: pattern, rule: schema };
        if (options.matches) {
            config.matches = Cast.schema(this._root, options.matches);
            obj._register(config.matches);
        }

        if (options.exclusive) {
            config.exclusive = true;
        }

        obj._inner.patterns.push(config);
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

        this._inner.renames = this._inner.renames || [];
        for (const rename of this._inner.renames) {
            Hoek.assert(rename.from !== from, 'Cannot rename the same key multiple times');
        }

        const obj = this.clone();

        if (to instanceof Template) {
            obj._refs.register(to);
        }

        obj._inner.renames.push({
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

        return this._flag('allowUnknown', allow !== false);
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

    // Internals

    _dependency(type, key, peers, options) {

        Hoek.assert(key === null || typeof key === 'string', type, 'key must be a strings');
        if (options) {
            Common.assertOptions(options, ['separator']);
        }

        // Extract options from peers array

        if (!options) {
            options = peers.length > 1 && typeof peers[peers.length - 1] === 'object' ? peers.pop() : {};
        }

        peers = [].concat(peers);
        const orig = { key, peers };

        // Split peer paths

        const separator = Common.default(options.separator, '.');
        const paths = [];
        for (const peer of peers) {
            Hoek.assert(typeof peer === 'string', type, 'peers must be a string');
            if (separator) {
                paths.push({ path: peer.split(separator), peer });
            }
            else {
                paths.push({ path: [peer], peer });
            }
        }

        // Split key

        if (key !== null) {
            key = separator ? key.split(separator) : [key];
        }

        // Add rule

        const obj = this.clone();
        obj._inner.dependencies = obj._inner.dependencies || [];
        obj._inner.dependencies.push({ type, key, peers: paths, orig });
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

    _override(id, schema) {

        for (const child of this._inner.children) {
            const childId = child.schema._flags.id || child.key;
            if (id === childId) {
                return this.keys({ [child.key]: schema });
            }
        }
    }

    _rename(value, state, prefs, errors) {

        const renamed = {};
        for (const rename of this._inner.renames) {
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

    assert: function (value, { error, prefs, state }, { schema, ref }, { key, path, message }) {

        const entryState = schema._stateEntry(state, value);
        if (schema._match(ref.resolve(null, { ancestors: [value, ...state.ancestors] }), entryState, prefs)) {
            return value;
        }

        return error('object.assert', { ref: path, message });
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

        if (value instanceof Any &&
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

    with: function (schema, dep, value, parent) {

        if (value === undefined) {
            return;
        }

        for (const { path, peer } of dep.peers) {
            const keysExist = Hoek.reach(parent, path, { functions: true });
            if (keysExist === undefined) {
                return {
                    code: 'object.with',
                    context: {
                        main: dep.orig.key,
                        mainWithLabel: internals.keysToLabels(schema, dep.orig.key),
                        peer,
                        peerWithLabel: internals.keysToLabels(schema, peer)
                    }
                };
            }
        }
    },

    without: function (schema, dep, value, parent) {

        if (value === undefined) {
            return;
        }

        for (const { path, peer } of dep.peers) {
            const keysExist = Hoek.reach(parent, path, { functions: true });
            if (keysExist !== undefined) {
                return {
                    code: 'object.without',
                    context: {
                        main: dep.orig.key,
                        mainWithLabel: internals.keysToLabels(schema, dep.orig.key),
                        peer,
                        peerWithLabel: internals.keysToLabels(schema, peer)
                    }
                };
            }
        }
    },

    xor: function (schema, dep, value, parent) {

        const present = [];
        for (const { path, peer } of dep.peers) {
            const keysExist = Hoek.reach(parent, path, { functions: true });
            if (keysExist !== undefined) {
                present.push(peer);
            }
        }

        if (present.length === 1) {
            return;
        }

        const context = { peers: dep.orig.peers, peersWithLabels: internals.keysToLabels(schema, dep.orig.peers) };
        if (present.length === 0) {
            return { code: 'object.missing', context };
        }

        context.present = present;
        context.presentWithLabels = internals.keysToLabels(schema, present);
        return { code: 'object.xor', context };
    },

    oxor: function (schema, dep, value, parent) {

        const present = [];
        for (const { path, peer } of dep.peers) {
            const keysExist = Hoek.reach(parent, path, { functions: true });
            if (keysExist !== undefined) {
                present.push(peer);
            }
        }

        if (!present.length ||
            present.length === 1) {

            return;
        }

        const context = { peers: dep.orig.peers, peersWithLabels: internals.keysToLabels(schema, dep.orig.peers) };
        context.present = present;
        context.presentWithLabels = internals.keysToLabels(schema, present);
        return { code: 'object.oxor', context };
    },

    or: function (schema, dep, value, parent) {

        for (const { path } of dep.peers) {
            const keysExist = Hoek.reach(parent, path, { functions: true });
            if (keysExist !== undefined) {
                return;
            }
        }

        return {
            code: 'object.missing',
            context: {
                peers: dep.orig.peers,
                peersWithLabels: internals.keysToLabels(schema, dep.orig.peers)
            }
        };
    },

    and: function (schema, dep, value, parent) {

        const missing = [];
        const present = [];
        const count = dep.peers.length;
        for (const { path, peer } of dep.peers) {
            const keysExist = Hoek.reach(parent, path, { functions: true });
            if (keysExist === undefined) {
                missing.push(peer);
            }
            else {
                present.push(peer);
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

    nand: function (schema, dep, value, parent) {

        const present = [];
        for (const { path, peer } of dep.peers) {
            const keysExist = Hoek.reach(parent, path, { functions: true });
            if (keysExist !== undefined) {
                present.push(peer);
            }
        }

        if (present.length !== dep.peers.length) {
            return;
        }

        const main = dep.orig.peers[0];
        const values = dep.orig.peers.slice(1);
        return {
            code: 'object.nand',
            context: {
                main,
                mainWithLabel: internals.keysToLabels(schema, main),
                peers: values,
                peersWithLabels: internals.keysToLabels(schema, values)
            }
        };
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


module.exports = new internals.Object();
