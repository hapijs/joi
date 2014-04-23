// Load modules

var Path = require('path');
var Hoek = require('hoek');
var Ref = require('./ref');
var Errors = require('./errors');
var Alternatives = null;                // Delay-loaded to prevent circular dependencies
var Cast = null;


// Declare internals

var internals = {};


internals.defaults = {
    abortEarly: true,
    convert: true,
    allowUnknown: false,
    skipFunctions: false,
    stripUnknown: false,
    language: {}
};


module.exports = internals.Any = function () {

    this.isJoi = true;
    this._type = 'any';
    this._settings = null;
    this._valids = new internals.Set([undefined]);
    this._invalids = new internals.Set([null]);
    this._tests = [];
    this._flags = {};       // insensitive (false), allowOnly (false), default (undefined), encoding (undefined)

    this._description = null;
    this._unit = null;
    this._notes = [];
    this._tags = [];
    this._examples = [];

    this._inner = null;
    this._renames = [];
    this._dependencies = [];
    this._refs = [];
};


internals.Any.prototype.clone = function () {

    var obj = {};
    obj.__proto__ = Object.getPrototypeOf(this);

    obj.isJoi = true;
    obj._type = this._type;
    obj._settings = Hoek.clone(this._settings);
    obj._valids = Hoek.clone(this._valids);
    obj._invalids = Hoek.clone(this._invalids);
    obj._tests = this._tests.slice();
    obj._flags = Hoek.clone(this._flags);

    obj._description = this._description;
    obj._unit = this._unit;
    obj._notes = this._notes.slice();
    obj._tags = this._tags.slice();
    obj._examples = this._examples.slice();

    obj._inner = this._inner ? this._inner.slice() : null;
    obj._renames = this._renames.slice();
    obj._dependencies = this._dependencies.slice();
    obj._refs = this._refs.slice();

    return obj;
};


internals.Any.prototype.concat = function (schema) {

    Hoek.assert(schema && schema.isJoi, 'Invalid schema object');
    Hoek.assert(schema._type === 'any' || schema._type === this._type, 'Cannot merge with another type:', schema._type);

    var obj = this.clone();

    obj._settings = obj._settings ? Hoek.merge(obj._settings, schema._settings) : schema._settings;
    obj._valids.merge(schema._valids);
    obj._invalids.merge(schema._invalids);
    obj._tests = obj._tests.concat(schema._tests);
    Hoek.merge(obj._flags, schema._flags);

    obj._description = schema._description || obj._description;
    obj._unit = schema._unit || obj._unit;
    obj._notes = obj._notes.concat(schema._notes);
    obj._tags = obj._tags.concat(schema._tags);
    obj._examples = obj._examples.concat(schema._examples);

    obj._inner = obj._inner ? (schema._inner ? obj._inner.concat(schema._inner) : obj._inner) : schema._inner;
    obj._renames = obj._renames.concat(schema._renames);
    obj._dependencies = obj._dependencies.concat(schema._dependencies);
    obj._refs = obj._refs.concat(schema._refs);

    return obj;
};


internals.Any.prototype._test = function (name, arg, func) {

    Hoek.assert(!this._flags.allowOnly, 'Cannot define rules when valid values specified');

    var obj = this.clone();
    obj._tests.push({ func: func, name: name, arg: arg });
    return obj;
};


internals.Any.prototype.options = function (options) {

    var obj = this.clone();
    obj._settings = Hoek.applyToDefaults(obj._settings || {}, options);
    return obj;
};


internals.Any.prototype.strict = function () {

    var obj = this.clone();
    obj._settings = obj._settings || {};
    obj._settings.convert = false;
    return obj;
};


internals.Any.prototype._allow = function () {

    var values = Hoek.flatten(Array.prototype.slice.call(arguments));
    for (var i = 0, il = values.length; i < il; ++i) {
        var value = values[i];
        this._invalids.remove(value);
        this._valids.add(value, this._refs);
    }
};


internals.Any.prototype.allow = function () {

    var obj = this.clone();
    obj._allow.apply(obj, arguments);
    return obj;
};


internals.Any.prototype.valid = internals.Any.prototype.equal = function () {

    Hoek.assert(!this._tests.length, 'Cannot set valid values when rules specified');

    var obj = this.allow.apply(this, arguments);
    obj._flags.allowOnly = true;
    return obj;
};


internals.Any.prototype.invalid = internals.Any.prototype.not = function (value) {

    var obj = this.clone();
    var values = Hoek.flatten(Array.prototype.slice.call(arguments));
    for (var i = 0, il = values.length; i < il; ++i) {
        var value = values[i];
        obj._valids.remove(value);
        obj._invalids.add(value, this._refs);
    }

    return obj;
};


internals.Any.prototype.required = function () {

    var obj = this.clone();
    obj._valids.remove(undefined);
    obj._invalids.add(undefined);
    return obj;
};


internals.Any.prototype.optional = function () {

    var obj = this.clone();
    obj._invalids.remove(undefined);
    obj._valids.add(undefined);
    return obj;
};


internals.Any.prototype.default = function (value) {

    var obj = this.clone();
    obj._flags.default = value;
    if (Ref.isRef(value)) {
        obj._refs.push(value.root);
    }
    return obj;
};


internals.Any.prototype.when = function (ref, options) {

    Hoek.assert(options && typeof options === 'object', 'Invalid options');
    Hoek.assert(options.then !== undefined || options.otherwise !== undefined, 'options must have at least one of "then" or "otherwise"');

    Cast = Cast || require('./cast');
    var then = options.then ? this.concat(Cast.schema(options.then)) : this;
    var otherwise = options.otherwise ? this.concat(Cast.schema(options.otherwise)) : this;

    Alternatives = Alternatives || require('./alternatives');
    return Alternatives.when(ref, { is: options.is, then: then, otherwise: otherwise });
};


internals.Any.prototype.description = function (desc) {

    Hoek.assert(desc && typeof desc === 'string', 'Description must be a non-empty string');

    var obj = this.clone();
    obj._description = desc;
    return obj;
};


internals.Any.prototype.notes = function (notes) {

    Hoek.assert(notes && (typeof notes === 'string' || Array.isArray(notes)), 'Notes must be a non-empty string or array');

    var obj = this.clone();
    obj._notes = obj._notes.concat(notes);
    return obj;
};


internals.Any.prototype.tags = function (tags) {

    Hoek.assert(tags && (typeof tags === 'string' || Array.isArray(tags)), 'Tags must be a non-empty string or array');

    var obj = this.clone();
    obj._tags = obj._tags.concat(tags);
    return obj;
};


internals.Any.prototype.example = function (value) {

    Hoek.assert(arguments.length, 'Missing example');
    var result = this._validate(value, null, internals.defaults);
    Hoek.assert(!result.errors, 'Bad example:', result.errors && Errors.process(result.errors, value));

    var obj = this.clone();
    obj._examples = obj._examples.concat(value);
    return obj;
};


internals.Any.prototype.unit = function (name) {

    Hoek.assert(name && typeof name === 'string', 'Unit name must be a non-empty string');

    var obj = this.clone();
    obj._unit = name;
    return obj;
};


internals.Any.prototype._validate = function (value, state, options, reference) {

    var self = this;

    // Setup state and settings

    state = state || { key: '', path: '', parent: null, reference: reference };

    if (this._settings) {
        options = Hoek.applyToDefaults(options, this._settings);
    }

    var errors = [];
    var finish = function () {

        return {
            value: (value !== undefined) ? value : (Ref.isRef(self._flags.default) ? self._flags.default(state.parent) : self._flags.default),
            errors: errors.length ? errors : null
        };
    };

    // Check allowed and denied values using the original value

    if (this._valids.has(value, state, this._flags.insensitive)) {
        return finish();
    }

    if (this._invalids.has(value, state, this._flags.insensitive)) {
        errors.push(Errors.create(value === '' ? 'any.empty' : (value === undefined ? 'any.required' : 'any.invalid'), null, state, options));
        if (options.abortEarly ||
            value === undefined) {          // No reason to keep validating missing value

            return finish();
        }
    }

    // Convert value and validate type

    if (this._base) {
        var base = this._base.call(this, value, state, options);
        if (base.errors) {
            value = base.value;
            errors = errors.concat(base.errors);
            return finish();                            // Base error always aborts early
        }

        if (base.value !== value) {
            value = base.value;

            // Check allowed and denied values using the converted value

            if (this._valids.has(value, state, this._flags.insensitive)) {
                return finish();
            }

            if (this._invalids.has(value, state, this._flags.insensitive)) {
                errors.push(Errors.create('any.invalid', null, state, options));
                if (options.abortEarly) {
                    return finish();
                }
            }
        }
    }

    // Required values did not match

    if (this._flags.allowOnly) {
        errors.push(Errors.create('any.allowOnly', { valids: this._valids.toString(false) }, state, options));
        if (options.abortEarly) {
            return finish();
        }
    }

    // Validate tests

    for (var i = 0, il = this._tests.length; i < il; ++i) {
        var test = this._tests[i];
        var err = test.func.call(this, value, state, options);
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

    var settings = Hoek.applyToDefaults(internals.defaults, options);
    var result = this._validate(value, null, settings);
    var errors = Errors.process(result.errors, value);

    return callback(errors, result.value);
};


internals.Any.prototype.validate = function (value, callback) {

    var result = this._validate(value, null, internals.defaults);
    var errors = Errors.process(result.errors, value);

    return callback(errors, result.value);
};


internals.Any.prototype.describe = function () {

    var description = {
        type: this._type
    };

    if (Object.keys(this._flags).length) {
        description.flags = this._flags;
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

    if (this._examples.length) {
        description.examples = this._examples;
    }

    if (this._unit) {
        description.unit = this._unit;
    }

    var valids = this._valids.values();
    if (valids.length) {
        description.valids = valids;
    }

    var invalids = this._invalids.values();
    if (invalids.length) {
        description.invalids = invalids;
    }

    description.rules = [];

    for (var i = 0, il = this._tests.length; i < il; ++i) {
        var validator = this._tests[i];
        var item = { name: validator.name };
        if (validator.arg) {
            item.arg = validator.arg;
        }
        description.rules.push(item);
    }

    if (!description.rules.length) {
        delete description.rules;
    }

    return description;
};


// Set

internals.Set = function (values) {

    this._set = [];

    for (var i = 0, il = values.length; i < il; ++i) {
        this.add(values[i]);
    }
};


internals.Set.prototype.add = function (value, refs) {

    Hoek.assert(value === null || value === undefined || value instanceof Date || Ref.isRef(value) || (typeof value !== 'function' && typeof value !== 'object'), 'Value cannot be an object or function');

    if (typeof value !== 'function' &&
        this.has(value, null, false)) {

        return;
    }

    if (Ref.isRef(value)) {
        refs.push(value.root);
    }

    this._set.push(value);
};


internals.Set.prototype.merge = function (set) {

    for (var i = 0, il = set._set.length; i < il; ++i) {
        this.add(set._set[i]);
    }
};


internals.Set.prototype.remove = function (value) {

    this._set = this._set.filter(function (item) {

        return value !== item;
    });
};


internals.Set.prototype.has = function (value, state, insensitive) {

    for (var i = 0, il = this._set.length; i < il; ++i) {
        var item = this._set[i];

        if (Ref.isRef(item)) {
            item = item(state.reference || state.parent);
        }

        if (typeof value !== typeof item) {
            continue;
        }

        if (value === item ||
            (value instanceof Date && item instanceof Date && value.getTime() === item.getTime()) ||
            (insensitive && typeof value === 'string' && value.toLowerCase() === item.toLowerCase())) {

            return true;
        }
    }

    return false;
};


internals.Set.prototype.values = function () {

    return this._set.slice();
};


internals.Set.prototype.toString = function (includeUndefined) {

    var list = '';
    for (var i = 0, il = this._set.length; i < il; ++i) {
        var item = this._set[i];
        if (item !== undefined || includeUndefined) {
            list += (list ? ', ' : '') + internals.stringify(item);
        }
    }

    return list;
};


internals.stringify = function (value) {

    if (value === undefined) {
        return 'undefined';
    }

    if (value === null) {
        return 'null';
    }

    if (typeof value === 'string') {
        return value;
    }

    return value.toString();
};
