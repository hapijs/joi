// Load modules

var Path = require('path');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Messages = function (options) {

    var language = options.language || 'en-US';
    this._resources = require(Path.join(__dirname, '..', 'languages', language + '.json'));
};


internals.Messages.prototype.print = function (chain, key, value) {

    var message = Utils.reach(this._resources, chain);
    return message && /\{\{key\}\}/ig.test(message) ?
        message.replace(/\{\{key\}\}/ig, key).replace(/\{\{value\}\}/ig, value) :
        key;
};
