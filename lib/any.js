'use strict';

// Load modules

const Hoek = require('hoek');
const Ref = require('./ref');
const Errors = require('./errors');
let Alternatives = null;                // Delay-loaded to prevent circular dependencies
let Cast = null;


// Declare internals

const internals = {};


internals.defaults = {
    abortEarly: true,
    convert: true,
    allowUnknown: false,
    skipFunctions: false,
    stripUnknown: false,
    language: {},
    presence: 'optional',
    raw: false,
    strip: false,
    noDefaults: false

    // context: null
};


internals.checkOptions = function (options) {

    const optionType = {
        abortEarly: 'boolean',
        convert: 'boolean',
        allowUnknown: 'boolean',
        skipFunctions: 'boolean',
        stripUnknown: 'boolean',
        language: 'object',
        presence: ['string', 'required', 'optional', 'forbidden', 'ignore'],
        raw: 'boolean',
        context: 'object',
        strip: 'boolean',
        noDefaults: 'boolean'
    };

    const keys = Object.keys(options);
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const opt = optionType[key];
        let type = opt;
        let values = null;

        if (Array.isArray(opt)) {
            type = opt[0];
            values = opt.slice(1);
        }

        Hoek.assert(type, 'unknown key ' + key);
        Hoek.assert(typeof options[key] === type, key + ' should be of type ' + type);
        if (values) {
            Hoek.assert(values.indexOf(options[key]) >= 0, key + ' should be one of ' + values.join(', '));
        }
    }
};


module.exports = internals.Any = function () {

    Cast = Cast || require('./cast');

    this.isJoi = true;
    this._type = 'any';
    this._settings = null;
    this._valids = new internals.Set();
    this._invalids = new internals.Set();
    this._tests = [];
    this._refs = [];
    this._flags = { /*
        presence: 'optional',                   // optional, required, forbidden, ignore
        allowOnly: false,
        allowUnknown: undefined,
        default: undefined,
        forbidden: false,
        encoding: undefined,
        insensitive: false,
        trim: false,
        case: undefined,                        // upper, lower
        empty: undefined,
        func: false
    */ };

    this._description = null;
    this._unit = null;
    this._notes = [];
    this._tags = [];
    this._examples = [];
    this._meta = [];

    this._inner = {};                           // Hash of arrays of immutable objects
};


internals.Any.prototype.isImmutable = true;     // Prevents Hoek from deep cloning schema objects


internals.Any.prototype.clone = function () {

    const obj = Object.create(Object.getPrototypeOf(this));

    obj.isJoi = true;
    obj._type = this._type;
    obj._settings = internals.concatSettings(this._settings);
    obj._valids = Hoek.clone(this._valids);
    obj._invalids = Hoek.clone(this._invalids);
    obj._tests = this._tests.slice();
    obj._refs = this._refs.slice();
    obj._flags = Hoek.clone(this._flags);

    obj._description = this._description;
    obj._unit = this._unit;
    obj._notes = this._notes.slice();
    obj._tags = this._tags.slice();
    obj._examples = this._examples.slice();
    obj._meta = this._meta.slice();

    obj._inner = {};
    const inners = Object.keys(this._inner);
    for (let i = 0; i < inners.length; ++i) {
        const key = inners[i];
        obj._inner[key] = this._inner[key] ? this._inner[key].slice() : null;
    }

    return obj;
};


internals.Any.prototype.concat = function (schema) {

    Hoek.assert(schema && schema.isJoi, 'Invalid schema object');
    Hoek.assert(this._type === 'any' || schema._type === 'any' || schema._type === this._type, 'Cannot merge type', this._type, 'with another type:', schema._type);

    let obj = this.clone();

    if (this._type === 'any' && schema._type !== 'any') {

        // Reset values as if we were "this"
        const tmpObj = schema.clone();
        const keysToRestore = ['_settings', '_valids', '_invalids', '_tests', '_refs', '_flags', '_description', '_unit',
            '_notes', '_tags', '_examples', '_meta', '_inner'];

        for (let i = 0; i < keysToRestore.length; ++i) {
            tmpObj[keysToRestore[i]] = obj[keysToRestore[i]];
        }

        obj = tmpObj;
    }

    obj._settings = obj._settings ? internals.concatSettings(obj._settings, schema._settings) : schema._settings;
    obj._valids.merge(schema._valids, schema._invalids);
    obj._invalids.merge(schema._invalids, schema._valids);
    obj._tests = obj._tests.concat(schema._tests);
    obj._refs = obj._refs.concat(schema._refs);
    Hoek.merge(obj._flags, schema._flags);

    obj._description = schema._description || obj._description;
    obj._unit = schema._unit || obj._unit;
    obj._notes = obj._notes.concat(schema._notes);
    obj._tags = obj._tags.concat(schema._tags);
    obj._examples = obj._examples.concat(schema._examples);
    obj._meta = obj._meta.concat(schema._meta);

    const inners = Object.keys(schema._inner);
    const isObject = obj._type === 'object';
    for (let i = 0; i < inners.length; ++i) {
        const key = inners[i];
        const source = schema._inner[key];
        if (source) {
            const target = obj._inner[key];
            if (target) {
                if (isObject && key === 'children') {
                    const keys = {};

                    for (let j = 0; j < target.length; ++j) {
                        keys[target[j].key] = j;
                    }

                    for (let j = 0; j < source.length; ++j) {
                        const sourceKey = source[j].key;
                        if (keys[sourceKey] >= 0) {
                            target[keys[sourceKey]] = {
                                key: sourceKey,
                                schema: target[keys[sourceKey]].schema.concat(source[j].schema)
                            };
                        }
                        else {
                            target.push(source[j]);
                        }
                    }
                }
                else {
                    obj._inner[key] = obj._inner[key].concat(source);
                }
            }
            else {
                obj._inner[key] = source.slice();
            }
        }
    }

    return obj;
};


internals.Any.prototype._test = function (name, arg, func) {

    Hoek.assert(!this._flags.allowOnly, 'Cannot define rules when valid values specified');

    const obj = this.clone();
    obj._tests.push({ func: func, name: name, arg: arg });
    return obj;
};


internals.Any.prototype.options = function (options) {

    Hoek.assert(!options.context, 'Cannot override context');
    internals.checkOptions(options);

    const obj = this.clone();
    obj._settings = internals.concatSettings(obj._settings, options);
    return obj;
};


internals.Any.prototype.strict = function (isStrict) {

    const obj = this.clone();
    obj._settings = obj._settings || {};
    obj._settings.convert = isStrict === undefined ? false : !isStrict;
    return obj;
};


internals.Any.prototype.raw = function (isRaw) {

    const obj = this.clone();
    obj._settings = obj._settings || {};
    obj._settings.raw = isRaw === undefined ? true : isRaw;
    return obj;
};


internals.Any.prototype._allow = function () {

    const values = Hoek.flatten(Array.prototype.slice.call(arguments));
    for (let i = 0; i < values.length; ++i) {
        const value = values[i];

        Hoek.assert(value !== undefined, 'Cannot call allow/valid/invalid with undefined');
        this._invalids.remove(value);
        this._valids.add(value, this._refs);
    }
};


internals.Any.prototype.allow = function () {

    const obj = this.clone();
    obj._allow.apply(obj, arguments);
    return obj;
};


internals.Any.prototype.valid = internals.Any.prototype.only = internals.Any.prototype.equal = function () {

    Hoek.assert(!this._tests.length, 'Cannot set valid values when rules specified');

    const obj = this.allow.apply(this, arguments);
    obj._flags.allowOnly = true;
    return obj;
};


internals.Any.prototype.invalid = internals.Any.prototype.disallow = internals.Any.prototype.not = function (value) {

    const obj = this.clone();
    const values = Hoek.flatten(Array.prototype.slice.call(arguments));
    for (let i = 0; i < values.length; ++i) {
        value = values[i];

        Hoek.assert(value !== undefined, 'Cannot call allow/valid/invalid with undefined');
        obj._valids.remove(value);
        obj._invalids.add(value, this._refs);
    }

    return obj;
};


internals.Any.prototype.required = internals.Any.prototype.exist = function () {

    const obj = this.clone();
    obj._flags.presence = 'required';
    return obj;
};


internals.Any.prototype.optional = function () {

    const obj = this.clone();
    obj._flags.presence = 'optional';
    return obj;
};


internals.Any.prototype.forbidden = function () {

    const obj = this.clone();
    obj._flags.presence = 'forbidden';
    return obj;
};


internals.Any.prototype.strip = function () {

    const obj = this.clone();
    obj._flags.strip = true;
    return obj;
};


internals.Any.prototype.applyFunctionToChildren = function (children, fn, args, root) {

    children = [].concat(children);

    if (children.length !== 1 || children[0] !== '') {
        root = root ? (root + '.') : '';

        const extraChildren = (children[0] === '' ? children.slice(1) : children).map((child) => {

            return root + child;
        });

        throw new Error('unknown key(s) ' + extraChildren.join(', '));
    }

    return this[fn].apply(this, args);
};


internals.Any.prototype.default = function (value, description) {

    if (typeof value === 'function' &&
        !Ref.isRef(value)) {

        if (!value.description &&
            description) {

            value.description = description;
        }

        if (!this._flags.func) {
            Hoek.assert(typeof value.description === 'string' && value.description.length > 0, 'description must be provided when default value is a function');
        }
    }

    const obj = this.clone();
    obj._flags.default = value;
    Ref.push(obj._refs, value);
    return obj;
};


internals.Any.prototype.empty = function (schema) {

    if (schema === undefined) {
        const obj = this.clone();
        obj._flags.empty = undefined;
        return obj;
    }

    schema = Cast.schema(schema);

    const obj = this.clone();
    obj._flags.empty = schema;
    return obj;
};


internals.Any.prototype.when = function (ref, options) {

    Hoek.assert(options && typeof options === 'object', 'Invalid options');
    Hoek.assert(options.then !== undefined || options.otherwise !== undefined, 'options must have at least one of "then" or "otherwise"');

    const then = options.then ? this.concat(Cast.schema(options.then)) : this;
    const otherwise = options.otherwise ? this.concat(Cast.schema(options.otherwise)) : this;

    Alternatives = Alternatives || require('./alternatives');
    const obj = Alternatives.when(ref, { is: options.is, then: then, otherwise: otherwise });
    obj._flags.presence = 'ignore';
    return obj;
};


internals.Any.prototype.description = function (desc) {

    Hoek.assert(desc && typeof desc === 'string', 'Description must be a non-empty string');

    const obj = this.clone();
    obj._description = desc;
    return obj;
};


internals.Any.prototype.notes = function (notes) {

    Hoek.assert(notes && (typeof notes === 'string' || Array.isArray(notes)), 'Notes must be a non-empty string or array');

    const obj = this.clone();
    obj._notes = obj._notes.concat(notes);
    return obj;
};


internals.Any.prototype.tags = function (tags) {

    Hoek.assert(tags && (typeof tags === 'string' || Array.isArray(tags)), 'Tags must be a non-empty string or array');

    const obj = this.clone();
    obj._tags = obj._tags.concat(tags);
    return obj;
};

internals.Any.prototype.meta = function (meta) {

    Hoek.assert(meta !== undefined, 'Meta cannot be undefined');

    const obj = this.clone();
    obj._meta = obj._meta.concat(meta);
    return obj;
};


internals.Any.prototype.example = function (value) {

    Hoek.assert(arguments.length, 'Missing example');
    const result = this._validate(value, null, internals.defaults);
    Hoek.assert(!result.errors, 'Bad example:', result.errors && Errors.process(result.errors, value));

    const obj = this.clone();
    obj._examples = obj._examples.concat(value);
    return obj;
};


internals.Any.prototype.unit = function (name) {

    Hoek.assert(name && typeof name === 'string', 'Unit name must be a non-empty string');

    const obj = this.clone();
    obj._unit = name;
    return obj;
};


internals._try = function (fn, arg) {

    let err;
    let result;

    try {
        result = fn.call(null, arg);
    }
    catch (e) {
        err = e;
    }

    return {
        value: result,
        error: err
    };
};


internals.Any.prototype._validate = function (value, state, options, reference) {

    const originalValue = value;

    // Setup state and settings

    state = state || { key: '', path: '', parent: null, reference: reference };

    if (this._settings) {
        options = internals.concatSettings(options, this._settings);
    }

    let errors = [];
    const finish = () => {

        let finalValue;

        if (!this._flags.strip) {
            if (value !== undefined) {
                finalValue = options.raw ? originalValue : value;
            }
            else if (options.noDefaults) {
                finalValue = originalValue;
            }
            else if (Ref.isRef(this._flags.default)) {
                finalValue = this._flags.default(state.parent, options);
            }
            else if (typeof this._flags.default === 'function' &&
                    !(this._flags.func && !this._flags.default.description)) {

                let arg;

                if (state.parent !== null &&
                    this._flags.default.length > 0) {

                    arg = Hoek.clone(state.parent);
                }

                const defaultValue = internals._try(this._flags.default, arg);
                finalValue = defaultValue.value;
                if (defaultValue.error) {
                    errors.push(Errors.create('any.default', defaultValue.error, state, options));
                }
            }
            else {
                finalValue = Hoek.clone(this._flags.default);
            }
        }

        return {
            value: finalValue,
            errors: errors.length ? errors : null
        };
    };

    // Check presence requirements

    const presence = this._flags.presence || options.presence;
    if (presence === 'optional') {
        if (value === undefined) {
            const isDeepDefault = this._flags.hasOwnProperty('default') && this._flags.default === undefined;
            if (isDeepDefault && this._type === 'object') {
                value = {};
            }
            else {
                return finish();
            }
        }
    }
    else if (presence === 'required' &&
            value === undefined) {

        errors.push(Errors.create('any.required', null, state, options));
        return finish();
    }
    else if (presence === 'forbidden') {
        if (value === undefined) {
            return finish();
        }

        errors.push(Errors.create('any.unknown', null, state, options));
        return finish();
    }

    if (this._flags.empty && !this._flags.empty._validate(value, null, internals.defaults).errors) {
        value = undefined;
        return finish();
    }

    // Check allowed and denied values using the original value

    if (this._valids.has(value, state, options, this._flags.insensitive)) {
        return finish();
    }

    if (this._invalids.has(value, state, options, this._flags.insensitive)) {
        errors.push(Errors.create(value === '' ? 'any.empty' : 'any.invalid', null, state, options));
        if (options.abortEarly ||
            value === undefined) {          // No reason to keep validating missing value

            return finish();
        }
    }

    // Convert value and validate type

    if (this._base) {
        const base = this._base.call(this, value, state, options);
        if (base.errors) {
            value = base.value;
            errors = errors.concat(base.errors);
            return finish();                            // Base error always aborts early
        }

        if (base.value !== value) {
            value = base.value;

            // Check allowed and denied values using the converted value

            if (this._valids.has(value, state, options, this._flags.insensitive)) {
                return finish();
            }

            if (this._invalids.has(value, state, options, this._flags.insensitive)) {
                errors.push(Errors.create('any.invalid', null, state, options));
                if (options.abortEarly) {
                    return finish();
                }
            }
        }
    }

    // Required values did not match

    if (this._flags.allowOnly) {
        errors.push(Errors.create('any.allowOnly', { valids: this._valids.values({ stripUndefined: true }) }, state, options));
        if (options.abortEarly) {
            return finish();
        }
    }

    // Helper.validate tests

    for (let i = 0; i < this._tests.length; ++i) {
        const test = this._tests[i];
        const err = test.func.call(this, value, state, options);
        if (err) {
            errors.push(err);
            if (options.abortEarly) {
                return finish();
            }
        }
    }

    return finish();
};


internals.Any.prototype._validateWithOptions = function (value, options, callback) {

    if (options) {
        internals.checkOptions(options);
    }

    const settings = internals.concatSettings(internals.defaults, options);
    const result = this._validate(value, null, settings);
    const errors = Errors.process(result.errors, value);

    if (callback) {
        return callback(errors, result.value);
    }

    return { error: errors, value: result.value };
};


internals.Any.prototype.validate = function (value, callback) {

    const result = this._validate(value, null, internals.defaults);
    const errors = Errors.process(result.errors, value);

    if (callback) {
        return callback(errors, result.value);
    }

    return { error: errors, value: result.value };
};


internals.Any.prototype.describe = function () {

    const description = {
        type: this._type
    };

    const flags = Object.keys(this._flags);
    if (flags.length) {
        if (this._flags.empty) {
            description.flags = {};
            for (let i = 0; i < flags.length; ++i) {
                const flag = flags[i];
                description.flags[flag] = flag === 'empty' ? this._flags[flag].describe() : this._flags[flag];
            }
        }
        else {
            description.flags = this._flags;
        }
    }

    if (this._description) {
        description.description = this._description;
    }

    if (this._notes.length) {
        description.notes = this._notes;
    }

    if (this._tags.length) {
        description.tags = this._tags;
    }

    if (this._meta.length) {
        description.meta = this._meta;
    }

    if (this._examples.length) {
        description.examples = this._examples;
    }

    if (this._unit) {
        description.unit = this._unit;
    }

    const valids = this._valids.values();
    if (valids.length) {
        description.valids = valids;
    }

    const invalids = this._invalids.values();
    if (invalids.length) {
        description.invalids = invalids;
    }

    description.rules = [];

    for (let i = 0; i < this._tests.length; ++i) {
        const validator = this._tests[i];
        const item = { name: validator.name };
        if (validator.arg !== void 0) {
            item.arg = validator.arg;
        }
        description.rules.push(item);
    }

    if (!description.rules.length) {
        delete description.rules;
    }

    const label = Hoek.reach(this._settings, 'language.label');
    if (label) {
        description.label = label;
    }

    return description;
};

internals.Any.prototype.label = function (name) {

    Hoek.assert(name && typeof name === 'string', 'Label name must be a non-empty string');

    const obj = this.clone();
    const options = { language: { label: name } };

    // If language.label is set, it should override this label
    obj._settings = internals.concatSettings(options, obj._settings);
    return obj;
};


// Set

internals.Set = function () {

    this._set = [];
};


internals.Set.prototype.add = function (value, refs) {

    Hoek.assert(value === null || value === undefined || value instanceof Date || Buffer.isBuffer(value) || Ref.isRef(value) || (typeof value !== 'function' && typeof value !== 'object'), 'Value cannot be an object or function');

    if (typeof value !== 'function' &&
        this.has(value, null, null, false)) {

        return;
    }

    Ref.push(refs, value);
    this._set.push(value);
};


internals.Set.prototype.merge = function (add, remove) {

    for (let i = 0; i < add._set.length; ++i) {
        this.add(add._set[i]);
    }

    for (let i = 0; i < remove._set.length; ++i) {
        this.remove(remove._set[i]);
    }
};


internals.Set.prototype.remove = function (value) {

    this._set = this._set.filter((item) => value !== item);
};


internals.Set.prototype.has = function (value, state, options, insensitive) {

    for (let i = 0; i < this._set.length; ++i) {
        let items = this._set[i];

        if (Ref.isRef(items)) {
            items = items(state.reference || state.parent, options);
        }

        if (!Array.isArray(items)) {
            items = [items];
        }

        for (let j = 0; j < items.length; ++j) {
            const item = items[j];
            if (typeof value !== typeof item) {
                continue;
            }

            if (value === item ||
                (value instanceof Date && item instanceof Date && value.getTime() === item.getTime()) ||
                (insensitive && typeof value === 'string' && value.toLowerCase() === item.toLowerCase()) ||
                (Buffer.isBuffer(value) && Buffer.isBuffer(item) && value.length === item.length && value.toString('binary') === item.toString('binary'))) {

                return true;
            }
        }
    }

    return false;
};


internals.Set.prototype.values = function (options) {

    if (options && options.stripUndefined) {
        const values = [];

        for (let i = 0; i < this._set.length; ++i) {
            const item = this._set[i];
            if (item !== undefined) {
                values.push(item);
            }
        }

        return values;
    }

    return this._set.slice();
};


internals.concatSettings = function (target, source) {

    // Used to avoid cloning context

    if (!target &&
        !source) {

        return null;
    }

    const obj = {};

    if (target) {
        const tKeys = Object.keys(target);
        for (let i = 0; i < tKeys.length; ++i) {
            const key = tKeys[i];
            obj[key] = target[key];
        }
    }

    if (source) {
        const sKeys = Object.keys(source);
        for (let i = 0; i < sKeys.length; ++i) {
            const key = sKeys[i];
            if (key !== 'language' ||
                !obj.hasOwnProperty(key)) {

                obj[key] = source[key];
            }
            else {
                obj[key] = Hoek.applyToDefaults(obj[key], source[key]);
            }
        }
    }

    return obj;
};
