// Load modules

var Path = require('path');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Messages = function (options) {

    options = options || {};
    var languagePath = options.languagePath || Path.join(__dirname, '..', 'languages', 'en-US.json');
    this._resources = require(languagePath);
};


internals.Messages.prototype.print = function (chain, key, value) {

    var message = Utils.reach(this._resources, chain);
    return message && /\{\{[ ]*key[ ]*\}\}/ig.test(message) ?
        message.replace(/\{\{[ ]*key[ ]*\}\}/ig, key).replace(/\{\{[ ]*value[ ]*\}\}/ig, value) :
        key;
};
