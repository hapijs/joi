'use strict';

const Hoek = require('@hapi/hoek');
const Marker = require('@hapi/marker');

const Pkg = require('../package.json');

let Messages;
let Schemas;


const internals = {};


exports.version = Pkg.version;


exports.defaults = {
    abortEarly: true,
    allowUnknown: false,
    cache: true,
    context: null,
    convert: true,
    dateFormat: 'iso',
    errors: {
        escapeHtml: false,
        language: null,
        wrapArrays: true
    },
    // externals: true,                         // Defaults to semi-true (collect but not execute)
    messages: {},
    nonEnumerables: false,
    noDefaults: false,
    presence: 'optional',
    skipFunctions: false,
    stripUnknown: false,
    warnings: false
};


exports.symbols = {
    any: Marker('joi-any-base'),                // Used to internally identify any-based types (shared with other joi versions)
    arraySingle: Symbol('arraySingle'),
    castFrom: Symbol('castFrom'),
    deepDefault: Symbol('deepDefault'),
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


exports.checkPreferences = function (prefs) {

    Schemas = Schemas || require('./schemas');

    const result = Schemas.preferences.validate(prefs);

    if (result.error) {
        throw new Hoek.Error([result.error.details[0].message]);
    }
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

    Class.prototype[prop] = Object.assign({}, Class.prototype[prop]);

    for (const name of Reflect.ownKeys(methods)) {
        let method = methods[name];
        if (method &&
            typeof name === 'string' &&
            typeof method !== 'function') {

            const args = method.args;
            method = method.method;
            method.args = args;
        }

        Class.prototype[prop][name] = method;
    }
};


exports.isResolvable = function (obj) {

    if (!obj) {
        return false;
    }

    return obj[exports.symbols.ref] || obj[exports.symbols.template];
};


exports.isSchema = function (schema, options = {}) {

    const any = schema && schema[exports.symbols.any];
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


exports.tryWithPath = function (fn, key, options = {}) {

    try {
        return fn();
    }
    catch (err) {
        if (err.path !== undefined) {
            err.path = key + '.' + err.path;
        }
        else {
            err.path = key;
        }

        if (options.append) {
            err.message = `${err.message}(${err.path})`;
        }

        throw err;
    }
};


exports.verifyFlat = function (args, method) {

    for (const arg of args) {
        Hoek.assert(!Array.isArray(arg), 'Method no longer accepts array arguments:', method);
    }
};
