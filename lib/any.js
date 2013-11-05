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

    languagePath: Path.join(__dirname, '..', 'languages', 'en-us.json')
};


module.exports = internals.Any = function () {

    this._settings = null;
    this._validators = [];
    this._mutators = [];
    this._valids = new internals.Set([undefined]);
    this._invalids = new internals.Set([null]);
    this._insensitive = false;
    this._allowOnly = false;
};


internals.Any.prototype._test = function (func) {

    this._validators.push(func);
};


internals.Any.prototype._mutate = function (value) {

    this._mutators.push(value);
};


internals.Any.error = function (type, context, options) {

    context = context || {};
    context.key = options.key || '<root>';
    return { type: type, context: context, path: options.path };
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
    this._allowOnly = true;
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


internals.with = function (peers) {

    return function (value, state, options) {

        if (!state.parent) {
            return internals.Any.error('any.with.parent', null, state);
        }

        for (var i = 0, il = peers.length; i < il; ++i) {
            if (!state.parent.hasOwnProperty(peers[i]) ||
                state.parent[peers[i]] === undefined ||
                state.parent[peers[i]] === null ||
                state.parent[peers[i]] === '') {

                return internals.Any.error('any.with.peer', { value: peers[i] }, state);
            }
        }

        return null;
    };
};


internals.Any.prototype.with = function () {

    var peers = Utils.flatten(Array.prototype.slice.call(arguments));
    for (var i = 0, li = peers.length; i < li; i++) {
        Utils.assert(typeof peers[i] === 'string', 'peers must be a string');
    }

    this._test(internals.with(peers));
    return this;
};


internals.Any.prototype.without = function () {

    var peers = Utils.flatten(Array.prototype.slice.call(arguments));
    for (var i = 0, li = peers.length; i < li; i++) {
        Utils.assert(typeof peers[i] === 'string', 'peers must be strings');
    }

    this._test(function (value, state, options) {

        if (!state.parent) {
            return internals.Any.error('any.without.parent', null, state);
        }

        for (var i = 0, il = peers.length; i < il; ++i) {
            if (state.parent.hasOwnProperty(peers[i]) &&
                state.parent[peers[i]] !== undefined &&
                state.parent[peers[i]] !== null &&
                state.parent[peers[i]] !== '') {

                return internals.Any.error('any.without.peer', { value: peers[i] }, state);
            }
        }

        return null;
    });

    return this;
};


internals.Any.prototype.xor = function () {

    this._invalids.remove(undefined);
    this._invalids.remove(null);
    this._invalids.remove('');

    var peers = Utils.flatten(Array.prototype.slice.call(arguments));
    var withFn = internals.with(peers);

    this._test(function (value, state, options) {

        var present = (value !== undefined && value !== null && value !== '');
        var other = !withFn(value, state, options);
        if (present ^ other) {
            return null;
        }

        return internals.Any.error('any.xor', { value: peers }, state);
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
            return internals.Any.error('any.rename.parent', null, state);
        }

        if (!renameOptions.multiple &&
            state.renamed[to]) {

            return internals.Any.error('any.rename.multiple', { value: to }, state);
        }

        if (state.parent.hasOwnProperty(to) &&
            !renameOptions.override &&
            !state.renamed[to]) {

            return internals.Any.error('any.rename.override', { value: to }, state);
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


internals.Any.prototype.description = function (desc) {

    Utils.assert(typeof desc === 'string', 'Description must be a string');
    this.description = desc || '';
    return this;
};


internals.Any.prototype.notes = function (notes) {

    Utils.assert(notes && (typeof notes === 'string' || Array.isArray(notes)), 'Notes must be a string or array');
    this.notes = [].concat(notes || '');
    return this;
};


internals.Any.prototype.tags = function (tags) {

    Utils.assert(tags && (typeof tags === 'string' || Array.isArray(tags)), 'Tags must be a string or array');
    this.tags = [].concat(tags || '');
    return this;
};


internals.Any.prototype._validate = function (value, state, options) {

    var self = this;

    state = state || { parent: null, key: '', path: '', renamed: {} };

    if (this._settings) {
        options = Utils.applyToDefaults(options, this._settings);
    }

    var convert = function () {

        if (!options.convert ||
            !self._convert) {

            return validate();
        }

        value = self._convert(value);
        if (state.parent &&
            options.modify) {

            state.parent[state.key] = value;
        }

        return validate();
    };

    var validate = function () {

        var errors = [];

        if (self._valids.has(value, self._insensitive)) {
            return finish(errors);
        }

        if (self._invalids.has(value, self._insensitive)) {
            errors.push(internals.Any.error('any.invalid', { value: (value === '' ? 'empty' : self._invalids.key(value)) }, state));
            if (options.abortEarly) {
                return errors;
            }
        }

        if (self._allowOnly === true) {
            errors.push(internals.Any.error('any.validate.allowOnly', { value: self._valids.toString() }, state));
            if (options.abortEarly) {
                return errors;
            }
        }

        for (var i = 0, il = self._validators.length; i < il; ++i) {
            var err = self._validators[i](value, state, options);
            if (err) {
                Utils.assert(typeof err === 'object', 'oops');
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

        return finish(errors);
    };

    var finish = function (errors) {

        for (var m = 0, ml = self._mutators.length; m < ml && (!options.abortEarly || !errors.length) ; ++m) {
            var err = self._mutators[m](value, state, options);
            if (err) {
                errors.push(err);
            }
        }

        return errors.length ? errors : null;
    };

    return convert();
};


internals.Any.prototype.validate = function (object, options) {

    var settings = Utils.applyToDefaults(internals.defaults, options || {});

    Utils.assert(!settings.modify || settings.convert, 'Cannot save and skip conversions at the same time');

    var errors = this._validate(object, null, settings);
    return Errors.process(errors, object, settings);
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


internals.Set.prototype.toString = function () {

    var list = '';
    var values = Object.keys(this._set);
    for (var i = 0, il = values.length; i < il; ++i) {

        if (i) {
            list += ', ';
        }

        var value = this._set[values[i]];
        list += (value === undefined ? 'undefined' : (value === null ? 'null' : value));
    }

    return list;
};