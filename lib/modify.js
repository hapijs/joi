'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('./common');


const internals = {};



exports.Ids = internals.Ids = class {

    constructor(schema) {

        this._type = schema.type;
        this._unsupported = ['array', 'object', 'alternatives'].includes(this._type) ? null : new Hoek.Error(['Cannot reach into schema', this._type, 'type']);
        this._map = new Map();
    }

    register(schema, key) {

        if (!schema ||
            !Common.isSchema(schema)) {

            return;
        }

        const id = schema._flags.id || key;
        if (!id) {
            return;
        }

        Hoek.assert(!this._map.has(id), 'Schema already contains id', id);
        this._map.set(id, { schema, key, id });
    }

    unregister(schema, key) {

        const id = schema._flags.id || key;
        this._map.delete(id);
    }

    clone() {

        const clone = new internals.Ids({ type: this._type });
        clone._unsupported = this._unsupported;
        clone._map = new Map(this._map);
        return clone;
    }

    concat(source) {

        for (const key of source._map.keys()) {
            this._map.set(key, source._map.get(key));
        }
    }

    reach(path, behind = []) {

        Hoek.assert(!this._unsupported, this._unsupported);

        const current = path[0];
        const node = this._map.get(current);
        Hoek.assert(node, 'Schema does not contain path', [...behind, ...path].join('.'));

        const forward = path.slice(1);
        if (!forward.length) {
            return node.schema;
        }

        return node.schema._ids.reach(forward, [...behind, current]);
    }

    labels(path, behind = []) {

        Hoek.assert(!this._unsupported, this._unsupported);

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

    modify(path, adjuster, root) {

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

    _collect(path, behind = [], nodes = []) {

        Hoek.assert(!this._unsupported, this._unsupported);

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
};
