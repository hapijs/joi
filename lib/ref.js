'use strict';

const Hoek = require('@hapi/hoek');
const Marker = require('@hapi/marker');

const Utils = require('./utils');


const internals = {
    symbol: Marker('ref')       // Used to internally identify references (shared with other joi versions)
};


module.exports = exports = internals.Ref = class {

    constructor(key, options = {}) {

        Hoek.assert(typeof key === 'string', 'Invalid reference key:', key);
        Hoek.assert(!options.adjust || typeof options.adjust === 'function', 'options.adjust must be a function');

        this.settings = Hoek.clone(options);
        this[internals.symbol] = true;

        const contextPrefix = this.settings.contextPrefix || '$';
        const separator = Utils.default(this.settings.separator, '.');

        this.isContext = key[0] === contextPrefix;
        if (this.isContext) {
            key = key.slice(1);
            this.display = `context:${key}`;
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
        this.path = separator ? this.key.split(separator) : [this.key];
        this.depth = this.path.length;
        this.root = this.path[0];
    }

    resolve(value, state, options = {}) {

        const ancestor = this.settings.ancestor;
        Hoek.assert(!ancestor || ancestor <= state.ancestors.length, 'Invalid reference exceeds the schema root:', this.display);

        const target = this.isContext ? options.context : (ancestor ? state.ancestors[ancestor - 1] : value);
        let resolved = Hoek.reach(target, this.path);
        if (this.settings.adjust) {
            resolved = this.settings.adjust(resolved);
        }

        return resolved;
    }

    toString() {

        return this.display;
    }

    describe() {

        const about = {
            type: this.isContext ? 'context' : 'ref',
            key: this.key,
            path: this.path
        };

        if (this.settings.adjust) {
            about.adjust = this.settings.adjust;
        }

        return about;
    }

    static isRef(ref) {

        return ref && !!ref[internals.symbol];
    }
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

    register(source, target = internals.Ref.toParent) {

        if (!source) {
            return;
        }

        // Any

        if (Utils.isSchema(source)) {
            for (const item of source._refs.refs) {
                if (item.ancestor - target >= 0) {
                    this.refs.push({ ancestor: item.ancestor - target, root: item.root });
                }
            }

            return;
        }

        // Reference

        if (internals.Ref.isRef(source) &&
            !source.isContext &&
            source.ancestor - target >= 0) {

            this.refs.push({ ancestor: source.ancestor - target, root: source.root });
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
