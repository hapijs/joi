'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('./common');

let Template;


const internals = {
    symbol: Symbol('ref')       // Used to internally identify references (shared with other joi versions)
};


module.exports = exports = internals.Ref = class {

    constructor(key, options = {}) {

        Hoek.assert(typeof key === 'string', 'Invalid reference key:', key);
        Common.assertOptions(options, ['adjust', 'ancestor', 'iterables', 'map', 'prefix', 'separator']);
        Hoek.assert(!options.adjust || typeof options.adjust === 'function', 'options.adjust must be a function');
        Hoek.assert(!options.prefix || typeof options.prefix === 'object', 'options.prefix must be an object');
        Hoek.assert(!options.map || Array.isArray(options.map), 'options.map must be an array');
        Hoek.assert(!options.map || !options.adjust, 'Cannot set both map and adjust options');

        this.settings = Hoek.clone(options);
        this.settings.prefix = this.settings.prefix || {};
        this.settings.map = this.settings.map && new Map(this.settings.map);

        const context = internals.context(key, this.settings);
        this.type = context.type;
        key = context.key;

        const separator = Common.default(this.settings.separator, '.');

        if (this.type !== 'value') {
            this.display = `ref:${this.type}:${key}`;
        }
        else if (separator &&
            separator === key) {

            key = null;
            this.settings.ancestor = 0;
        }
        else {
            if (this.settings.ancestor !== undefined) {
                Hoek.assert(!separator || key[0] !== separator, 'Cannot combine prefix with ancestor option');
            }
            else {
                const [ancestor, slice] = internals.ancestor(key, separator);
                if (slice) {
                    key = key.slice(slice);
                }

                this.settings.ancestor = ancestor;
            }

            this.display = internals.display(key, separator, this.settings.ancestor);
        }

        this.key = key;
        this.ancestor = this.settings.ancestor;
        this.path = separator ? (this.key === null ? [] : this.key.split(separator)) : [this.key];
        this.depth = this.path.length;
        this.root = this.path[0];
    }

    resolve(value, state, prefs, local) {

        const ancestor = this.settings.ancestor;
        Hoek.assert(this.type !== 'value' || !ancestor || ancestor <= state.ancestors.length, 'Invalid reference exceeds the schema root:', this.display);

        const target = this.type === 'value' ?
            (ancestor ? state.ancestors[ancestor - 1] : value) :
            (this.type === 'global' ? prefs.context : local);

        let resolved = Hoek.reach(target, this.path, { iterables: this.settings.iterables });
        if (this.settings.adjust) {
            resolved = this.settings.adjust(resolved);
        }

        if (this.settings.map) {
            const mapped = this.settings.map.get(resolved);
            if (mapped !== undefined) {
                return mapped;
            }
        }

        return resolved;
    }

    toString() {

        return this.display;
    }

    describe() {

        const about = {
            ref: this.type,
            key: this.key,
            path: this.path
        };

        if (this.settings.adjust) {
            about.adjust = this.settings.adjust;
        }

        if (this.settings.map) {
            about.map = [...this.settings.map];
        }

        return about;
    }

    static isRef(ref) {

        return ref ? !!ref[Common.symbols.ref] : false;
    }
};


internals.Ref.prototype[Common.symbols.ref] = true;


internals.context = function (key, options) {

    key = key.trim();

    if (key[0] === (options.prefix.global || '$')) {
        return { key: key.slice(1), type: 'global' };
    }

    if (key[0] === (options.prefix.local || '#')) {
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


internals.display = function (key, separator, ancestor) {

    if (!separator) {
        return `ref:${key}`;
    }

    if (!ancestor) {
        return `ref:${separator}${key}`;
    }

    if (ancestor === 1) {
        return `ref:${key}`;
    }

    return `ref:${new Array(3).fill('.').join('')}${key}`;
};


internals.Ref.toSibling = 0;
internals.Ref.toParent = 1;


internals.Ref.Manager = class {

    constructor() {

        this.refs = [];                     // 0: [self refs], 1: [parent refs], 2: [grandparent refs], ...
    }

    register(source, target) {

        if (!source) {
            return;
        }

        target = target === undefined ? internals.Ref.toParent : target;

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

        if (internals.Ref.isRef(source) &&
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

    clone() {

        const copy = new internals.Ref.Manager();
        copy.refs = Hoek.clone(this.refs);
        return copy;
    }

    roots() {

        return this.refs.filter((ref) => !ref.ancestor).map((ref) => ref.root);
    }
};
