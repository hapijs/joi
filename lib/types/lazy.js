'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');


const internals = {};


internals.Lazy = class extends Any {

    constructor() {

        super('lazy');

        this._immutables.lazy = {};         // Must be set to a fresh object when `schema` is modified
    }

    _init(fn, options = {}) {

        Common.assertOptions(options, ['once']);
        Hoek.assert(typeof fn === 'function', 'You must provide a function as first argument');
        Hoek.assert(options.once === undefined || typeof options.once === 'boolean', 'Option "once" must be a boolean');

        const obj = this.clone();

        obj._immutables.lazy = {
            schema: fn,
            once: options.once === undefined ? true : options.once,
            generated: null
        };

        return obj;
    }

    _base(value, state, prefs) {

        const schema = this._generate();
        if (!Common.isSchema(schema)) {
            return { value, errors: this.createError('lazy.schema', value, { schema }, state, prefs) };
        }

        return schema._validate(value, state, prefs);
    }

    // About

    describe() {

        const description = super.describe();
        description.schema = this._immutables.lazy.schema;
        description.once = this._immutables.lazy.once;
        return description;
    }

    // Helpers

    concat(source) {

        Hoek.assert(Common.isSchema(source), 'Invalid schema object');
        Hoek.assert(source._type === 'any', 'Cannot merge type lazy with another type:', source._type);

        return super.concat(source);
    }

    // Internals

    _generate() {

        if (this._immutables.lazy.generated) {
            return this._immutables.lazy.generated;
        }

        const schema = this._immutables.lazy.schema();
        if (Common.isSchema(schema) &&
            this._immutables.lazy.once) {

            this._immutables.lazy.generated = schema;
        }

        return schema;
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
