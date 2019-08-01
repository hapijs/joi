'use strict';

const Bourne = require('@hapi/bourne');
const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Cast = require('../cast');
const Common = require('../common');


const internals = {};


internals.Array = Any.extend({

    type: 'array',

    // Initialize

    initialize: function () {

        this._inners.items = [];
        this._inners.ordered = [];
        this._inners._inclusions = [];
        this._inners._exclusions = [];
        this._inners._requireds = [];
    },

    // Coerce

    coerce: {
        method: function (value, state, prefs) {

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
    },

    // Base validation

    validate: function (value, state, prefs) {

        if (!Array.isArray(value)) {
            if (this._flags.single) {
                const single = [value];
                single[Common.symbols.arraySingle] = true;
                return { value: single };
            }

            return { errors: this.createError('array.base', value, null, state, prefs) };
        }

        if (!this._uniqueRules.has('items') &&
            !this._inners.externals) {

            return;
        }

        return { value: value.slice() };        // Clone the array so that we don't modify the original
    },

    // Rules

    rules: {

        has: {
            method: function (schema) {

                schema = this._cast(schema, { appendPath: true });
                const obj = this._rule({ name: 'has', args: { schema } });
                obj._register(schema);
                return obj;
            },
            validate: function (value, { state, prefs, error, schema }, { schema: has }) {

                for (let i = 0; i < value.length; ++i) {
                    const localState = state.localize([...state.path, i], [value, ...state.ancestors], schema);
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
            multi: true
        },

        items: {
            method: function (...schemas) {

                Common.verifyFlat(schemas, 'items');

                const obj = this._rule('items');

                for (let i = 0; i < schemas.length; ++i) {
                    const type = Common.tryWithPath(() => this._cast(schemas[i]), i, { append: true });
                    obj._inners.items.push(type);
                }

                return obj._rebuild();
            },
            validate: function (value, { schema, error, state, prefs }) {

                const requireds = schema._inners._requireds.slice();
                const ordereds = schema._inners.ordered.slice();
                const inclusions = [...schema._inners._inclusions, ...requireds];

                const wasArray = !value[Common.symbols.arraySingle];

                const errors = [];
                let il = value.length;
                for (let i = 0; i < il; ++i) {
                    const item = value[i];

                    let errored = false;
                    let isValid = false;

                    const key = wasArray ? i : new Number(i);       // eslint-disable-line no-new-wrappers
                    const path = [...state.path, key];

                    // Sparse

                    if (!schema._flags.sparse &&
                        item === undefined) {

                        errors.push(error('array.sparse', { key, path, pos: i, value: undefined }, state.localize(path, null, schema)));
                        if (prefs.abortEarly) {
                            return errors;
                        }

                        ordereds.shift();
                        continue;
                    }

                    // Exclusions

                    const localState = state.localize(path, [value, ...state.ancestors], schema);

                    for (const exclusion of schema._inners._exclusions) {
                        if (!exclusion._match(item, localState, prefs)) {
                            continue;
                        }

                        errors.push(error('array.excludes', { pos: i, value: item }, state.localize(path, null, schema)));
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

                    if (schema._inners.ordered.length) {
                        if (ordereds.length) {
                            const ordered = ordereds.shift();
                            const res = ordered._validate(item, localState, prefs);
                            if (!res.errors) {
                                if (ordered._flags.result === 'strip') {
                                    internals.fastSplice(value, i);
                                    --i;
                                    --il;
                                }
                                else if (!schema._flags.sparse && res.value === undefined) {
                                    errors.push(error('array.sparse', { key, path, pos: i, value: undefined }, state.localize(path, null, schema)));
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
                        else if (!schema._inners.items.length) {
                            errors.push(error('array.orderedLength', { pos: i, limit: schema._inners.ordered.length }));
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

                                errors.push(error('array.sparse', { key, path, pos: i, value: undefined }, state.localize(path, null, schema)));
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
                                if (inclusion._flags.result === 'strip') {
                                    internals.fastSplice(value, i);
                                    --i;
                                    --il;
                                }
                                else if (!schema._flags.sparse &&
                                    res.value === undefined) {

                                    errors.push(error('array.sparse', { key, path, pos: i, value: undefined }, state.localize(path, null, schema)));
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

                    if (schema._inners._inclusions.length && !isValid) {
                        if (stripUnknown) {
                            internals.fastSplice(value, i);
                            --i;
                            --il;
                            continue;
                        }

                        errors.push(error('array.includes', { pos: i, value: item }, state.localize(path, null, schema)));
                        if (prefs.abortEarly) {
                            return errors;
                        }
                    }
                }

                if (requireds.length) {
                    internals.fillMissedErrors(schema, errors, requireds, value, state, prefs);
                }

                if (ordereds.length) {
                    internals.fillOrderedErrors(schema, errors, ordereds, value, state, prefs);
                }

                return errors.length ? errors : value;
            },
            priority: true
        },

        length: {
            method: function (limit) {

                return this._rule({ name: 'length', args: { limit }, operator: '=' });
            },
            validate: function (value, helpers, { limit }, { name, operator, args }) {

                if (Common.compare(value.length, limit, operator)) {
                    return value;
                }

                return helpers.error('array.' + name, { limit: args.limit, value });
            },
            refs: {
                limit: {
                    assert: Common.limit,
                    code: 'array.ref',
                    message: 'limit must be a positive integer or reference'
                }
            }
        },

        max: {
            method: function (limit) {

                return this._rule({ name: 'max', method: 'length', args: { limit }, operator: '<=' });
            }
        },

        min: {
            method: function (limit) {

                return this._rule({ name: 'min', method: 'length', args: { limit }, operator: '>=' });
            }
        },

        ordered: {
            method: function (...schemas) {

                Common.verifyFlat(schemas, 'ordered');

                const obj = this._rule('items');

                for (let i = 0; i < schemas.length; ++i) {
                    const type = Common.tryWithPath(() => this._cast(schemas[i]), i, { append: true });
                    internals.validateSingle(type, obj);

                    obj._register(type);
                    obj._inners.ordered.push(type);
                }

                return obj._rebuild();
            }
        },

        single: {
            method: function (enabled) {

                const value = enabled === undefined ? true : !!enabled;
                Hoek.assert(!value || !this._flags._arrayItems, 'Cannot specify single rule when array has array items');

                return this._flag('single', value);
            }
        },

        sort: {
            method: function (options = {}) {

                Common.assertOptions(options, ['by', 'order']);

                const settings = {
                    order: options.order || 'ascending'
                };

                if (options.by) {
                    settings.by = Cast.ref(options.by, { ancestor: 0 });
                    Hoek.assert(!settings.by.ancestor, 'Cannot sort by ancestor');
                }

                return this._rule({ name: 'sort', args: { options: settings } });
            },
            validate: function (value, { error, state, prefs, schema }, { options }) {

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
            convert: true
        },

        sparse: {
            method: function (enabled) {

                const value = enabled === undefined ? true : !!enabled;

                if (this._flags.sparse === value) {
                    return this;
                }

                const obj = value ? this.clone() : this._rule('items');
                return obj._flag('sparse', value, { clone: false });
            }
        },

        unique: {
            method: function (comparator, options = {}) {

                Hoek.assert(!comparator || typeof comparator === 'function' || typeof comparator === 'string', 'comparator must be a function or a string');
                Common.assertOptions(options, ['ignoreUndefined', 'separator']);

                const rule = { name: 'unique', args: { options, comparator } };

                if (comparator) {
                    if (typeof comparator === 'string') {
                        const separator = Common.default(options.separator, '.');
                        rule.path = separator ? comparator.split(separator) : [comparator];
                    }
                    else {
                        rule.comparator = comparator;
                    }
                }

                return this._rule(rule);
            },
            validate: function (value, { state, error, schema }, { comparator: raw, options }, { comparator, path }) {

                const found = {
                    string: Object.create(null),
                    number: Object.create(null),
                    undefined: Object.create(null),
                    boolean: Object.create(null),
                    object: new Map(),
                    function: new Map(),
                    custom: new Map()
                };

                const compare = comparator || Hoek.deepEqual;
                const ignoreUndefined = options.ignoreUndefined;

                for (let i = 0; i < value.length; ++i) {
                    const item = path ? Hoek.reach(value[i], path) : value[i];
                    const records = comparator ? found.custom : found[typeof item];
                    Hoek.assert(records, 'Failed to find unique map container for type', typeof item);

                    if (records instanceof Map) {
                        const entries = records.entries();
                        let current;
                        while (!(current = entries.next()).done) {
                            if (compare(current.value[0], item)) {
                                const localState = state.localize([...state.path, i], [value, ...state.ancestors], schema);
                                const context = {
                                    pos: i,
                                    value: value[i],
                                    dupePos: current.value[1],
                                    dupeValue: value[current.value[1]]
                                };

                                if (path) {
                                    context.path = raw;
                                }

                                return error('array.unique', context, localState);
                            }
                        }

                        records.set(item, i);
                    }
                    else {
                        if ((!ignoreUndefined || item !== undefined) &&
                            records[item] !== undefined) {

                            const context = {
                                pos: i,
                                value: value[i],
                                dupePos: records[item],
                                dupeValue: value[records[item]]
                            };

                            if (path) {
                                context.path = raw;
                            }

                            const localState = state.localize([...state.path, i], [value, ...state.ancestors], schema);
                            return error('array.unique', context, localState);
                        }

                        records[item] = i;
                    }
                }

                return value;
            },
            args: ['comparator', 'options'],
            multi: true
        }
    },

    // Cast

    cast: {
        from: Array.isArray,
        to: {
            set: function (value, options) {

                return new Set(value);
            }
        }
    },

    // Build

    build: function (desc) {

        let obj = this;                                     // eslint-disable-line consistent-this

        if (desc.items) {
            obj = obj.items(...desc.items);
        }

        if (desc.ordered) {
            obj = obj.ordered(...desc.ordered);
        }

        return obj;
    },

    // Modify

    modify: function (id, schema) {

        for (const set of ['items', 'ordered']) {
            for (let i = 0; i < this._inners[set].length; ++i) {
                const existing = this._inners[set][i];
                if (id === existing._flags.id) {
                    const obj = this.clone();
                    obj._inners[set][i] = schema;
                    obj._rebuild();
                    return obj;
                }
            }
        }

        const hases = this._getRules('has');
        for (const has of hases) {

            if (id === has.args.schema._flags.id) {
                const obj = this.clone();
                has.args.schema = schema;
                obj._rebuild();
                return obj;
            }
        }
    },

    rebuild: function () {

        this._resetRegistrations();

        this._inners._inclusions = [];
        this._inners._exclusions = [];
        this._inners._requireds = [];

        for (const type of this._inners.items) {
            internals.validateSingle(type, this);

            this._register(type);

            if (type._flags.presence === 'required') {
                this._inners._requireds.push(type);
            }
            else if (type._flags.presence === 'forbidden') {
                this._inners._exclusions.push(type.optional());
            }
            else {
                this._inners._inclusions.push(type);
            }
        }

        for (const type of this._inners.ordered) {
            internals.validateSingle(type, this);
            this._register(type);
        }

        const hases = this._getRules('has');
        for (const has of hases) {
            this._register(has.args.schema);
        }

        return this;
    }
});


// Helpers

internals.fillMissedErrors = function (schema, errors, requireds, value, state, prefs) {

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
            errors.push(schema.createError('array.includesRequiredBoth', value, { knownMisses, unknownMisses }, state, prefs));
        }
        else {
            errors.push(schema.createError('array.includesRequiredKnowns', value, { knownMisses }, state, prefs));
        }
    }
    else {
        errors.push(schema.createError('array.includesRequiredUnknowns', value, { unknownMisses }, state, prefs));
    }
};


internals.fillOrderedErrors = function (schema, errors, ordereds, value, state, prefs) {

    const requiredOrdereds = [];

    for (const ordered of ordereds) {
        if (ordered._flags.presence === 'required') {
            requiredOrdereds.push(ordered);
        }
    }

    if (requiredOrdereds.length) {
        internals.fillMissedErrors(schema, errors, requiredOrdereds, value, state, prefs);
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
