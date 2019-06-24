'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('./common');
const Ref = require('./ref');


const internals = {};


exports.schema = function (Joi, config, options = {}) {

    Common.assertOptions(options, ['appendPath']);

    if (options.appendPath) {
        return internals.appendPath(Joi, config);
    }

    if (config !== undefined &&
        config !== null &&
        typeof config === 'object') {

        if (Common.isResolvable(config)) {
            return Joi.valid(config);
        }

        if (Common.isSchema(config)) {
            return config;
        }

        if (Array.isArray(config)) {
            return Joi.alternatives().try(config);
        }

        if (config instanceof RegExp) {
            return Joi.string().regex(config);
        }

        if (config instanceof Date) {
            return Joi.date().valid(config);
        }

        Hoek.assert(Object.getPrototypeOf(config) === Object.getPrototypeOf({}), 'Schema can only contain plain objects');

        return Joi.object().keys(config);
    }

    if (typeof config === 'string') {
        return Joi.string().valid(config);
    }

    if (typeof config === 'number') {
        return Joi.number().valid(config);
    }

    if (typeof config === 'boolean') {
        return Joi.boolean().valid(config);
    }

    Hoek.assert(config === null, 'Invalid schema content:', config);

    return Joi.valid(null);
};


internals.appendPath = function (Joi, config) {

    try {
        return exports.schema(Joi, config);
    }
    catch (err) {
        if (err.path !== undefined) {
            err.message = `${err.message}${err.message[err.message.length - 1] === ' ' ? '' : ' '}(${err.path})`;
        }

        throw err;
    }
};


exports.ref = function (id, options) {

    return Ref.isRef(id) ? id : new Ref(id, options);
};


exports.compile = function (root, schema, options = {}) {

    Common.assertOptions(options, ['legacy']);

    // Compiled by any supported version

    const any = schema && schema[Common.symbols.any];
    if (any) {
        Hoek.assert(options.legacy || any.version === Common.version, 'Cannot mix different versions of joi schemas');
        return schema;
    }

    // Uncompiled root

    if (typeof schema !== 'object' ||
        !options.legacy) {

        return internals.appendPath(root, schema);      // Will error if schema contains other versions
    }

    // Scan schema for compiled parts

    const compiler = internals.walk(schema);
    if (!compiler) {
        return internals.appendPath(root, schema);
    }

    return compiler.compile(compiler.root, schema);
};


internals.walk = function (schema) {

    if (typeof schema !== 'object') {
        return null;
    }

    if (Array.isArray(schema)) {
        for (const item of schema) {
            const compiler = internals.walk(item);
            if (compiler) {
                return compiler;
            }
        }

        return null;
    }

    const any = schema[Common.symbols.any];
    if (any) {
        return { root: schema[any.root], compile: any.compile };
    }

    Hoek.assert(Object.getPrototypeOf(schema) === Object.getPrototypeOf({}), 'Schema can only contain plain objects');

    for (const key in schema) {
        const compiler = internals.walk(schema[key]);
        if (compiler) {
            return compiler;
        }
    }

    return null;
};
