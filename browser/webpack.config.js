'use strict';

const Path = require('path');

const Webpack = require('webpack');
const { BundleComparisonPlugin } = require('@mixer/webpack-bundle-compare');


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
        }),
        new BundleComparisonPlugin({
            file: '../stats.msp.gz',
            format: 'msgpack',
            gzip: true,
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
                            '@babel/plugin-transform-class-properties',
                            '@babel/plugin-transform-optional-chaining',
                            '@babel/plugin-transform-nullish-coalescing-operator',
                        ]
                    }
                }
            },
            {
                test: /@(hapi|sideway)\//,
                sideEffects: false
            }
        ]
    },
    node: false,
    resolve: {
      alias: {
          [Path.join(__dirname, '../lib/annotate.js')]: false,
          [Path.join(__dirname, '../lib/manifest.js')]: false,
          [Path.join(__dirname, '../lib/trace.js')]: false,
          [Path.join(__dirname, '../lib/types/binary.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/tlds/esm/index.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/address/esm/decode.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/hoek/lib/bench.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/hoek/lib/block.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/hoek/lib/contain.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/hoek/lib/flatten.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/hoek/lib/intersect.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/hoek/lib/isPromise.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/hoek/lib/escapeHeaderAttribute.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/hoek/lib/escapeJson.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/hoek/lib/once.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/hoek/lib/reachTemplate.js')]: false,
          [Path.join(__dirname, '../node_modules/@hapi/hoek/lib/wait.js')]: false,
      },
      fallback: {
        url: false,
        util: false,
      }
    }
};
