'use strict';

const Hoek = require('@hapi/hoek');

const Cast = require('./cast');
const Common = require('./common');
const Errors = require('./errors');
const Messages = require('./messages');

let Schemas;


const internals = {};


exports.root = function (root, extensions) {

    Schemas = Schemas || require('./schemas');

    Hoek.assert(extensions.length, 'You need to provide at least one extension');
    root.assert(extensions, Schemas.extensions);

    const joi = Object.assign({}, root);
    joi._types = new Set(joi._types);

    for (let extension of extensions) {
        if (typeof extension === 'function') {
            extension = extension(joi);
        }

        root.assert(extension, Schemas.extension);

        const generator = internals.generator(joi, root, extension);

        joi[extension.name] = function (...args) {

            return Common.callWithDefaults(this, generator(args), args);
        };

        joi._types.add(extension.name);
    }

    return joi;
};


internals.generator = function (joi, root, extension) {

    return function (ctorArgs) {

        let base = extension.base;
        if (typeof base === 'function') {
            base = base(...ctorArgs);
        }

        if (!base) {
            base = root.any();
        }

        const ctor = base.constructor;
        const type = class extends ctor {                       // eslint-disable-line no-loop-func

            constructor() {

                super();

                if (extension.base) {
                    Object.assign(this, base);
                }

                this._type = extension.name;

                if (extension.messages) {
                    const existing = base._preferences && Hoek.clone(base._preferences.messages);
                    this._preferences = Object.assign({}, this._preferences);
                    this._preferences.messages = Messages.compile(extension.messages, existing);
                }
            }
        };

        if (extension.coerce) {
            type.prototype._coerce = function (value, state, prefs) {

                if (ctor.prototype._coerce &&
                    (!ctor.prototype._coerce.type || typeof value === ctor.prototype._coerce.type)) {

                    const baseRet = ctor.prototype._coerce.call(this, value, state, prefs);
                    if (baseRet) {
                        if (baseRet.errors) {
                            return baseRet;
                        }

                        value = baseRet.value;
                    }
                }

                const ret = extension.coerce.call(this, value, state, prefs);
                if (ret instanceof Errors.Report) {
                    return { value, errors: ret };
                }

                return { value: ret };
            };
        }

        if (extension.pre) {
            type.prototype._base = function (value, state, prefs) {

                if (ctor.prototype._base) {
                    const baseRet = ctor.prototype._base.call(this, value, state, prefs);
                    if (baseRet) {
                        if (baseRet.errors &&
                            (!Array.isArray(baseRet.errors) || baseRet.errors.length)) {

                            return baseRet;
                        }

                        value = baseRet.value;
                    }
                }

                const ret = extension.pre.call(this, value, state, prefs);
                if (ret instanceof Errors.Report) {
                    return { value, errors: ret };
                }

                return { value: ret };
            };
        }

        if (extension.rules) {
            for (const rule of extension.rules) {
                internals.rule(joi, root, rule, type);
            }
        }

        return new type();
    };
};


internals.rule = function (joi, root, rule, type) {

    const params = rule.params ? (Common.isSchema(rule.params) ? rule.params._inners.keys.map((k) => k.key) : Object.keys(rule.params)) : [];
    const validateArgs = rule.params ? Cast.schema(root, rule.params) : null;

    type.prototype[rule.name] = function (...inputs) {

        Hoek.assert(inputs.length <= params.length, 'Incorrect number of arguments');

        let args = {};
        for (let i = 0; i < params.length; ++i) {
            args[params[i]] = inputs[i];
        }

        if (validateArgs) {
            args = joi.attempt(args, validateArgs);
        }

        let schema = this.clone();

        if (rule.setup) {
            const setup = rule.setup.call(schema, args);
            if (setup !== undefined) {
                Hoek.assert(Common.isSchema(setup), 'Setup of extension', this._type, rule.name, 'rule must return undefined or a joi schema');
                schema = setup;
            }
        }

        if (!rule.validate) {
            return schema;
        }

        const validate = function (value, state, prefs) {

            return rule.validate.call(this, args, value, state, prefs);
        };

        return schema._test(rule.name, args, validate, { description: rule.description });
    };
};
