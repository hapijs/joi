// Load modules

var Path = require('path');
var Utils = require('./utils');


// Declare internals

var internals = {
    templatePattern: /\{\{\s*([^\s}]+?)\s*\}\}/ig
};


module.exports = internals.Messages = function (options) {

    options = options || {};
    var languagePath = options.languagePath || Path.join(__dirname, '..', 'languages', 'en-US.json');
    this._resources = require(languagePath);
};


internals.Messages.prototype.print = function (chain, key, replacements) {

    var message = Utils.reach(this._resources, chain);
    return message ? message.replace(internals.templatePattern, function (match, name) {

        var replacement = name === 'key' ? key : Utils.reach(replacements, name);
        return replacement;
    }) : key;
};
