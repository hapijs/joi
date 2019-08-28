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

    terms: {

        link: { init: null, manifest: 'single', register: false }
    },

    args(schema, ref) {

        return schema.ref(ref);
    },

    validate(value, { schema, error, state, prefs }) {

        Assert(schema.$_terms.link, 'Uninitialized link schema');

        const ref = schema.$_terms.link[0].ref;
        const { perspective, path } = internals.perspective(ref, state);
        if (!perspective) {
            return { value, errors: error('link.depth', { ref }) };
        }

        try {
            var linked = path.length ? perspective.$_reach(path) : perspective;
        }
        catch (err) {
            return { value, errors: error('link.ref', { ref }) };
        }

        if (linked.type === 'link') {
            return { value, errors: error('link.loop', { ref }) };
        }

        return linked.$_validate(value, state.nest(linked, `link:${ref.display}:${linked.type}`), prefs);
    },

    rules: {
        ref: {
            method(ref) {

                Assert(!this.$_terms.link, 'Cannot reinitialize schema');

                ref = Compile.ref(ref);

                Assert(ref.type === 'value' || ref.type === 'local', 'Invalid reference type:', ref.type);
                Assert(ref.type === 'local' || ref.ancestor === 'root' || ref.ancestor > 0, 'Link cannot reference itself');

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
        }
    },

    manifest: {

        build(obj, desc) {

            Assert(desc.link, 'Invalid link description missing link');
            return obj.ref(desc.link);
        }
    },

    messages: {
        'link.depth': '"{{#label}}" contains link reference "{{#ref}}" outside of schema boundaries',
        'link.loop': '"{{#label}}" contains link reference to another link "{{#ref}}"',
        'link.ref': '"{{#label}}" contains link reference to non-existing "{{#ref}}" schema'
    }
});


// Helpers

internals.perspective = function (ref, state) {

    if (ref.type === 'local') {
        for (const { schema, key } of state.schemas) {                              // From parent to root
            const id = schema._flags.id || key;
            if (id === ref.path[0]) {
                return { perspective: schema, path: ref.path.slice(1) };
            }
        }

        return { perspective: null, path: null };
    }

    if (ref.ancestor === 'root') {
        return { perspective: state.schemas[state.schemas.length - 1].schema, path: ref.path };
    }

    return { perspective: state.schemas[ref.ancestor] && state.schemas[ref.ancestor].schema, path: ref.path };
};
