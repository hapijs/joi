'use strict';

const Pkg = require('../../package.json');


const internals = {};


module.exports = function () {

    return `{ "version": "${Pkg.version}" }`;
};
