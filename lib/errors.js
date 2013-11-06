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

        values.push({ message: message, path: item.path || item.context.key });
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

    var obj = Utils.clone(this._object || {});

    var el = this._errors.length;
    for (var e = el - 1; e >= 0; --e) {        // Reverse order to process deepest child first
        var error = this._errors[e];
        var path = error.path.split('.');
        var ref = obj;
        for (var i = 0, il = path.length; i < il && ref; ++i) {
            var seg = path[i];
            if (i + 1 === il) {
                var value = ref[seg];
                if (value !== undefined) {
                    delete ref[seg];
                    ref[seg + '_$key$_' + (e + 1) + '_$end$_'] = value;
                }
                else {
                    ref['_$miss$_' + seg + '|' + (e + 1) + '_$end$_'] = '__missing__';
                }

                break;
            }

            ref = ref[seg];
        }
    }

    var annotated = JSON.stringify(obj, null, 2);

    annotated = annotated.replace(/_\$key\$_(\d+)_\$end\$_\"/g, function ($0, $1) {

        return '" \u001b[31m[' + $1 + ']\u001b[0m';
    });

    this.message = annotated.replace(/\"_\$miss\$_([^\|]+)\|(\d+)_\$end\$_\"\: \"__missing__\"/g, function ($0, $1, $2) {

        return '\u001b[41m"' + $1 + '"\u001b[0m\u001b[31m [' + $2 + ']: -- missing --\u001b[0m';
    });

    this.message += '\n\u001b[31m';

    for (e = 0; e < el; ++e) {
        this.message += '\n[' + (e + 1) + '] ' + this._errors[e].message;
    }

    this.message += '\u001b[0m';

    return this;
};

