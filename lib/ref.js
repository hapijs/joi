'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('./common');

let Template;


const internals = {
    symbol: Symbol('ref')       // Used to internally identify references (shared with other joi versions)
};


exports.create = function (key, options = {}) {

    Hoek.assert(typeof key === 'string', 'Invalid reference key:', key);
    Common.assertOptions(options, ['adjust', 'ancestor', 'iterables', 'map', 'prefix', 'separator']);
    Hoek.assert(!options.adjust || typeof options.adjust === 'function', 'options.adjust must be a function');
    Hoek.assert(!options.prefix || typeof options.prefix === 'object', 'options.prefix must be an object');
    Hoek.assert(!options.map || Array.isArray(options.map), 'options.map must be an array');
    Hoek.assert(!options.map || !options.adjust, 'Cannot set both map and adjust options');

    const ref = {
        adjust: options.adjust || null,
        ancestor: options.ancestor,
        iterables: options.iterables || null,
        map: options.map ? new Map(options.map) : null,
        separator: Common.default(options.separator, '.')
    };

    const separator = ref.separator;
    const context = internals.context(key, options.prefix);
    ref.type = context.type;
    key = context.key;

    if (ref.type === 'value') {
        if (separator &&
            separator === key) {

            key = null;
            ref.ancestor = 0;
        }
        else {
            if (ref.ancestor !== undefined) {
                Hoek.assert(!separator || key[0] !== separator, 'Cannot combine prefix with ancestor option');
            }
            else {
                const [ancestor, slice] = internals.ancestor(key, separator);
                if (slice) {
                    key = key.slice(slice);
                    if (key === '') {
                        key = null;
                    }
                }

                ref.ancestor = ancestor;
            }
        }
    }

    ref.path = separator ? (key === null ? [] : key.split(separator)) : [key];

    return new internals.Ref(ref);
};


exports.isRef = function (ref) {

    return ref ? !!ref[Common.symbols.ref] : false;
};


internals.Ref = class {

    constructor(ref) {

        Object.assign(this, ref);       // adjust, ancestor, iterables, map, path, separator, type

        this.depth = this.path.length;
        this.key = this.path.length ? this.path.join(this.separator) : null;
        this.root = this.path[0];

        this.updateDisplay();
    }

    resolve(value, state, prefs, local) {

        const ancestor = this.ancestor;
        Hoek.assert(this.type !== 'value' || !ancestor || ancestor <= state.ancestors.length, 'Invalid reference exceeds the schema root:', this.display);

        const target = this.type === 'value' ?
            (ancestor ? state.ancestors[ancestor - 1] : value) :
            (this.type === 'global' ? prefs.context : local);

        let resolved = Hoek.reach(target, this.path, { iterables: this.iterables, functions: true });

        if (this.adjust) {
            resolved = this.adjust(resolved);
        }

        if (this.map) {
            const mapped = this.map.get(resolved);
            if (mapped !== undefined) {
                return mapped;
            }
        }

        return resolved;
    }

    toString() {

        return this.display;
    }

    clone() {

        return new internals.Ref(this);
    }

    describe() {

        const ref = { path: this.path };

        if (this.type !== 'value') {
            ref.type = this.type;
        }

        if (this.separator !== '.') {
            ref.separator = this.separator;
        }

        if (this.type === 'value' &&
            this.ancestor !== 1) {

            ref.ancestor = this.ancestor;
        }

        if (this.map) {
            ref.map = [...this.map];
        }

        for (const key of ['adjust', 'iterables']) {
            if (this[key] !== null) {
                ref[key] = this[key];
            }
        }

        return { ref };
    }

    updateDisplay() {

        if (this.type !== 'value') {
            this.display = `ref:${this.type}:${this.key}`;
            return;
        }

        if (!this.separator) {
            this.display = `ref:${this.key}`;
            return;
        }

        if (!this.ancestor) {
            this.display = `ref:${this.separator}${this.key}`;
            return;
        }

        if (this.ancestor === 1) {
            this.display = `ref:${this.key}`;
            return;
        }

        const lead = new Array(this.ancestor + 1).fill(this.separator).join('');
        this.display = `ref:${lead}${this.key || ''}`;
    }
};


internals.Ref.prototype[Common.symbols.ref] = true;


internals.context = function (key, prefix = {}) {

    key = key.trim();

    if (key[0] === (prefix.global || '$')) {
        return { key: key.slice(1), type: 'global' };
    }

    if (key[0] === (prefix.local || '#')) {
        return { key: key.slice(1), type: 'local' };
    }

    return { key, type: 'value' };
};


internals.ancestor = function (key, separator) {

    if (!separator) {
        return [1, 0];              // 'a_b' -> 1 (parent)
    }

    if (key[0] !== separator) {     // 'a.b' -> 1 (parent)
        return [1, 0];
    }

    if (key[1] !== separator) {     // '.a.b' -> 0 (self)
        return [0, 1];
    }

    let i = 2;
    while (key[i] === separator) {
        ++i;
    }

    return [i - 1, i];              // '...a.b.' -> 2 (grandparent)
};


exports.toSibling = 0;

exports.toParent = 1;


exports.Manager = class {

    constructor() {

        this.refs = [];                     // 0: [self refs], 1: [parent refs], 2: [grandparent refs], ...
    }

    register(source, target) {

        if (!source) {
            return;
        }

        target = target === undefined ? exports.toParent : target;

        // Array

        if (Array.isArray(source)) {
            for (const ref of source) {
                this.register(ref, target);
            }

            return;
        }

        // Any

        if (Common.isSchema(source)) {
            for (const item of source._refs.refs) {
                if (item.ancestor - target >= 0) {
                    this.refs.push({ ancestor: item.ancestor - target, root: item.root });
                }
            }

            return;
        }

        // Reference

        if (exports.isRef(source) &&
            source.type === 'value' &&
            source.ancestor - target >= 0) {

            this.refs.push({ ancestor: source.ancestor - target, root: source.root });
        }

        // Template

        Template = Template || require('./template');

        if (Template.isTemplate(source)) {
            this.register(source.refs(), target);
        }
    }

    get length() {

        return this.refs.length;
    }

    clone() {

        const copy = new exports.Manager();
        copy.refs = Hoek.clone(this.refs);
        return copy;
    }

    reset() {

        this.refs = [];
    }

    roots() {

        return this.refs.filter((ref) => !ref.ancestor).map((ref) => ref.root);
    }
};
