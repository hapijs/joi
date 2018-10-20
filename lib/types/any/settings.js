'use strict';

// Load modules

const Hoek = require('hoek');

const Symbols = require('../symbols');


// Declare internals

const internals = {};


exports.concat = function (target, source) {

    if (!source) {
        return target;
    }

    const obj = Object.assign({}, target);

    const language = source.language;

    Object.assign(obj, source);

    if (language) {
        obj.language = Hoek.applyToDefaults(obj.language, language);
    }

    if (obj[Symbols.settingsCache]) {
        delete obj[Symbols.settingsCache];
    }

    return obj;
};
