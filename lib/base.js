// Load modules

var Sys = require('sys');
var Path = require('path');
var Errors = require('./errors');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Base = function () {

    this._validators = [];
    this._mutators = [];

    this._modifiers = new internals.Set();
    this._valids = new internals.Set([undefined]);
    this._invalids = new internals.Set([null]);
    this._allowOnly = false;
};


internals.Base.prototype._test = function (func) {

    this._validators.push(func);
};


internals.Base.prototype._mutate = function (value) {

    this._mutators.push(value);
};


internals.Base.error = function (type, context, options) {

    context = context || {};
    context.key = options.key;
    return { type: type, context: context, path: options.keyPath };
};


internals.Base.prototype._allow = function (value) {

    this._invalids.remove(value);
    this._valids.add(value);
    return this;
};


internals.Base.prototype.allow = function (value) {

    this._allow(value);
    return this;
};


internals.Base.prototype._deny = function (value) {

    this._valids.remove(value);
    this._invalids.add(value);
    return this;
};


internals.Base.prototype.deny = function (value) {

    this._deny(value);
    return this;
};


internals.Base.prototype.required = function () {

    this._deny(undefined);
    this._modifiers.add('required');
    return this;
};


internals.Base.prototype.optional = function () {

    this._invalids.remove(undefined);
    this._valids.add(undefined);
    return this;
};


internals.Base.prototype.nullOk = function () {

    this._allow(null);
    this._modifiers.add('nullOk');
    return this;
};


internals.Base.prototype.empty = function () {

    this._allow(null);
    this._modifiers.add('empty');
    return this;
};


internals.Base.prototype.valid = function (acceptable) {

    if (!Array.isArray(acceptable)) {
        acceptable = Array.prototype.slice.call(arguments);
    }

    for (var i = 0, il = acceptable.length; i < il; ++i) {
        this._allow(acceptable[i]);
    }

    this._allowOnly = true;
    return this;
};


internals.Base.prototype.invalid = function (unacceptable) {

    if (!Array.isArray(unacceptable)) {
        unacceptable = Array.prototype.slice.call(arguments);
    }

    for (var i = 0, il = unacceptable.length; i < il; ++i) {
        this._deny(unacceptable[i]);
    }

    return this;
};


internals.with = function (peers) {

    peers = Utils.clone(peers);

    return function (value, options) {

        if (!options.parent) {
            return internals.Base.error('base.with.parent', null, options);
        }

        for (var i = 0, il = peers.length; i < il; ++i) {
            if (!options.parent.hasOwnProperty(peers[i]) ||
                typeof (options.parent[peers[i]]) === 'undefined' ||
                options.parent[peers[i]] === null ||
                options.parent[peers[i]] === '') {

                return internals.Base.error('base.with.peer', { value: peers[i] }, options);
            }
        }

        return null;
    };
};


internals.Base.prototype.with = function () {

    for (var i = 0, li = arguments.length; i < li; i++) {
        Utils.assert(typeof arguments[i] === 'string', 'arguments must be a string');
    }
    this._test(internals.with(Array.prototype.slice.call(arguments)));
    return this;
};


internals.without = function (peers) {

    return function (value, options) {

        return !internals.with(peers)(value, options);
    };
};


internals.Base.prototype.without = function () {

    for (var i = 0, li = arguments.length; i < li; i++) {
        Utils.assert(typeof arguments[i] === 'string', 'arguments must be a string');
    }
    if (this._modifiers.has('required')) {
        return this.xor(Array.prototype.slice.call(arguments));
    }

    this._test(internals.without(Array.prototype.slice.call(arguments)));
    return this;
};


internals.xor = function (peers) {

    var withFn = internals.with(peers);

    return function (value, options) {

        var present = (value !== undefined && value !== null && value !== '');
        var other = !withFn(value, options);
        if (present ^ other) {
            return null;
        }

        return internals.Base.error('base.without', { value: peers }, options);
    };
};


internals.Base.prototype.xor = function () {

    this._test(internals.xor(Array.prototype.slice.call(arguments)));
    this._invalids.remove(undefined);
    this._invalids.remove(null);
    this._invalids.remove('');

    return this;
};


internals.rename = function (to, renameOptions) {

    var defaults = {
        deleteOrig: false,
        allowMult: false,
        allowOverwrite: false
    };

    renameOptions = Utils.merge(defaults, renameOptions);

    return function (value, options) {

        if (!options.parent) {
            return internals.Base.error('base.rename.parent', null, options);
        }

        options.state.renamed = options.state.renamed || {};
        if (!renameOptions.allowMult &&
            options.state.renamed[to]) {

            return internals.Base.error('base.rename.allowMult', { value: to }, options);
        }

        if (options.parent.hasOwnProperty(to) &&
            !renameOptions.allowOverwrite &&
            !options.state.renamed[to]) {

            return internals.Base.error('base.rename.allowOverwrite', { value: to }, options);
        }

        options.state.renamed[to] = true;

        options.parent[to] = options.parent[options.key];

        if (renameOptions.deleteOrig) {
            delete options.parent[options.key];
        }

        return null;
    };
};


internals.Base.prototype.rename = function (to, options) {

    this._mutate(internals.rename(to, options));
    return this;
};


internals.Base.prototype.description = function (desc) {

    Utils.assert(typeof desc === 'string', 'Description must be a string');
    this.description = desc || '';
    return this;
};


internals.Base.prototype.notes = function (notes) {

    Utils.assert(typeof notes === 'string' || Array.isArray(notes), 'Notes must be a string or array');
    this.notes = notes || '';
    return this;
};


internals.Base.prototype.tags = function (tags) {

    Utils.assert(Array.isArray(tags), 'Tags must be an array');
    this.tags = tags || [];
    return this;
};


internals.Base.prototype._validate = function (value, options) {

    var self = this;

    options = options || {};
    options.key = options.key || '<root>';
    options.keyPath = options.keyPath || '';
    options.earlyAbort = options.hasOwnProperty('earlyAbort') ? options.earlyAbort : true;      // Defaults to true
    options.state = options.state || {};

    var convert = function () {

        if (options.skipConversions ||
            !self._convert) {

            return validate();
        }

        value = self._convert(value);
        if (options.parent &&
            options.saveConversions) {

            options.parent[options.key] = value;
        }

        return validate();
    };

    var validate = function () {

        var errors = [];

        if (self._valids.has(value)) {
            return finish(errors);
        }

        if (self._invalids.has(value)) {
            errors.push(internals.Base.error('base.invalid', { value: (value === '' ? 'empty' : self._invalids.key(value)) }, options));
            if (options.earlyAbort) {
                return errors;
            }
        }

        if (self._allowOnly === true) {
            errors.push(internals.Base.error('base.validate.allowOnly', { value: self._valids.toString() }, options));
            if (options.earlyAbort) {
                return errors;
            }
        }

        for (var i = 0, il = self._validators.length; i < il; ++i) {
            var err = self._validators[i](value, options);
            if (err) {
                if (Array.isArray(err)) {
                    errors = errors.concat(err);
                }
                else {
                    errors.push(err);
                }

                if (options.earlyAbort) {
                    return errors;
                }
            }
        }

        return finish(errors);
    };

    var finish = function (errors) {

        for (var m = 0, ml = self._mutators.length; m < ml && (!options.earlyAbort || !errors.length) ; ++m) {
            var err = self._mutators[m](value, options);
            if (err) {
                if (Array.isArray(err)) {
                    errors = errors.concat(err);
                }
                else {
                    errors.push(err);
                }
            }
        }

        return errors.length ? errors : null;
    };

    return convert();
};


internals.defaults = {
    skipFunctions: false,
    saveConversions: false,
    skipConversions: false,
    stripExtraKeys: false,
    allowExtraKeys: false,
    earlyAbort: true,
    languagePath: Path.join(__dirname, '..', 'languages', 'en-us.json')
};


internals.Base.prototype.validate = function (object, options) {

    var settings = Utils.applyToDefaults(internals.defaults, options || {});
    var errors = this._validate(object, settings);
    return errors ? Errors.process(errors, object, settings) : null;
};


internals.types = {
    Base: internals.Base,
    String: require('./string'),
    Number: require('./number'),
    Boolean: require('./boolean'),
    Array: require('./array'),
    Object: require('./object'),
    Function: require('./function'),
    Any: require('./any')
};


// Set

internals.Set = function (values) {

    this._set = {};
    if (values) {
        for (var i = 0, il = values.length; i < il; ++i) {
            this.add(values[i]);
        }
    }
};


internals.Set.prototype.add = function (value) {

    this._set[this.key(value)] = value;
};


internals.Set.prototype.remove = function (value) {

    delete this._set[this.key(value)];
};


internals.Set.prototype.has = function (value) {

    return this._set.hasOwnProperty(this.key(value));
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