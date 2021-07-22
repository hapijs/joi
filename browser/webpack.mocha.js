const Path = require('path');
const Webpack = require('webpack');

const WebpackConfig = require('./webpack.config');

WebpackConfig.mode = 'production';
WebpackConfig.devServer = {
    host: 'localhost',
    port: 8081
};
WebpackConfig.devtool = 'inline-source-map';
WebpackConfig.entry = [
    `mocha-loader!${Path.join(__dirname, 'tests')}`
];
WebpackConfig.output.publicPath = 'http://localhost:8081';
WebpackConfig.module.rules[1].use.options.presets[0][1].exclude = [
    '@babel/plugin-transform-regenerator'
];

// Used in testing.
WebpackConfig.plugins.push(new Webpack.DefinePlugin({
  'process.env.NODE_DEBUG': false,
}));
WebpackConfig.node = {
  global: true,
};
WebpackConfig.resolve.fallback.util = require.resolve('util/');
WebpackConfig.resolve.fallback.assert = require.resolve('assert/');

module.exports = WebpackConfig;
