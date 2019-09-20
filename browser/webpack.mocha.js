const Path = require('path');

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
WebpackConfig.module.rules[2].use.options.presets[0][1].exclude = [
    '@babel/plugin-transform-regenerator'
];

delete WebpackConfig.node.util;

module.exports = WebpackConfig;
