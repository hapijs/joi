'use strict';

const Assert = require('@hapi/hoek/lib/assert');

const Cache = require('./cache');
const Common = require('./common');
const Compile = require('./compile');
const Errors = require('./errors');
const Extend = require('./extend');
const Manifest = require('./manifest');
const Ref = require('./ref');
const Template = require('./template');

const Pkg = require('../package.json');

let Schemas;


const internals = {
    types: {
        alternatives: require('./types/alternatives'),
        any: require('./types/any'),
        array: require('./types/array'),
        boolean: require('./types/boolean'),
        date: require('./types/date'),
        function: require('./types/function'),
        link: require('./types/link'),
        number: require('./types/number'),
        object: require('./types/object'),
        string: require('./types/string'),
        symbol: require('./types/symbol')
    }
};


if (Buffer) {                                                           // $lab:coverage:ignore$
    internals.types.binary = require('./types/binary');
}


internals.root = function () {

    const root = {
        _types: new Set(Object.keys(internals.types))
    };

    // Types

    for (const type of root._types) {
        root[type] = function (...args) {

            Assert(!args.length || ['alternatives', 'link', 'object'].includes(type), 'The', type, 'type does not allow arguments');
            return internals.generate(this, internals.types[type], args);
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
    root.func = root.function;
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

    checkPreferences: function (prefs) {

        Common.checkPreferences(prefs);
    },

    compile: function (schema, options) {

        return Compile.compile(this, schema, options);
    },

    expression: function (...args) {

        return new Template(...args);
    },

    extend: function (...extensions) {

        Common.verifyFlat(extensions, 'extend');

        Schemas = Schemas || require('./schemas');

        Assert(extensions.length, 'You need to provide at least one extension');
        this.assert(extensions, Schemas.extensions);

        const joi = Object.assign({}, this);
        joi._types = new Set(joi._types);

        for (let extension of extensions) {
            if (typeof extension === 'function') {
                extension = extension(joi);
            }

            this.assert(extension, Schemas.extension);

            const base = extension.base || this.any();
            const schema = Extend.type(base, extension);

            joi._types.add(extension.type);
            joi[extension.type] = function (...args) {

                return internals.generate(this, schema, args);
            };
        }

        return joi;
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


// Helpers

internals.generate = function (root, schema, args) {

    Assert(root, 'Must be invoked on a Joi instance.');

    schema._root = root;

    if (!schema._definition.args ||
        !args.length) {

        return schema;
    }

    return schema._definition.args(schema, ...args);
};


module.exports = internals.root();
