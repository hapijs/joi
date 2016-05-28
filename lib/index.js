'use strict';

// Load modules

const Hoek = require('hoek');
const Any = require('./any');
const Cast = require('./cast');
const Lazy = require('./lazy');
const Ref = require('./ref');


// Declare internals

const internals = {
    alternatives: require('./alternatives'),
    array: require('./array'),
    boolean: require('./boolean'),
    binary: require('./binary'),
    date: require('./date'),
    number: require('./number'),
    object: require('./object'),
    string: require('./string')
};


internals.root = function () {

    const any = new Any();

    const root = any.clone();
    root.any = function () {

        return any;
    };

    root.alternatives = root.alt = function () {

        return arguments.length ? internals.alternatives.try.apply(internals.alternatives, arguments) : internals.alternatives;
    };

    root.array = function () {

        return internals.array;
    };

    root.boolean = root.bool = function () {

        return internals.boolean;
    };

    root.binary = function () {

        return internals.binary;
    };

    root.date = function () {

        return internals.date;
    };

    root.func = function () {

        return internals.object._func();
    };

    root.number = function () {

        return internals.number;
    };

    root.object = function () {

        return arguments.length ? internals.object.keys.apply(internals.object, arguments) : internals.object;
    };

    root.string = function () {

        return internals.string;
    };

    root.ref = function () {

        return Ref.create.apply(null, arguments);
    };

    root.isRef = function (ref) {

        return Ref.isRef(ref);
    };

    root.validate = function (value /*, [schema], [options], callback */) {

        const last = arguments[arguments.length - 1];
        const callback = typeof last === 'function' ? last : null;

        const count = arguments.length - (callback ? 1 : 0);
        if (count === 1) {
            return any.validate(value, callback);
        }

        const options = count === 3 ? arguments[2] : {};
        const schema = root.compile(arguments[1]);

        return schema._validateWithOptions(value, options, callback);
    };

    root.describe = function () {

        const schema = arguments.length ? root.compile(arguments[0]) : any;
        return schema.describe();
    };

    root.compile = function (schema) {

        try {
            return Cast.schema(schema);
        }
        catch (err) {
            if (err.hasOwnProperty('path')) {
                err.message = err.message + '(' + err.path + ')';
            }
            throw err;
        }
    };

    root.assert = function (value, schema, message) {

        root.attempt(value, schema, message);
    };

    root.attempt = function (value, schema, message) {

        const result = root.validate(value, schema);
        const error = result.error;
        if (error) {
            if (!message) {
                error.message = error.annotate();
                throw error;
            }

            if (!(message instanceof Error)) {
                error.message = message + ' ' + error.annotate();
                throw error;
            }

            throw message;
        }

        return result.value;
    };

    root.reach = function (schema, path) {

        Hoek.assert(schema && schema.isJoi, 'you must provide a joi schema');
        Hoek.assert(typeof path === 'string', 'path must be a string');

        if (path === '') {
            return schema;
        }

        const parts = path.split('.');
        const children = schema._inner.children;
        if (!children) {
            return;
        }

        const key = parts[0];
        for (let i = 0; i < children.length; ++i) {
            const child = children[i];
            if (child.key === key) {
                return this.reach(child.schema, path.substr(key.length + 1));
            }
        }
    };

    root.lazy = function (fn) {

        return Lazy.set(fn);
    };

    return root;
};


module.exports = internals.root();
