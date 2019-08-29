'use strict';

const Clone = require('@hapi/hoek/lib/clone');

const Common = require('./common');
const Template = require('./template');


const internals = {
    annotations: Symbol('annotations')
};


exports.Report = class {

    constructor(code, value, local, flags, messages, state, prefs) {

        this.code = code;
        this.flags = flags;
        this.messages = messages;
        this.path = state.path;
        this.prefs = prefs;
        this.state = state;
        this.value = value;

        this.message = null;
        this.template = null;

        this.local = local || {};
        this.local.label = exports.label(this.flags, this.state, this.prefs, this.messages);

        if (this.value !== undefined &&
            !this.local.hasOwnProperty('value')) {

            this.local.value = this.value;
        }

        if (this.path.length) {
            const key = this.path[this.path.length - 1];
            if (typeof key !== 'object') {
                this.local.key = key;
            }
        }
    }

    _setTemplate(template) {

        this.template = template;

        if (!this.flags.label &&
            this.path.length === 0) {

            const localized = this._template(this.template, 'root');
            if (localized) {
                this.local.label = localized;
            }
        }
    }

    toString() {

        if (this.message) {
            return this.message;
        }

        const code = this.code;

        if (!this.prefs.errors.render) {
            return this.code;
        }

        const template = this._template(this.template) ||
            this._template(this.prefs.messages) ||
            this._template(this.messages);

        if (template === undefined) {
            return `Error code "${code}" is not defined, your custom type is missing the correct messages definition`;
        }

        // Render and cache result

        this.message = template.render(this.value, this.state, this.prefs, this.local, { errors: this.prefs.errors, messages: [this.prefs.messages, this.messages] });
        if (!this.prefs.errors.label) {
            this.message = this.message.replace(/^"" /, '').trim();
        }

        return this.message;
    }

    _template(messages, code) {

        return exports.template(this.value, messages, code || this.code, this.state, this.prefs);
    }
};


exports.path = function (path) {

    let label = '';
    for (const segment of path) {
        if (typeof segment === 'object') {          // Exclude array single path segment
            continue;
        }

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


exports.template = function (value, messages, code, state, prefs) {

    if (!messages) {
        return;
    }

    if (Template.isTemplate(messages)) {
        return code !== 'root' ? messages : null;
    }

    let lang = prefs.errors.language;
    if (Common.isResolvable(lang)) {
        lang = lang.resolve(value, state, prefs);
    }

    if (lang &&
        messages[lang] &&
        messages[lang][code] !== undefined) {

        return messages[lang][code];
    }

    return messages[code];
};


exports.label = function (flags, state, prefs, messages) {

    if (flags.label) {
        return flags.label;
    }

    if (!prefs.errors.label) {
        return '';
    }

    let path = state.path;
    if (prefs.errors.label === 'key' &&
        state.path.length > 1) {

        path = state.path.slice(-1);
    }

    return exports.path(path) ||
        exports.template(null, prefs.messages, 'root', state, prefs) ||
        messages && exports.template(null, messages, 'root', state, prefs) ||
        'value';
};


exports.process = function (errors, original, prefs) {

    if (!errors) {
        return null;
    }

    const { override, message, details } = exports.details(errors);
    if (override) {
        return override;
    }

    if (prefs.errors.stack) {
        return new exports.ValidationError(message, details, original);
    }

    const limit = Error.stackTraceLimit;
    Error.stackTraceLimit = 0;
    const validationError = new exports.ValidationError(message, details, original);
    Error.stackTraceLimit = limit;
    return validationError;
};


exports.details = function (errors, options = {}) {

    let messages = [];
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
            path: item.path.filter((v) => typeof v !== 'object'),
            type: item.code,
            context: item.local
        });
    }

    if (messages.length > 1) {
        messages = [...new Set(messages)];
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

        if (!this._original ||
            typeof this._original !== 'object') {

            return this.details[0].message;
        }

        const redFgEscape = stripColorCodes ? '' : '\u001b[31m';
        const redBgEscape = stripColorCodes ? '' : '\u001b[41m';
        const endColor = stripColorCodes ? '' : '\u001b[0m';

        const obj = Clone(this._original);

        for (let i = this.details.length - 1; i >= 0; --i) {        // Reverse order to process deepest child first
            const pos = i + 1;
            const error = this.details[i];
            const path = error.path;
            let node = obj;
            for (let j = 0; ; ++j) {
                const seg = path[j];

                if (Common.isSchema(node)) {
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
