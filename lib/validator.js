'use strict';

const Hoek = require('@hapi/hoek');

const Common = require('./common');
const Errors = require('./errors');


const internals = {
    result: Symbol('result')
};


exports.entry = function (value, schema, prefs) {

    if (prefs) {
        Common.checkPreferences(prefs);
    }

    const mainstay = { externals: [], warnings: [] };
    const settings = Common.preferences(Common.defaults, prefs);
    const state = schema._stateEntry({ mainstay });
    const result = exports.validate(value, schema, state, settings);
    const error = Errors.process(result.errors, value);

    Hoek.assert(!mainstay.externals.length || settings.externals, 'Cannot validate a schema with external rules without the externals flag');

    this.value = value;
    this.error = error;

    const outcome = { value: result.value, error };
    if (mainstay.warnings.length) {
        outcome.warning = Errors.details(mainstay.warnings);
    }

    if (error ||
        !mainstay.externals.length) {

        return new internals.Promise(outcome, settings);
    }

    return internals.externals(mainstay.externals, outcome, settings);
};


internals.externals = function (externals, outcome, prefs) {

    return new Promise(async (resolve, reject) => {

        let root = outcome.value;

        for (const { external, path, label } of externals) {
            let value = root;
            let key;
            let parent;

            if (path.length) {
                key = path[path.length - 1];
                parent = Hoek.reach(root, path.slice(0, -1));
                value = parent[key];
            }

            try {
                var result = await external.method(value);
            }
            catch (err) {
                err.message += ` (${label})`;
                return reject(err);     // Change message to include path
            }

            if (result === undefined ||
                result === value) {

                continue;
            }

            if (parent) {
                parent[key] = result;
            }
            else {
                root = result;
            }
        }

        resolve(prefs.warnings ? Object.assign(outcome, { value: root }) : root);
    });
};


exports.validate = function (value, schema, state, prefs) {

    // Setup state and settings

    state = schema._state(state.path, state.ancestors, state);
    prefs = internals.prefs(schema, prefs);

    const original = value;

    // Cache

    if (schema._cache &&
        prefs.cache) {

        const result = schema._cache.get(original);
        if (result) {
            return result;
        }
    }

    // Type coercion

    if (schema._coerce &&
        prefs.convert &&
        (!schema._coerce.type || typeof value === schema._coerce.type)) {

        const coerced = schema._coerce(value, state, prefs);
        if (coerced) {
            if (coerced.errors) {
                return internals.finalize(coerced.value, schema, original, [].concat(coerced.errors), state, prefs);                            // Coerced error always aborts early
            }

            value = coerced.value;
        }
    }

    // Empty value

    if (schema._flags.empty) {
        const entryState = schema._flags.empty._stateEntry(state);
        if (schema._flags.empty._match(internals.trim(value, schema), entryState, Common.defaults)) {
            value = undefined;
        }
    }

    // Presence requirements (required, optional, forbidden)

    const presence = schema._flags.presence || prefs.presence;
    if (value === undefined) {
        if (presence === 'forbidden') {
            return internals.finalize(value, schema, original, null, state, prefs);
        }

        if (presence === 'required') {
            return internals.finalize(value, schema, original, [schema.createError('any.required', value, null, state, prefs)], state, prefs);
        }

        if (presence === 'optional') {
            if (schema._type !== 'object' ||
                schema._flags.default !== Common.symbols.deepDefault) {

                return internals.finalize(value, schema, original, null, state, prefs);
            }

            value = {};
        }
    }
    else if (presence === 'forbidden') {
        return internals.finalize(value, schema, original, [schema.createError('any.unknown', value, null, state, prefs)], state, prefs);
    }

    // Allowed values

    const errors = [];

    if (schema._valids) {
        const match = schema._valids.get(value, state, prefs, schema._flags.insensitive);
        if (match) {
            if (prefs.convert) {
                value = match.value;
            }

            return internals.finalize(value, schema, original, null, state, prefs);
        }

        if (schema._flags.allowOnly) {
            const report = schema.createError('any.allowOnly', value, { valids: schema._valids.values({ stripUndefined: true }) }, state, prefs);
            if (prefs.abortEarly) {
                return internals.finalize(value, schema, original, [report], state, prefs);
            }

            errors.push(report);
        }
    }

    // Denied values

    if (schema._invalids) {
        if (schema._invalids.has(value, state, prefs, schema._flags.insensitive)) {
            const report = schema.createError(value === '' ? 'any.empty' : 'any.invalid', value, { invalids: schema._invalids.values({ stripUndefined: true }) }, state, prefs);
            if (prefs.abortEarly) {
                return internals.finalize(value, schema, original, [report], state, prefs);
            }

            errors.push(report);
        }
    }

    // Base type

    if (schema._base) {
        const base = schema._base(value, state, prefs);
        if (base) {
            value = base.value;

            if (base.errors) {
                if (!Array.isArray(base.errors)) {
                    errors.push(base.errors);
                    return internals.finalize(value, schema, original, errors, state, prefs);        // Base error always aborts early
                }

                if (base.errors.length) {
                    errors.push(...base.errors);
                    return internals.finalize(value, schema, original, errors, state, prefs);        // Base error always aborts early
                }
            }
        }
    }

    // Validate tests

    if (!schema._tests.length) {
        return internals.finalize(value, schema, original, errors, state, prefs);
    }

    const helpers = {
        prefs,
        schema,
        state,
        error: (code, local, localState) => schema.createError(code, value, local, localState || state, prefs)
    };

    for (const test of schema._tests) {
        const { func, rule } = test;
        let ret;
        if (func) {
            ret = func.call(schema, value, state, prefs);
        }
        else {

            // Skip rules that are also applied in coerce step

            if (rule.convert &&
                prefs.convert) {

                continue;
            }

            // Resolve references

            let args = rule.args;
            if (rule.resolve.length) {
                args = Object.assign({}, args);                                     // Shallow copy
                for (const key of rule.resolve) {
                    const resolver = rule.refs[key];

                    const resolved = args[key].resolve(value, state, prefs);
                    const normalized = resolver.normalize ? resolver.normalize(resolved) : resolved;

                    if (!resolver.assert(normalized)) {
                        ret = schema.createError(resolver.code, resolved, { ref: args[key] }, state, prefs);
                        break;
                    }

                    args[key] = normalized;
                }
            }

            // Test rule (if reference didn't error)

            ret = ret || schema._rules[rule.rule](value, helpers, args, rule);      // Use ret if already set to error
        }

        const result = internals.rule(ret, test);
        if (result.errors) {
            if (test.warn) {
                state.mainstay.warnings.push(...result.errors);
                continue;
            }

            if (prefs.abortEarly) {
                return internals.finalize(value, schema, original, result.errors, state, prefs);
            }

            errors.push(...result.errors);
        }
        else {
            value = result.value;
        }
    }

    return internals.finalize(value, schema, original, errors, state, prefs);
};


internals.rule = function (ret, test) {

    if (ret instanceof Errors.Report) {
        internals.error(ret, test);
        return { errors: [ret] };
    }

    if (Array.isArray(ret) &&
        ret[0] instanceof Errors.Report) {

        ret.forEach((report) => internals.error(report, test));
        return { errors: ret };
    }

    return { value: ret };
};


internals.error = function (report, { message }) {

    if (message) {
        report._setTemplate(message);
    }

    return report;
};


internals.finalize = function (value, schema, original, errors, state, prefs) {

    errors = errors || [];

    // Failover value

    if (errors.length) {
        const failover = internals.default('failover', undefined, schema, errors, state, prefs);
        if (failover !== undefined) {
            value = failover;
            errors = [];
        }
    }

    // Error override

    if (errors.length &&
        schema._flags.error) {

        if (typeof schema._flags.error === 'function') {
            errors = schema._flags.error(errors);
            if (!Array.isArray(errors)) {
                errors = [errors];
            }
        }
        else {
            errors = [schema._flags.error];
        }
    }

    // Default

    if (value === undefined) {
        value = internals.default('default', value, schema, errors, state, prefs);
    }

    // Cast

    if (schema._flags.cast &&
        value !== undefined &&
        (!schema._casts[Common.symbols.castFrom] || schema._casts[Common.symbols.castFrom](value))) {

        value = schema._casts[schema._flags.cast](value, { original, schema, state, prefs });
    }

    // Externals

    if (schema._inners.externals &&
        prefs.externals !== false &&                        // Defaults to semi-true (collect but not execute)
        prefs._externals !== false) {                       // Disabled for matching

        for (const external of schema._inners.externals) {
            state.mainstay.externals.push({ external, path: state.path, label: Errors.label(state, prefs) });
        }
    }

    // Result

    const result = {
        errors: errors.length ? errors : null,
        outcome: value,
        value: schema._flags.strip ? undefined : value
    };

    // Cache

    if (schema._cache &&
        prefs.cache !== false &&
        !schema._refs.length) {

        schema._cache.set(original, result);
    }

    return result;
};


internals.prefs = function (schema, prefs) {

    if (schema._preferences) {
        const isDefaultOptions = prefs === Common.defaults;
        if (isDefaultOptions &&
            schema._preferences[Common.symbols.prefs]) {

            return schema._preferences[Common.symbols.prefs];
        }

        prefs = Common.preferences(prefs, schema._preferences);
        if (isDefaultOptions) {
            schema._preferences[Common.symbols.prefs] = prefs;
        }

        return prefs;
    }

    return prefs;
};


internals.default = function (flag, value, schema, errors, state, prefs) {

    if (prefs.noDefaults) {
        return value;
    }

    const source = schema._flags[flag];
    if (source === undefined) {
        return value;
    }

    if (Common.isResolvable(source)) {
        return source.resolve(value, state, prefs);
    }

    if (typeof source === 'function' &&
        !(schema._flags.func && !source.description)) {

        const args = source.length > 0 ? [Hoek.clone(state.ancestors[0]), prefs] : [];

        try {
            return source(...args);
        }
        catch (err) {
            errors.push(schema.createError(`any.${flag}`, null, { error: err }, state, prefs));
            return;
        }
    }

    if (source !== Common.symbols.deepDefault) {
        return Hoek.clone(source);
    }

    return value;
};


internals.trim = function (value, schema) {

    if (typeof value !== 'string') {
        return value;
    }

    const trim = schema._uniqueRules.get('trim');
    if (trim &&
        trim.args.enabled) {

        value = value.trim();
    }

    return value;
};


internals.Promise = class {

    constructor(result, prefs) {

        Object.assign(this, result);
        this[internals.result] = prefs.warnings ? result : result.value;
    }

    then(resolve, reject) {

        if (this.error) {
            return Promise.reject(this.error).catch(reject);
        }

        return Promise.resolve(this[internals.result]).then(resolve);
    }

    catch(reject) {

        if (this.error) {
            return Promise.reject(this.error).catch(reject);
        }

        return Promise.resolve(this[internals.result]);
    }
};
