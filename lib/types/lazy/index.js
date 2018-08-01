'use strict';

// Load modules

const Any = require('../any');
const Ref = require('../../ref');
const Hoek = require('hoek');


// Declare internals

const internals = {};


internals.Lazy = class extends Any {

    constructor() {

        super();
        this._type = 'lazy';
    }

    _base(value, state, options) {

        const result = { value };
        const lazy = this._flags.lazy;
        let args = this._flags.lazyArgs;

        if (!lazy) {
            result.errors = this.createError('lazy.base', null, state, options);
            return result;
        }

        args = args.map((arg) => {

            return Ref.isRef(arg) ? arg(state.reference || state.parent, options) : arg;
        });

        const schema = lazy(...args);

        if (!(schema instanceof Any)) {
            result.errors = this.createError('lazy.schema', null, state, options);
            return result;
        }

        return schema._validate(value, state, options);
    }

    set(fn, ...args) {

        Hoek.assert(typeof fn === 'function', 'You must provide a function as first argument');

        const obj = this.clone();
        obj._flags.lazy = fn;
        obj._flags.lazyArgs = args;
        return obj;
    }

};

module.exports = new internals.Lazy();
