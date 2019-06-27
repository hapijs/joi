'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./types/any');


const internals = {};


exports.reach = function (schema, path) {

    Hoek.assert(schema && schema instanceof Any, 'you must provide a joi schema');
    Hoek.assert(Array.isArray(path) || typeof path === 'string', 'path must be a string or an array of strings');

    const schemaPath = typeof path === 'string' ? (path ? path.split('.') : []) : path.slice();
    return internals.reach(schema, schemaPath);
};


internals.reach = function (schema, path) {

    if (!path.length) {
        return schema;
    }

    Hoek.assert(schema.type === 'object', 'Cannot reach into', schema.type, 'schema type');

    const children = schema._inner.children;
    if (!children) {
        return;
    }

    const key = path.shift();
    for (const child of children) {
        if (child.key === key) {
            return internals.reach(child.schema, path);
        }
    }
};
