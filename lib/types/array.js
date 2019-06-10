'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Cast = require('../cast');
const Common = require('../common');


const internals = {};


internals.Array = class extends Any {

    constructor() {

        super();

        this._type = 'array';
        this._inner.items = [];
        this._inner.ordereds = [];
        this._inner.inclusions = [];
        this._inner.exclusions = [];
        this._inner.requireds = [];
        this._flags.sparse = false;
    }

    _coerce(value, state, options) {

        const result = { value };

        if (value &&
            typeof value === 'string' &&
            (value[0] === '[' || /^\s*\[/.test(value))) {

            try {
                result.value = JSON.parse(value);
            }
            catch (ignoreErr) { }
        }

        return result;
    }

    _base(value, state, options) {

        if (!Array.isArray(value)) {
            if (this._flags.single) {
                const single = [value];
                single[Common.symbols.arraySingle] = true;
                return { value: single };
            }

            return { errors: this.createError('array.base', null, state, options) };
        }

        if (this._uniqueRules.has('items')) {
            value = value.slice(0);                 // Clone the array so that we don't modify the original
        }

        return { value };
    }

    describe() {

        const description = super.describe();

        if (this._inner.ordereds.length) {
            description.orderedItems = [];

            for (let i = 0; i < this._inner.ordereds.length; ++i) {
                description.orderedItems.push(this._inner.ordereds[i].describe());
            }
        }

        if (this._inner.items.length) {
            description.items = [];

            for (let i = 0; i < this._inner.items.length; ++i) {
                description.items.push(this._inner.items[i].describe());
            }
        }

        if (description.rules) {
            for (let i = 0; i < description.rules.length; ++i) {
                const rule = description.rules[i];
                if (rule.name === 'has') {
                    rule.arg = rule.arg.describe();
                }
            }
        }

        return description;
    }

    items(...schemas) {

        Common.verifyFlat(schemas, 'items');

        const obj = this._rule('items');

        for (let i = 0; i < schemas.length; ++i) {
            let type = schemas[i];

            try {
                type = Cast.schema(this._currentJoi, type);
            }
            catch (castErr) {
                if (castErr.hasOwnProperty('path')) {
                    castErr.path = i + '.' + castErr.path;
                }
                else {
                    castErr.path = i;
                }

                castErr.message = `${castErr.message}(${castErr.path})`;
                throw castErr;
            }

            internals.validateSingle(type, obj);

            obj._refs.register(type);
            obj._inner.items.push(type);        // Only used to describe

            if (type._flags.presence === 'required') {
                obj._inner.requireds.push(type);
            }
            else if (type._flags.presence === 'forbidden') {
                obj._inner.exclusions.push(type.optional());
            }
            else {
                obj._inner.inclusions.push(type);
            }
        }

        return obj;
    }

    ordered(...schemas) {

        Common.verifyFlat(schemas, 'ordered');

        const obj = this._rule('items');

        for (let i = 0; i < schemas.length; ++i) {
            let type = schemas[i];

            try {
                type = Cast.schema(this._currentJoi, type);
            }
            catch (castErr) {
                if (castErr.hasOwnProperty('path')) {
                    castErr.path = i + '.' + castErr.path;
                }
                else {
                    castErr.path = i;
                }

                castErr.message = `${castErr.message}(${castErr.path})`;
                throw castErr;
            }

            internals.validateSingle(type, obj);

            obj._refs.register(type);
            obj._inner.ordereds.push(type);
        }

        return obj;
    }

    min(limit) {

        return this._length('min', limit, '>=');
    }

    max(limit) {

        return this._length('max', limit, '<=');
    }

    length(limit) {

        return this._length('length', limit, '=');
    }

    _length(name, limit, operator) {

        const refs = {
            limit: {
                assert: (value) => Number.isSafeInteger(value) && value >= 0,
                code: 'array.ref',
                message: 'limit must be a positive integer or reference'
            }
        };

        return this._rule(name, { rule: 'length', refs, args: { limit }, operator });
    }

    has(schema) {

        schema = Cast.schema(this._currentJoi, schema, { appendPath: true });
        const obj = this._rule('has', { args: { schema }, multi: true });
        obj._refs.register(schema);
        return obj;
    }

    unique(comparator, options = {}) {

        Hoek.assert(!comparator || typeof comparator === 'function' || typeof comparator === 'string', 'comparator must be a function or a string');
        Hoek.assert(typeof options === 'object', 'configs must be an object');

        const settings = {
            ignoreUndefined: options.ignoreUndefined || false
        };

        if (comparator) {
            settings[typeof comparator === 'string' ? 'path' : 'comparator'] = comparator;
        }

        const rule = { args: { settings }, multi: true };

        if (settings.path) {
            const separator = Common.default(options.separator, '.');
            rule.path = separator ? settings.path.split(separator) : [settings.path];
        }

        return this._rule('unique', rule);
    }

    sparse(enabled) {

        const value = enabled === undefined ? true : !!enabled;

        if (this._flags.sparse === value) {
            return this;
        }

        const obj = value ? this.clone() : this._rule('items');
        return obj._flag('sparse', value, { clone: false });
    }

    single(enabled) {

        const value = enabled === undefined ? true : !!enabled;
        Hoek.assert(!value || !this._flags._arrayItems, 'Cannot specify single rule when array has array items');

        return this._flag('single', value);
    }

    _fillMissedErrors(errors, requireds, state, options) {

        const knownMisses = [];
        let unknownMisses = 0;
        for (const required of requireds) {
            const label = required._getLabel();
            if (label) {
                knownMisses.push(label);
            }
            else {
                ++unknownMisses;
            }
        }

        if (knownMisses.length) {
            if (unknownMisses) {
                errors.push(this.createError('array.includesRequiredBoth', { knownMisses, unknownMisses }, state, options));
            }
            else {
                errors.push(this.createError('array.includesRequiredKnowns', { knownMisses }, state, options));
            }
        }
        else {
            errors.push(this.createError('array.includesRequiredUnknowns', { unknownMisses }, state, options));
        }
    }

    _fillOrderedErrors(errors, ordereds, state, options) {

        const requiredOrdereds = [];

        for (const ordered of ordereds) {
            if (ordered._flags.presence === 'required') {
                requiredOrdereds.push(ordered);
            }
        }

        if (requiredOrdereds.length) {
            this._fillMissedErrors(errors, requiredOrdereds, state, options);
        }
    }
};


internals.Array.prototype._rules = {

    has: function (value, { state, options, error, schema }, { schema: has }) {

        for (let i = 0; i < value.length; ++i) {
            const localState = schema._state(i, [...state.path, i], [value, ...state.ancestors]);
            if (has._match(value[i], localState, options)) {
                return value;
            }
        }

        const patternLabel = has._getLabel();
        if (patternLabel) {
            return error('array.hasKnown', { patternLabel });
        }

        return error('array.hasUnknown', null);
    },

    items: function (value, { schema, error, state, options }) {

        const requireds = schema._inner.requireds.slice();
        const ordereds = schema._inner.ordereds.slice();
        const inclusions = [...schema._inner.inclusions, ...requireds];

        const wasArray = !value[Common.symbols.arraySingle];

        const errors = [];
        let il = value.length;
        for (let i = 0; i < il; ++i) {
            const item = value[i];

            let errored = false;
            let isValid = false;

            const path = wasArray ? [...state.path, i] : state.path;
            const key = state.key;

            // Sparse

            if (!schema._flags.sparse &&
                item === undefined) {

                errors.push(error('array.sparse', { key, path, pos: i }, schema._state(key, path)));
                if (options.abortEarly) {
                    return errors;
                }

                ordereds.shift();
                continue;
            }

            // Exclusions

            const localState = schema._state(wasArray ? i : key, path, [value, ...state.ancestors]);

            for (const exclusion of schema._inner.exclusions) {
                if (!exclusion._match(item, localState, {})) {          // Not passing options to use defaults
                    continue;
                }

                errors.push(error('array.excludes', { pos: i, value: item }, schema._state(key, path)));
                if (options.abortEarly) {
                    return errors;
                }

                errored = true;
                ordereds.shift();
                break;
            }

            if (errored) {
                continue;
            }

            // Ordered

            if (schema._inner.ordereds.length) {
                if (ordereds.length > 0) {
                    const ordered = ordereds.shift();
                    const res = ordered._validate(item, localState, options);
                    if (!res.errors) {
                        if (ordered._flags.strip) {
                            internals.fastSplice(value, i);
                            --i;
                            --il;
                        }
                        else if (!schema._flags.sparse && res.value === undefined) {
                            errors.push(error('array.sparse', { key, path, pos: i }, schema._state(key, path)));
                            if (options.abortEarly) {
                                return errors;
                            }

                            continue;
                        }
                        else {
                            value[i] = res.value;
                        }
                    }
                    else {
                        errors.push(...res.errors);
                        if (options.abortEarly) {
                            return errors;
                        }
                    }

                    continue;
                }
                else if (!schema._inner.items.length) {
                    errors.push(error('array.orderedLength', { pos: i, limit: schema._inner.ordereds.length }));
                    if (options.abortEarly) {
                        return errors;
                    }

                    break;      // No reason to continue since there are no other rules to validate other than array.orderedLength
                }
            }

            // Requireds

            const requiredChecks = [];
            let jl = requireds.length;
            for (let j = 0; j < jl; ++j) {
                const res = requireds[j]._validate(item, localState, options);
                requiredChecks[j] = res;

                if (!res.errors) {
                    value[i] = res.value;
                    isValid = true;
                    internals.fastSplice(requireds, j);
                    --j;
                    --jl;

                    if (!schema._flags.sparse &&
                        res.value === undefined) {

                        errors.push(error('array.sparse', { key, path, pos: i }, schema._state(key, path)));
                        if (options.abortEarly) {
                            return errors;
                        }
                    }

                    break;
                }
            }

            if (isValid) {
                continue;
            }

            // Inclusions

            const stripUnknown = options.stripUnknown && !!options.stripUnknown.arrays || false;

            jl = inclusions.length;
            for (const inclusion of inclusions) {

                // Avoid re-running requireds that already didn't match in the previous loop

                let res;
                const previousCheck = requireds.indexOf(inclusion);
                if (previousCheck !== -1) {
                    res = requiredChecks[previousCheck];
                }
                else {
                    res = inclusion._validate(item, localState, options);
                    if (!res.errors) {
                        if (inclusion._flags.strip) {
                            internals.fastSplice(value, i);
                            --i;
                            --il;
                        }
                        else if (!schema._flags.sparse &&
                            res.value === undefined) {

                            errors.push(error('array.sparse', { key, path, pos: i }, schema._state(key, path)));
                            errored = true;
                        }
                        else {
                            value[i] = res.value;
                        }

                        isValid = true;
                        break;
                    }
                }

                // Return the actual error if only one inclusion defined

                if (jl === 1) {
                    if (stripUnknown) {
                        internals.fastSplice(value, i);
                        --i;
                        --il;
                        isValid = true;
                        break;
                    }

                    errors.push(...res.errors);
                    if (options.abortEarly) {
                        return errors;
                    }

                    errored = true;
                    break;
                }
            }

            if (errored) {
                continue;
            }

            if (schema._inner.inclusions.length && !isValid) {
                if (stripUnknown) {
                    internals.fastSplice(value, i);
                    --i;
                    --il;
                    continue;
                }

                errors.push(error('array.includes', { pos: i, value: item }, schema._state(key, path)));
                if (options.abortEarly) {
                    return errors;
                }
            }
        }

        if (requireds.length) {
            schema._fillMissedErrors(errors, requireds, state, options);
        }

        if (ordereds.length) {
            schema._fillOrderedErrors(errors, ordereds, state, options);
        }

        return errors.length ? errors : value;
    },

    length: function (value, helpers, { limit }, { alias, operator, args }) {

        if (Common.compare(value.length, limit, operator)) {
            return value;
        }

        return helpers.error('array.' + alias, { limit: args.limit, value });
    },

    unique: function (value, { state, error, schema }, { settings }, { path }) {

        const found = {
            string: Object.create(null),
            number: Object.create(null),
            undefined: Object.create(null),
            boolean: Object.create(null),
            object: new Map(),
            function: new Map(),
            custom: new Map()
        };

        const compare = settings.comparator || Hoek.deepEqual;
        const ignoreUndefined = settings.ignoreUndefined;

        for (let i = 0; i < value.length; ++i) {
            const item = path ? Hoek.reach(value[i], path) : value[i];
            const records = settings.comparator ? found.custom : found[typeof item];

            // All available types are supported, so it's not possible to reach 100% coverage without ignoring this line.
            // I still want to keep the test for future js versions with new types (eg. Symbol).

            if (/* $lab:coverage:off$ */ records /* $lab:coverage:on$ */) {
                if (records instanceof Map) {
                    const entries = records.entries();
                    let current;
                    while (!(current = entries.next()).done) {
                        if (compare(current.value[0], item)) {
                            const localState = schema._state(state.key, [...state.path, i], [value, ...state.ancestors]);
                            const context = {
                                pos: i,
                                value: value[i],
                                dupePos: current.value[1],
                                dupeValue: value[current.value[1]]
                            };

                            if (settings.path) {
                                context.path = settings.path;
                            }

                            return error('array.unique', context, localState);
                        }
                    }

                    records.set(item, i);
                }
                else {
                    if ((!ignoreUndefined || item !== undefined) &&
                        records[item] !== undefined) {

                        const localState = schema._state(state.key, [...state.path, i], [value, ...state.ancestors]);

                        const context = {
                            pos: i,
                            value: value[i],
                            dupePos: records[item],
                            dupeValue: value[records[item]]
                        };

                        if (settings.path) {
                            context.path = settings.path;
                        }

                        return error('array.unique', context, localState);
                    }

                    records[item] = i;
                }
            }
        }

        return value;
    }
};


internals.fastSplice = function (arr, i) {

    let pos = i;
    while (pos < arr.length) {
        arr[pos++] = arr[pos];
    }

    --arr.length;
};


internals.validateSingle = function (type, obj) {

    if (type._type === 'array' ||
        type._type === 'alternatives') {

        Hoek.assert(!obj._flags.single, 'Cannot specify array item with single rule enabled');
        obj._flag('_arrayItems', true, { clone: false });
    }
};


module.exports = new internals.Array();
