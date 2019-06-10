'use strict';

const Hoek = require('@hapi/hoek');
const Marker = require('@hapi/marker');


const internals = {};


exports.defaults = {
    abortEarly: true,
    allowUnknown: false,
    // context: null
    convert: true,
    escapeHtml: false,
    language: {},
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
    settingsCache: Symbol('settingsCache')
};


exports.settings = function (target, source) {

    if (!source) {
        return target;
    }

    const obj = Object.assign({}, target);
    const language = source.language;
    Object.assign(obj, source);

    if (language &&
        target &&
        target.language) {

        obj.language = Hoek.applyToDefaults(target.language, language);
    }

    if (obj[exports.symbols.settingsCache]) {
        delete obj[exports.symbols.settingsCache];
    }

    return obj;
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


exports.assertOptions = function (options, keys) {

    Hoek.assert(options && typeof options === 'object' && !Array.isArray(options), 'Options must be an object');
    const unknownKeys = Object.keys(options).filter((k) => !keys.includes(k));
    Hoek.assert(unknownKeys.length === 0, `Options contain unknown keys: ${unknownKeys}`);
};
