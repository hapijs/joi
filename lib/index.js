'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./types/any');
const Cast = require('./cast');
const Common = require('./common');
const Errors = require('./errors');
const Extend = require('./extend');
const Lazy = require('./types/lazy');
const Ref = require('./ref');
const Template = require('./template');
const Validator = require('./validator');


const internals = {
    alternatives: require('./types/alternatives'),
    array: require('./types/array'),
    boolean: require('./types/boolean'),
    binary: require('./types/binary'),
    date: require('./types/date'),
    func: require('./types/func'),
    number: require('./types/number'),
    object: require('./types/object'),
    string: require('./types/string'),
    symbol: require('./types/symbol')
};


internals.root = function () {

    const any = new Any();

    const root = any.clone();
    Any.prototype._root = root;
    root._root = root;
    root._binds = new Set(['any', 'alternatives', 'alt', 'array', 'bool', 'boolean', 'binary', 'date', 'func', 'number', 'object', 'string', 'symbol', 'validate', 'describe', 'compile', 'assert', 'attempt', 'lazy', 'defaults', 'extend', 'allow', 'valid', 'only', 'equal', 'invalid', 'disallow', 'not', 'required', 'exist', 'optional', 'forbidden', 'strip', 'when', 'empty', 'default', 'failover']);

    root.any = function (...args) {

        Hoek.assert(args.length === 0, 'Joi.any() does not allow arguments.');

        return Common.callWithDefaults(this, any, args);
    };

    root.alternatives = root.alt = function (...args) {

        return Common.callWithDefaults(this, internals.alternatives, args);
    };

    root.array = function (...args) {

        Hoek.assert(args.length === 0, 'Joi.array() does not allow arguments.');

        return Common.callWithDefaults(this, internals.array, args);
    };

    root.boolean = root.bool = function (...args) {

        Hoek.assert(args.length === 0, 'Joi.boolean() does not allow arguments.');

        return Common.callWithDefaults(this, internals.boolean, args);
    };

    root.binary = function (...args) {

        Hoek.assert(args.length === 0, 'Joi.binary() does not allow arguments.');

        return Common.callWithDefaults(this, internals.binary, args);
    };

    root.date = function (...args) {

        Hoek.assert(args.length === 0, 'Joi.date() does not allow arguments.');

        return Common.callWithDefaults(this, internals.date, args);
    };

    root.func = function (...args) {

        Hoek.assert(args.length === 0, 'Joi.func() does not allow arguments.');

        return Common.callWithDefaults(this, internals.func, args);
    };

    root.number = function (...args) {

        Hoek.assert(args.length === 0, 'Joi.number() does not allow arguments.');

        return Common.callWithDefaults(this, internals.number, args);
    };

    root.object = function (...args) {

        return Common.callWithDefaults(this, internals.object, args);
    };

    root.string = function (...args) {

        Hoek.assert(args.length === 0, 'Joi.string() does not allow arguments.');

        return Common.callWithDefaults(this, internals.string, args);
    };

    root.symbol = function (...args) {

        Hoek.assert(args.length === 0, 'Joi.symbol() does not allow arguments.');

        return Common.callWithDefaults(this, internals.symbol, args);
    };

    root.expression = function (...args) {

        return new Template(...args);
    };

    root.x = root.expression;

    root.isVar = function (template) {

        return Template.isTemplate(template);
    };

    root.ref = function (...args) {

        return new Ref(...args);
    };

    root.isRef = function (ref) {

        return Ref.isRef(ref);
    };

    root.isSchema = function (schema, options) {

        return Common.isSchema(schema, options);
    };

    root.validate = function (value, ...args /*, [schema], [options], callback */) {

        const last = args[args.length - 1];
        const callback = typeof last === 'function' ? last : null;

        const count = args.length - (callback ? 1 : 0);
        if (count === 0) {
            return any.validate(value, callback);
        }

        const prefs = count === 2 ? args[1] : undefined;
        const schema = this.compile(args[0]);

        return Validator.process(value, schema, prefs, callback);
    };

    root.ValidationError = Errors.ValidationError;

    root.describe = function (...args) {

        const schema = args.length ? this.compile(args[0]) : any;
        return schema.describe();
    };

    root.compile = function (schema, options) {

        return Cast.compile(this, schema, options);
    };

    root.assert = function (...args) {

        this.attempt(...args);
    };

    root.attempt = function (value, schema, ...args/* [message], [options]*/) {

        const first = args[0];
        const message = first instanceof Error || typeof first === 'string' ? first : null;
        const options = message ? args[1] : args[0];
        const result = this.validate(value, schema, options);
        const error = result.error;

        if (!error) {
            return result.value;
        }

        if (message instanceof Error) {
            throw message;
        }

        if (typeof error.annotate === 'function') {
            error.message = message ?
                `${message} ${error.annotate()}` :
                error.annotate();
        }

        throw error;
    };

    root.reach = function (schema, path) {

        Hoek.assert(schema && schema instanceof Any, 'you must provide a joi schema');
        Hoek.assert(Array.isArray(path) || typeof path === 'string', 'path must be a string or an array of strings');

        const reach = (sourceSchema, schemaPath) => {

            if (!schemaPath.length) {
                return sourceSchema;
            }

            const children = sourceSchema._inner.children;
            if (!children) {
                return;
            }

            const key = schemaPath.shift();
            for (let i = 0; i < children.length; ++i) {
                const child = children[i];
                if (child.key === key) {
                    return reach(child.schema, schemaPath);
                }
            }
        };

        const schemaPath = typeof path === 'string' ? (path ? path.split('.') : []) : path.slice();

        return reach(schema, schemaPath);
    };

    root.lazy = function (...args) {

        return Common.callWithDefaults(this, Lazy, args);
    };

    root.defaults = function (fn) {

        Hoek.assert(typeof fn === 'function', 'Defaults must be a function');

        let joi = Object.create(this.any());
        joi = fn(joi);

        Hoek.assert(joi && joi instanceof this.constructor, 'defaults() must return a schema');

        Object.assign(joi, this, joi.clone()); // Re-add the types from `this` but also keep the settings from joi's potential new defaults

        joi._defaults = (schema) => {

            if (this._defaults) {
                schema = this._defaults(schema);
                Hoek.assert(schema instanceof this.constructor, 'defaults() must return a schema');
            }

            schema = fn(schema);
            Hoek.assert(schema instanceof this.constructor, 'defaults() must return a schema');
            return schema;
        };

        return joi;
    };

    root.bind = function () {

        const joi = Object.create(this);

        joi._binds.forEach((bind) => {

            joi[bind] = joi[bind].bind(joi);
        });

        return joi;
    };

    root.extend = function (...extensions) {

        Common.verifyFlat(extensions, 'extend');
        return Extend.root(this, extensions);
    };

    root.version = require('../package.json').version;

    root.schema = Common.symbols.schema;

    return root;
};


module.exports = internals.root();
