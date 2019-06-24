'use strict';

const Hoek = require('@hapi/hoek');
const Marker = require('@hapi/marker');

const Pkg = require('../package.json');

let Messages;


const internals = {};


exports.version = Pkg.version;


exports.defaults = {
    abortEarly: true,
    allowUnknown: false,
    context: null,
    convert: true,
    dateFormat: 'iso',
    errors: {
        escapeHtml: false,
        language: null,
        wrapArrays: true
    },
    messages: {},
    nonEnumerables: false,
    noDefaults: false,
    presence: 'optional',
    skipFunctions: false,
    stripUnknown: false
};


exports.symbols = {
    any: Marker('joi-any-base'),                // Used to internally identify any-based types (shared with other joi versions)
    arraySingle: Symbol('arraySingle'),
    castFrom: Symbol('castFrom'),
    deepDefault: Symbol('deepDefault'),
    schema: Symbol('schema'),                   // Used by describe() to include a reference to the schema
    prefs: Symbol('prefs'),
    ref: Symbol('ref'),
    template: Symbol('template')
};


exports.alias = function (Class, aliases) {

    for (const [from, to] of aliases) {
        Class.prototype[to] = Class.prototype[from];
    }
};


exports.assertOptions = function (options, keys, name = 'Options') {

    Hoek.assert(options && typeof options === 'object' && !Array.isArray(options), 'Options must be an object');
    const unknownKeys = Object.keys(options).filter((k) => !keys.includes(k));
    Hoek.assert(unknownKeys.length === 0, `${name} contain unknown keys: ${unknownKeys}`);
};


exports.callWithDefaults = function (root, schema, args) {

    Hoek.assert(root, 'Must be invoked on a Joi instance.');

    if (root._defaults) {
        schema = root._defaults(schema);
    }

    schema._root = root;

    return schema._init(...args);
};


exports.compare = function (a, b, operator) {

    switch (operator) {
        case '=': return a === b;
        case '>': return a > b;
        case '<': return a < b;
        case '>=': return a >= b;
        case '<=': return a <= b;
    }
};


exports.default = function (value, defaultValue) {

    return value === undefined ? defaultValue : value;
};


exports.extend = function (Class, prop, methods) {

    prop = `_${prop}`;
    Class.prototype[prop] = Object.assign({}, Class.prototype[prop], methods);
};


exports.isResolvable = function (obj) {

    if (!obj) {
        return false;
    }

    return obj[exports.symbols.ref] || obj[exports.symbols.template];
};


exports.isSchema = function (schema, options = {}) {

    const any = schema[exports.symbols.any];
    if (!any) {
        return false;
    }

    Hoek.assert(options.legacy || any.version === exports.version, 'Cannot mix different versions of joi schemas');
    return true;
};


exports.preferences = function (target, source) {

    Messages = Messages || require('./messages');

    if (!source) {
        return target;
    }

    target = target || {};

    const merged = Object.assign({}, target, source);
    if (source.errors &&
        target.errors) {

        merged.errors = Object.assign({}, target.errors, source.errors);
    }

    if (source.messages) {
        merged.messages = Messages.compile(source.messages, target.messages);
    }

    delete merged[exports.symbols.prefs];
    return merged;
};


exports.verifyFlat = function (args, method) {

    for (const arg of args) {
        Hoek.assert(!Array.isArray(arg), 'Method no longer accepts array arguments:', method);
    }
};
