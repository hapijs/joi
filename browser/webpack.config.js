'use strict';

const Path = require('path');

const Webpack = require('webpack');


module.exports = {
    entry: '../lib/index.js',
    output: {
        filename: 'joi-browser.min.js',
        path: Path.join(__dirname, '../dist'),
        library: 'joi',
        libraryTarget: 'umd'
    },
    plugins: [
        new Webpack.DefinePlugin({
            Buffer: false
        })
    ],
    module: {
        rules: [
            {
                use: './lib/version-loader',
                include: [
                    Path.join(__dirname, '../package.json')
                ]
            },
            {
                use: 'null-loader',
                include: [
                    Path.join(__dirname, '../lib/annotate.js'),
                    Path.join(__dirname, '../lib/manifest.js'),
                    Path.join(__dirname, '../lib/trace.js'),
                    Path.join(__dirname, '../lib/types/binary.js'),
                    Path.join(__dirname, '../node_modules/@sideway/address/lib/tlds.js')
                ]
            },
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/preset-env',
                                {
                                    'targets': '> 1%, not IE 11, not dead'
                                }
                            ]
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties'
                        ]
                    }
                }
            }
        ]
    },
    node: {
        url: 'empty',
        util: 'empty'
    }
};
