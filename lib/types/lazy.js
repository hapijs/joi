'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');


const internals = {};


internals.Lazy = class extends Any {

    constructor() {

        super('lazy');

        this._flags.once = true;
        this._immutables.lazy = {};         // Must be set to a fresh object when `schema` is modified
    }

    _init(fn, options) {

        return this.set(fn, options);
    }

    _base(value, state, prefs) {

        let schema = this._immutables.lazy.generated;
        if (!schema) {
            const lazy = this._immutables.lazy.schema;
            if (!lazy) {
                return { value, errors: this.createError('lazy.base', value, null, state, prefs) };
            }

            schema = lazy();
            if (!(schema instanceof Any)) {
                return { value, errors: this.createError('lazy.schema', value, { schema }, state, prefs) };
            }

            if (this._flags.once) {
                this._immutables.lazy.generated = schema;
            }
        }

        return schema._validate(value, state, prefs);
    }

    // About

    describe() {

        const description = super.describe();
        description.schema = this._immutables.lazy.schema;
        return description;
    }

    // Rules

    set(fn, options = {}) {

        Common.assertOptions(options, ['once']);
        Hoek.assert(typeof fn === 'function', 'You must provide a function as first argument');
        Hoek.assert(options.once === undefined || typeof options.once === 'boolean', 'Option "once" must be a boolean');

        const obj = this._flag('once', options.once === undefined ? true : options.once);
        obj._immutables.lazy = { schema: fn, generated: null };
        return obj;
    }

    // Helpers

    concat(source) {

        Hoek.assert(source instanceof Any, 'Invalid schema object');
        Hoek.assert(source._type === 'any', 'Cannot merge type lazy with another type:', source._type);

        return super.concat(source);
    }
};


// Aliases

Common.alias(internals.Lazy, [

]);


// Casts

Common.extend(internals.Lazy, 'casts', {

});


// Rules

Common.extend(internals.Lazy, 'rules', {

});


module.exports = new internals.Lazy();
