'use strict';

// Load modules

const Hoek = require('hoek');
const Any = require('./any');
const Cast = require('./cast');
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

    root.extend = function () {

        const extensions = Hoek.flatten(Array.prototype.slice.call(arguments));
        Hoek.assert(extensions.length > 0, 'You need to provide at least one extension');

        this.assert(extensions, internals.extensionsSchema);

        const joi = Object.assign({}, this);

        for (let i = 0; i < extensions.length; ++i) {
            const extension = extensions[i];
            const base = (extension.base || this.any()).clone(); // Cloning because we're going to override language afterwards
            const ctor = base.constructor;
            const type = function () { // eslint-disable-line no-loop-func

                ctor.call(this);

                if (extension.base) {
                    Object.assign(this, base);
                }

                this._type = extension.name;

                if (extension.language) {
                    this._settings = this._settings || { language: {} };
                    this._settings.language = Hoek.applyToDefaults(this._settings.language, {
                        [extension.name]: extension.language
                    });
                }
            };
            Hoek.inherits(type, ctor);

            if (extension.pre) {
                type.prototype._base = function (value, state, options) {

                    if (ctor.prototype._base) {
                        const baseRet = ctor.prototype._base.call(this, value, state, options);

                        if (baseRet.errors) {
                            return baseRet;
                        }

                        value = baseRet.value;
                    }

                    const ret = extension.pre.call(this, value, state, options);
                    if (ret && ret.isJoi) {
                        return { value, errors: ret };
                    }
                    else if (ret !== null) {
                        return { value: ret };
                    }

                    return { value };
                };
            }

            if (extension.rules) {
                for (let j = 0; j < extension.rules.length; ++j) {
                    const rule = extension.rules[j];
                    const ruleArgs = rule.params ?
                        (rule.params instanceof Any ? rule.params._inner.children.map((k) => k.key) : Object.keys(rule.params)) :
                        [];
                    const validateArgs = rule.params ? Cast.schema(rule.params) : null;

                    type.prototype[rule.name] = function () { // eslint-disable-line no-loop-func

                        if (arguments.length > ruleArgs.length) {
                            throw new Error('Unexpected number of arguments');
                        }

                        const args = Array.prototype.slice.call(arguments);
                        let hasRef = false;
                        const arg = {};

                        for (let k = 0; k < ruleArgs.length; ++k) {
                            arg[ruleArgs[k]] = args[k];
                            if (!hasRef && Ref.isRef(args[k])) {
                                hasRef = true;
                            }
                        }

                        if (validateArgs) {
                            joi.assert(arg, validateArgs);
                        }

                        let schema;
                        if (rule.validate) {
                            const validate = rule.validate.bind(this, arg);

                            schema = this._test(rule.name, arg, validate, {
                                description: rule.description,
                                hasRef
                            });
                        }
                        else {
                            schema = this.clone();
                        }

                        if (rule.setup) {
                            rule.setup.call(schema, arg);
                        }

                        return schema;
                    };
                }
            }

            if (extension.describe) {
                type.prototype.describe = function () {

                    const description = ctor.prototype.describe.call(this);
                    return extension.describe.call(this, description);
                };
            }

            const instance = new type();
            joi[extension.name] = function () {

                return instance;
            };
        }

        return joi;
    };

    return root;
};


internals.extensionsSchema = internals.array.items(internals.object.keys({
    base: internals.object.type(Any, 'Joi object'),
    name: internals.string.required(),
    pre: internals.object._func().arity(3),
    language: internals.object,
    describe: internals.object._func().arity(1),
    rules: internals.array.items(internals.object.keys({
        name: internals.string.required(),
        setup: internals.object._func().arity(1),
        validate: internals.object._func().arity(4),
        params: [
            internals.object.pattern(/.*/, internals.object.type(Any, 'Joi object')),
            internals.object.type(internals.object.constructor, 'Joi object')
        ],
        description: [internals.string, internals.object._func().arity(1)]
    }).or('setup', 'validate'))
})).strict();


module.exports = internals.root();
