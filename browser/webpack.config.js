'use strict';

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
