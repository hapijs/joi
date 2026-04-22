'use strict';

const Conditions = require('./conditions');


exports.matches = function (schema, mode, options) {

    const matches = [];
    for (const match of schema.$_terms.matches) {
        matches.push(...Conditions.matchSchemas(match, mode, options));
    }

    return matches;
};
