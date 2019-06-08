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


exports.concat = function (target, source) {

    if (!source) {
        return target;
    }

    const obj = Object.assign({}, target);

    const language = source.language;

    Object.assign(obj, source);

    if (language && target && target.language) {
        obj.language = Hoek.applyToDefaults(target.language, language);
    }

    if (obj[exports.symbols.settingsCache]) {
        delete obj[exports.symbols.settingsCache];
    }

    return obj;
};
