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

        this._inner.matches = [];
    }

    _init(schemas) {

        return schemas ? this.try(schemas) : this;
    }

    _base(value, state, prefs) {

        const errors = [];
        for (const item of this._inner.matches) {
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

    // Rules

    try(schemas) {

        Hoek.assert(schemas, 'Missing alternative schemas');
        Hoek.assert(!this._flags._endedSwitch, 'Unreachable condition');

        if (!Array.isArray(schemas)) {
            schemas = [schemas];
        }

        Hoek.assert(schemas.length, 'Cannot add other alternatives without at least one schema');

        const obj = this.clone();

        for (let i = 0; i < schemas.length; ++i) {
            const cast = Cast.schema(this._root, schemas[i]);
            obj._addAlternative({ schema: cast });
        }

        return obj;
    }

    when(condition, options) {

        if (Array.isArray(options)) {
            options = { switch: options };
        }

        Common.assertOptions(options, ['is', 'then', 'otherwise', 'switch']);

        const schemaCondition = condition instanceof Any;
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

            const isSchema = match instanceof Any;

            const item = {
                ref: !isSchema ? Cast.ref(match) : null,
                peek: isSchema ? match : null,
                then: settings.then !== undefined ? Cast.schema(this._root, settings.then) : undefined,
                otherwise: settings.otherwise !== undefined ? Cast.schema(this._root, settings.otherwise) : undefined
            };

            if (settings.is !== undefined) {
                item.is = Cast.schema(this._root, settings.is);
                if (settings.is === null ||
                    !(Ref.isRef(settings.is) || settings.is instanceof Any)) {

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
            obj._addAlternative(normalize(condition, options));
            return obj;
        }

        // Switch statement

        for (let i = 0; i < options.switch.length; ++i) {
            const test = options.switch[i];
            Hoek.assert(test.is !== undefined, 'Switch statement missing "is"');
            Hoek.assert(test.then !== undefined, 'Switch statement missing "then"');

            if (i + 1 !== options.switch.length) {
                Common.assertOptions(test, ['is', 'then']);
                obj._addAlternative(normalize(condition, test));
            }
            else {

                // Last

                Common.assertOptions(test, ['is', 'then', 'otherwise']);
                Hoek.assert(options.otherwise === undefined || test.otherwise === undefined, 'Cannot specify "otherwise" inside and outside a "switch"');

                const otherwise = options.otherwise !== undefined ? options.otherwise : test.otherwise;
                obj._addAlternative(normalize(condition, { is: test.is, then: test.then, otherwise }));
            }
        }

        if (options.otherwise) {
            obj._addAlternative(normalize(condition, { is: new Any(), otherwise: options.otherwise }));
        }

        return obj;
    }

    label(name) {

        const obj = super.label(name);
        obj._inner.matches = obj._inner.matches.map((match) => {

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

    describe() {

        const description = super.describe();

        const alternatives = [];
        for (let i = 0; i < this._inner.matches.length; ++i) {
            const item = this._inner.matches[i];
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

    // Internals

    _addAlternative(match) {

        this._inner.matches.push(match);

        for (const key of ['schema', 'ref', 'is', 'then', 'otherwise']) {
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
