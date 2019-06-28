'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./types/any');
const Cast = require('./cast');
const Common = require('./common');
const Errors = require('./errors');
const Messages = require('./messages');
const Ref = require('./ref');

let Schemas;


const internals = {};


exports.root = function (root, extensions) {

    Schemas = Schemas || require('./schemas');

    Hoek.assert(extensions.length, 'You need to provide at least one extension');
    root.assert(extensions, Schemas.extensions);

    const joi = Object.create(root.any());
    Object.assign(joi, root);
    joi._root = joi;
    joi._binds = new Set(joi._binds);

    for (let extension of extensions) {
        if (typeof extension === 'function') {
            extension = extension(joi);
        }

        root.assert(extension, Schemas.extension);

        const base = (extension.base || root.any()).clone(); // Cloning because we're going to override messages afterwards
        const ctor = base.constructor;
        const type = class extends ctor { // eslint-disable-line no-loop-func

            constructor() {

                super();

                if (extension.base) {
                    Object.assign(this, base);
                }

                this._type = extension.name;
            }
        };

        if (extension.messages) {
            const existing = type.prototype._messages || base._preferences && base._preferences.messages;
            type.prototype._messages = Messages.compile(extension.messages, existing);
        }

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
                const ruleArgs = rule.params ? (rule.params instanceof Any ? rule.params._inner.children.map((k) => k.key) : Object.keys(rule.params)) : [];
                const validateArgs = rule.params ? Cast.schema(root, rule.params) : null;

                type.prototype[rule.name] = function (...rArgs) { // eslint-disable-line no-loop-func

                    if (rArgs.length > ruleArgs.length) {
                        throw new Error('Unexpected number of arguments');
                    }

                    let hasRef = false;
                    let arg = {};

                    for (let i = 0; i < ruleArgs.length; ++i) {
                        arg[ruleArgs[i]] = rArgs[i];
                        if (!hasRef && Ref.isRef(rArgs[i])) {
                            hasRef = true;
                        }
                    }

                    if (validateArgs) {
                        arg = joi.attempt(arg, validateArgs);
                    }

                    let schema;
                    if (rule.validate &&
                        !rule.setup) {

                        const validate = function (value, state, prefs) {

                            return rule.validate.call(this, arg, value, state, prefs);
                        };

                        schema = this._test(rule.name, arg, validate, { description: rule.description, hasRef });
                    }
                    else {
                        schema = this.clone();
                    }

                    if (rule.setup) {
                        const newSchema = rule.setup.call(schema, arg);
                        if (newSchema !== undefined) {
                            Hoek.assert(newSchema instanceof Any, `Setup of extension Joi.${this._type}().${rule.name}() must return undefined or a Joi object`);
                            schema = newSchema;
                        }

                        if (rule.validate) {
                            const validate = function (value, state, prefs) {

                                return rule.validate.call(this, arg, value, state, prefs);
                            };

                            schema = schema._test(rule.name, arg, validate, { description: rule.description, hasRef });
                        }
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
        joi[extension.name] = function (...extArgs) {

            return Common.callWithDefaults(this, instance, extArgs);
        };

        joi._binds.add(extension.name);
    }

    return joi;
};
