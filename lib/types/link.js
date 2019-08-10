'use strict';

const Assert = require('@hapi/hoek/lib/assert');

const Any = require('./any');
const Common = require('../common');
const Compile = require('../compile');


const internals = {};


module.exports = Any.extend({

    type: 'link',

    properties: {
        schemaChain: true
    },

    initialize(schema) {

        schema.$_terms.link = null;
    },

    args(schema, ref) {

        return schema.ref(ref);
    },

    validate(schema, value, { error, state, prefs }) {

        if (!schema.$_terms.link) {
            return { value, errors: error('link.uninitialized') };
        }

        const ref = schema.$_terms.link[0].ref;
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

    rules: {
        ref: {
            method(ref) {

                Assert(!this.$_terms.link, 'Cannot reinitialize schema');

                ref = Compile.ref(ref);

                Assert(ref.type === 'value', 'Invalid reference type');
                Assert(ref.ancestor === 'root' || ref.ancestor > 0, 'Link cannot reference itself');

                const obj = this.clone();
                obj.$_terms.link = [{ ref }];
                return obj;
            }
        }
    },

    overrides: {
        concat(source) {

            Assert(this.$_terms.link, 'Uninitialized link schema');
            Assert(Common.isSchema(source), 'Invalid schema object');
            Assert(source.type === 'any', 'Cannot merge type link with another type:', source.type);

            return this.$_super.concat(source);
        },

        when(...args) {

            Assert(this.$_terms.link, 'Uninitialized link schema');

            const ref = this.$_terms.link[0].ref.clone();
            ++ref.ancestor;
            ref.updateDisplay();

            const obj = this.clone();
            obj.$_terms.link = [{ ref }];
            return obj.$_super.when(...args);
        }
    },

    build(obj, desc) {

        return obj.ref(desc.link);
    },

    messages: {
        'link.depth': '"{{#label}}" contains link reference "{{#ref}}" outside of schema boundaries',
        'link.loop': '"{{#label}}" contains link reference to another link "{{#ref}}"',
        'link.ref': '"{{#label}}" contains link reference to non-existing "{{#ref}}" schema',
        'link.uninitialized': 'uninitialized schema'
    }
});
