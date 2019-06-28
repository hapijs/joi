'use strict';

const Bourne = require('@hapi/bourne');
const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Cast = require('../cast');
const Common = require('../common');


const internals = {};


internals.Array = class extends Any {

    constructor() {

        super('array');

        this._flags.sparse = false;
        this._inner.items = [];
        this._inner.ordereds = [];
        this._inner.inclusions = [];
        this._inner.exclusions = [];
        this._inner.requireds = [];
    }

    _coerce(value, state, prefs) {

        const result = { value };

        if (typeof value === 'string') {
            if (value[0] !== '[' &&
                !/^\s*\[/.test(value)) {

                return;
            }

            try {
                result.value = Bourne.parse(value);
            }
            catch (ignoreErr) {
                return;
            }
        }

        if (!Array.isArray(result.value)) {
            return;
        }

        const sort = this._uniqueRules.get('sort');
        if (sort) {
            return internals.sort(this, result.value, sort.args.options, state, prefs);
        }

        return result;
    }

    _base(value, state, prefs) {

        if (!Array.isArray(value)) {
            if (this._flags.single) {
                const single = [value];
                single[Common.symbols.arraySingle] = true;
                return { value: single };
            }

            return { errors: this.createError('array.base', value, null, state, prefs) };
        }

        if (!this._uniqueRules.has('items')) {
            return;
        }

        return { value: value.slice() };        // Clone the array so that we don't modify the original
    }

    // About

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

    // Rules

    items(...schemas) {

        Common.verifyFlat(schemas, 'items');

        const obj = this._rule('items');

        for (let i = 0; i < schemas.length; ++i) {
            let type = schemas[i];

            try {
                type = Cast.schema(this._root, type);
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

            obj._register(type);
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
                type = Cast.schema(this._root, type);
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

            obj._register(type);
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

        schema = Cast.schema(this._root, schema, { appendPath: true });
        const obj = this._rule('has', { args: { schema }, multi: true });
        obj._register(schema);
        return obj;
    }

    unique(comparator, options = {}) {

        Hoek.assert(!comparator || typeof comparator === 'function' || typeof comparator === 'string', 'comparator must be a function or a string');
        Common.assertOptions(options, ['ignoreUndefined', 'separator']);

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

    sort(options = {}) {

        Common.assertOptions(options, ['by', 'order']);

        const settings = {
            order: options.order || 'ascending'
        };

        if (options.by) {
            settings.by = Cast.ref(options.by, { ancestor: 0 });
            Hoek.assert(!settings.by.settings.ancestor, 'Cannot sort by ancestor');
        }

        return this._rule('sort', { args: { options: settings }, convert: true });
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

    // Internals

    _fillMissedErrors(errors, requireds, value, state, prefs) {

        const knownMisses = [];
        let unknownMisses = 0;
        for (const required of requireds) {
            const label = required._flags.label;
            if (label) {
                knownMisses.push(label);
            }
            else {
                ++unknownMisses;
            }
        }

        if (knownMisses.length) {
            if (unknownMisses) {
                errors.push(this.createError('array.includesRequiredBoth', value, { knownMisses, unknownMisses }, state, prefs));
            }
            else {
                errors.push(this.createError('array.includesRequiredKnowns', value, { knownMisses }, state, prefs));
            }
        }
        else {
            errors.push(this.createError('array.includesRequiredUnknowns', value, { unknownMisses }, state, prefs));
        }
    }

    _fillOrderedErrors(errors, ordereds, value, state, prefs) {

        const requiredOrdereds = [];

        for (const ordered of ordereds) {
            if (ordered._flags.presence === 'required') {
                requiredOrdereds.push(ordered);
            }
        }

        if (requiredOrdereds.length) {
            this._fillMissedErrors(errors, requiredOrdereds, value, state, prefs);
        }
    }
};


// Aliases

Common.alias(internals.Array, [

]);


// Casts

Common.extend(internals.Array, 'casts', {

    [Common.symbols.castFrom]: (value) => Array.isArray(value),

    set: function (value, options) {

        return new Set(value);
    }
});


// Rules

Common.extend(internals.Array, 'rules', {

    has: function (value, { state, prefs, error, schema }, { schema: has }) {

        for (let i = 0; i < value.length; ++i) {
            const localState = schema._state(i, [...state.path, i], [value, ...state.ancestors], state);
            if (has._match(value[i], localState, prefs)) {
                return value;
            }
        }

        const patternLabel = has._flags.label;
        if (patternLabel) {
            return error('array.hasKnown', { patternLabel });
        }

        return error('array.hasUnknown', null);
    },

    items: function (value, { schema, error, state, prefs }) {

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

                errors.push(error('array.sparse', { key, path, pos: i, value: undefined }, schema._state(key, path, null, state)));
                if (prefs.abortEarly) {
                    return errors;
                }

                ordereds.shift();
                continue;
            }

            // Exclusions

            const localState = schema._state(wasArray ? i : key, path, [value, ...state.ancestors], state);

            for (const exclusion of schema._inner.exclusions) {
                if (!exclusion._match(item, localState, prefs)) {
                    continue;
                }

                errors.push(error('array.excludes', { pos: i, value: item }, schema._state(key, path, null, state)));
                if (prefs.abortEarly) {
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
                    const res = ordered._validate(item, localState, prefs);
                    if (!res.errors) {
                        if (ordered._flags.strip) {
                            internals.fastSplice(value, i);
                            --i;
                            --il;
                        }
                        else if (!schema._flags.sparse && res.value === undefined) {
                            errors.push(error('array.sparse', { key, path, pos: i, value: undefined }, schema._state(key, path, null, state)));
                            if (prefs.abortEarly) {
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
                        if (prefs.abortEarly) {
                            return errors;
                        }
                    }

                    continue;
                }
                else if (!schema._inner.items.length) {
                    errors.push(error('array.orderedLength', { pos: i, limit: schema._inner.ordereds.length }));
                    if (prefs.abortEarly) {
                        return errors;
                    }

                    break;      // No reason to continue since there are no other rules to validate other than array.orderedLength
                }
            }

            // Requireds

            const requiredChecks = [];
            let jl = requireds.length;
            for (let j = 0; j < jl; ++j) {
                const res = requireds[j]._validate(item, localState, prefs);
                requiredChecks[j] = res;

                if (!res.errors) {
                    value[i] = res.value;
                    isValid = true;
                    internals.fastSplice(requireds, j);
                    --j;
                    --jl;

                    if (!schema._flags.sparse &&
                        res.value === undefined) {

                        errors.push(error('array.sparse', { key, path, pos: i, value: undefined }, schema._state(key, path, null, state)));
                        if (prefs.abortEarly) {
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

            const stripUnknown = prefs.stripUnknown && !!prefs.stripUnknown.arrays || false;

            jl = inclusions.length;
            for (const inclusion of inclusions) {

                // Avoid re-running requireds that already didn't match in the previous loop

                let res;
                const previousCheck = requireds.indexOf(inclusion);
                if (previousCheck !== -1) {
                    res = requiredChecks[previousCheck];
                }
                else {
                    res = inclusion._validate(item, localState, prefs);
                    if (!res.errors) {
                        if (inclusion._flags.strip) {
                            internals.fastSplice(value, i);
                            --i;
                            --il;
                        }
                        else if (!schema._flags.sparse &&
                            res.value === undefined) {

                            errors.push(error('array.sparse', { key, path, pos: i, value: undefined }, schema._state(key, path, null, state)));
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
                    if (prefs.abortEarly) {
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

                errors.push(error('array.includes', { pos: i, value: item }, schema._state(key, path, null, state)));
                if (prefs.abortEarly) {
                    return errors;
                }
            }
        }

        if (requireds.length) {
            schema._fillMissedErrors(errors, requireds, value, state, prefs);
        }

        if (ordereds.length) {
            schema._fillOrderedErrors(errors, ordereds, value, state, prefs);
        }

        return errors.length ? errors : value;
    },

    length: function (value, helpers, { limit }, { alias, operator, args }) {

        if (Common.compare(value.length, limit, operator)) {
            return value;
        }

        return helpers.error('array.' + alias, { limit: args.limit, value });
    },

    sort: function (value, { error, state, prefs, schema }, { options }) {

        const { value: sorted, errors } = internals.sort(schema, value, options, state, prefs);
        if (errors) {
            return errors;
        }

        for (let i = 0; i < value.length; ++i) {
            if (value[i] !== sorted[i]) {
                return error('array.sort', { order: options.order, by: options.by ? options.by.key : 'value' });
            }
        }

        return value;
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
                            const localState = schema._state(state.key, [...state.path, i], [value, ...state.ancestors], state);
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

                        const localState = schema._state(state.key, [...state.path, i], [value, ...state.ancestors], state);

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
});


// Helpers

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


internals.sort = function (schema, value, settings, state, prefs) {

    const order = settings.order === 'ascending' ? 1 : -1;
    const aFirst = -1 * order;
    const bFirst = order;

    const sort = (a, b) => {

        let compare = internals.compare(a, b, aFirst, bFirst);
        if (compare !== null) {
            return compare;
        }

        if (settings.by) {
            a = settings.by.resolve(a, state, prefs);
            b = settings.by.resolve(b, state, prefs);
        }

        compare = internals.compare(a, b, aFirst, bFirst);
        if (compare !== null) {
            return compare;
        }

        const type = typeof a;
        if (type !== typeof b) {
            throw schema.createError('array.sort.mismatching', value, null, state, prefs);
        }

        if (type !== 'number' &&
            type !== 'string') {

            throw schema.createError('array.sort.unsupported', value, { type }, state, prefs);
        }

        if (type === 'number') {
            return (a - b) * order;
        }

        return a < b ? aFirst : bFirst;
    };

    try {
        return { value: value.slice().sort(sort) };
    }
    catch (err) {
        return { errors: err };
    }
};


internals.compare = function (a, b, aFirst, bFirst) {

    if (a === b) {
        return 0;
    }

    if (a === undefined) {
        return 1;           // Always last regardless of sort order
    }

    if (b === undefined) {
        return -1;           // Always last regardless of sort order
    }

    if (a === null) {
        return bFirst;
    }

    if (b === null) {
        return aFirst;
    }

    return null;
};


module.exports = new internals.Array();
