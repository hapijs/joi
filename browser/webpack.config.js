'use strict';

const Path = require('path');

module.exports = {
    entry: '../lib/index.js',
    output: {
        filename: './joi-browser.min.js',
        library: 'joi',
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                use: 'null-loader',
                include: [
                    Path.join(__dirname, '../lib/types/binary.js')
                ]
            },
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        'presets': [
                            [
                                '@babel/preset-env',
                                {
                                    'targets': '> 0.25%, not dead'
                                }
                            ]
                        ]
                    }
                }
            }
        ]
    }
};
