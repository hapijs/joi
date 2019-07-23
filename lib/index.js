'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./types/any');
const Cache = require('./cache');
const Cast = require('./cast');
const Common = require('./common');
const Errors = require('./errors');
const Extend = require('./extend');
const Manifest = require('./manifest');
const Ref = require('./ref');
const Template = require('./template');

const Pkg = require('../package.json');


const internals = {
    types: {
        alternatives: require('./types/alternatives'),
        any: new Any(),
        array: require('./types/array'),
        boolean: require('./types/boolean'),
        binary: require('./types/binary'),
        date: require('./types/date'),
        func: require('./types/func'),
        link: require('./types/link'),
        number: require('./types/number'),
        object: require('./types/object'),
        string: require('./types/string'),
        symbol: require('./types/symbol')
    }
};


internals.root = function () {

    const root = {
        _types: new Set(Object.keys(internals.types))
    };

    // Types

    for (const type of root._types) {
        root[type] = function (...args) {

            Hoek.assert(!args.length || ['alternatives', 'link', 'object'].includes(type), 'The', type, 'type does not allow arguments');
            return Common.callWithDefaults(this, internals.types[type], args);
        };
    }

    // Shortcuts

    for (const method of ['allow', 'disallow', 'equal', 'exist', 'forbidden', 'invalid', 'not', 'optional', 'options', 'prefs', 'preferences', 'required', 'valid', 'when']) {
        root[method] = function (...args) {

            return this.any()[method](...args);
        };
    }

    // Methods

    Object.assign(root, internals.methods);

    // Aliases

    root.alt = root.alternatives;
    root.attempt = root.assert;
    root.bool = root.boolean;
    root.x = root.expression;

    return root;
};


internals.methods = {

    ValidationError: Errors.ValidationError,
    version: Pkg.version,
    cache: Cache.provider,

    assert: function (value, schema, ...args/* [message], [options]*/) {

        const first = args[0];
        const message = first instanceof Error || typeof first === 'string' ? first : null;
        const options = message ? args[1] : args[0];
        const result = schema.validate(value, options);
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
    },

    build: function (desc) {

        return Manifest.build(this, desc);
    },

    compile: function (schema, options) {

        return Cast.compile(this, schema, options);
    },

    defaults: function (fn) {

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
    },

    expression: function (...args) {

        return new Template(...args);
    },

    extend: function (...extensions) {

        Common.verifyFlat(extensions, 'extend');
        return Extend.root(this, extensions);
    },

    isExpression: Template.isTemplate,
    isRef: Ref.isRef,
    isSchema: Common.isSchema,

    ref: function (...args) {

        return Ref.create(...args);
    },

    types: function () {

        const types = {};
        for (const type of this._types) {
            types[type] = this[type]();
        }

        return types;
    }
};


module.exports = internals.root();
