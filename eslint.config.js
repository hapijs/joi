'use strict';

const HapiPlugin = require('@hapi/eslint-plugin');

module.exports = [
    {
        ignores: ['browser', 'dist', 'sandbox.js']
    },
    ...HapiPlugin.configs.module
];
