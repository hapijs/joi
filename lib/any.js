// Load modules

var Sys = require('sys');
var Path = require('path');
var Errors = require('./errors');
var Utils = require('./utils');


// Declare internals

var internals = {};


internals.defaults = {
    abortEarly: true,
    convert: true,
    modify: false,

    allowUnknown: false,
    skipFunctions: false,
    stripUnknown: false,

    language: {},
    languagePath: Path.join(__dirname, '..', 'languages', 'en-us.json')
};


module.exports = internals.Any = function () {

    this._type = 'any';
    this._settings = null;
    this._tests = [];
    this._dependencies = [];
    this._mutators = [];
    this._valids = new internals.Set([undefined]);
    this._invalids = new internals.Set([null]);
    this._flags = {
        insensitive: false,
        allowOnly: false
    };

    this._description = null;
    this._notes = [];
    this._tags = [];
};


internals.Any.create = function () {

    return new internals.Any();
};


internals.Any.prototype._base = function (func) {

    this._tests.push({ func: func });
};


internals.Any.prototype._test = function (name, arg, func) {

    this._tests.push({ func: func, name: name, arg: arg });
};


internals.Any.prototype._dependency = function (name, arg, func) {

    this._dependencies.push({ func: func, name: name, arg: arg });
};


internals.Any.prototype._mutate = function (value) {

    this._mutators.push(value);
};


internals.Any.prototype.options = function (options) {

    this._settings = Utils.applyToDefaults(this._settings || {}, options);
    return this;
};


internals.Any.prototype.strict = function () {

    this._settings = this._settings || {};
    this._settings.convert = false;
    return this;
};


internals.Any.prototype._allow = function (value) {

    this._invalids.remove(value);
    this._valids.add(value);
    return this;
};


internals.Any.prototype.allow = function () {

    var values = Utils.flatten(Array.prototype.slice.call(arguments));
    for (var i = 0, il = values.length; i < il; ++i) {
        this._allow(values[i]);
    }

    return this;
};


internals.Any.prototype.valid = function () {

    this.allow.apply(this, arguments);
    this._flags.allowOnly = true;
    return this;
};


internals.Any.prototype._deny = function (value) {

    this._valids.remove(value);
    this._invalids.add(value);
    return this;
};


internals.Any.prototype.invalid = internals.Any.prototype.deny = function (value) {

    var values = Utils.flatten(Array.prototype.slice.call(arguments));
    for (var i = 0, il = values.length; i < il; ++i) {
        this._deny(values[i]);
    }

    return this;
};


internals.Any.prototype.required = function () {

    this._deny(undefined);
    return this;
};


internals.Any.prototype.optional = function () {

    this._invalids.remove(undefined);
    this._valids.add(undefined);
    return this;
};


internals.Any.prototype.nullOk = function () {

    this._allow(null);
    return this;
};


internals.Any.prototype.with = function () {

    var peers = Utils.flatten(Array.prototype.slice.call(arguments));
    for (var i = 0, li = peers.length; i < li; i++) {
        Utils.assert(typeof peers[i] === 'string', 'peers must be a string');
    }

    this._dependency('with', peers, function (value, state, options) {

        if (!state.parent) {
            return Errors.create('any.with.parent', null, state, options);
        }

        if (value === undefined) {
            return null;
        }

        for (var i = 0, il = peers.length; i < il; ++i) {
            var peer = peers[i];
            if (!state.parent.hasOwnProperty(peer) ||
                state.parent[peer] === undefined) {
                return Errors.create('any.with.peer', { value: peer }, state, options);
            }
        }

        return null;
    });

    return this;
};


internals.Any.prototype.without = function () {

    var peers = Utils.flatten(Array.prototype.slice.call(arguments));
    for (var i = 0, li = peers.length; i < li; i++) {
        Utils.assert(typeof peers[i] === 'string', 'peers must be strings');
    }

    this._dependency('without', peers, function (value, state, options) {

        if (!state.parent) {
            return Errors.create('any.without.parent', null, state, options);
        }

        if (value === undefined) {
            return null;
        }

        for (var i = 0, il = peers.length; i < il; ++i) {
            var peer = peers[i];
            if (state.parent.hasOwnProperty(peer) &&
                state.parent[peer] !== undefined) {

                return Errors.create('any.without.peer', { value: peer }, state, options);
            }
        }

        return null;
    });

    return this;
};


internals.Any.prototype.xor = function () {

    var peers = Utils.flatten(Array.prototype.slice.call(arguments));

    this._dependency('xor', peers, function (value, state, options) {

        if (!state.parent) {
            return Errors.create('any.xor.parent', null, state, options);
        }

        var present = (value !== undefined && value !== null && value !== '' ? 1 : 0);

        for (var i = 0, il = peers.length; i < il && present < 2; ++i) {
            var peer = peers[i];
            if (state.parent.hasOwnProperty(peer) &&
                state.parent[peer] !== undefined) {

                ++present;
            }
        }

        if (present === 1) {
            return null;
        }

        if (present === 0) {
            return Errors.create('any.xor.missing', { value: peers }, state, options);
        }

        return Errors.create('any.xor.peer', { value: peers }, state, options);
    });

    return this;
};


internals.Any.prototype.or = function () {

    var peers = Utils.flatten(Array.prototype.slice.call(arguments));
    for (var i = 0, li = peers.length; i < li; i++) {
        Utils.assert(typeof peers[i] === 'string', 'peers must be a string');
    }

    this._dependency('or', peers, function (value, state, options) {

        if (!state.parent) {
            return Errors.create('any.or.parent', null, state, options);
        }

        if (value !== undefined) {
            return null;
        }

        for (var i = 0, il = peers.length; i < il; ++i) {
            var peer = peers[i];
            if (state.parent.hasOwnProperty(peer) &&
                state.parent[peer] !== undefined) {
                return null;
            }
        }

        return Errors.create('any.or.peer', { value: peers }, state, options);
    });

    return this;
};


internals.Any.prototype.rename = function (to, renameOptions) {

    var defaults = {
        move: false,
        multiple: false,
        override: false
    };

    renameOptions = Utils.merge(defaults, renameOptions);

    this._mutate(function (value, state, options) {

        if (!state.parent) {
            return Errors.create('any.rename.parent', null, state, options);
        }

        if (!renameOptions.multiple &&
            state.renamed[to]) {

            return Errors.create('any.rename.multiple', { value: to }, state, options);
        }

        if (state.parent.hasOwnProperty(to) &&
            !renameOptions.override &&
            !state.renamed[to]) {

            return Errors.create('any.rename.override', { value: to }, state, options);
        }

        state.parent[to] = state.parent[state.key];
        state.renamed[to] = true;

        if (renameOptions.move) {
            delete state.parent[state.key];
        }

        return null;
    });

    return this;
};


internals.Any.prototype.default = function (value) {

    this._flags.default = value;
    return this;
};


internals.Any.prototype.description = function (desc) {

    Utils.assert(typeof desc === 'string', 'Description must be a string');
    this._description = desc || '';
    return this;
};


internals.Any.prototype.notes = function (notes) {

    Utils.assert(notes && (typeof notes === 'string' || Array.isArray(notes)), 'Notes must be a string or array');
    this._notes = this._notes.concat(notes || '');
    return this;
};


internals.Any.prototype.tags = function (tags) {

    Utils.assert(tags && (typeof tags === 'string' || Array.isArray(tags)), 'Tags must be a string or array');
    this._tags = this._tags.concat(tags || '');
    return this;
};


internals.Any.prototype._validate = function (value, state, options) {

    var self = this;

    // Setup state and settings

    state = state || { parent: null, key: '', path: '', renamed: {} };

    if (this._settings) {
        options = Utils.applyToDefaults(options, this._settings);
    }

    var errors = [];

    var process = function () {

        // Validate dependencies

        for (var i = 0, il = self._dependencies.length; i < il; ++i) {
            var err = self._dependencies[i].func(value, state, options);
            if (err) {
                errors.push(err);
                if (options.abortEarly) {
                    return errors;
                }
            }
        }

        // Check allowed and denied values using the original value

        if (self._valids.has(value, self._flags.insensitive)) {
            return finish();
        }

        if (self._invalids.has(value, self._flags.insensitive)) {
            errors.push(Errors.create(value === '' ? 'any.empty' : 'any.invalid', { value: (value === '' ? '' : self._invalids.key(value)) }, state, options));
            if (options.abortEarly) {
                return errors;
            }
        }

        // Convert value

        if (options.convert &&
            self._convert) {

            var original = value;
            value = self._convert(original);
            if (original !== value) {

                // Check allowed and denied values using the converted value

                if (self._valids.has(value, self._flags.insensitive)) {
                    return finish();
                }

                if (self._invalids.has(value, self._flags.insensitive)) {
                    errors.push(Errors.create('any.invalid', { value: self._invalids.key(value) }, state, options));
                    if (options.abortEarly) {
                        return errors;
                    }
                }
            }
        }

        // Required values did not match

        if (self._flags.allowOnly) {
            errors.push(Errors.create('any.validate.allowOnly', { value: self._valids.toString(false) }, state, options));
            if (options.abortEarly) {
                return errors;
            }
        }

        // Validate tests

        for (i = 0, il = self._tests.length; i < il; ++i) {
            var err = self._tests[i].func(value, state, options);
            if (err) {
                if (Array.isArray(err)) {
                    errors = errors.concat(err);
                }
                else {
                    errors.push(err);
                }

                if (options.abortEarly) {
                    return errors;
                }
            }
        }

        return finish();
    };

    var finish = function () {

        // Apply mutators as long as there are no errors

        for (var m = 0, ml = self._mutators.length; m < ml && !errors.length; ++m) {
            var err = self._mutators[m](value, state, options);
            if (err) {
                errors.push(err);
            }
        }

        if (!errors.length &&
            state.parent &&
            ((options.modify && state.parent.hasOwnProperty(state.key)) || (value === undefined && self._flags.default !== undefined))) {

            state.parent[state.key] = (value !== undefined ? value : self._flags.default);
        }

        // Return null or errors

        return errors.length ? errors : null;
    };

    return process();
};


internals.Any.prototype.validate = function (object, options) {

    var settings = Utils.applyToDefaults(internals.defaults, options || {});

    Utils.assert(!settings.modify || settings.convert, 'Cannot save and skip conversions at the same time');

    var errors = this._validate(object, null, settings);
    return Errors.process(errors, object);
};


internals.Any.prototype.validateCallback = function (object, options, callback) {       // Not actually async, just callback interface

    var err = this.validate(object, options);
    return callback(err);
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
    if (valids) {
        description.valids = valids;
    }

    var invalids = this._invalids.values();
    if (invalids) {
        description.invalids = invalids;
    }

    description.rules = [];

    var validators = [].concat(this._dependencies, this._tests);
    for (var i = 0, il = validators.length; i < il; ++i) {
        var validator = validators[i];
        if (validator.name) {
            var item = { name: validator.name };
            if (validator.arg) {
                item.arg = validator.arg;
            }
            description.rules.push(item);
        }
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

    if (values) {
        for (var i = 0, il = values.length; i < il; ++i) {
            this.add(values[i]);
        }
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

    return list.length ? list : null;
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