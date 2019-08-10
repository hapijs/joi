'use strict';

const Assert = require('@hapi/hoek/lib/assert');

const Any = require('./any');
const Common = require('../common');
const Compile = require('../compile');
const Errors = require('../errors');
const Ref = require('../ref');


const internals = {};


module.exports = Any.extend({

    type: 'alternatives',

    initialize(schema) {

        schema.$_terms.matches = [];
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

            const is = item.peek || item.is;
            const input = item.is ? item.ref.resolve(value, state, prefs) : value;

            if (!is.$_match(input, state.entry(is, state.ancestors[0]), prefs)) {
                if (item.otherwise) {
                    return item.otherwise.$_validate(value, state.nest(item.otherwise), prefs);
                }
            }
            else if (item.then) {
                return item.then.$_validate(value, state.nest(item.then), prefs);
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
                for (const key of ['schema', 'peek', 'is', 'then', 'otherwise']) {
                    if (match[key]) {
                        match[key] = match[key].tailor(targets);
                    }
                }
            }

            return obj.$_mutateRebuild();
        },

        when(condition, options) {

            if (Array.isArray(options)) {
                options = { switch: options };
            }

            Common.assertOptions(options, ['is', 'then', 'otherwise', 'switch']);

            const schemaCondition = Common.isSchema(condition);
            Assert(!this._flags._endedSwitch, 'Unreachable condition');
            Assert(Ref.isRef(condition) || typeof condition === 'string' || schemaCondition, 'Invalid condition:', condition);
            Assert(!options.switch || options.is === undefined, 'Cannot combine "switch" with "is"');
            Assert(!options.switch || options.then === undefined, 'Cannot combine "switch" with "then"');
            Assert(options.switch !== undefined || options.then !== undefined || options.otherwise !== undefined, 'options must have at least one of "then", "otherwise", or "switch"');
            Assert(!schemaCondition || options.is === undefined, '"is" can not be used with a schema condition');
            Assert(!schemaCondition || options.switch === undefined, '"switch" can not be used with a schema condition');
            Assert(schemaCondition || options.is !== undefined || options.switch !== undefined, 'Missing "is" or "switch" option');
            Assert(options.switch === undefined || Array.isArray(options.switch), '"switch" must be an array');

            const obj = this.clone();

            const normalize = (match, settings) => {

                const isSchema = Common.isSchema(match);

                const item = {
                    ref: !isSchema ? Compile.ref(match) : null,
                    peek: isSchema ? match : null,
                    then: settings.then !== undefined ? obj.$_compile(settings.then) : undefined,
                    otherwise: settings.otherwise !== undefined ? obj.$_compile(settings.otherwise) : undefined
                };

                if (settings.is !== undefined) {
                    item.is = obj.$_compile(settings.is);
                    if (settings.is === null ||
                        !(Ref.isRef(settings.is) || Common.isSchema(settings.is))) {

                        item.is = item.is.required();         // Only apply required if this wasn't already a schema or a ref
                    }
                }

                if (item.then &&
                    item.otherwise) {

                    obj.$_setFlag('_endedSwitch', true, { clone: false });
                }

                return item;
            };

            // Single case

            if (options.switch === undefined) {
                obj.$_terms.matches.push(normalize(condition, options));
                return obj.$_mutateRebuild();
            }

            // Switch statement

            for (let i = 0; i < options.switch.length; ++i) {
                const test = options.switch[i];
                Assert(test.is !== undefined, 'Switch statement missing "is"');
                Assert(test.then !== undefined, 'Switch statement missing "then"');

                if (i + 1 !== options.switch.length) {
                    Common.assertOptions(test, ['is', 'then']);
                    obj.$_terms.matches.push(normalize(condition, test));
                }
                else {

                    // Last

                    Common.assertOptions(test, ['is', 'then', 'otherwise']);
                    Assert(options.otherwise === undefined || test.otherwise === undefined, 'Cannot specify "otherwise" inside and outside a "switch"');

                    const otherwise = options.otherwise !== undefined ? options.otherwise : test.otherwise;
                    obj.$_terms.matches.push(normalize(condition, { is: test.is, then: test.then, otherwise }));
                }
            }

            return obj.$_mutateRebuild();
        }
    },

    fork(schema, id, replacement) {

        let i = 0;
        for (const match of schema.$_terms.matches) {
            for (const key of ['schema', 'peek', 'is', 'then', 'otherwise']) {
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
            for (const key of ['schema', 'ref', 'peek', 'is', 'then', 'otherwise']) {
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

            for (const { schema, ref, peek, is, then, otherwise } of desc.matches) {
                if (schema) {
                    obj = obj.try(schema);
                }
                else {
                    obj = obj.when(ref || peek, { is, then, otherwise });
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
