'use strict';

const Hoek = require('@hapi/hoek');

const ObjectType = require('./object');


const internals = {};


internals.Func = class extends ObjectType.constructor {

    constructor() {

        super();

        this._flags.func = true;
    }

    arity(n) {

        Hoek.assert(Number.isSafeInteger(n) && n >= 0, 'n must be a positive integer');

        return this._rule('arity', { args: { n } });
    }

    minArity(n) {

        Hoek.assert(Number.isSafeInteger(n) && n > 0, 'n must be a strict positive integer');

        return this._rule('minArity', { args: { n } });
    }

    maxArity(n) {

        Hoek.assert(Number.isSafeInteger(n) && n >= 0, 'n must be a positive integer');

        return this._rule('maxArity', { args: { n } });
    }

    class() {

        return this._rule('class');
    }
};


internals.Func.prototype._rules = Object.assign({}, internals.Func.prototype._rules, {

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


internals.Func.prototype._casts = Object.assign({}, internals.Func.prototype._casts, {

    map: null       // Disable object cast
});


module.exports = new internals.Func();
