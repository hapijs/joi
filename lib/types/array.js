'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Cast = require('../cast');
const State = require('./state');
const Utils = require('../utils');


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

    _base(value, state, options) {

        const result = {
            value
        };

        if (typeof value === 'string' &&
            options.convert) {

            if (value.length > 1 &&
                (value[0] === '[' || /^\s*\[/.test(value))) {

                try {
                    result.value = JSON.parse(value);
                }
                catch (ignoreErr) { }
            }
        }

        let isArray = Array.isArray(result.value);
        const wasArray = isArray;
        if (!isArray &&
            options.convert &&
            this._flags.single) {

            result.value = [result.value];
            isArray = true;
        }

        if (!isArray) {
            result.errors = this.createError('array.base', null, state, options);
            return result;
        }

        if (this._inner.inclusions.length ||
            this._inner.exclusions.length ||
            this._inner.requireds.length ||
            this._inner.ordereds.length ||
            !this._flags.sparse) {

            // Clone the array so that we don't modify the original

            if (wasArray) {
                result.value = result.value.slice(0);
            }

            result.errors = this._checkItems(result.value, wasArray, state, options);

            if (result.errors &&
                wasArray &&
                options.convert &&
                this._flags.single) {

                // Attempt a 2nd pass by putting the array inside one

                const previousErrors = result.errors;

                result.value = [result.value];
                result.errors = this._checkItems(result.value, wasArray, state, options);

                if (result.errors) {

                    // Restore previous errors and value since this didn't validate either

                    result.errors = previousErrors;
                    result.value = result.value[0];
                }
            }
        }

        return result;
    }

    _checkItems(items, wasArray, state, options) {

        const errors = [];
        let errored;

        const requireds = this._inner.requireds.slice();
        const ordereds = this._inner.ordereds.slice();
        const inclusions = [...this._inner.inclusions, ...requireds];

        let il = items.length;
        for (let i = 0; i < il; ++i) {
            errored = false;
            const item = items[i];
            let isValid = false;
            const key = wasArray ? i : state.key;
            const path = wasArray ? [...state.path, i] : state.path;
            const localState = new State(key, path, [items, ...state.ancestors]);
            let res;

            // Sparse

            if (!this._flags.sparse &&
                item === undefined) {

                errors.push(this.createError('array.sparse', null, { key: state.key, path, pos: i }, options));

                if (options.abortEarly) {
                    return errors;
                }

                ordereds.shift();

                continue;
            }

            // Exclusions

            for (const exclusion of this._inner.exclusions) {
                res = exclusion._validate(item, localState, {});                // Not passing options to use defaults

                if (!res.errors) {
                    errors.push(this.createError(wasArray ? 'array.excludes' : 'array.excludesSingle', { pos: i, value: item }, { key: state.key, path: localState.path }, options));
                    errored = true;

                    if (options.abortEarly) {
                        return errors;
                    }

                    ordereds.shift();

                    break;
                }
            }

            if (errored) {
                continue;
            }

            // Ordered

            if (this._inner.ordereds.length) {
                if (ordereds.length > 0) {
                    const ordered = ordereds.shift();
                    res = ordered._validate(item, localState, options);
                    if (!res.errors) {
                        if (ordered._flags.strip) {
                            internals.fastSplice(items, i);
                            --i;
                            --il;
                        }
                        else if (!this._flags.sparse && res.value === undefined) {
                            errors.push(this.createError('array.sparse', null, { key: state.key, path, pos: i }, options));

                            if (options.abortEarly) {
                                return errors;
                            }

                            continue;
                        }
                        else {
                            items[i] = res.value;
                        }
                    }
                    else {
                        errors.push(this.createError('array.ordered', { pos: i, reason: res.errors, value: item }, { key: state.key, path: localState.path }, options));
                        if (options.abortEarly) {
                            return errors;
                        }
                    }

                    continue;
                }
                else if (!this._inner.items.length) {
                    errors.push(this.createError('array.orderedLength', { pos: i, limit: this._inner.ordereds.length }, { key: state.key, path: localState.path }, options));
                    if (options.abortEarly) {
                        return errors;
                    }

                    continue;
                }
            }

            // Requireds

            const requiredChecks = [];
            let jl = requireds.length;
            for (let j = 0; j < jl; ++j) {
                res = requiredChecks[j] = requireds[j]._validate(item, localState, options);
                if (!res.errors) {
                    items[i] = res.value;
                    isValid = true;
                    internals.fastSplice(requireds, j);
                    --j;
                    --jl;

                    if (!this._flags.sparse && res.value === undefined) {
                        errors.push(this.createError('array.sparse', null, { key: state.key, path, pos: i }, options));

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

                const previousCheck = requireds.indexOf(inclusion);
                if (previousCheck !== -1) {
                    res = requiredChecks[previousCheck];
                }
                else {
                    res = inclusion._validate(item, localState, options);

                    if (!res.errors) {
                        if (inclusion._flags.strip) {
                            internals.fastSplice(items, i);
                            --i;
                            --il;
                        }
                        else if (!this._flags.sparse &&
                            res.value === undefined) {

                            errors.push(this.createError('array.sparse', null, { key: state.key, path, pos: i }, options));
                            errored = true;
                        }
                        else {
                            items[i] = res.value;
                        }

                        isValid = true;
                        break;
                    }
                }

                // Return the actual error if only one inclusion defined
                if (jl === 1) {
                    if (stripUnknown) {
                        internals.fastSplice(items, i);
                        --i;
                        --il;
                        isValid = true;
                        break;
                    }

                    errors.push(this.createError(wasArray ? 'array.includesOne' : 'array.includesOneSingle', { pos: i, reason: res.errors, value: item }, { key: state.key, path }, options));
                    errored = true;

                    if (options.abortEarly) {
                        return errors;
                    }

                    break;
                }
            }

            if (errored) {
                continue;
            }

            if (this._inner.inclusions.length && !isValid) {
                if (stripUnknown) {
                    internals.fastSplice(items, i);
                    --i;
                    --il;
                    continue;
                }

                errors.push(this.createError(wasArray ? 'array.includes' : 'array.includesSingle', { pos: i, value: item }, { key: state.key, path }, options));

                if (options.abortEarly) {
                    return errors;
                }
            }
        }

        if (requireds.length) {
            this._fillMissedErrors(errors, requireds, state, options);
        }

        if (ordereds.length) {
            this._fillOrderedErrors(errors, ordereds, state, options);
        }

        return errors.length ? errors : null;
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

        Utils.verifyFlat(schemas, 'items');

        const obj = this.clone();

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

        Utils.verifyFlat(schemas, 'ordered');

        const obj = this.clone();

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

        return this._rule(name, { rule: 'length', refs, args: { limit }, operator, override: true });
    }

    has(schema) {

        schema = Cast.schema(this._currentJoi, schema, { appendPath: true });
        const obj = this._rule('has', { args: { schema } });
        obj._refs.register(schema);
        return obj;
    }

    unique(comparator, configs) {

        Hoek.assert(comparator === undefined ||
            typeof comparator === 'function' ||
            typeof comparator === 'string', 'comparator must be a function or a string');

        Hoek.assert(configs === undefined || typeof configs === 'object', 'configs must be an object');

        const settings = {
            ignoreUndefined: configs && configs.ignoreUndefined || false
        };


        if (typeof comparator === 'string') {
            settings.path = comparator;
        }
        else if (typeof comparator === 'function') {
            settings.comparator = comparator;
        }

        return this._rule('unique', { args: { settings } });
    }

    sparse(enabled) {

        const value = enabled === undefined ? true : !!enabled;

        if (this._flags.sparse === value) {
            return this;
        }

        const obj = this.clone();
        obj._flags.sparse = value;
        return obj;
    }

    single(enabled) {

        const value = enabled === undefined ? true : !!enabled;

        if (this._flags.single === value) {
            return this;
        }

        const obj = this.clone();
        obj._flags.single = value;
        return obj;
    }

    _fillMissedErrors(errors, requireds, state, options) {

        const knownMisses = [];
        let unknownMisses = 0;
        for (let i = 0; i < requireds.length; ++i) {
            const label = requireds[i]._getLabel();
            if (label) {
                knownMisses.push(label);
            }
            else {
                ++unknownMisses;
            }
        }

        if (knownMisses.length) {
            if (unknownMisses) {
                errors.push(this.createError('array.includesRequiredBoth', { knownMisses, unknownMisses }, { key: state.key, path: state.path }, options));
            }
            else {
                errors.push(this.createError('array.includesRequiredKnowns', { knownMisses }, { key: state.key, path: state.path }, options));
            }
        }
        else {
            errors.push(this.createError('array.includesRequiredUnknowns', { unknownMisses }, { key: state.key, path: state.path }, options));
        }
    }

    _fillOrderedErrors(errors, ordereds, state, options) {

        const requiredOrdereds = [];

        for (let i = 0; i < ordereds.length; ++i) {
            const presence = Hoek.reach(ordereds[i], '_flags.presence');
            if (presence === 'required') {
                requiredOrdereds.push(ordereds[i]);
            }
        }

        if (requiredOrdereds.length) {
            this._fillMissedErrors(errors, requiredOrdereds, state, options);
        }
    }
};


internals.Array.prototype._rules = {

    has: function (value, { state, options, error }, { schema }) {

        const isValid = value.some((item, idx) => {

            const localState = new State(idx, [...state.path, idx], [value, ...state.ancestors]);
            return !schema._validate(item, localState, options).errors;
        });

        if (isValid) {
            return value;
        }

        const patternLabel = schema._getLabel();
        if (patternLabel) {
            return error('array.hasKnown', { patternLabel });
        }

        return error('array.hasUnknown', null);
    },

    length: function (value, helpers, { limit }, { alias, operator, args }) {

        if (Utils.compare(value.length, limit, operator)) {
            return value;
        }

        return helpers.error('array.' + alias, { limit: args.limit, value });
    },

    unique: function (value, { state, options, error }, { settings }) {

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
            const item = settings.path ? Hoek.reach(value[i], settings.path) : value[i];
            const records = settings.comparator ? found.custom : found[typeof item];

            // All available types are supported, so it's not possible to reach 100% coverage without ignoring this line.
            // I still want to keep the test for future js versions with new types (eg. Symbol).

            if (/* $lab:coverage:off$ */ records /* $lab:coverage:on$ */) {
                if (records instanceof Map) {
                    const entries = records.entries();
                    let current;
                    while (!(current = entries.next()).done) {
                        if (compare(current.value[0], item)) {
                            const localState = new State(state.key, [...state.path, i], [value, ...state.ancestors]);
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

                        const localState = new State(state.key, [...state.path, i], [value, ...state.ancestors]);

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


module.exports = new internals.Array();
