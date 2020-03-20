'use strict';

const webpackConfigFactory = require('./build/webpack.config.factory');

module.exports = webpackConfigFactory({
    filename: 'joi-browser.compat.min.js',
    targets: 'defaults',
});
