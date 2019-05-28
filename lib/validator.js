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

    state = state || new State('', [], null, reference);

    if (schema._settings) {
        const isDefaultOptions = options === Settings.defaults;
        if (isDefaultOptions && schema._settings[Settings.symbols.settingsCache]) {
            options = schema._settings[Settings.symbols.settingsCache];
        }
        else {
            options = Settings.concat(schema._language ? Settings.concat({ language: schema._language }, options) : options, schema._settings);
            if (isDefaultOptions) {
                schema._settings[Settings.symbols.settingsCache] = options;
            }
        }
    }
    else if (schema._language) {
        options = Settings.concat({ language: schema._language }, options);
    }

    let errors = [];

    if (schema._coerce) {
        const coerced = schema._coerce(value, state, options);
        if (coerced.errors) {
            value = coerced.value;
            errors = errors.concat(coerced.errors);
            return internals.finalizeValue(value, schema, originalValue, errors, state, options);                            // Coerced error always aborts early
        }

        value = coerced.value;
    }

    if (schema._flags.empty &&
        !schema._flags.empty._validate(internals.prepareEmptyValue(value, schema), null, Settings.defaults).errors) {

        value = undefined;
    }

    // Check presence requirements

    const presence = schema._flags.presence || options.presence;
    if (presence === 'optional') {
        if (value === undefined) {
            const isDeepDefault = schema._flags.hasOwnProperty('default') && schema._flags.default === undefined;
            if (isDeepDefault &&
                schema._type === 'object') {

                value = {};
            }
            else {
                return internals.finalizeValue(value, schema, originalValue, errors, state, options);
            }
        }
    }
    else if (presence === 'required' &&
        value === undefined) {

        errors.push(schema.createError('any.required', null, state, options));
        return internals.finalizeValue(value, schema, originalValue, errors, state, options);
    }
    else if (presence === 'forbidden') {
        if (value === undefined) {
            return internals.finalizeValue(value, schema, originalValue, errors, state, options);
        }

        errors.push(schema.createError('any.unknown', null, state, options));
        return internals.finalizeValue(value, schema, originalValue, errors, state, options);
    }

    // Check allowed and denied values using the original value

    let match = schema._valids.get(value, state, options, schema._flags.insensitive);
    if (match) {
        if (options.convert) {
            value = match.value;
        }

        return internals.finalizeValue(value, schema, originalValue, errors, state, options);
    }

    if (schema._invalids.has(value, state, options, schema._flags.insensitive)) {
        errors.push(schema.createError(value === '' ? 'any.empty' : 'any.invalid', { value, invalids: schema._invalids.values({ stripUndefined: true }) }, state, options));
        if (options.abortEarly) {

            return internals.finalizeValue(value, schema, originalValue, errors, state, options);
        }
    }

    // Convert value and validate type

    if (schema._base) {
        const base = schema._base(value, state, options);
        if (base.errors) {
            value = base.value;
            errors = errors.concat(base.errors);
            return internals.finalizeValue(value, schema, originalValue, errors, state, options);                            // Base error always aborts early
        }

        if (base.value !== value) {
            value = base.value;

            // Check allowed and denied values using the converted value

            match = schema._valids.get(value, state, options, schema._flags.insensitive);
            if (match) {
                value = match.value;
                return internals.finalizeValue(value, schema, originalValue, errors, state, options);
            }

            if (schema._invalids.has(value, state, options, schema._flags.insensitive)) {
                errors.push(schema.createError(value === '' ? 'any.empty' : 'any.invalid', { value, invalids: schema._invalids.values({ stripUndefined: true }) }, state, options));
                if (options.abortEarly) {
                    return internals.finalizeValue(value, schema, originalValue, errors, state, options);
                }
            }
        }
    }

    // Required values did not match

    if (schema._flags.allowOnly) {
        errors.push(schema.createError('any.allowOnly', { value, valids: schema._valids.values({ stripUndefined: true }) }, state, options));
        if (options.abortEarly) {
            return internals.finalizeValue(value, schema, originalValue, errors, state, options);
        }
    }

    // Validate tests

    const helpers = {
        options,
        state,
        error: (code, context, localState) => schema.createError(code, context, localState || state, options)
    };

    for (const { func, rule } of schema._tests) {
        let ret;
        if (func) {
            ret = func.call(schema, value, state, options);
        }
        else {
            let args = rule.args;
            if (rule.resolve.length) {
                args = Object.assign({}, args);                                     // Shallow copy
                for (const key of rule.resolve) {
                    const resolved = args[key](state.reference || state.parent, value, options);
                    const resolver = rule.refs[key];
                    if (!resolver.assert(resolved)) {
                        ret = schema.createError(resolver.code, { ref: args[key].key }, state, options);
                        break;
                    }

                    args[key] = resolved;
                }
            }

            ret = ret || schema._rules[rule.rule](value, helpers, args, rule);      // Use ret if already set to error
        }

        if (ret instanceof Errors.Err) {
            errors.push(ret);
            if (options.abortEarly) {
                return internals.finalizeValue(value, schema, originalValue, errors, state, options);
            }
        }
        else {
            value = ret;
        }
    }

    return internals.finalizeValue(value, schema, originalValue, errors, state, options);
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


internals.finalizeValue = function (value, schema, originalValue, errors, state, options) {

    let finalValue;

    if (value !== undefined) {
        finalValue = schema._flags.raw ? originalValue : value;
    }
    else if (options.noDefaults) {
        finalValue = value;
    }
    else if (Ref.isRef(schema._flags.default)) {
        finalValue = schema._flags.default(state.parent, value, options);
    }
    else if (typeof schema._flags.default === 'function' &&
        !(schema._flags.func && !schema._flags.default.description)) {

        let args;

        if (state.parent !== null &&
            schema._flags.default.length > 0) {

            args = [Hoek.clone(state.parent), options];
        }

        const defaultValue = internals._try(schema._flags.default, args);
        finalValue = defaultValue.value;
        if (defaultValue.error) {
            errors.push(schema.createError('any.default', { error: defaultValue.error }, state, options));
        }
    }
    else {
        finalValue = Hoek.clone(schema._flags.default);
    }

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


internals.prepareEmptyValue = function (value, schema) {

    if (typeof value === 'string' &&
        schema._flags.trim) {

        return value.trim();
    }

    return value;
};


internals._try = function (fn, args = []) {

    let err;
    let result;

    try {
        result = fn(...args);
    }
    catch (e) {
        err = e;
    }

    return {
        value: result,
        error: err
    };
};
