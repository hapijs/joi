'use strict';

const Assert = require('@hapi/hoek/lib/assert');

const Common = require('./common');


const internals = {};



exports.Ids = internals.Ids = class {

    constructor() {

        this._reachable = false;
        this._map = new Map();
        this._schemaChain = false;
    }

    clone() {

        const clone = new internals.Ids();
        clone._map = new Map(this._map);
        clone._schemaChain = this._schemaChain;
        clone._reachable = this._reachable;
        return clone;
    }

    concat(source) {

        this._reachable = source._reachable;

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
            const def = node.schema._definition;
            adjusted = { id: node.id, schema: def.modify(node.schema, adjusted.id, adjusted.schema) };
        }

        return adjusted.schema;
    }

    labels(path, behind = []) {

        Assert(this._reachable, 'Schema type is not reachable');

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

        Assert(this._reachable, 'Schema type is not reachable');

        const current = path[0];
        const node = this._map.get(current);
        Assert(node, 'Schema does not contain path', [...behind, ...path].join('.'));

        const forward = path.slice(1);
        if (!forward.length) {
            return node.schema;
        }

        return node.schema._ids.reach(forward, [...behind, current]);
    }

    register(schema, key) {

        if (!schema ||
            !Common.isSchema(schema)) {

            return;
        }

        if (schema._definition.properties.schemaChain ||
            schema._ids._schemaChain) {

            this._schemaChain = true;
        }

        const id = schema._flags.id || key;
        if (!id) {
            return;
        }

        Assert(!this._map.has(id), 'Schema already contains id', id);
        this._map.set(id, { schema, key, id });
    }

    reset() {

        this._map = new Map();
        this._schemaChain = false;
    }

    _collect(path, behind = [], nodes = []) {

        Assert(this._reachable, 'Schema type is not reachable');

        const current = path[0];
        const node = this._map.get(current);
        Assert(node, 'Schema does not contain path', [...behind, ...path].join('.'));

        nodes = [node, ...nodes];

        const forward = path.slice(1);
        if (!forward.length) {
            return nodes;
        }

        Assert(node.schema._definition.modify, 'Schema node', [...behind, ...path].join('.'), 'does not support manipulation');
        return node.schema._ids._collect(forward, [...behind, current], nodes);
    }
};
