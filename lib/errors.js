'use strict';

const Hoek = require('@hapi/hoek');

const Language = require('./language');
const Utils = require('./utils');

let Any;


const internals = {
    annotations: Symbol('joi-annotations'),

    labelRx: /{{!?label}}/,
    skipLabelRx: /^!!/
};


exports.Report = class {

    constructor(type, context, state, options, flags, message, template) {

        this.isJoi = true;
        this.type = type;
        this.context = context || {};
        this.context.label = flags.label ? flags.label : internals.label(state.path);
        this.path = state.path;
        this.options = options;
        this.message = message;
        this.template = template;

        if (state.path.length) {
            this.context.key = state.path[state.path.length - 1];
        }

        const localized = this.options.language;
        if (localized &&
            !this.context.label) {

            this.context.label = localized.root || Language.errors.root;
        }
    }

    toString() {

        const localized = this.options.language;
        let format = Hoek.reach(localized, this.type) || Language.flat.get(this.type);
        if (typeof format !== 'string') {
            return `Error code "${this.type}" is not defined, your custom type is missing the correct language definition`;
        }

        const hasLabel = internals.labelRx.test(format);
        const skipLabel = internals.skipLabelRx.test(format);

        if (skipLabel) {
            format = format.slice(2);
        }

        if (!hasLabel &&
            !skipLabel) {

            if (typeof localized.key === 'string') {
                format = localized.key + format;
            }
            else {
                format = Language.errors.key + format;
            }
        }

        const wrapArrays = Utils.default(localized.messages && localized.messages.wrapArrays, Language.errors.messages.wrapArrays);
        const message = format.replace(/{{(!?)([^}]+)}}/g, ($0, isSecure, name) => {

            const value = Hoek.reach(this.context, name);
            const normalized = internals.stringify(value, wrapArrays);
            return isSecure && this.options.escapeHtml ? Hoek.escapeHtml(normalized) : normalized;
        });

        this.toString = () => message;  // Cache result
        return message;
    }
};


internals.stringify = function (value, wrapArrays) {

    const type = typeof value;

    if (value === null) {
        return 'null';
    }

    if (type === 'string') {
        return value;
    }

    if (type === 'function' ||
        type === 'symbol') {

        return value.toString();
    }

    if (type !== 'object') {
        return JSON.stringify(value);
    }

    if (!Array.isArray(value)) {
        return value.toString();
    }

    let partial = '';
    for (const item of value) {
        partial = partial + (partial.length ? ', ' : '') + internals.stringify(item, wrapArrays);
    }

    return wrapArrays ? '[' + partial + ']' : partial;
};


internals.label = function (path) {

    let label = '';
    for (const segment of path) {
        if (typeof segment === 'string') {
            if (label) {
                label += '.';
            }

            label += segment;
        }
        else {
            label += `[${segment}]`;
        }
    }

    return label;
};


exports.process = function (errors, original) {

    if (!errors) {
        return null;
    }

    const { override, message, details } = exports.details(errors);
    if (override) {
        return override;
    }

    return new exports.ValidationError(message, details, original);
};


exports.details = function (errors, options = {}) {

    const messages = [];
    const details = [];

    for (const item of errors) {

        // Override

        if (item instanceof Error) {
            if (options.override !== false) {
                return { override: item };
            }

            const message = item.toString();
            messages.push(message);

            details.push({
                message,
                type: 'override',
                context: { error: item }
            });

            continue;
        }

        // Report

        const message = item.toString();
        messages.push(message);

        details.push({
            message,
            path: item.path,
            type: item.type,
            context: item.context
        });
    }

    return { message: messages.join('. '), details };
};


exports.ValidationError = class extends Error {

    constructor(message, details, original) {

        super(message);
        this._original = original;
        this.details = details;
    }

    annotate(stripColorCodes) {

        Any = Any || require('./types/any');

        if (!this._original ||
            typeof this._original !== 'object') {

            return this.details[0].message;
        }

        const redFgEscape = stripColorCodes ? '' : '\u001b[31m';
        const redBgEscape = stripColorCodes ? '' : '\u001b[41m';
        const endColor = stripColorCodes ? '' : '\u001b[0m';

        const obj = Hoek.clone(this._original);

        for (let i = this.details.length - 1; i >= 0; --i) {        // Reverse order to process deepest child first
            const pos = i + 1;
            const error = this.details[i];
            const path = error.path;
            let node = obj;
            for (let j = 0; ; ++j) {
                const seg = path[j];

                if (node instanceof Any) {
                    node = node.clone();                              // joi schemas are not cloned by hoek, we have to take this extra step
                }

                if (j + 1 < path.length &&
                    typeof node[seg] !== 'string') {

                    node = node[seg];
                }
                else {
                    const refAnnotations = node[internals.annotations] || { errors: {}, missing: {} };
                    node[internals.annotations] = refAnnotations;

                    const cacheKey = seg || error.context.key;

                    if (node[seg] !== undefined) {
                        refAnnotations.errors[cacheKey] = refAnnotations.errors[cacheKey] || [];
                        refAnnotations.errors[cacheKey].push(pos);
                    }
                    else {
                        refAnnotations.missing[cacheKey] = pos;
                    }

                    break;
                }
            }
        }

        const replacers = {
            key: /_\$key\$_([, \d]+)_\$end\$_"/g,
            missing: /"_\$miss\$_([^|]+)\|(\d+)_\$end\$_": "__missing__"/g,
            arrayIndex: /\s*"_\$idx\$_([, \d]+)_\$end\$_",?\n(.*)/g,
            specials: /"\[(NaN|Symbol.*|-?Infinity|function.*|\(.*)]"/g
        };

        let message = internals.safeStringify(obj, 2)
            .replace(replacers.key, ($0, $1) => `" ${redFgEscape}[${$1}]${endColor}`)
            .replace(replacers.missing, ($0, $1, $2) => `${redBgEscape}"${$1}"${endColor}${redFgEscape} [${$2}]: -- missing --${endColor}`)
            .replace(replacers.arrayIndex, ($0, $1, $2) => `\n${$2} ${redFgEscape}[${$1}]${endColor}`)
            .replace(replacers.specials, ($0, $1) => $1);

        message = `${message}\n${redFgEscape}`;

        for (let i = 0; i < this.details.length; ++i) {
            const pos = i + 1;
            message = `${message}\n[${pos}] ${this.details[i].message}`;
        }

        message = message + endColor;

        return message;
    }
};


exports.ValidationError.prototype.isJoi = true;


exports.ValidationError.prototype.name = 'ValidationError';


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

        if (value) {
            const annotations = value[internals.annotations];
            if (annotations) {
                if (Array.isArray(value)) {
                    const annotated = [];

                    for (let i = 0; i < value.length; ++i) {
                        if (annotations.errors[i]) {
                            annotated.push(`_$idx$_${annotations.errors[i].sort().join(', ')}_$end$_`);
                        }

                        annotated.push(value[i]);
                    }

                    value = annotated;
                }
                else {
                    for (const errorKey in annotations.errors) {
                        value[`${errorKey}_$key$_${annotations.errors[errorKey].sort().join(', ')}_$end$_`] = value[errorKey];
                        value[errorKey] = undefined;
                    }

                    for (const missingKey in annotations.missing) {
                        value[`_$miss$_${missingKey}|${annotations.missing[missingKey]}_$end$_`] = '__missing__';
                    }
                }

                return value;
            }
        }

        if (value === Infinity ||
            value === -Infinity ||
            Number.isNaN(value) ||
            typeof value === 'function' ||
            typeof value === 'symbol') {

            return '[' + value.toString() + ']';
        }

        return value;
    };
};
