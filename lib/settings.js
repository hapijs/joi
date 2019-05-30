'use strict';

const Hoek = require('@hapi/hoek');


const internals = {};


exports.defaults = {
    abortEarly: true,
    convert: true,
    allowUnknown: false,
    skipFunctions: false,
    stripUnknown: false,
    language: {},
    presence: 'optional',
    noDefaults: false,
    escapeHtml: false

    // context: null
};


exports.symbols = {
    settingsCache: Symbol('settingsCache'),
    schema: Symbol('schema')
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
