'use strict';

const Assert = require('@hapi/hoek/lib/assert');

const Base = require('../base');
const Common = require('../common');
const Messages = require('../messages');


const internals = {};


module.exports = Base.extend({

    type: 'any',

    flags: {

        only: { default: false }
    },

    terms: {

        alterations: { init: null },
        examples: { init: null },
        externals: { init: null },
        metas: { init: [] },
        notes: { init: [] },
        shared: { init: null },
        tags: { init: [] },
        whens: { init: null }
    },

    rules: {

        custom: {
            method(method, description) {

                Assert(typeof method === 'function', 'Method must be a function');
                Assert(description === undefined || description && typeof description === 'string', 'Description must be a non-empty string');

                return this.$_addRule({ name: 'custom', args: { method, description } });
            },
            validate(value, helpers, { method }) {

                try {
                    return method(value, helpers);
                }
                catch (err) {
                    return helpers.error('any.custom', { error: err });
                }
            },
            args: ['method', 'description'],
            multi: true
        },

        messages: {
            method(messages) {

                return this.prefs({ messages });
            }
        },

        shared: {
            method(schema) {

                Assert(Common.isSchema(schema) && schema._flags.id, 'Schema must be a schema with an id');

                const obj = this.clone();
                obj.$_terms.shared = obj.$_terms.shared || [];
                obj.$_terms.shared.push(schema);
                obj.$_mutateRegister(schema);
                return obj;
            }
        },

        warning: {
            method(code, local) {

                Assert(code && typeof code === 'string', 'Invalid warning code');

                return this.$_addRule({ name: 'warning', args: { code, local }, warn: true });
            },
            validate(value, helpers, { code, local }) {

                return helpers.error(code, local);
            },
            args: ['code', 'local'],
            multi: true
        }
    },

    modifiers: {

        keep(rule, enabled = true) {

            rule.keep = enabled;
        },

        message(rule, message) {

            rule.message = Messages.compile(message);
        },

        warn(rule, enabled = true) {

            rule.warn = enabled;
        }
    },

    manifest: {

        build(obj, desc) {

            for (const key in desc) {
                const values = desc[key];

                if (['examples', 'externals', 'metas', 'notes', 'tags'].includes(key)) {
                    for (const value of values) {
                        obj = obj[key.slice(0, -1)](value);
                    }

                    continue;
                }

                if (key === 'alterations') {
                    const alter = {};
                    for (const { target, adjuster } of values) {
                        alter[target] = adjuster;
                    }

                    obj = obj.alter(alter);
                    continue;
                }

                if (key === 'whens') {
                    for (const value of values) {
                        const { ref, is, not, then, otherwise, concat } = value;
                        if (concat) {
                            obj = obj.concat(concat);
                        }
                        else if (ref) {
                            obj = obj.when(ref, { is, not, then, otherwise, switch: value.switch, break: value.break });
                        }
                        else {
                            obj = obj.when(is, { then, otherwise, break: value.break });
                        }
                    }

                    continue;
                }

                if (key === 'shared') {
                    for (const value of values) {
                        obj = obj.shared(value);
                    }
                }
            }

            return obj;
        }
    },

    messages: {
        /**
         * @category errors
         * @summary A custom validation method threw an exception.
         * @description Additional local context properties:
         * ```ts
         * {
         *     error: Error // The error thrown
         * }
         * ```
         */
        'any.custom': '{{#label}} failed custom validation because {{#error.message}}',
        /**
         * @category errors
         * @summary If your [`any.default()`](#anydefaultvalue-description) generator function throws error, you will have it here.
         * @description Additional local context properties:
         * ```ts
         * {
         *     error: Error // Error generated during the default value function call
         * }
         * ```
         */
        'any.default': '{{#label}} threw an error when running default method',
        /**
         * @category errors
         * @summary If your [`any.failover()`](#anyfailovervalue-description) generator function throws error, you will have it here.
         * @description Additional local context properties:
         * ```ts
         * {
         *     error: Error // Error generated during the failover value function call
         * }
         * ```
         */
        'any.failover': '{{#label}} threw an error when running failover method',
        /**
         * @category errors
         * @summary The value matched a value listed in the invalid values.
         * @description Additional local context properties:
         * ```ts
         * {
         *     invalids: Array<any> // Contains the list of the invalid values that should be rejected
         * }
         * ```
         */
        'any.invalid': '{{#label}} contains an invalid value',
        /**
         * @category errors
         * @summary Only some values were allowed, the input didn't match any of them.
         * @description Additional local context properties:
         * ```ts
         * {
         *     valids: Array<any> // Contains the list of the valid values that were expected
         * }
         * ```
         */
        'any.only': '{{#label}} must be {if(#valids.length == 1, "", "one of ")}{{#valids}}',
        /**
         * @category errors
         * @summary A reference was used in rule argument and the value pointed to by that reference in the input is not valid.
         * @description Additional local context properties:
         * ```ts
         * {
         *     arg: string, // The argument name
         *     reason: string, // The reason the referenced value is invalid
         *     ref: Reference // Reference used
         * }
         * ```
         */
        'any.ref': '{{#label}} {{#arg}} references {{:#ref}} which {{#reason}}',
        /**
         * @category errors
         * @summary A required value wasn't present.
         */
        'any.required': '{{#label}} is required',
        /**
         * @category errors
         * @summary A value was present while it wasn't expected.
         */
        'any.unknown': '{{#label}} is not allowed'
    }
});
