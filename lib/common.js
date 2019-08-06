'use strict';

const Hoek = require('@hapi/hoek');
const Marker = require('@hapi/marker');

const Pkg = require('../package.json');

let Messages;
let Schemas;


const internals = {
    isoDate: /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/
};


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
        stack: false,
        wrapArrays: true
    },
    externals: true,
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
    deepDefault: Symbol('deepDefault'),
    literal: Symbol('literal'),
    prefs: Symbol('prefs'),
    ref: Symbol('ref'),
    values: Symbol('values'),
    template: Symbol('template')
};


exports.assertOptions = function (options, keys, name = 'Options') {

    Hoek.assert(options && typeof options === 'object' && !Array.isArray(options), 'Options must be of type object');
    const unknownKeys = Object.keys(options).filter((k) => !keys.includes(k));
    Hoek.assert(unknownKeys.length === 0, `${name} contain unknown keys: ${unknownKeys}`);
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


exports.isIsoDate = function (date) {

    return internals.isoDate.test(date);
};


exports.isNumber = function (value) {

    return typeof value === 'number' && !isNaN(value);
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


exports.isValues = function (obj) {

    return obj[exports.symbols.values];
};


exports.limit = function (value) {

    return Number.isSafeInteger(value) && value >= 0;
};


exports.preferences = function (target, source) {

    Messages = Messages || require('./messages');

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


exports.State = class {

    constructor(path, ancestors, state) {

        this.path = path;
        this.ancestors = ancestors;

        this.mainstay = state.mainstay;
        this.schemas = state.schemas;
    }

    entry(schema, reference) {

        const ancestors = reference !== undefined ? [reference] : [];
        const state = new exports.State([], ancestors, this);
        state.schemas = state.schemas && [...state.schemas, schema];
        return state;
    }

    localize(path, ancestors = null, schema = null) {

        const state = new exports.State(path, ancestors, this);

        if (schema) {
            state.schemas = state.schemas && [...state.schemas, schema];
        }

        return state;
    }

    nest(schema) {

        const state = new exports.State(this.path, this.ancestors, this);
        state.schemas = state.schemas && [...state.schemas, schema];
        return state;
    }
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


exports.validateArg = function (value, { assert, message }) {

    if (exports.isSchema(assert)) {
        const result = assert.validate(value);
        if (!result.error) {
            return;
        }

        return result.error.message;
    }
    else if (!assert(value)) {
        return message;
    }
};


exports.verifyFlat = function (args, method) {

    for (const arg of args) {
        Hoek.assert(!Array.isArray(arg), 'Method no longer accepts array arguments:', method);
    }
};
