'use strict';

const Assert = require('@hapi/hoek/lib/assert');

const Base = require('../base');
const Messages = require('../messages');


const internals = {};


module.exports = Base.extend({

    type: 'any',

    // Rules

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

    // Modifiers

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

    // Errors

    messages: {
        'any.custom': '"{{#label}}" failed custom validation because {{#error.message}}',
        'any.default': '"{{#label}}" threw an error when running default method',
        'any.failover': '"{{#label}}" threw an error when running failover method',
        'any.invalid': '"{{#label}}" contains an invalid value',
        'any.only': '"{{#label}}" must be one of {{#valids}}',
        'any.ref': '"{{#label}}" {{#arg}} references "{{#ref}}" which {{#reason}}',
        'any.required': '"{{#label}}" is required',
        'any.unknown': '"{{#label}}" is not allowed'
    }
});
