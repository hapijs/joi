'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Cast = require('../cast');
const Common = require('../common');


const internals = {};


module.exports = Any.extend({

    type: 'link',

    // Initialize

    initialize: function () {

        this._inners.link = null;
    },

    args: function (schema, ref) {

        return schema.ref(ref);
    },

    // Base validation

    validate: function (schema, value, { error, state, prefs }) {

        if (!schema._inners.link) {
            return { value, errors: error('link.uninitialized') };
        }

        const ref = schema._inners.link[0].ref;
        const perspective = ref.ancestor === 'root' ? state.schemas[0] : state.schemas[state.schemas.length - ref.ancestor - 1];
        if (!perspective) {
            return { value, errors: error('link.depth', { ref }) };
        }

        try {
            var linked = ref.path.length ? perspective._ids.reach(ref.path) : perspective;
        }
        catch (err) {
            return { value, errors: error('link.ref', { ref }) };
        }

        if (linked._type === 'link') {
            return { value, errors: error('link.loop', { ref }) };
        }

        return linked._validate(value, state.nest(linked), prefs);
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
    },

    // Errors

    messages: {
        'link.depth': '"{{#label}}" contains link reference "{{#ref}}" outside of schema boundaries',
        'link.loop': '"{{#label}}" contains link reference to another link "{{#ref}}"',
        'link.ref': '"{{#label}}" contains link reference to non-existing "{{#ref}}" schema',
        'link.uninitialized': 'uninitialized schema'
    }
});
