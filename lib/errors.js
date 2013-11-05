// Load modules

var Utils = require('./utils');


// Declare internals

var internals = {};


exports.process = function (errors, object, options) {

    if (!errors || !errors.length) {
        return null;
    }

    var resources = require(options.languagePath);

    var values = [];
    for (var i = 0, il = errors.length; i < il; ++i) {
        var item = errors[i];
        var message = Utils.reach(resources, item.type);
        if (message) {
            message = message.replace(/\{\{\s*([^\s}]+?)\s*\}\}/ig, function (match, name) { return Utils.reach(item.context, name); });
        }
        else {
            message = item.context.key;
        }

        values.push({ message: message, path: item.path });
    }

    return new internals.ValidationError(values, object);
};


internals.ValidationError = function (errors, object) {

    Error.call(this);
    this._errors = errors;
    this._object = object;

    return this.simple();
};

Utils.inherits(internals.ValidationError, Error);


internals.ValidationError.prototype.simple = function () {

    var message = '';
    this._errors.forEach(function (error) {

        message += (message ? '. ' : '') + error.message;
    });

    this.message = message;

    return this;
};


internals.ValidationError.prototype.annotated = function () {

    var errorObject = Utils.clone(this._object || {});
    var hasTemplate = false;

    for (var e = 0, el = this._errors.length; e < el; ++e) {
        var error = this._errors[e];
        var paths = error.path.split('.');
        var result = errorObject;
        for (var i = 0, il = paths.length; i < il; ++i) {
            if (i + 1 === il) {
                hasTemplate = true;
                var pathMessage = typeof result[paths[i]] === 'object' ? JSON.stringify(result[paths[i]]) : result[paths[i]];
                result[paths[i]] = '{{red}}' + pathMessage + '{{/}}{{br}}' + error.message + '{{/}}';
            }

            result = result[paths[i]];
        }
    }

    var annotated = JSON.stringify(errorObject, null, 1);

    if (hasTemplate) {
        annotated = annotated.replace(/\{\{\/\}\}/gi, '\u001b[0m');
        annotated = annotated.replace(/\{\{red\}\}/gi, '\u001b[41m');
        annotated = annotated.replace(/\{\{br\}\}/gi, '"\n\t"\u001b[31m');
    }

    this.message = annotated;

    return this;
};

