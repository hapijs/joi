'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('../common');
const ObjectType = require('./object');


const internals = {};


internals.Func = class extends ObjectType.constructor {

    constructor() {

        super();

        this._flags.func = true;
    }

    // Rules

    arity(n) {

        Hoek.assert(Number.isSafeInteger(n) && n >= 0, 'n must be a positive integer');

        return this._rule('arity', { args: { n } });
    }

    class() {

        return this._rule('class');
    }

    minArity(n) {

        Hoek.assert(Number.isSafeInteger(n) && n > 0, 'n must be a strict positive integer');

        return this._rule('minArity', { args: { n } });
    }

    maxArity(n) {

        Hoek.assert(Number.isSafeInteger(n) && n >= 0, 'n must be a positive integer');

        return this._rule('maxArity', { args: { n } });
    }
};


// Aliases

Common.alias(internals.Func, [

]);


// Casts

Common.extend(internals.Func, 'casts', {

    map: null                               // Disable object cast
});


// Rules

Common.extend(internals.Func, 'rules', {

    arity: function (value, helpers, { n }) {

        if (value.length === n) {
            return value;
        }

        return helpers.error('function.arity', { n });
    },

    class: function (value, helpers) {

        if ((/^\s*class\s/).test(value.toString())) {
            return value;
        }

        return helpers.error('function.class', { value });
    },

    maxArity: function (value, helpers, { n }) {

        if (value.length <= n) {
            return value;
        }

        return helpers.error('function.maxArity', { n });
    },

    minArity: function (value, helpers, { n }) {

        if (value.length >= n) {
            return value;
        }

        return helpers.error('function.minArity', { n });
    }
});


module.exports = new internals.Func();
