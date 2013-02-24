// Load modules

var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Errors = function (object) {

    this._object = object;
    this._values = [];
};


internals.Errors.prototype.add = function (message, path) {

    if (message) {
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

    this.message = this.toString();
};

Utils.inherits(internals.ValidationError, Error);


internals.ValidationError.prototype.toString = function (format) {

    if (format === 'annotated') {
        return this._annotated();
    }

    return this._simple();
};


internals.ValidationError.prototype._simple = function () {

    var message = '';
    this._errors.forEach(function (error) {

        if (message) {
            message += ', ';
        }

        message += error.message;
    });

    return message;
};


internals.ValidationError.prototype._annotated = function () {

    var errorObject = Utils.clone(this._object || {});
    var hasTemplate = false;

    this._errors.forEach(function (error) {

        var paths = error.path.split('.');
        var result = errorObject;
        for (var i = 0, il = paths.length; i < il; ++i) {

            if (i + 1 === il) {
                hasTemplate = true;
                result[paths[i]] = '{{red}}' + result[paths[i]] + '{{/}}{{br}}' + error.message + '{{/}}';
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

    return annotated;
};