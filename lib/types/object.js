'use strict';

const Hoek = require('@hapi/hoek');
const Topo = require('@hapi/topo');

const Any = require('./any');
const Cast = require('../cast');
const Common = require('../common');
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

        super();
        this._type = 'object';
        this._inner.children = null;
        this._inner.renames = [];
        this._inner.dependencies = [];
        this._inner.patterns = [];
    }

    _init(keys) {

        return this.keys(keys);
    }

    _coerce(value, state, prefs) {

        if (!value ||
            typeof value !== 'string') {

            return { value };
        }

        if (value[0] === '{' ||
            /^\s*\{/.test(value)) {

            try {
                value = JSON.parse(value);
            }
            catch (ignoreErr) { }
        }

        return { value };
    }

    _base(value, state, prefs) {

        const type = this._flags.func ? 'function' : 'object';
        if (!value ||
            typeof value !== type ||
            Array.isArray(value)) {

            return { value, errors: this.createError(type + '.base', value, null, state, prefs) };
        }

        // Skip if there are no other rules to test

        if (!this._inner.renames.length &&
            !this._inner.dependencies.length &&
            !this._inner.children &&                    // null allows any keys
            !this._inner.patterns.length) {

            return { value };
        }

        let target = value;
        const errors = [];
        const finish = () => {

            return {
                value: target,
                errors: errors.length ? errors : null
            };
        };

        // Shallow copy value

        if (type === 'object') {
            if (prefs.nonEnumerables) {
                target = Hoek.clone(value, { shallow: true });
            }
            else {
                target = Object.create(Object.getPrototypeOf(value));
                Object.assign(target, value);
            }
        }
        else {
            target = function (...args) {

                return value.apply(this, args);
            };

            target.prototype = Hoek.clone(value.prototype);
            Object.defineProperty(target, 'name', { value: value.name, writable: false });
            Object.assign(target, value);
        }

        // Rename keys

        if (!this._rename(target, state, prefs, errors)) {
            return finish();
        }

        // Validate schema

        if (!this._inner.children &&            // null allows any keys
            !this._inner.patterns.length &&
            !this._inner.dependencies.length) {

            return finish();
        }

        const unprocessed = new Set(Object.keys(target));

        if (this._inner.children) {
            const strips = [];
            const ancestors = [target, ...state.ancestors];

            for (const child of this._inner.children) {
                const key = child.key;
                const item = target[key];

                unprocessed.delete(key);

                const localState = this._state(key, [...state.path, key], ancestors);
                const result = child.schema._validate(item, localState, prefs);

                if (result.errors) {
                    errors.push(...result.errors);

                    if (prefs.abortEarly) {
                        return finish();
                    }
                }
                else {
                    if (child.schema._flags.strip ||
                        result.value === undefined && item !== undefined) {

                        strips.push(key);
                        target[key] = result.outcome;
                    }
                    else if (result.value !== undefined) {
                        target[key] = result.value;
                    }
                }

                if (child.schema._flags.strip) {
                    strips.push(key);
                }
            }

            for (const key of strips) {
                delete target[key];
            }
        }

        // Unknown keys

        if (unprocessed.size &&
            this._inner.patterns.length) {

            for (const key of unprocessed) {
                const localState = this._state(key, [...state.path, key], [target]);
                const item = target[key];

                for (let i = 0; i < this._inner.patterns.length; ++i) {
                    const pattern = this._inner.patterns[i];

                    if (pattern.regex ?
                        pattern.regex.test(key) :
                        pattern.schema._match(key, state, { ...prefs, abortEarly: true })) {

                        unprocessed.delete(key);

                        const result = pattern.rule._validate(item, localState, prefs);
                        if (result.errors) {
                            errors.push(...result.errors);

                            if (prefs.abortEarly) {
                                return finish();
                            }
                        }

                        target[key] = result.value;
                    }
                }
            }
        }

        if (unprocessed.size &&
            (this._inner.children || this._inner.patterns.length)) {

            if (prefs.stripUnknown && this._flags.allowUnknown !== true ||
                prefs.skipFunctions) {

                const stripUnknown = prefs.stripUnknown
                    ? (prefs.stripUnknown === true ? true : !!prefs.stripUnknown.objects)
                    : false;


                for (const key of unprocessed) {
                    if (stripUnknown) {
                        delete target[key];
                        unprocessed.delete(key);
                    }
                    else if (typeof target[key] === 'function') {
                        unprocessed.delete(key);
                    }
                }
            }

            const forbidUnknown = !Common.default(this._flags.allowUnknown, prefs.allowUnknown);
            if (forbidUnknown) {
                for (const unprocessedKey of unprocessed) {
                    const localState = this._state(unprocessedKey, [...state.path, unprocessedKey], [], { flags: false });
                    errors.push(this.createError('object.allowUnknown', target[unprocessedKey], { child: unprocessedKey }, localState, prefs));
                }
            }
        }

        // Validate dependencies

        for (const dep of this._inner.dependencies) {
            const key = dep.key;
            const method = internals.dependencies[dep.type];
            const keyValue = key && Hoek.reach(target, key, { functions: true });

            const failed = method(this, dep, keyValue, target);
            if (failed) {
                const localState = key ? this._state(key[key.length - 1], [...state.path, ...key]) : this._state(null, state.path);
                errors.push(this.createError(failed.code, target, failed.context, localState, prefs));
                if (prefs.abortEarly) {
                    return finish();
                }
            }
        }

        return finish();
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

        if (this._inner.dependencies.length) {
            description.dependencies = [];
            for (const dep of this._inner.dependencies) {
                const { type, orig } = dep;
                description.dependencies.push({ type, ...orig });
            }
        }

        if (this._inner.patterns.length) {
            description.patterns = [];

            for (const pattern of this._inner.patterns) {
                if (pattern.regex) {
                    description.patterns.push({ regex: pattern.regex.toString(), rule: pattern.rule.describe() });
                }
                else {
                    description.patterns.push({ schema: pattern.schema.describe(), rule: pattern.rule.describe() });
                }
            }
        }

        if (this._inner.renames.length) {
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

    assert(ref, schema, message) {

        ref = Cast.ref(ref);
        Hoek.assert(ref.type === 'global' || ref.depth > 1, 'Cannot use assertions for root level references - use direct key rules instead');
        message = message || 'pass the assertion test';
        Hoek.assert(typeof message === 'string', 'Message must be a string');

        schema = Cast.schema(this._currentJoi, schema, { appendPath: true });

        const key = ref.path[ref.path.length - 1];
        const path = ref.path.join('.');

        const obj = this._rule('assert', { args: { schema, ref }, key, path, message, multi: true });
        obj._refs.register(schema);
        return obj;
    }

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

    forbiddenKeys(...children) {

        Common.verifyFlat(children, 'forbiddenKeys');

        return this.applyFunctionToChildren(children, 'forbidden');
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

                // Only add the key if we are not going to replace it later

                if (!children.includes(child.key)) {
                    topo.add(child, { after: child.schema._refs.roots(), group: child.key });
                }
            }
        }

        for (const key of children) {
            const child = schema[key];
            try {
                const cast = Cast.schema(this._currentJoi, child);
                topo.add({ key, schema: cast }, { after: cast._refs.roots(), group: key });
                obj._refs.register(cast);
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

    optionalKeys(...children) {

        Common.verifyFlat(children, 'optionalKeys');

        return this.applyFunctionToChildren(children, 'optional');
    }

    or(...peers /*, [options] */) {

        Common.verifyFlat(peers, 'or');

        return this._dependency('or', null, peers);
    }

    oxor(...peers /*, [options] */) {

        return this._dependency('oxor', null, peers);
    }

    pattern(pattern, schema) {

        const isRegExp = pattern instanceof RegExp;
        Hoek.assert(isRegExp || pattern instanceof Any, 'pattern must be a regex or schema');
        Hoek.assert(schema !== undefined, 'Invalid rule');

        if (isRegExp) {
            Hoek.assert(!pattern.flags.includes('g') && !pattern.flags.includes('y'), 'pattern should not use global or sticky mode');
        }

        schema = Cast.schema(this._currentJoi, schema, { appendPath: true });

        const obj = this.clone();
        obj._inner.patterns.push({ [isRegExp ? 'regex' : 'schema']: pattern, rule: schema });
        obj._refs.register(schema);
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

    requiredKeys(...children) {

        Common.verifyFlat(children, 'requiredKeys');

        return this.applyFunctionToChildren(children, 'required');
    }

    schema(type = 'any') {

        return this._rule('schema', { args: { type } });
    }

    type(constructor, name = constructor.name) {

        Hoek.assert(typeof constructor === 'function', 'type must be a constructor function');

        const typeData = { name, ctor: constructor };
        return this._rule('type', { args: { typeData } });
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

    // Helpers

    applyFunctionToChildren(children, fn, args = [], root) {

        children = [].concat(children);
        Hoek.assert(children.length > 0, 'expected at least one children');

        const groupedChildren = internals.groupChildren(children);
        let obj;

        if ('' in groupedChildren) {
            obj = this[fn](...args);
            delete groupedChildren[''];
        }
        else {
            obj = this.clone();
        }

        if (obj._inner.children) {
            root = root ? root + '.' : '';

            for (let i = 0; i < obj._inner.children.length; ++i) {
                const child = obj._inner.children[i];
                const group = groupedChildren[child.key];

                if (group) {
                    obj._inner.children[i] = {
                        key: child.key,
                        _refs: child._refs,
                        schema: child.schema.applyFunctionToChildren(group, fn, args, root + child.key)
                    };

                    delete groupedChildren[child.key];
                }
            }
        }

        const remaining = Object.keys(groupedChildren);
        Hoek.assert(remaining.length === 0, 'unknown key(s)', remaining.join(', '));

        return obj;
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

    _rename(target, state, prefs, errors) {

        const renamed = {};
        for (const rename of this._inner.renames) {
            const matches = [];
            const pattern = typeof rename.from !== 'string';

            if (!pattern) {
                if (Object.prototype.hasOwnProperty.call(target, rename.from) &&
                    (target[rename.from] !== undefined || !rename.options.ignoreUndefined)) {

                    matches.push(rename);
                }
            }
            else {
                for (const from in target) {
                    if (target[from] === undefined &&
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
                    to = to.render(target, state, prefs, match.match);
                }

                if (from === to) {
                    continue;
                }

                if (!rename.options.multiple &&
                    renamed[to]) {

                    errors.push(this.createError('object.rename.multiple', target, { from, to, pattern }, state, prefs));
                    if (prefs.abortEarly) {
                        return false;
                    }
                }

                if (Object.prototype.hasOwnProperty.call(target, to) &&
                    !rename.options.override &&
                    !renamed[to]) {

                    errors.push(this.createError('object.rename.override', target, { from, to, pattern }, state, prefs));
                    if (prefs.abortEarly) {
                        return false;
                    }
                }

                const value = target[from];
                if (value === undefined) {
                    delete target[to];
                }
                else {
                    target[to] = value;
                }

                renamed[to] = true;

                if (!rename.options.alias) {
                    delete target[from];
                }
            }
        }

        return true;
    }
};


internals.Object.prototype._rules = {

    assert: function (value, { error, prefs, state }, { schema, ref }, { key, path, message }) {

        if (schema._match(ref.resolve(null, { ancestors: [value, ...state.ancestors] }), null, prefs, value)) {
            return value;
        }

        return error('object.assert', { ref: path, message });
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
    },

    type: function (value, helpers, { typeData }) {

        if (value instanceof typeData.ctor) {
            return value;
        }

        return helpers.error('object.type', { type: typeData.name, value });
    }
};


internals.groupChildren = function (children) {

    children.sort();

    const grouped = {};

    for (const child of children) {
        Hoek.assert(typeof child === 'string', 'children must be strings');
        const group = child.split('.')[0];
        const childGroup = grouped[group] = grouped[group] || [];
        childGroup.push(child.substring(group.length + 1));
    }

    return grouped;
};


internals.keysToLabels = function (schema, keys) {

    const children = schema._inner.children;

    if (!children) {
        return keys;
    }

    const findLabel = function (key) {

        const matchingChild = schema._currentJoi.reach(schema, key);
        return matchingChild ? matchingChild._getLabel(key) : key;
    };

    if (Array.isArray(keys)) {
        return keys.map(findLabel);
    }

    return findLabel(keys);
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


module.exports = new internals.Object();
