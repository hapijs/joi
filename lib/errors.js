'use strict';

// Load modules

const Hoek = require('hoek');
const Language = require('./language');


// Declare internals

const internals = {};

internals.stringify = function (value, wrapArrays) {

    const type = typeof value;

    if (value === null) {
        return 'null';
    }

    if (type === 'string') {
        return value;
    }

    if (value instanceof internals.Err || type === 'function') {
        return value.toString();
    }

    if (type === 'object') {
        if (Array.isArray(value)) {
            let partial = '';

            for (let i = 0; i < value.length; ++i) {
                partial = partial + (partial.length ? ', ' : '') + internals.stringify(value[i], wrapArrays);
            }

            return wrapArrays ? '[' + partial + ']' : partial;
        }

        return value.toString();
    }

    return JSON.stringify(value);
};

internals.Err = function (type, context, state, options) {

    this.isJoi = true;
    this.type = type;
    this.context = context || {};
    this.context.key = state.key;
    this.path = state.path;
    this.options = options;
};


internals.Err.prototype.toString = function () {

    const localized = this.options.language;

    if (localized.label) {
        this.context.key = localized.label;
    }
    else if (this.context.key === '' || this.context.key === null) {
        this.context.key = localized.root || Language.errors.root;
    }

    let format = Hoek.reach(localized, this.type) || Hoek.reach(Language.errors, this.type);
    const hasKey = /\{\{\!?key\}\}/.test(format);
    const skipKey = format.length > 2 && format[0] === '!' && format[1] === '!';

    if (skipKey) {
        format = format.slice(2);
    }

    if (!hasKey && !skipKey) {
        format = (Hoek.reach(localized, 'key') || Hoek.reach(Language.errors, 'key')) + format;
    }

    let wrapArrays = Hoek.reach(localized, 'messages.wrapArrays');
    if (typeof wrapArrays !== 'boolean') {
        wrapArrays = Language.errors.messages.wrapArrays;
    }

    const message = format.replace(/\{\{(\!?)([^}]+)\}\}/g, ($0, isSecure, name) => {

        const value = Hoek.reach(this.context, name);
        const normalized = internals.stringify(value, wrapArrays);
        return (isSecure ? Hoek.escapeHtml(normalized) : normalized);
    });

    return message;
};


exports.create = function (type, context, state, options) {

    return new internals.Err(type, context, state, options);
};


exports.process = function (errors, object) {

    if (!errors || !errors.length) {
        return null;
    }

    // Construct error

    let message = '';
    const details = [];

    const processErrors = function (localErrors, parent) {

        for (let i = 0; i < localErrors.length; ++i) {
            const item = localErrors[i];

            if (item.options.error) {
                return item.options.error;
            }

            const detail = {
                message: item.toString(),
                path: internals.getPath(item),
                type: item.type,
                context: item.context
            };

            if (parent === undefined) {
                message = message + (message ? '. ' : '') + detail.message;
            }

            // Do not push intermediate errors, we're only interested in leafs

            if (item.context.reason && item.context.reason.length) {
                const override = processErrors(item.context.reason, item.path);
                if (override) {
                    return override;
                }
            }
            else {
                details.push(detail);
            }
        }
    };

    const override = processErrors(errors);
    if (override) {
        return override;
    }

    const error = new Error(message);
    error.isJoi = true;
    error.name = 'ValidationError';
    error.details = details;
    error._object = object;
    error.annotate = internals.annotate;
    return error;
};


internals.getPath = function (item) {

    const recursePath = (it) => {

        const reachedItem = Hoek.reach(it, 'context.reason.0');
        if (reachedItem && reachedItem.context) {
            return recursePath(reachedItem);
        }

        return it.path;
    };

    return recursePath(item) || item.context.key;
};


// Inspired by json-stringify-safe
internals.safeStringify = function (obj, spaces) {

    return JSON.stringify(obj, internals.serializer(), spaces);
};

internals.serializer = function () {

    const keys = [];
    const stack = [];

    const cycleReplacer = (key, value) => {

        if (stack[0] === value) {
            return '[Circular ~]';
        }

        return '[Circular ~.' + keys.slice(0, stack.indexOf(value)).join('.') + ']';
    };

    return function (key, value) {

        if (stack.length > 0) {
            const thisPos = stack.indexOf(this);
            if (~thisPos) {
                stack.length = thisPos + 1;
                keys.length = thisPos + 1;
                keys[thisPos] = key;
            }
            else {
                stack.push(this);
                keys.push(key);
            }

            if (~stack.indexOf(value)) {
                value = cycleReplacer.call(this, key, value);
            }
        }
        else {
            stack.push(value);
        }

        if (Array.isArray(value) && value.placeholders) {
            const placeholders = value.placeholders;
            const arrWithPlaceholders = [];
            for (let i = 0; i < value.length; ++i) {
                if (placeholders[i]) {
                    arrWithPlaceholders.push(placeholders[i]);
                }
                arrWithPlaceholders.push(value[i]);
            }

            value = arrWithPlaceholders;
        }

        if (value === Infinity || value === -Infinity || Number.isNaN(value) ||
            typeof value === 'function' || typeof value === 'symbol') {
            return '[' + value.toString() + ']';
        }

        return value;
    };
};


internals.annotate = function () {

    if (typeof this._object !== 'object') {
        return this.details[0].message;
    }

    const obj = Hoek.clone(this._object || {});

    const lookup = {};
    for (let i = this.details.length - 1; i >= 0; --i) {        // Reverse order to process deepest child first
        const pos = this.details.length - i;
        const error = this.details[i];
        const path = error.path.split('.');
        let ref = obj;
        for (let j = 0; j < path.length && ref; ++j) {
            const seg = path[j];
            if (j + 1 < path.length) {
                ref = ref[seg];
            }
            else {
                const value = ref[seg];
                if (Array.isArray(ref)) {
                    const arrayLabel = '_$idx$_' + (i + 1) + '_$end$_';
                    if (!ref.placeholders) {
                        ref.placeholders = {};
                    }

                    if (ref.placeholders[seg]) {
                        ref.placeholders[seg] = ref.placeholders[seg].replace('_$end$_', ', ' + (i + 1) + '_$end$_');
                    }
                    else {
                        ref.placeholders[seg] = arrayLabel;
                    }
                }
                else {
                    if (value !== undefined) {
                        delete ref[seg];
                        const objectLabel = seg + '_$key$_' + pos + '_$end$_';
                        ref[objectLabel] = value;
                        lookup[error.path] = objectLabel;
                    }
                    else if (lookup[error.path]) {
                        const replacement = lookup[error.path];
                        const appended = replacement.replace('_$end$_', ', ' + pos + '_$end$_');
                        ref[appended] = ref[replacement];
                        lookup[error.path] = appended;
                        delete ref[replacement];
                    }
                    else {
                        ref['_$miss$_' + seg + '|' + pos + '_$end$_'] = '__missing__';
                    }
                }
            }
        }
    }

    const replacers = {
        key: /_\$key\$_([, \d]+)_\$end\$_\"/g,
        missing: /\"_\$miss\$_([^\|]+)\|(\d+)_\$end\$_\"\: \"__missing__\"/g,
        arrayIndex: /\s*\"_\$idx\$_([, \d]+)_\$end\$_\",?\n(.*)/g,
        specials: /"\[(NaN|Symbol.*|-?Infinity|function.*|\(.*)\]"/g
    };

    let message = internals.safeStringify(obj, 2)
        .replace(replacers.key, ($0, $1) => '" \u001b[31m[' + $1 + ']\u001b[0m')
        .replace(replacers.missing, ($0, $1, $2) => '\u001b[41m"' + $1 + '"\u001b[0m\u001b[31m [' + $2 + ']: -- missing --\u001b[0m')
        .replace(replacers.arrayIndex, ($0, $1, $2) => '\n' + $2 + ' \u001b[31m[' + $1 + ']\u001b[0m')
        .replace(replacers.specials, ($0, $1) => $1);

    message = message + '\n\u001b[31m';

    for (let i = 0; i < this.details.length; ++i) {
        message = message + '\n[' + (i + 1) + '] ' + this.details[i].message;
    }

    message = message + '\u001b[0m';

    return message;
};
