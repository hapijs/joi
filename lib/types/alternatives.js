'use strict';

const Assert = require('@hapi/hoek/lib/assert');
const AssertError = require('@hapi/hoek/lib/error');

const Any = require('./any');
const Compile = require('../compile');
const Errors = require('../errors');
const Ref = require('../ref');


const internals = {};


module.exports = Any.extend({

    type: 'alternatives',

    terms: {

        matches: { init: [] }
    },

    args(schema, schemas) {

        return schema.try(schemas);
    },

    validate(schema, value, { error, state, prefs }) {

        const errors = [];
        for (const item of schema.$_terms.matches) {
            if (item.schema) {
                const result = item.schema.$_validate(value, state.nest(item.schema), prefs);
                if (!result.errors) {
                    return result;
                }

                errors.push(...result.errors);
                continue;
            }

            const { ref, is, then, otherwise } = item;
            const input = ref ? ref.resolve(value, state, prefs) : value;

            if (!is.$_match(input, state.entry(is, state.ancestors[0]), prefs)) {
                if (otherwise) {
                    return otherwise.$_validate(value, state.nest(otherwise), prefs);
                }
            }
            else if (then) {
                return then.$_validate(value, state.nest(then), prefs);
            }
        }

        // Nothing matched due to type criteria rules

        if (!errors.length) {
            return { errors: error('alternatives.base') };
        }

        // Single error

        if (errors.length === 1) {
            return { errors };
        }

        // All rules are base types

        const types = [];
        for (const report of errors) {
            if (report instanceof Errors.Report === false) {
                return { errors: error('alternatives.match', Errors.details(errors, { override: false })) };
            }

            if (report.state.path.length !== state.path.length) {
                return { errors: error('alternatives.match', Errors.details(errors, { override: false })) };
            }

            const [type, code] = report.code.split('.');
            if (code !== 'base') {
                return { errors: error('alternatives.match', Errors.details(errors, { override: false })) };
            }

            types.push(type);
        }

        // Complex reasons

        return { errors: error('alternatives.types', { types }) };
    },

    rules: {

        try: {
            method(schemas) {

                Assert(schemas, 'Missing alternative schemas');
                Assert(!this._flags._endedSwitch, 'Unreachable condition');

                if (!Array.isArray(schemas)) {
                    schemas = [schemas];
                }

                const obj = this.clone();
                for (const schema of schemas) {
                    obj.$_terms.matches.push({ schema: obj.$_compile(schema) });
                }

                return obj.$_mutateRebuild();
            }
        },

        conditional: {
            method(condition, options) {

                Assert(!this._flags._endedSwitch, 'Unreachable condition');

                const obj = this.clone();

                const conditions = Compile.when(obj, condition, options);
                for (const item of conditions) {
                    obj.$_terms.matches.push(item);

                    if (item.then &&
                        item.otherwise) {

                        obj.$_setFlag('_endedSwitch', true, { clone: false });
                    }
                }

                return obj.$_mutateRebuild();
            }
        }
    },

    overrides: {

        label(name) {

            const obj = this.$_super.label(name);
            obj.$_terms.matches = obj.$_terms.matches.map((match) => {

                if (match.schema) {
                    return { schema: match.schema.label(name) };
                }

                match = Object.assign({}, match);
                if (match.then) {
                    match.then = match.then.label(name);
                }

                if (match.otherwise) {
                    match.otherwise = match.otherwise.label(name);
                }

                return match;
            });

            return obj;
        },

        tailor(targets) {

            let obj = this.$_super.tailor(targets);
            if (obj === this) {
                obj = this.clone();
            }

            for (let i = 0; i < obj.$_terms.matches.length; ++i) {
                const match = Object.assign({}, obj.$_terms.matches[i]);
                obj.$_terms.matches[i] = match;
                for (const key of ['schema', 'is', 'then', 'otherwise']) {
                    if (match[key]) {
                        match[key] = match[key].tailor(targets);
                    }
                }
            }

            return obj.$_mutateRebuild();
        },

        when() {

            throw new AssertError(['Alternatives type does not support when(), use conditional() instead']);
        }
    },

    fork(schema, id, replacement) {

        let i = 0;
        for (const match of schema.$_terms.matches) {
            for (const key of ['schema', 'is', 'then', 'otherwise']) {
                if (match[key] &&
                    id === match[key]._flags.id) {

                    const obj = schema.clone();
                    obj.$_terms.matches[i] = Object.assign({}, match, { [key]: replacement });
                    return obj.$_mutateRebuild();
                }
            }

            ++i;
        }
    },

    rebuild(schema) {

        for (const match of schema.$_terms.matches) {
            for (const key of ['schema', 'ref', 'is', 'then', 'otherwise']) {
                schema.$_mutateRegister(match[key], { family: Ref.toSibling });
            }

            // Flag when an alternative type is an array

            for (const key of ['schema', 'then', 'otherwise']) {
                if (match[key] &&
                    match[key].type === 'array') {

                    schema.$_setFlag('_arrayItems', true, { clone: false });
                    break;
                }
            }
        }

        return schema;
    },

    manifest: {

        build(obj, desc) {

            if (desc.matches) {
                for (const { schema, ref, is, then, otherwise } of desc.matches) {
                    if (schema) {
                        obj = obj.try(schema);
                    }
                    else if (ref) {
                        obj = obj.conditional(ref, { is, then, otherwise });
                    }
                    else {
                        obj = obj.conditional(is, { then, otherwise });
                    }
                }
            }

            return obj;
        }
    },

    messages: {
        'alternatives.base': '"{{#label}}" does not match any of the allowed types',
        'alternatives.match': '"{{#label}}" does not match any of the allowed types',
        'alternatives.types': '"{{#label}}" must be one of {{#types}}'
    }
});
