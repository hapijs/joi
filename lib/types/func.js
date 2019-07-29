'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const ObjectType = require('./object');


const internals = {};


internals.Func = Any.extend({

    // type: 'func',
    base: ObjectType.constructor,

    // Initialize

    initialize: function () {

        this._flags._func = true;
    },

    // Rules

    rules: {
        arity: {
            method: function (n) {

                Hoek.assert(Number.isSafeInteger(n) && n >= 0, 'n must be a positive integer');

                return this._rule({ name: 'arity', args: { n } });
            },
            validate: function (value, helpers, { n }) {

                if (value.length === n) {
                    return value;
                }

                return helpers.error('function.arity', { n });
            }
        },

        class: {
            method: function () {

                return this._rule('class');
            },
            validate: function (value, helpers) {

                if ((/^\s*class\s/).test(value.toString())) {
                    return value;
                }

                return helpers.error('function.class', { value });
            }
        },

        minArity: {
            method: function (n) {

                Hoek.assert(Number.isSafeInteger(n) && n > 0, 'n must be a strict positive integer');

                return this._rule({ name: 'minArity', args: { n } });
            },
            validate: function (value, helpers, { n }) {

                if (value.length >= n) {
                    return value;
                }

                return helpers.error('function.minArity', { n });
            }
        },

        maxArity: {
            method: function (n) {

                Hoek.assert(Number.isSafeInteger(n) && n >= 0, 'n must be a positive integer');

                return this._rule({ name: 'maxArity', args: { n } });
            },
            validate: function (value, helpers, { n }) {

                if (value.length <= n) {
                    return value;
                }

                return helpers.error('function.maxArity', { n });
            }
        }
    },

    // Cast

    cast: {
        to: {
            map: null                               // Disable object cast
        }
    }
});


module.exports = new internals.Func();
