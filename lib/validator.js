'use strict';

const Assert = require('@hapi/hoek/lib/assert');
const Clone = require('@hapi/hoek/lib/clone');
const Reach = require('@hapi/hoek/lib/reach');

const Common = require('./common');
const Errors = require('./errors');


const internals = {
    result: Symbol('result')
};


exports.entry = function (value, schema, prefs) {

    let settings = Common.defaults;
    if (prefs) {
        Assert(prefs.warnings === undefined, 'Cannot override warnings preference in synchronous validation');
        settings = Common.preferences(Common.defaults, prefs);
    }

    const result = internals.entry(value, schema, settings);
    Assert(!result.mainstay.externals.length, 'Schema with external rules must use validateAsync()');
    const outcome = { value: result.value };

    if (result.error) {
        outcome.error = result.error;
    }

    if (result.mainstay.warnings.length) {
        outcome.warning = Errors.details(result.mainstay.warnings);
    }

    return outcome;
};


exports.entryAsync = async function (value, schema, prefs) {

    let settings = Common.defaults;
    if (prefs) {
        settings = Common.preferences(Common.defaults, prefs);
    }

    const result = internals.entry(value, schema, settings);
    if (result.error) {
        throw result.error;
    }

    const mainstay = result.mainstay;
    if (mainstay.externals.length) {
        let root = result.value;
        for (const { method, path, label } of mainstay.externals) {
            let node = root;
            let key;
            let parent;

            if (path.length) {
                key = path[path.length - 1];
                parent = Reach(root, path.slice(0, -1));
                node = parent[key];
            }

            try {
                const output = await method(node);
                if (output === undefined ||
                    output === node) {

                    continue;
                }

                if (parent) {
                    parent[key] = output;
                }
                else {
                    root = output;
                }
            }
            catch (err) {
                err.message += ` (${label})`;       // Change message to include path
                throw err;
            }
        }

        result.value = root;
    }

    if (!settings.warnings) {
        return result.value;
    }

    const outcome = { value: result.value };
    if (mainstay.warnings.length) {
        outcome.warning = Errors.details(mainstay.warnings);
    }

    return outcome;
};


internals.entry = function (value, schema, prefs) {

    const mainstay = { externals: [], warnings: [] };
    const state = new Common.State([], [], { mainstay, schemas: schema._ids._schemaChain && [schema] });
    const result = exports.validate(value, schema, state, prefs);
    const error = Errors.process(result.errors, value, prefs);

    return { value: result.value, error, mainstay };
};


exports.validate = function (value, schema, state, prefs) {

    // Setup state and settings

    if (schema._preferences) {
        prefs = internals.prefs(schema, prefs);
    }

    const original = value;

    // Cache

    if (schema._cache &&
        prefs.cache) {

        const result = schema._cache.get(original);
        if (result) {
            return result;
        }
    }

    // Helpers

    const helpers = {
        prefs,
        schema,
        state,
        error: (code, local, localState) => schema.$_createError(code, value, local, localState || state, prefs)
    };

    // Type coercion

    const def = schema._definition;
    if (def.coerce &&
        value !== undefined &&
        prefs.convert &&
        (!def.coerce.from || def.coerce.from.includes(typeof value))) {

        const coerced = def.coerce.method(schema, value, helpers);
        if (coerced) {
            if (coerced.errors) {
                return internals.finalize(coerced.value, original, [].concat(coerced.errors), helpers);     // Coerced error always aborts early
            }

            value = coerced.value;
        }
    }

    // Empty value

    if (schema._flags.empty &&
        schema._flags.empty.$_match(internals.trim(value, schema), state.entry(schema._flags.empty), Common.defaults)) {

        value = undefined;
    }

    // Presence requirements (required, optional, forbidden)

    const presence = schema._flags.presence || (schema._flags._endedSwitch ? 'ignore' : prefs.presence);
    if (value === undefined) {
        if (presence === 'forbidden') {
            return internals.finalize(value, original, null, helpers);
        }

        if (presence === 'required') {
            return internals.finalize(value, original, [schema.$_createError('any.required', value, null, state, prefs)], helpers);
        }

        if (presence === 'optional') {
            if (schema._flags.default !== Common.symbols.deepDefault) {
                return internals.finalize(value, original, null, helpers);
            }

            value = {};
        }
    }
    else if (presence === 'forbidden') {
        return internals.finalize(value, original, [schema.$_createError('any.unknown', value, null, state, prefs)], helpers);
    }

    // Allowed values

    const errors = [];

    if (schema._valids) {
        const match = schema._valids.get(value, state, prefs, schema._flags.insensitive);
        if (match) {
            if (prefs.convert) {
                value = match.value;
            }

            return internals.finalize(value, original, null, helpers);
        }

        if (schema._flags.only) {
            const report = schema.$_createError('any.only', value, { valids: schema._valids.values({ stripUndefined: true }) }, state, prefs);
            if (prefs.abortEarly) {
                return internals.finalize(value, original, [report], helpers);
            }

            errors.push(report);
        }
    }

    // Denied values

    if (schema._invalids) {
        if (schema._invalids.has(value, state, prefs, schema._flags.insensitive)) {
            const report = schema.$_createError('any.invalid', value, { invalids: schema._invalids.values({ stripUndefined: true }) }, state, prefs);
            if (prefs.abortEarly) {
                return internals.finalize(value, original, [report], helpers);
            }

            errors.push(report);
        }
    }

    // Base type

    if (def.validate) {
        const base = def.validate(schema, value, helpers);
        if (base) {
            value = base.value;

            if (base.errors) {
                if (!Array.isArray(base.errors)) {
                    errors.push(base.errors);
                    return internals.finalize(value, original, errors, helpers);        // Base error always aborts early
                }

                if (base.errors.length) {
                    errors.push(...base.errors);
                    return internals.finalize(value, original, errors, helpers);        // Base error always aborts early
                }
            }
        }
    }

    // Validate tests

    if (!schema._rules.length) {
        return internals.finalize(value, original, errors, helpers);
    }

    return internals.rules(value, errors, original, helpers);
};


internals.rules = function (value, errors, original, helpers) {

    const { schema, state, prefs } = helpers;

    for (const rule of schema._rules) {
        const definition = schema._definition.rules[rule.method];

        // Skip rules that are also applied in coerce step

        if (definition.convert &&
            prefs.convert) {

            continue;
        }

        // Resolve references

        let ret;
        let args = rule.args;
        if (rule.resolve.length) {
            args = Object.assign({}, args);                                     // Shallow copy
            for (const key of rule.resolve) {
                const resolver = definition.argsByName.get(key);

                const resolved = args[key].resolve(value, state, prefs);
                const normalized = resolver.normalize ? resolver.normalize(resolved) : resolved;

                const invalid = Common.validateArg(normalized, null, resolver);
                if (invalid) {
                    ret = schema.$_createError('any.ref', resolved, { arg: key, ref: args[key], reason: invalid }, state, prefs);
                    break;
                }

                args[key] = normalized;
            }
        }

        // Test rule

        ret = ret || definition.validate(value, helpers, args, rule.options);     // Use ret if already set to reference error

        const result = internals.rule(ret, rule);
        if (result.errors) {
            if (rule.warn) {
                state.mainstay.warnings.push(...result.errors);
                continue;
            }

            if (prefs.abortEarly) {
                return internals.finalize(value, original, result.errors, helpers);
            }

            errors.push(...result.errors);
        }
        else {
            value = result.value;
        }
    }

    return internals.finalize(value, original, errors, helpers);
};


internals.rule = function (ret, rule) {

    if (ret instanceof Errors.Report) {
        internals.error(ret, rule);
        return { errors: [ret] };
    }

    if (Array.isArray(ret) &&
        ret[0] instanceof Errors.Report) {

        ret.forEach((report) => internals.error(report, rule));
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


internals.finalize = function (value, original, errors, helpers) {

    errors = errors || [];
    const { schema, state, prefs } = helpers;

    // Failover value

    if (errors.length) {
        const failover = internals.default('failover', undefined, errors, helpers);
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
        value = internals.default('default', value, errors, helpers);
    }

    // Cast

    if (schema._flags.cast &&
        value !== undefined) {

        const caster = schema._definition.cast[schema._flags.cast];
        if (caster.from(value)) {
            value = caster.to(value, helpers);
        }
    }

    // Externals

    if (schema.$_terms.externals &&
        prefs.externals &&
        prefs._externals !== false) {                       // Disabled for matching

        for (const method of schema.$_terms.externals) {
            state.mainstay.externals.push({ method, path: state.path, label: Errors.label(schema._flags, state, prefs) });
        }
    }

    // Result

    const result = { value, errors: errors.length ? errors : null };

    if (schema._flags.result) {
        result.value = schema._flags.result === 'strip' ? undefined : /* raw */ original;
        state.mainstay.shadow = state.mainstay.shadow || new internals.Shadow();
        state.mainstay.shadow.set(state.path, value);
    }

    // Cache

    if (schema._cache &&
        prefs.cache !== false &&
        !schema._refs.length) {

        schema._cache.set(original, result);
    }

    return result;
};


internals.prefs = function (schema, prefs) {

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
};


internals.default = function (flag, value, errors, { schema, state, prefs }) {

    const source = schema._flags[flag];
    if (prefs.noDefaults ||
        source === undefined) {

        return value;
    }

    if (!source) {
        return source;
    }

    if (typeof source === 'function') {
        const args = source.length > 0 ? [Clone(state.ancestors[0]), prefs] : [];

        try {
            return source(...args);
        }
        catch (err) {
            errors.push(schema.$_createError(`any.${flag}`, null, { error: err }, state, prefs));
            return;
        }
    }

    if (typeof source !== 'object') {
        return source;
    }

    if (source[Common.symbols.literal]) {
        return source.literal;
    }

    if (Common.isResolvable(source)) {
        return source.resolve(value, state, prefs);
    }

    return Clone(source);
};


internals.trim = function (value, schema) {

    if (typeof value !== 'string') {
        return value;
    }

    const trim = schema.$_getRule('trim');
    if (!trim ||
        !trim.args.enabled) {

        return value;
    }

    return value.trim();
};


internals.Shadow = class {

    constructor() {

        this._value = null;
    }

    set(path, value) {

        if (!path.length) {         // No need to store root value
            return;
        }

        this._value = this._value || new Map();

        let node = this._value;
        for (let i = 0; i < path.length - 1; ++i) {
            const segment = path[i];
            let next = node.get(segment);
            if (!next) {
                next = new Map();
                node.set(segment, next);
            }

            node = next;
        }

        node.set(path[path.length - 1], value);
    }

    get(path) {

        return Reach(this._value, path, { iterables: true });
    }
};
