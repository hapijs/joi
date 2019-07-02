'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Cast = require('../cast');
const Common = require('../common');
const Errors = require('../errors');
const Ref = require('../ref');


const internals = {};


internals.Alternatives = class extends Any {

    constructor() {

        super('alternatives');

        this._inners.matches = [];
    }

    _init(schemas) {

        return schemas ? this.try(schemas) : this;
    }

    _base(value, state, prefs) {

        const errors = [];
        for (const item of this._inners.matches) {
            if (item.schema) {
                const result = item.schema._validate(value, state, prefs);
                if (!result.errors) {
                    return result;
                }

                errors.push(...result.errors);
                continue;
            }

            const schema = item.peek || item.is;
            const input = item.is ? item.ref.resolve(value, state, prefs) : value;
            const entryState = schema._stateEntry(state, state.ancestors[0]);

            if (!schema._match(input, entryState, prefs)) {
                if (item.otherwise) {
                    return item.otherwise._validate(value, state, prefs);
                }
            }
            else if (item.then) {
                return item.then._validate(value, state, prefs);
            }
        }

        if (this._baseType) {
            return this._baseType._validate(value, state, prefs);
        }

        // Nothing matched due to type criteria rules

        if (!errors.length) {
            return { errors: this.createError('alternatives.base', value, null, state, prefs) };
        }

        // Single error

        if (errors.length === 1) {
            return { errors };
        }

        // All rules are base types

        const types = [];
        for (const error of errors) {
            if (error instanceof Errors.Report === false) {
                return { errors: this.createError('alternatives.match', value, Errors.details(errors, { override: false }), state, prefs) };
            }

            const [type, code] = error.code.split('.');
            if (code !== 'base') {
                return { errors: this.createError('alternatives.match', value, Errors.details(errors, { override: false }), state, prefs) };
            }

            types.push(type);
        }

        // Complex reasons

        return { errors: this.createError('alternatives.types', value, { types }, state, prefs) };
    }

    _override(id, schema) {

        let i = 0;
        for (const match of this._inners.matches) {
            for (const key of ['schema', 'peek', 'is', 'then', 'otherwise']) {
                if (match[key] &&
                    id === match[key]._flags.id) {

                    const obj = this.clone();
                    obj._inners.matches[i] = Object.assign({}, match, { [key]: schema });
                    return obj._rebuild();
                }
            }

            ++i;
        }
    }

    // About

    describe() {

        const description = super.describe();

        const alternatives = [];
        for (let i = 0; i < this._inners.matches.length; ++i) {
            const item = this._inners.matches[i];
            if (item.schema) {

                // try()

                alternatives.push(item.schema.describe());
            }
            else {

                // when()

                const when = item.is ? { ref: item.ref.describe(), is: item.is.describe() } : { peek: item.peek.describe() };

                if (item.then) {
                    when.then = item.then.describe();
                }

                if (item.otherwise) {
                    when.otherwise = item.otherwise.describe();
                }

                alternatives.push(when);
            }
        }

        description.alternatives = alternatives;
        return description;
    }

    // Rules

    label(name) {

        const obj = super.label(name);
        obj._inners.matches = obj._inners.matches.map((match) => {

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
    }

    tailor(targets) {

        let obj = super.tailor(targets);
        if (obj === this) {
            obj = this.clone();
        }

        for (let i = 0; i < obj._inners.matches.length; ++i) {
            const match = Object.assign({}, obj._inners.matches[i]);
            obj._inners.matches[i] = match;
            for (const key of ['schema', 'peek', 'is', 'then', 'otherwise']) {
                if (match[key]) {
                    match[key] = match[key].tailor(targets);
                }
            }
        }

        return obj._rebuild();
    }

    try(schemas) {

        Hoek.assert(schemas, 'Missing alternative schemas');
        Hoek.assert(!this._flags._endedSwitch, 'Unreachable condition');

        if (!Array.isArray(schemas)) {
            schemas = [schemas];
        }

        Hoek.assert(schemas.length, 'Cannot add other alternatives without at least one schema');

        const obj = this.clone();
        for (const schema of schemas) {
            obj._inners.matches.push({ schema: Cast.schema(obj._root, schema) });
        }

        return obj._rebuild();
    }

    when(condition, options) {

        if (Array.isArray(options)) {
            options = { switch: options };
        }

        Common.assertOptions(options, ['is', 'then', 'otherwise', 'switch']);

        const schemaCondition = Common.isSchema(condition);
        Hoek.assert(!this._baseType, 'Cannot chain multiple when conditions on non-alternatives root');
        Hoek.assert(!this._flags._endedSwitch, 'Unreachable condition');
        Hoek.assert(Ref.isRef(condition) || typeof condition === 'string' || schemaCondition, 'Invalid condition:', condition);
        Hoek.assert(!options.switch || options.is === undefined, 'Cannot combine "switch" with "is"');
        Hoek.assert(!options.switch || options.then === undefined, 'Cannot combine "switch" with "then"');
        Hoek.assert(options.switch !== undefined || options.then !== undefined || options.otherwise !== undefined, 'options must have at least one of "then", "otherwise", or "switch"');
        Hoek.assert(!schemaCondition || options.is === undefined, '"is" can not be used with a schema condition');
        Hoek.assert(!schemaCondition || options.switch === undefined, '"switch" can not be used with a schema condition');
        Hoek.assert(schemaCondition || options.is !== undefined || options.switch !== undefined, 'Missing "is" or "switch" option');
        Hoek.assert(options.switch === undefined || Array.isArray(options.switch), '"switch" must be an array');

        const obj = this.clone();

        const normalize = (match, settings) => {

            const isSchema = Common.isSchema(match);

            const item = {
                ref: !isSchema ? Cast.ref(match) : null,
                peek: isSchema ? match : null,
                then: settings.then !== undefined ? Cast.schema(this._root, settings.then) : undefined,
                otherwise: settings.otherwise !== undefined ? Cast.schema(this._root, settings.otherwise) : undefined
            };

            if (settings.is !== undefined) {
                item.is = Cast.schema(this._root, settings.is);
                if (settings.is === null ||
                    !(Ref.isRef(settings.is) || Common.isSchema(settings.is))) {

                    item.is = item.is.required();         // Only apply required if this wasn't already a schema or a ref
                }
            }

            if (item.then &&
                item.otherwise) {

                obj._flag('_endedSwitch', true, { clone: false });
            }

            return item;
        };

        // Single case

        if (options.switch === undefined) {
            obj._inners.matches.push(normalize(condition, options));
            return obj._rebuild();
        }

        // Switch statement

        for (let i = 0; i < options.switch.length; ++i) {
            const test = options.switch[i];
            Hoek.assert(test.is !== undefined, 'Switch statement missing "is"');
            Hoek.assert(test.then !== undefined, 'Switch statement missing "then"');

            if (i + 1 !== options.switch.length) {
                Common.assertOptions(test, ['is', 'then']);
                obj._inners.matches.push(normalize(condition, test));
            }
            else {

                // Last

                Common.assertOptions(test, ['is', 'then', 'otherwise']);
                Hoek.assert(options.otherwise === undefined || test.otherwise === undefined, 'Cannot specify "otherwise" inside and outside a "switch"');

                const otherwise = options.otherwise !== undefined ? options.otherwise : test.otherwise;
                obj._inners.matches.push(normalize(condition, { is: test.is, then: test.then, otherwise }));
            }
        }

        if (options.otherwise) {
            obj._inners.matches.push(normalize(condition, { is: new Any(), otherwise: options.otherwise }));
        }

        return obj._rebuild();
    }

    // Internals

    _rebuild() {

        Hoek.assert(!this._inRuleset(), 'Cannot set alternative schemas inside a ruleset');

        this._resetRegistrations();

        for (const match of this._inners.matches) {
            for (const key of ['schema', 'ref', 'peek', 'is', 'then', 'otherwise']) {
                this._register(match[key], { family: Ref.toSibling });
            }

            // Flag when an alternative type is an array

            for (const key of ['schema', 'then', 'otherwise']) {
                if (match[key] &&
                    match[key]._type === 'array') {

                    this._flag('_arrayItems', true);
                    break;
                }
            }
        }

        this._ruleset = false;
        return this;
    }
};


// Aliases

Common.alias(internals.Alternatives, [

]);


// Casts

Common.extend(internals.Alternatives, 'casts', {

});


// Rules

Common.extend(internals.Alternatives, 'rules', {

});


module.exports = new internals.Alternatives();
