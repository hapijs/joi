'use strict';

const Hoek = require('@hapi/hoek');


const internals = {};


exports.verifyFlat = function (args, method) {

    for (const arg of args) {
        Hoek.assert(!Array.isArray(arg), 'Method no longer accepts array arguments:', method);
    }
};
