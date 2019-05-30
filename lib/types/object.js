'use strict';

const Hoek = require('@hapi/hoek');
const Topo = require('@hapi/topo');

const Any = require('./any');
const Errors = require('../errors');
const Cast = require('../cast');
const State = require('./state');
const Utils = require('../utils');


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

    _base(value, state, options) {

        let target = value;
        const errors = [];
        const finish = () => {

            return {
                value: target,
                errors: errors.length ? errors : null
            };
        };

        if (typeof value === 'string' &&
            options.convert) {

            if (value.length > 1 &&
                (value[0] === '{' || /^\s*\{/.test(value))) {

                try {
                    value = JSON.parse(value);
                }
                catch (ignoreErr) { }
            }
        }

        const type = this._flags.func ? 'function' : 'object';
        if (!value ||
            typeof value !== type ||
            Array.isArray(value)) {

            errors.push(this.createError(type + '.base', { value }, state, options));
            return finish();
        }

        // Skip if there are no other rules to test

        if (!this._inner.renames.length &&
            !this._inner.dependencies.length &&
            !this._inner.children &&                    // null allows any keys
            !this._inner.patterns.length) {

            target = value;
            return finish();
        }

        // Ensure target is a local copy (parsed) or shallow copy

        if (target === value) {
            if (type === 'object') {
                target = Object.create(Object.getPrototypeOf(value));
            }
            else {
                target = function (...args) {

                    return value.apply(this, args);
                };

                target.prototype = Hoek.clone(value.prototype);
            }

            Object.assign(target, value);
        }
        else {
            target = value;
        }

        // Rename keys

        if (!this._rename(target, state, options, errors)) {
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
            const stripProps = [];

            for (let i = 0; i < this._inner.children.length; ++i) {
                const child = this._inner.children[i];
                const key = child.key;
                const item = target[key];

                unprocessed.delete(key);

                const localState = new State(key, [...state.path, key], target, state.reference);
                const result = child.schema._validate(item, localState, options);
                if (result.errors) {
                    errors.push(this.createError('object.child', { key, child: child.schema._getLabel(key), reason: result.errors }, localState, options));

                    if (options.abortEarly) {
                        return finish();
                    }
                }
                else {
                    if (child.schema._flags.strip || (result.value === undefined && result.value !== item)) {
                        stripProps.push(key);
                        target[key] = result.finalValue;
                    }
                    else if (result.value !== undefined) {
                        target[key] = result.value;
                    }
                }
            }

            for (let i = 0; i < stripProps.length; ++i) {
                delete target[stripProps[i]];
            }
        }

        // Unknown keys

        if (unprocessed.size &&
            this._inner.patterns.length) {

            for (const key of unprocessed) {
                const localState = new State(key, [...state.path, key], target, state.reference);
                const item = target[key];

                for (let i = 0; i < this._inner.patterns.length; ++i) {
                    const pattern = this._inner.patterns[i];

                    if (pattern.regex ?
                        pattern.regex.test(key) :
                        !pattern.schema._validate(key, state, { ...options, abortEarly: true }).errors) {

                        unprocessed.delete(key);

                        const result = pattern.rule._validate(item, localState, options);
                        if (result.errors) {
                            errors.push(this.createError('object.child', {
                                key,
                                child: pattern.rule._getLabel(key),
                                reason: result.errors
                            }, localState, options));

                            if (options.abortEarly) {
                                return finish();
                            }
                        }

                        target[key] = result.value;
                    }
                }
            }
        }

        if (unprocessed.size && (this._inner.children || this._inner.patterns.length)) {
            if ((options.stripUnknown && this._flags.allowUnknown !== true) ||
                options.skipFunctions) {

                const stripUnknown = options.stripUnknown
                    ? (options.stripUnknown === true ? true : !!options.stripUnknown.objects)
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

            if (this._flags.allowUnknown !== undefined ? !this._flags.allowUnknown : !options.allowUnknown) {
                for (const unprocessedKey of unprocessed) {
                    errors.push(this.createError('object.allowUnknown', { child: unprocessedKey, value: target[unprocessedKey] }, {
                        key: unprocessedKey,
                        path: [...state.path, unprocessedKey]
                    }, options, {}));
                }
            }
        }

        // Validate dependencies

        for (const dep of this._inner.dependencies) {
            const hasKey = dep.key !== null;
            const splitKey = hasKey && dep.key.split('.');
            const localState = hasKey ? new State(splitKey[splitKey.length - 1], [...state.path, ...splitKey]) : new State(null, state.path);
            const err = internals[dep.type].call(this, dep.key, hasKey && Hoek.reach(target, dep.key, { functions: true }), dep.peers, target, localState, options);
            if (err instanceof Errors.Err) {
                errors.push(err);
                if (options.abortEarly) {
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
                        ref: rule.arg.ref.toString()
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
            description.dependencies = Hoek.clone(this._inner.dependencies);
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

        if (this._inner.renames.length > 0) {
            description.renames = Hoek.clone(this._inner.renames);
        }

        return description;
    }

    // Rules

    assert(ref, schema, message) {

        ref = Cast.ref(ref);
        Hoek.assert(ref.isContext || ref.depth > 1, 'Cannot use assertions for root level references - use direct key rules instead');
        message = message || 'pass the assertion test';
        Hoek.assert(typeof message === 'string', 'Message must be a string');

        schema = Cast.schema(this._currentJoi, schema, { appendPath: true });

        const key = ref.path[ref.path.length - 1];
        const path = ref.path.join('.');

        return this._rule('assert', { args: { schema, ref }, key, path, message });
    }

    and(...peers) {

        Utils.verifyFlat(peers, 'and');

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

        Utils.verifyFlat(children, 'forbiddenKeys');

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
                    topo.add(child, { after: child._refs, group: child.key });
                }
            }
        }

        for (const key of children) {
            const child = schema[key];
            try {
                const cast = Cast.schema(this._currentJoi, child);
                topo.add({ key, schema: cast }, { after: cast._refs, group: key });
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

    nand(...peers) {

        Utils.verifyFlat(peers, 'nand');

        return this._dependency('nand', null, peers);
    }

    optionalKeys(...children) {

        Utils.verifyFlat(children, 'optionalKeys');

        return this.applyFunctionToChildren(children, 'optional');
    }

    or(...peers) {

        Utils.verifyFlat(peers, 'or');

        return this._dependency('or', null, peers);
    }

    oxor(...peers) {

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
        return obj;
    }

    rename(from, to, options = {}) {

        Hoek.assert(typeof from === 'string' || from instanceof RegExp, 'Rename missing the from argument');
        Hoek.assert(typeof to === 'string', 'Rename missing the to argument');
        Hoek.assert(to !== from, 'Cannot rename key to same name:', from);

        for (const rename of this._inner.renames) {
            Hoek.assert(rename.from !== from, 'Cannot rename the same key multiple times');
        }

        const obj = this.clone();

        obj._inner.renames.push({
            from,
            to,
            options: Hoek.applyToDefaults(internals.renameDefaults, options)
        });

        return obj;
    }

    requiredKeys(...children) {

        Utils.verifyFlat(children, 'requiredKeys');

        return this.applyFunctionToChildren(children, 'required');
    }

    schema() {

        return this._rule('schema');
    }

    type(constructor, name = constructor.name) {

        Hoek.assert(typeof constructor === 'function', 'type must be a constructor function');

        const typeData = { name, ctor: constructor };
        return this._rule('type', { args: { typeData } });
    }

    unknown(allow) {

        const value = allow !== false;

        if (this._flags.allowUnknown === value) {
            return this;
        }

        const obj = this.clone();
        obj._flags.allowUnknown = value;
        return obj;
    }

    with(key, peers) {

        Hoek.assert(arguments.length === 2, 'Invalid number of arguments, expected 2.');

        return this._dependency('with', key, peers);
    }

    without(key, peers) {

        Hoek.assert(arguments.length === 2, 'Invalid number of arguments, expected 2.');

        return this._dependency('without', key, peers);
    }

    xor(...peers) {

        Utils.verifyFlat(peers, 'xor');

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

    _dependency(type, key, peers) {

        peers = [].concat(peers);
        for (const peer of peers) {
            Hoek.assert(typeof peer === 'string', type, 'peers must be a string or array of strings');
        }

        const obj = this.clone();
        obj._inner.dependencies.push({ type, key, peers });
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

        return this._rule(name, { rule: 'length', refs, args: { limit }, operator, override: true });
    }

    _rename(target, state, options, errors) {

        const renamed = {};
        for (const rename of this._inner.renames) {
            if (typeof rename.from === 'string') {
                if (rename.options.ignoreUndefined &&
                    target[rename.from] === undefined) {

                    continue;
                }

                if (!rename.options.multiple &&
                    renamed[rename.to]) {

                    errors.push(this.createError('object.rename.multiple', { from: rename.from, to: rename.to }, state, options));
                    if (options.abortEarly) {
                        return false;
                    }
                }

                if (Object.prototype.hasOwnProperty.call(target, rename.to) &&
                    !rename.options.override &&
                    !renamed[rename.to]) {

                    errors.push(this.createError('object.rename.override', { from: rename.from, to: rename.to }, state, options));
                    if (options.abortEarly) {
                        return false;
                    }
                }

                if (target[rename.from] === undefined) {
                    delete target[rename.to];
                }
                else {
                    target[rename.to] = target[rename.from];
                }

                renamed[rename.to] = true;

                if (!rename.options.alias) {
                    delete target[rename.from];
                }
            }
            else {
                const matchedTargetKeys = [];

                let allUndefined = true;
                for (const key in target) {
                    if (rename.from.test(key)) {
                        matchedTargetKeys.push(key);
                        if (target[key] !== undefined) {
                            allUndefined = false;
                        }
                    }
                }

                if (rename.options.ignoreUndefined &&
                    allUndefined) {

                    continue;
                }

                if (!rename.options.multiple &&
                    renamed[rename.to]) {

                    errors.push(this.createError('object.rename.regex.multiple', { from: matchedTargetKeys, to: rename.to }, state, options));
                    if (options.abortEarly) {
                        return false;
                    }
                }

                if (Object.prototype.hasOwnProperty.call(target, rename.to) &&
                    !rename.options.override &&
                    !renamed[rename.to]) {

                    errors.push(this.createError('object.rename.regex.override', { from: matchedTargetKeys, to: rename.to }, state, options));
                    if (options.abortEarly) {
                        return false;
                    }
                }

                if (allUndefined) {
                    delete target[rename.to];
                }
                else {
                    target[rename.to] = target[matchedTargetKeys[matchedTargetKeys.length - 1]];
                }

                renamed[rename.to] = true;

                if (!rename.options.alias) {
                    for (const key of matchedTargetKeys) {
                        if (key !== rename.to) {
                            delete target[key];
                        }
                    }
                }
            }
        }

        return true;
    }
};


internals.Object.prototype._rules = {

    assert: function (value, { error, options, state }, { schema, ref }, { key, path, message }) {

        const result = schema._validate(ref(value), null, options, value);
        if (!result.errors) {
            return value;
        }

        const localState = new State(key, ref.path, state.parent, state.reference);
        return error('object.assert', { ref: path, message }, localState);
    },

    length: function (value, helpers, { limit }, { alias, operator, args }) {

        if (Utils.compare(Object.keys(value).length, limit, operator)) {
            return value;
        }

        return helpers.error('object.' + alias, { limit: args.limit, value });
    },

    schema: function (value, helpers) {

        if (value instanceof Any) {
            return value;
        }

        return helpers.error('object.schema');
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
        const childGroup = grouped[group] = (grouped[group] || []);
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


internals.with = function (key, value, peers, parent, state, options) {

    if (value === undefined) {
        return;
    }

    for (const peer of peers) {
        const keysExist = Hoek.reach(parent, peer, { functions: true });
        if (keysExist === undefined) {

            return this.createError('object.with', {
                main: key,
                mainWithLabel: internals.keysToLabels(this, key),
                peer,
                peerWithLabel: internals.keysToLabels(this, peer)
            }, state, options);
        }
    }
};


internals.without = function (key, value, peers, parent, state, options) {

    if (value === undefined) {
        return;
    }

    for (const peer of peers) {
        const keysExist = Hoek.reach(parent, peer, { functions: true });
        if (keysExist !== undefined) {

            return this.createError('object.without', {
                main: key,
                mainWithLabel: internals.keysToLabels(this, key),
                peer,
                peerWithLabel: internals.keysToLabels(this, peer)
            }, state, options);
        }
    }
};


internals.xor = function (key, value, peers, parent, state, options) {

    const present = [];
    for (const peer of peers) {
        const keysExist = Hoek.reach(parent, peer, { functions: true });
        if (keysExist !== undefined) {
            present.push(peer);
        }
    }

    if (present.length === 1) {
        return;
    }

    const context = { peers, peersWithLabels: internals.keysToLabels(this, peers) };

    if (present.length === 0) {
        return this.createError('object.missing', context, state, options);
    }

    context.present = present;
    context.presentWithLabels = internals.keysToLabels(this, present);

    return this.createError('object.xor', context, state, options);
};


internals.oxor = function (key, value, peers, parent, state, options) {

    const present = [];
    for (const peer of peers) {
        const keysExist = Hoek.reach(parent, peer, { functions: true });
        if (keysExist !== undefined) {
            present.push(peer);
        }
    }

    if (!present.length ||
        present.length === 1) {

        return;
    }

    const context = { peers, peersWithLabels: internals.keysToLabels(this, peers) };
    context.present = present;
    context.presentWithLabels = internals.keysToLabels(this, present);

    return this.createError('object.oxor', context, state, options);
};


internals.or = function (key, value, peers, parent, state, options) {

    for (const peer of peers) {
        const keysExist = Hoek.reach(parent, peer, { functions: true });
        if (keysExist !== undefined) {
            return;
        }
    }

    return this.createError('object.missing', {
        peers,
        peersWithLabels: internals.keysToLabels(this, peers)
    }, state, options);
};


internals.and = function (key, value, peers, parent, state, options) {

    const missing = [];
    const present = [];
    const count = peers.length;
    for (const peer of peers) {
        const keysExist = Hoek.reach(parent, peer, { functions: true });
        if (keysExist === undefined) {
            missing.push(peer);
        }
        else {
            present.push(peer);
        }
    }

    if (missing.length !== count &&
        present.length !== count) {

        return this.createError('object.and', {
            present,
            presentWithLabels: internals.keysToLabels(this, present),
            missing,
            missingWithLabels: internals.keysToLabels(this, missing)
        }, state, options);
    }
};


internals.nand = function (key, value, peers, parent, state, options) {

    const present = [];
    for (const peer of peers) {
        const keysExist = Hoek.reach(parent, peer, { functions: true });
        if (keysExist !== undefined) {
            present.push(peer);
        }
    }

    const main = peers[0];
    const values = peers.slice(1);
    return present.length === peers.length ? this.createError('object.nand', {
        main,
        mainWithLabel: internals.keysToLabels(this, main),
        peers: values,
        peersWithLabels: internals.keysToLabels(this, values)
    }, state, options) : null;
};


module.exports = new internals.Object();
