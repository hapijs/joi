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


internals.findPath = function findPath (context) {
    // if this context doesn't have a reason, then we won't find a valid path
    if (!context || !context.reason || !Array.isArray(context.reason)){
        return false;
    }

    // recurse through the reasons to try to find a path
    if (context.reason && Array.isArray(context.reason) && context.reason[0].context && context.reason[0].context.reason) {
        return findPath(context.reason[0].context);
    }
    else {
        return context.reason[0].path;
    }
};



internals.Err.prototype.toString = function () {

    var self = this;

    var localized = this.options.language;
    var format = Hoek.reach(localized, this.type) || Hoek.reach(Language.errors, this.type);
    if (!format) {
        return this.context.key;
    }

    return format.replace(/\{\{\s*([^\s}]+?)\s*\}\}/ig, function (match, name) {

        var value = Hoek.reach(self.context, name);
        return Array.isArray(value) ? value.join(', ') : value.toString();
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
        details.push({ message: item.toString(), path: internals.findPath(item.context) || item.path || item.context.key, type: item.type });
    }

    // Construct error

    var message = '';
    details.forEach(function (error) {

        message += (message ? '. ' : '') + error.message;
    });

    var error = new Error(message);
    error.details = details;
    error._object = object;
    error.annotated = internals.annotated;
    return error;
};


internals.annotated = function () {

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

    var message = annotated.replace(/\"_\$miss\$_([^\|]+)\|(\d+)_\$end\$_\"\: \"__missing__\"/g, function ($0, $1, $2) {

        return '\u001b[41m"' + $1 + '"\u001b[0m\u001b[31m [' + $2 + ']: -- missing --\u001b[0m';
    });

    message += '\n\u001b[31m';

    for (e = 0; e < el; ++e) {
        message += '\n[' + (e + 1) + '] ' + this.details[e].message;
    }

    message += '\u001b[0m';

    return message;
};

