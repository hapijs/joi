// Load modules

var Sys = require('sys');
var Path = require('path');
var Hoek = require('hoek');
var Errors = require('./errors');
var Hoek = require('hoek');


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
    this._tests = [];
    this._valids = new internals.Set([undefined]);
    this._invalids = new internals.Set([null]);
    this._flags = {
        insensitive: false,
        allowOnly: false,
        default: undefined
    };

    this._description = null;
    this._notes = [];
    this._tags = [];

    this._inner = null;
    this._renames = [];
    this._dependencies = [];
};


internals.Any.create = function () {

    return new internals.Any();
};


internals.Any.prototype.clone = function () {

    var obj = {};
    obj.__proto__ = Object.getPrototypeOf(this);

    obj.isJoi = true;
    obj._type = this._type;
    obj._settings = Hoek.clone(this._settings);
    obj._tests = this._tests.slice();
    obj._valids = Hoek.clone(this._valids);
    obj._invalids = Hoek.clone(this._invalids);
    obj._flags = {
        insensitive: this._flags.insensitive,
        allowOnly: this._flags.allowOnly,
        default: this._flags.default
    };

    obj._description = this._description;
    obj._notes = this._notes.slice();
    obj._tags = this._tags.slice();

    obj._inner = this._inner ? this._inner.slice() : null;
    obj._renames = this._renames.slice();
    obj._dependencies = this._dependencies.slice();

    return obj;
};


internals.Any.prototype._test = function (name, arg, func) {

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
        this._valids.add(value);
    }
};


internals.Any.prototype.allow = function () {

    var obj = this.clone();
    obj._allow.apply(obj, arguments);
    return obj;
};


internals.Any.prototype.valid = function () {

    var obj = this.allow.apply(this, arguments);
    obj._flags.allowOnly = true;
    return obj;
};


internals.Any.prototype.invalid = function (value) {

    var obj = this.clone();
    var values = Hoek.flatten(Array.prototype.slice.call(arguments));
    for (var i = 0, il = values.length; i < il; ++i) {
        var value = values[i];
        obj._valids.remove(value);
        obj._invalids.add(value);
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
    return obj;
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


internals.Any.prototype._validate = function (value, state, options) {

    var self = this;

    // Setup state and settings

    state = state || { key: '', path: '' };

    if (this._settings) {
        options = Hoek.applyToDefaults(options, this._settings);
    }

    var errors = [];
    var finish = function () {

        return {
            value: (value !== undefined) ? value : self._flags.default,
            errors: errors.length ? errors : null
        };
    };

    // Check allowed and denied values using the original value

    if (this._valids.has(value, this._flags.insensitive)) {
        return finish();
    }

    if (this._invalids.has(value, this._flags.insensitive)) {
        errors.push(Errors.create(value === '' ? 'any.empty' : 'any.invalid', { value: (value === '' ? '' : this._invalids.key(value)) }, state, options));
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

            if (this._valids.has(value, this._flags.insensitive)) {
                return finish();
            }

            if (this._invalids.has(value, this._flags.insensitive)) {
                errors.push(Errors.create('any.invalid', { value: this._invalids.key(value) }, state, options));
                if (options.abortEarly) {
                    return finish();
                }
            }
        }
    }

    // Required values did not match

    if (this._flags.allowOnly) {
        errors.push(Errors.create('any.validate.allowOnly', { value: this._valids.toString(false) }, state, options));
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


internals.Any.prototype.validate = function (object /*, [options], callback */) {

    var options = typeof arguments[1] === 'object' ? arguments[1] : {};
    var callback = arguments[2] || arguments[1];

    var settings = Hoek.applyToDefaults(internals.defaults, options);
    var result = this._validate(object, null, settings);
    var errors = Errors.process(result.errors, object);

    return callback(errors, result.value);
};


internals.Any.prototype.describe = function () {

    var description = {
        type: this._type,
        flags: this._flags
    };

    if (this._description) {
        description.description = this._description;
    }

    if (this._notes.length) {
        description.notes = this._notes;
    }

    if (this._tags.length) {
        description.tags = this._tags;
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

    this._set = {};
    this._lowercase = {};

    for (var i = 0, il = values.length; i < il; ++i) {
        this.add(values[i]);
    }
};


internals.Set.prototype.add = function (value) {

    var key = this.key(value);
    this._set[key] = value;
    this._lowercase[key.toLowerCase()] = value;
};


internals.Set.prototype.remove = function (value) {

    var key = this.key(value);
    delete this._set[key];
    delete this._lowercase[key.toLowerCase()];
};


internals.Set.prototype.has = function (value, insensitive) {

    var key = this.key(value);
    return (insensitive === true ? this._lowercase.hasOwnProperty(key.toLowerCase()) : this._set.hasOwnProperty(key));
};


internals.Set.prototype.key = function (value) {

    return Sys.inspect(value);
};


internals.Set.prototype.values = function () {

    var list = [];
    var values = Object.keys(this._set);
    for (var i = 0, il = values.length; i < il; ++i) {
        list.push(this._set[values[i]]);
    }

    return list;
};


internals.Set.prototype.toString = function (includeUndefined) {

    var list = '';
    var values = Object.keys(this._set);
    for (var i = 0, il = values.length; i < il; ++i) {
        var value = this._set[values[i]];
        if (value !== undefined || includeUndefined) {
            list += (list ? ', ' : '') + (value === undefined ? 'undefined' : (value === null ? 'null' : value));
        }
    }

    return list;
};
