'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('./common');
const Messages = require('./messages');
const Template = require('./template');

let Any;


const internals = {
    annotations: Symbol('annotations')
};


exports.Report = class {

    constructor(code, value, local, state, prefs) {

        this.code = code;
        this.path = state.path;
        this.prefs = prefs;
        this.state = state;
        this.value = value;

        this.message = null;
        this.template = null;

        this.local = local || {};

        this.local.label = this.state.flags.label ||
            internals.label(this.path) ||
            this._template(this.prefs.messages, 'root') ||
            Messages.errors.root;

        if (this.value !== undefined &&
            !this.local.hasOwnProperty('value')) {

            this.local.value = this.value;
        }

        if (this.path.length) {
            this.local.key = this.path[this.path.length - 1];
        }
    }

    _setTemplate(template) {

        this.template = template;

        if (!this.state.flags.label &&
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

        const template = this._template(this.template, this.code) ||
            this._template(this.prefs.messages, code) ||
            Messages.compiled[code];

        if (template === undefined) {
            return `Error code "${code}" is not defined, your custom type is missing the correct messages definition`;
        }

        this.message = template.render(this.value, this.state, this.prefs, this.local, this.prefs.errors);        // Cache result
        return this.message;
    }

    _template(messages, code) {

        if (!messages) {
            return;
        }

        if (Template.isTemplate(messages)) {
            return code !== 'root' ? messages : null;
        }

        let lang = this.prefs.errors.language;
        if (Common.isResolvable(lang)) {
            const local = this.state.ancestors[this.state.ancestors.length - 1];
            lang = lang.resolve(this.value, this.state, this.prefs, local);
        }

        if (lang &&
            messages[lang] &&
            messages[lang][code] !== undefined) {

            return messages[lang][code];
        }

        return messages[code];
    }
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
            path: item.path,
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
