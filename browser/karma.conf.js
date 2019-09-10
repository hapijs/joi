const Path = require('path');

const WebpackMocha = require('./webpack.mocha');

const internals = {
    libs: Path.join(__dirname, '../lib/**/*.js'),
    tests: Path.join(__dirname, './tests/**/*.js')
};

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['mocha'],
        files: [
            internals.libs,
            internals.tests
        ],
        preprocessors: {
            [internals.libs]: ['webpack', 'sourcemap'],
            [internals.tests]: ['webpack', 'sourcemap']
        },
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_ERROR,
        autoWatch: true,
        browsers: ['ChromeHeadless'],
        singleRun: true,
        concurrency: Infinity,
        webpack: WebpackMocha,
        webpackMiddleware: {
            noInfo: true,
            stats: {
                chunks: false
            }
        },
    })
};
