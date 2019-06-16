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

        super();

        this._type = 'alternatives';
        this._invalids.remove(null);
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

            if (!schema._match(input, null, prefs, state.parent)) {
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

    try(schemas) {

        Hoek.assert(schemas, 'Missing alternative schemas');
        Hoek.assert(!this._flags._endedSwitch, 'Unreachable condition');

        if (!Array.isArray(schemas)) {
            schemas = [schemas];
        }

        Hoek.assert(schemas.length, 'Cannot add other alternatives without at least one schema');

        const obj = this.clone();

        for (let i = 0; i < schemas.length; ++i) {
            const cast = Cast.schema(this._currentJoi, schemas[i]);
            obj._refs.register(cast, Ref.toSibling);
            obj._addAlternative({ schema: cast });
        }

        return obj;
    }

    when(condition, options) {

        let schemaCondition = false;
        Hoek.assert(!this._baseType, 'Cannot chain multiple when conditions on non-alternatives root');
        Hoek.assert(Ref.isRef(condition) || typeof condition === 'string' || (schemaCondition = condition instanceof Any), 'Invalid condition:', condition);

        Common.assertOptions(options, ['is', 'then', 'otherwise']);
        Hoek.assert(!this._flags._endedSwitch, 'Unreachable condition');

        if (schemaCondition) {
            Hoek.assert(!options.hasOwnProperty('is'), '"is" can not be used with a schema condition');
        }
        else {
            Hoek.assert(options.hasOwnProperty('is'), 'Missing "is" directive');
        }

        Hoek.assert(options.then !== undefined || options.otherwise !== undefined, 'options must have at least one of "then" or "otherwise"');

        const obj = this.clone();

        if (options.then !== undefined &&
            options.otherwise !== undefined) {

            obj._flag('_endedSwitch', true, { clone: false });
        }

        let is;
        if (!schemaCondition) {
            is = Cast.schema(this._currentJoi, options.is);

            if (options.is === null ||
                !(Ref.isRef(options.is) || options.is instanceof Any)) {

                // Only apply required if this wasn't already a schema or a ref, we'll suppose people know what they're doing
                is = is.required();
            }
        }

        const item = {
            ref: schemaCondition ? null : Cast.ref(condition),
            peek: schemaCondition ? condition : null,
            is,
            then: options.then !== undefined ? Cast.schema(this._currentJoi, options.then) : undefined,
            otherwise: options.otherwise !== undefined ? Cast.schema(this._currentJoi, options.otherwise) : undefined
        };

        if (!schemaCondition) {
            obj._refs.register(item.ref, Ref.toSibling);
            obj._refs.register(item.is, Ref.toSibling);
        }

        if (item.then) {
            obj._refs.register(item.then, Ref.toSibling);
        }

        if (item.otherwise) {
            obj._refs.register(item.otherwise, Ref.toSibling);
        }

        obj._addAlternative(item);

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

    _addAlternative(match) {

        this._inner.matches.push(match);

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


module.exports = new internals.Alternatives();
