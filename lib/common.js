'use strict';

const Hoek = require('@hapi/hoek');
const Marker = require('@hapi/marker');


const internals = {};


exports.defaults = {
    abortEarly: true,
    allowUnknown: false,
    // context: null
    convert: true,
    dateErrorFormat: 'iso',
    escapeErrors: false,
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
    deepDefault: Symbol('deepDefault'),
    schema: Symbol('schema'),                   // Used by describe() to include a reference to the schema
    prefs: Symbol('prefs')
};


exports.preferences = function (target, source) {

    if (!source) {
        return target;
    }

    const merged = Hoek.applyToDefaults(target || {}, source);
    if (merged[exports.symbols.prefs]) {
        delete merged[exports.symbols.prefs];
    }

    return merged;
};


exports.verifyFlat = function (args, method) {

    for (const arg of args) {
        Hoek.assert(!Array.isArray(arg), 'Method no longer accepts array arguments:', method);
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


exports.isSchema = function (schema) {

    return !!schema[exports.symbols.any];
};


exports.default = function (value, defaultValue) {

    return value === undefined ? defaultValue : value;
};


exports.assertOptions = function (options, keys, name = 'Options') {

    Hoek.assert(options && typeof options === 'object' && !Array.isArray(options), 'Options must be an object');
    const unknownKeys = Object.keys(options).filter((k) => !keys.includes(k));
    Hoek.assert(unknownKeys.length === 0, `${name} contain unknown keys: ${unknownKeys}`);
};
