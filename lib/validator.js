'use strict';

const Hoek = require('@hapi/hoek');

const Errors = require('./errors');
const Ref = require('./ref');
const Settings = require('./settings');
const State = require('./types/state');


const internals = {};


exports.validate = function (value, schema, state, options, reference) {

    const originalValue = value;

    // Setup state and settings

    state = state || new State('', [], reference !== undefined ? [reference] : []);
    options = internals.options(schema, options);

    let errors = [];

    // Type coercion

    if (schema._coerce &&
        options.convert) {

        const coerced = schema._coerce(value, state, options);
        if (coerced.errors) {
            return internals.finalize(coerced.value, schema, originalValue, errors.concat(coerced.errors), state, options);                            // Coerced error always aborts early
        }

        value = coerced.value;
    }

    // Empty value

    if (schema._flags.empty &&
        !schema._flags.empty._validate(internals.prepareEmptyValue(value, schema), null, Settings.defaults).errors) {

        value = undefined;
    }

    // Presence requirements (required, optional, forbidden)

    const presence = schema._flags.presence || options.presence;
    if (presence === 'optional') {
        if (value === undefined) {
            if (schema._flags.default === Settings.symbols.deepDefault &&
                schema._type === 'object') {

                value = {};
            }
            else {
                return internals.finalize(value, schema, originalValue, errors, state, options);
            }
        }
    }
    else if (presence === 'required' &&
        value === undefined) {

        errors.push(schema.createError('any.required', null, state, options));
        return internals.finalize(value, schema, originalValue, errors, state, options);
    }
    else if (presence === 'forbidden') {
        if (value === undefined) {
            return internals.finalize(value, schema, originalValue, errors, state, options);
        }

        errors.push(schema.createError('any.unknown', null, state, options));
        return internals.finalize(value, schema, originalValue, errors, state, options);
    }

    // Allowed and denied values

    const match = schema._valids.get(value, state, options, schema._flags.insensitive);
    if (match) {
        if (options.convert) {
            value = match.value;
        }

        return internals.finalize(value, schema, originalValue, errors, state, options);
    }

    if (schema._invalids.has(value, state, options, schema._flags.insensitive)) {
        errors.push(schema.createError(value === '' ? 'any.empty' : 'any.invalid', { value, invalids: schema._invalids.values({ stripUndefined: true }) }, state, options));
        if (options.abortEarly) {

            return internals.finalize(value, schema, originalValue, errors, state, options);
        }
    }

    if (schema._flags.allowOnly) {
        errors.push(schema.createError('any.allowOnly', { value, valids: schema._valids.values({ stripUndefined: true }) }, state, options));
        if (options.abortEarly) {
            return internals.finalize(value, schema, originalValue, errors, state, options);
        }
    }

    // Base type

    if (schema._base) {
        const base = schema._base(value, state, options);
        value = base.value;

        if (base.errors) {
            errors = errors.concat(base.errors);
            return internals.finalize(value, schema, originalValue, errors, state, options);                            // Base error always aborts early
        }
    }

    // Validate tests

    const helpers = {
        options,
        schema,
        state,
        error: (code, context, localState) => schema.createError(code, context, localState || state, options)
    };

    for (const { func, rule } of schema._tests) {
        let ret;
        if (func) {
            ret = func.call(schema, value, state, options);
        }
        else {

            // Skip rules that are also applied in coerce step

            if (rule.convert &&
                options.convert) {

                continue;
            }

            // Resolve references

            let args = rule.args;
            if (rule.resolve.length) {
                args = Object.assign({}, args);                                     // Shallow copy
                for (const key of rule.resolve) {
                    const resolver = rule.refs[key];

                    const resolved = args[key].resolve(value, state, options);
                    const normalized = resolver.normalize ? resolver.normalize(resolved) : resolved;

                    if (!resolver.assert(normalized)) {
                        ret = schema.createError(resolver.code, { ref: args[key], value: resolved }, state, options);
                        break;
                    }

                    args[key] = normalized;
                }
            }

            // Test rule (if reference didn't error)

            ret = ret || schema._rules[rule.rule](value, helpers, args, rule);      // Use ret if already set to error
        }

        if (ret instanceof Errors.Report ||
            Array.isArray(ret) && ret[0] instanceof Errors.Report) {

            if (Array.isArray(ret)) {
                errors.push(...ret);
            }
            else {
                errors.push(ret);
            }

            if (options.abortEarly) {
                return internals.finalize(value, schema, originalValue, errors, state, options);
            }
        }
        else {
            value = ret;
        }
    }

    return internals.finalize(value, schema, originalValue, errors, state, options);
};


internals.options = function (schema, options) {

    if (schema._settings) {
        const isDefaultOptions = options === Settings.defaults;
        if (isDefaultOptions &&
            schema._settings[Settings.symbols.settingsCache]) {

            return schema._settings[Settings.symbols.settingsCache];
        }

        options = Settings.concat(schema._language ? Settings.concat({ language: schema._language }, options) : options, schema._settings);
        if (isDefaultOptions) {
            schema._settings[Settings.symbols.settingsCache] = options;
        }

        return options;
    }

    if (schema._language) {
        return Settings.concat({ language: schema._language }, options);
    }

    return options;
};


exports.validateWithOptions = function (value, schema, options, callback) {

    if (options) {
        schema.checkOptions(options);
    }

    const settings = Settings.concat(Settings.defaults, options);
    const result = exports.validate(value, schema, null, settings);
    const errors = Errors.process(result.errors, value);

    if (callback) {
        return callback(errors, result.value);
    }

    return {
        error: errors,
        value: result.value,
        then(resolve, reject) {

            if (errors) {
                return Promise.reject(errors).catch(reject);
            }

            return Promise.resolve(result.value).then(resolve);
        },
        catch(reject) {

            if (errors) {
                return Promise.reject(errors).catch(reject);
            }

            return Promise.resolve(result.value);
        }
    };
};


internals.finalize = function (value, schema, original, errors, state, options) {

    const failover = errors.length ? internals.default('failover', undefined, schema, errors, state, options) : undefined;
    if (failover !== undefined) {
        value = failover;
        errors = [];
    }

    const finalValue = value !== undefined ? (schema._flags.raw ? original : value)
        : internals.default('default', value, schema, errors, state, options);

    if (errors.length &&
        typeof schema._flags.error === 'function' &&
        (!schema._flags.selfError || errors.some((e) => state.path.length === e.path.length))) {

        const change = schema._flags.error.call(schema, errors);

        if (typeof change === 'string') {
            errors = [schema.createOverrideError('override', { reason: errors }, state, options, change)];
        }
        else {
            errors = [].concat(change)
                .map((err) => {

                    return err instanceof Error ?
                        err :
                        schema.createOverrideError(err.type || 'override', err.context, state, options, err.message, err.template);
                });
        }
    }

    return {
        value: schema._flags.strip ? undefined : finalValue,
        finalValue,
        errors: errors.length ? errors : null
    };
};


internals.default = function (flag, value, schema, errors, state, options) {

    if (options.noDefaults) {
        return value;
    }

    const source = schema._flags[flag];
    if (source === undefined) {
        return value;
    }

    if (Ref.isRef(source)) {
        return source.resolve(value, state, options);
    }

    if (typeof source === 'function' &&
        !(schema._flags.func && !source.description)) {

        const args = source.length > 0 ? [Hoek.clone(state.parent), options] : [];

        try {
            return source(...args);
        }
        catch (err) {
            errors.push(schema.createError(`any.${flag}`, { error: err }, state, options));
            return;
        }
    }

    if (source !== Settings.symbols.deepDefault) {
        return Hoek.clone(source);
    }

    return value;
};


internals.prepareEmptyValue = function (value, schema) {

    if (typeof value === 'string' &&
        schema._flags.trim) {

        return value.trim();
    }

    return value;
};
