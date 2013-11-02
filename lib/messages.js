// Load modules

var Path = require('path');
var Utils = require('./utils');


// Declare internals

var internals = {
    templatePattern: /\{\{\s*([^\s}]+?)\s*\}\}/ig
};


module.exports = internals.Messages = function (options) {

    options = options || {};
    var languagePath = options.languagePath || Path.join(__dirname, '..', 'languages', 'en-us.json');
    this._resources = require(languagePath);
};


internals.Messages.prototype.print = function (chain, key, replacements) {

    var message = Utils.reach(this._resources, chain);
    if (!message) {
        return key;
    }

    return message.replace(internals.templatePattern, function (match, name) {

        return (name === 'key' ? key : Utils.reach(replacements, name));
    });
};
