'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');
const Compile = require('../compile');


const internals = {};


module.exports = Any.extend({

    type: 'link',

    properties: {
        schemaChain: true
    },

    // Initialize

    initialize: function (schema) {

        schema._inners.link = null;
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
            var linked = ref.path.length ? perspective.$_reach(ref.path) : perspective;
        }
        catch (err) {
            return { value, errors: error('link.ref', { ref }) };
        }

        if (linked.type === 'link') {
            return { value, errors: error('link.loop', { ref }) };
        }

        return linked.$_validate(value, state.nest(linked), prefs);
    },

    // Rules

    rules: {
        ref: {
            method: function (ref) {

                Hoek.assert(!this._inners.link, 'Cannot reinitialize schema');

                ref = Compile.ref(ref);

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
            Hoek.assert(source.type === 'any', 'Cannot merge type link with another type:', source.type);

            return this.super.concat(source);
        },

        when: function (...args) {

            Hoek.assert(this._inners.link, 'Uninitialized link schema');

            const ref = this._inners.link[0].ref.clone();
            ++ref.ancestor;
            ref.updateDisplay();

            const obj = this.clone();
            obj._inners.link = [{ ref }];
            return obj.super.when(...args);
        }
    },

    // Build

    build: function (obj, desc) {

        return obj.ref(desc.link);
    },

    // Errors

    messages: {
        'link.depth': '"{{#label}}" contains link reference "{{#ref}}" outside of schema boundaries',
        'link.loop': '"{{#label}}" contains link reference to another link "{{#ref}}"',
        'link.ref': '"{{#label}}" contains link reference to non-existing "{{#ref}}" schema',
        'link.uninitialized': 'uninitialized schema'
    }
});
