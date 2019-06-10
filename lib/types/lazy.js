'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');


const internals = {};


internals.Lazy = class extends Any {

    constructor() {

        super();
        this._type = 'lazy';
        this._flags.once = true;
        this._cache = null;
    }

    _init(fn, options) {

        return this.set(fn, options);
    }

    _base(value, state, options) {

        let schema = this._cache;
        if (!schema) {
            const result = { value };
            const lazy = this._flags.lazy;

            if (!lazy) {
                result.errors = this.createError('lazy.base', null, state, options);
                return result;
            }

            schema = lazy();

            if (!(schema instanceof Any)) {
                result.errors = this.createError('lazy.schema', { schema }, state, options);
                return result;
            }

            if (this._flags.once) {
                this._cache = schema;
            }
        }

        return schema._validate(value, state, options);
    }

    // About

    describe() {

        const description = super.describe();
        description.schema = this._flags.lazy;
        return description;
    }

    // Rules

    set(fn, options = {}) {

        Common.assertOptions(options, ['once']);
        Hoek.assert(typeof fn === 'function', 'You must provide a function as first argument');
        Hoek.assert(options.once === undefined || typeof options.once === 'boolean', 'Option "once" must be a boolean');

        return this._flag([
            { flag: 'lazy', value: fn },
            { flag: 'once', value: options.once === undefined ? true : options.once }
        ]);
    }
};


module.exports = new internals.Lazy();
