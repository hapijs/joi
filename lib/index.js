'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./types/any');
const Cast = require('./cast');
const Common = require('./common');
const Errors = require('./errors');
const Extend = require('./extend');
const Ref = require('./ref');
const Template = require('./template');

const Pkg = require('../package.json');


const internals = {
    alternatives: require('./types/alternatives'),
    array: require('./types/array'),
    boolean: require('./types/boolean'),
    binary: require('./types/binary'),
    date: require('./types/date'),
    func: require('./types/func'),
    lazy: require('./types/lazy'),
    number: require('./types/number'),
    object: require('./types/object'),
    string: require('./types/string'),
    symbol: require('./types/symbol'),

    binds: [
        'any',
        'alt',
        'alternatives',
        'array',
        'bool',
        'boolean',
        'binary',
        'date',
        'func',
        'lazy',
        'number',
        'object',
        'string',
        'symbol',

        'bind',
        'compile',
        'defaults',
        'extend'
    ]
};


internals.anyMethods = Object.keys(Any.prototype)
    .filter((key) => key[0] !== '_' && key !== 'isImmutable')
    .concat(internals.binds);


internals.root = function () {

    const any = new Any();
    const root = any.clone();
    root._root = root;
    root._binds = new Set(internals.anyMethods);

    root.any = function (...args) {

        Hoek.assert(!args.length, 'The any type does not allow arguments');
        return Common.callWithDefaults(this, any, args);
    };

    for (const type of ['array', 'boolean', 'binary', 'date', 'func', 'number', 'string', 'symbol']) {
        root[type] = function (...args) {

            Hoek.assert(!args.length, 'The', type, 'type does not allow arguments');
            return Common.callWithDefaults(this, internals[type], args);
        };
    }

    for (const type of ['alternatives', 'lazy', 'object']) {
        root[type] = function (...args) {

            return Common.callWithDefaults(this, internals[type], args);
        };
    }

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
    schema: Common.symbols.schema,

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

    bind: function () {

        const joi = Object.create(this);
        for (const bind of joi._binds) {
            joi[bind] = joi[bind].bind(joi);
        }

        return joi;
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

        return new Ref(...args);
    }
};


module.exports = internals.root();
