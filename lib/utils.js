'use strict';

const Hoek = require('@hapi/hoek');

const Settings = require('./settings');


const internals = {};


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

    return !!schema[Settings.symbols.any];
};
