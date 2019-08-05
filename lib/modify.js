'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('./common');


const internals = {};



exports.Ids = internals.Ids = class {

    constructor(schema) {

        this._type = schema.type;
        this._map = new Map();
        this._schemaChain = false;
    }

    clone() {

        const clone = new internals.Ids({ type: this._type });
        clone._map = new Map(this._map);
        clone._schemaChain = this._schemaChain;
        return clone;
    }

    concat(source) {

        if (source._type !== 'any') {
            this._type = source._type;
        }

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

        Hoek.assert(Common.isSchema(adjusted.schema), 'adjuster function failed to return a joi schema type');

        for (const node of chain) {
            adjusted = { id: node.id, schema: node.schema._override(adjusted.id, adjusted.schema) };
        }

        return adjusted.schema;
    }

    labels(path, behind = []) {

        this._verifySupported();

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

        this._verifySupported();

        const current = path[0];
        const node = this._map.get(current);
        Hoek.assert(node, 'Schema does not contain path', [...behind, ...path].join('.'));

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

        Hoek.assert(!this._map.has(id), 'Schema already contains id', id);
        this._map.set(id, { schema, key, id });
    }

    reset() {

        this._map = new Map();
        this._schemaChain = false;
    }

    _collect(path, behind = [], nodes = []) {

        this._verifySupported();

        const current = path[0];
        const node = this._map.get(current);
        Hoek.assert(node, 'Schema does not contain path', [...behind, ...path].join('.'));

        nodes = [node, ...nodes];

        const forward = path.slice(1);
        if (!forward.length) {
            return nodes;
        }

        Hoek.assert(typeof node.schema._override === 'function', 'Schema node', [...behind, ...path].join('.'), 'does not support manipulation');
        return node.schema._ids._collect(forward, [...behind, current], nodes);
    }

    _verifySupported() {

        Hoek.assert(['array', 'object', 'alternatives'].includes(this._type), 'Cannot reach into schema', this._type, 'type');
    }
};
