// Load modules

var Hoek = require('hoek');
var Language = require('./language');


// Declare internals

var internals = {};


internals.Err = function (type, context, state, options) {

    this.type = type;
    this.context = context || {};
    this.context.key = state.key || '<root>';
    this.path = state.path;
    this.options = options;
};


internals.Err.prototype.toString = function () {

    var self = this;

    var localized = this.options.language;
    var format = Hoek.reach(localized, this.type) || Hoek.reach(Language.errors, this.type);
    if (!format) {
        return this.context.key;
    }

    return format.replace(/\{\{\s*([^\s}]+?)\s*\}\}/ig, function (match, name) {

        return Hoek.reach(self.context, name).toString();
    });
};


exports.create = function (type, context, state, options) {

    return new internals.Err(type, context, state, options);
};


exports.process = function (errors, object) {

    if (!errors || !errors.length) {
        return null;
    }

    var details = [];
    for (var i = 0, il = errors.length; i < il; ++i) {
        var item = errors[i];
        details.push({ message: item.toString(), path: item.path || item.context.key, type: item.type });
    }

    return new internals.ValidationError(details, object);
};


internals.ValidationError = function (details, object) {

    Error.call(this);
    this.details = details;
    this._object = object;

    return this.simple();
};

Hoek.inherits(internals.ValidationError, Error);


internals.ValidationError.prototype.simple = function () {

    var message = '';
    this.details.forEach(function (error) {

        message += (message ? '. ' : '') + error.message;
    });

    this.message = message;

    return this;
};


internals.ValidationError.prototype.annotated = function () {

    var obj = Hoek.clone(this._object || {});

    var el = this.details.length;
    for (var e = el - 1; e >= 0; --e) {        // Reverse order to process deepest child first
        var error = this.details[e];
        var path = error.path.split('.');
        var ref = obj;
        for (var i = 0, il = path.length; i < il && ref; ++i) {
            var seg = path[i];
            if (i + 1 < il) {
                ref = ref[seg];
            }
            else {
                var value = ref[seg];
                if (value !== undefined) {
                    delete ref[seg];
                    ref[seg + '_$key$_' + (e + 1) + '_$end$_'] = value;
                }
                else {
                    ref['_$miss$_' + seg + '|' + (e + 1) + '_$end$_'] = '__missing__';
                }
            }
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
        this.message += '\n[' + (e + 1) + '] ' + this.details[e].message;
    }

    this.message += '\u001b[0m';

    return this;
};

