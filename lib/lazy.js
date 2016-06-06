'use strict';

// Load modules

const Any = require('./any');
const Hoek = require('hoek');


// Declare internals

const internals = {};


internals.Lazy = function () {

    Any.call(this);
    this._type = 'lazy';
};

Hoek.inherits(internals.Lazy, Any);

internals.Lazy.prototype._base = function (value, state, options) {

    const result = { value };
    const lazy = this._flags.lazy;

    if (!lazy) {
        result.errors = this.createError('lazy.base', null, state, options);
        return result;
    }

    const schema = lazy();

    if (!(schema instanceof Any)) {
        result.errors = this.createError('lazy.schema', null, state, options);
        return result;
    }

    return schema._validate(value, state, options);
};

internals.Lazy.prototype.set = function (fn) {

    Hoek.assert(typeof fn === 'function', 'You must provide a function as first argument');

    const obj = this.clone();
    obj._flags.lazy = fn;
    return obj;
};

module.exports = new internals.Lazy();
