'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Cast = require('../cast');
const Common = require('../common');


const internals = {};


internals.Link = Any.extend({

    type: 'link',

    // Initialize

    initialize: function () {

        this._inners.link = null;
    },

    args: function (ref) {

        return this.ref(ref);
    },

    // Base validation

    validate: function (value, state, prefs) {

        if (!this._inners.link) {
            return { value, errors: this.createError('link.uninitialized', value, null, state, prefs) };
        }

        const ref = this._inners.link[0].ref;
        const perspective = ref.ancestor === 'root' ? state.schemas[state.schemas.length - 1] : state.schemas[ref.ancestor];
        if (!perspective) {
            return { value, errors: this.createError('link.depth', value, { ref }, state, prefs) };
        }

        try {
            var schema = ref.path.length ? perspective._ids.reach(ref.path) : perspective;
        }
        catch (err) {
            return { value, errors: this.createError('link.ref', value, { ref }, state, prefs) };
        }

        if (schema._type === 'link') {
            return { value, errors: this.createError('link.loop', value, { ref }, state, prefs) };
        }

        return schema._validate(value, state, prefs);
    },

    // Rules

    rules: {
        ref: {
            method: function (ref) {

                Hoek.assert(!this._inners.link, 'Cannot reinitialize schema');

                ref = Cast.ref(ref);

                Hoek.assert(ref.type === 'value', 'Invalid reference type');
                Hoek.assert(ref.ancestor === 'root' || ref.ancestor > 0, 'Link cannot reference itself');

                const obj = this.clone();
                obj._inners.link = [{ ref }];
                return obj;
            }
        }
    },

    // Overrides

    overrides: {
        concat: function (source) {

            Hoek.assert(this._inners.link, 'Uninitialized link schema');
            Hoek.assert(Common.isSchema(source), 'Invalid schema object');
            Hoek.assert(source._type === 'any', 'Cannot merge type link with another type:', source._type);

            return this.super.concat.call(this, source);
        },

        when: function (...args) {

            Hoek.assert(this._inners.link, 'Uninitialized link schema');

            const ref = this._inners.link[0].ref.clone();
            ++ref.ancestor;
            ref.updateDisplay();

            const obj = this.clone();
            obj._inners.link = [{ ref }];
            return this.super.when.call(obj, ...args);
        }
    },

    // Build

    build: function (desc) {

        return this.ref(desc.link);
    }
});


module.exports = new internals.Link();
