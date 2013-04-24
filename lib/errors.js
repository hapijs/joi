// Load modules

var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Errors = function (object) {

    this._object = object;
    this._values = [];
};


internals.Errors.prototype.add = function (message, path) {

    var topPath = path.split('.')[0];
    if (message && !this._values.some(function (error) {                // Don't add an error when there is already a more specific one

        return topPath === error.path.split('.')[0];
    })) {

        this._values.push({
            message: message,
            path: path
        });
    }
};


internals.Errors.prototype.toError = function () {

    return this._values.length > 0 ? new internals.ValidationError(this._values, this._object) : null;
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

        if (message) {
            message += ', ';
        }

        message += error.message;
    });

    this.message = message;

    return this;
};


internals.ValidationError.prototype.annotated = function () {

    var errorObject = Utils.clone(this._object || {});
    var hasTemplate = false;

    this._errors.forEach(function (error) {

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
    });

    var annotated = JSON.stringify(errorObject, null, 1);

    if (hasTemplate) {
        annotated = annotated.replace(/\{\{\/\}\}/gi, '\u001b[0m');
        annotated = annotated.replace(/\{\{red\}\}/gi, '\u001b[41m');
        annotated = annotated.replace(/\{\{br\}\}/gi, '"\n\t"\u001b[31m');
    }

    this.message = annotated;

    return this;
};