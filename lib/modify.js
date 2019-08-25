'use strict';

const Assert = require('@hapi/hoek/lib/assert');

const Common = require('./common');
const Ref = require('./ref');


const internals = {};



exports.Ids = internals.Ids = class {

    constructor() {

        this._map = new Map();
        this._schemaChain = false;
    }

    clone() {

        const clone = new internals.Ids();
        clone._map = new Map(this._map);
        clone._schemaChain = this._schemaChain;
        return clone;
    }

    concat(source) {

        if (source._schemaChain) {
            this._schemaChain = true;
        }

        for (const key of source._map.keys()) {
            this._map.set(key, source._map.get(key));
        }
    }

    fork(path, adjuster, root) {

        const chain = this._collect(path);
        chain.push({ schema: root });
        const tail = chain.shift();
        let adjusted = { id: tail.id, schema: adjuster(tail.schema) };

        Assert(Common.isSchema(adjusted.schema), 'adjuster function failed to return a joi schema type');

        for (const node of chain) {
            adjusted = { id: node.id, schema: internals.fork(node.schema, adjusted.id, adjusted.schema) };
        }

        return adjusted.schema;
    }

    labels(path, behind = []) {

        const current = path[0];
        const node = this._map.get(current);
        if (!node) {
            return [...behind, ...path].join('.');
        }

        const forward = path.slice(1);
        behind = [...behind, node.schema._flags.label || current];
        if (!forward.length) {
            return behind.join('.');
        }

        return node.schema._ids.labels(forward, behind);
    }

    reach(path, behind = []) {

        const current = path[0];
        const node = this._map.get(current);
        Assert(node, 'Schema does not contain path', [...behind, ...path].join('.'));

        const forward = path.slice(1);
        if (!forward.length) {
            return node.schema;
        }

        return node.schema._ids.reach(forward, [...behind, current]);
    }

    register(schema) {

        if (!schema ||
            !Common.isSchema(schema)) {

            return;
        }

        if (schema.$_property('schemaChain') ||
            schema._ids._schemaChain) {

            this._schemaChain = true;
        }

        const id = schema._flags.id || schema._flags._key;
        if (!id) {
            return;
        }

        Assert(!this._map.has(id), 'Schema already contains id', id);
        this._map.set(id, { schema, id });
    }

    reset() {

        this._map = new Map();
        this._schemaChain = false;
    }

    _collect(path, behind = [], nodes = []) {

        const current = path[0];
        const node = this._map.get(current);
        Assert(node, 'Schema does not contain path', [...behind, ...path].join('.'));

        nodes = [node, ...nodes];

        const forward = path.slice(1);
        if (!forward.length) {
            return nodes;
        }

        return node.schema._ids._collect(forward, [...behind, current], nodes);
    }
};


internals.fork = function (schema, id, replacement) {

    const each = (item) => {

        if (id === (item._flags.id || item._flags._key)) {
            return replacement;
        }
    };

    const obj = exports.schema(schema, { each, ref: false, once: true });
    return obj.$_mutateRebuild();
};


exports.schema = function (schema, options) {

    let obj;

    for (const name in schema._flags) {
        if (name[0] === '_') {
            continue;
        }

        const result = internals.scan(schema._flags[name], { source: 'flags', name }, options);
        if (result !== undefined) {
            obj = obj || schema.clone();
            obj._flags[name] = result;
            if (options.once) {
                return obj;
            }
        }
    }

    for (let i = 0; i < schema._rules.length; ++i) {
        const rule = schema._rules[i];
        const result = internals.scan(rule.args, { source: 'rules', name: rule.name }, options);
        if (result !== undefined) {
            obj = obj || schema.clone();
            const clone = Object.assign({}, rule);
            clone.args = result;
            obj._rules[i] = clone;

            const existingUnique = obj._singleRules.get(rule.name);
            if (existingUnique === rule) {
                obj._singleRules.set(rule.name, clone);
            }

            if (options.once) {
                return obj;
            }
        }
    }

    for (const name in schema.$_terms) {
        if (name[0] === '_') {
            continue;
        }

        const result = internals.scan(schema.$_terms[name], { source: 'terms', name }, options);
        if (result !== undefined) {
            obj = obj || schema.clone();
            obj.$_terms[name] = result;

            if (options.once) {
                return obj;
            }
        }
    }

    return obj;
};


internals.scan = function (item, source, options, _path) {

    const path = _path || [];

    if (item === null ||
        typeof item !== 'object') {

        return;
    }

    let clone;

    if (Array.isArray(item)) {
        for (let i = 0; i < item.length; ++i) {
            const result = internals.scan(item[i], source, options, [i, ...path]);
            if (result !== undefined) {
                clone = clone || item.slice();
                clone[i] = result;
            }
        }

        return clone;
    }

    if (options.schema !== false && Common.isSchema(item) ||
        options.ref !== false && Ref.isRef(item)) {

        const result = options.each(item, { ...source, path });
        if (result === item) {
            return;
        }

        return result;
    }

    for (const key in item) {
        const result = internals.scan(item[key], source, options, [key, ...path]);
        if (result !== undefined) {
            clone = clone || Object.assign({}, item);
            clone[key] = result;
        }
    }

    return clone;
};
