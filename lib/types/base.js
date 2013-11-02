// Load modules

var Errors = require('../errors');
var Utils = require('../utils');
var Set = require('../set');


// Declare internals

var internals = {};


module.exports = internals.Base = function () {

    this._validators = [];
    this._mutators = [];

    this._modifiers = new Set();
    this._valids = new Set([undefined]);
    this._invalids = new Set([null]);
    this._allowOnly = false;
    this._shortCircuit = true;
};


internals.Base.prototype._test = function (key, value) {

    this._validators.push(value);
};


internals.Base.prototype._mutate = function (value) {

    this._mutators.push(value);
};


internals.Base.prototype.allow = function (value) {

    this._invalids.remove(value);
    this._valids.add(value);
    return this;
};


internals.Base.prototype.deny = function (value) {

    this._valids.remove(value);
    this._invalids.add(value);
    return this;
};


internals.Base.prototype.required = function () {

    this.deny(undefined);
    this._modifiers.add('required');
    return this;
};


internals.Base.prototype.optional = function () {

    this._invalids.remove(undefined);
    this._valids.add(undefined);
    return this;
};


internals.Base.prototype.nullOk = function () {

    this.allow(null);
    this._modifiers.add('nullOk');
    return this;
};


internals.Base.prototype.empty = function () {

    this.allow(null);
    this._modifiers.add('empty');
    return this;
};


internals.Base.prototype.valid = function (acceptable) {

    if (!Array.isArray(acceptable)) {
        acceptable = Array.prototype.slice.call(arguments);
    }

    for (var i = 0, il = acceptable.length; i < il; ++i) {
        this.allow(acceptable[i]);
    }

    this._allowOnly = true;
    return this;
};


internals.Base.prototype.invalid = function (unacceptable) {

    if (!Array.isArray(unacceptable)) {
        unacceptable = Array.prototype.slice.call(arguments);
    }

    for (var i = 0, il = unacceptable.length; i < il; ++i) {
        this.deny(unacceptable[i]);
    }

    return this;
};


internals.with = function (peers) {

    peers = Utils.clone(peers);

    return function (value, obj, key, errors, keyPath) {

        if (!obj) {
            return false;
        }

        for (var i = 0, il = peers.length; i < il; ++i) {
            if (!obj.hasOwnProperty(peers[i]) ||
                typeof (obj[peers[i]]) === 'undefined' ||
                obj[peers[i]] === null ||
                obj[peers[i]] === '') {

                return false;
            }
        }

        return true;
    };
};


internals.Base.prototype.with = function () {

    for (var i = 0, li = arguments.length; i < li; i++) {
        Utils.assert(typeof arguments[i] === 'string', 'arguments must be a string');
    }
    this._test('with', internals.with(Array.prototype.slice.call(arguments)));
    return this;
};


internals.without = function (peers) {

    return function (value, obj, key, errors, keyPath) {

        return !internals.with(peers)(value, obj);
    };
};


internals.Base.prototype.without = function () {

    for (var i = 0, li = arguments.length; i < li; i++) {
        Utils.assert(typeof arguments[i] === 'string', 'arguments must be a string');
    }
    if (this._modifiers.has('required')) {
        return this.xor(Array.prototype.slice.call(arguments));
    }

    this._test('without', internals.without(Array.prototype.slice.call(arguments)));
    return this;
};


internals.xor = function (peers) {

    var withFn = internals.with(peers);

    return function (value, obj, key, errors, keyPath) {

        var result = !!((typeof value !== 'undefined' && value !== null && value !== '') ^ withFn(value, obj, key, errors, keyPath));
        if (!result) {
            errors.addLocalized('base.without', key, { value: peers }, keyPath);
        }

        return result;
    };
};


internals.Base.prototype.xor = function () {

    this._test('xor', internals.xor(Array.prototype.slice.call(arguments)));
    this._invalids.remove(undefined);
    this._invalids.remove(null);
    this._invalids.remove('');

    return this;
};


internals.rename = function (to, options) {

    var defaults = {
        deleteOrig: false,
        allowMult: false,
        allowOverwrite: false
    };

    options = Utils.merge(defaults, options);

    return function (value, obj, key, errors, keyPath) {

        if (!obj) {
            return false;
        }

        if (options.allowMult === false && to in errors._renamed) {
            errors.addLocalized('base.rename.allowMult', key, { value: to }, keyPath);
            return false;
        }

        if (options.allowOverwrite === false && obj.hasOwnProperty(to)) {
            errors.addLocalized('base.rename.allowOverwrite', key, { value: to }, keyPath);
            return false;
        }

        obj[to] = value;

        if (options.deleteOrig === true) {
            delete obj[key];
        }

        if (options.allowMult === false) {
            errors._renamed[to] = errors._renamed[to]++ || 1;
        }

        return true;
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


internals.Base.prototype.noShortCircuit = function () {

    this._shortCircuit = false;
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


internals.Base.prototype.validate = function (value, obj, key, errors, keyPath) {

    var self = this;

    key = key || '<root>';
    errors = errors || new Errors(this);

    var validate = function () {

        var result = true;

        if (self._valids.has(value)) {
            return finish(true);
        }

        if (self._invalids.has(value)) {
            errors.addLocalized('base.invalid', key, { value: (value === '' ? 'empty' : self._invalids.key(value)) }, keyPath);
            if (self._shortCircuit) {
                return false;
            }

            result = false;
        }

        if (self._allowOnly === true) {
            errors.addLocalized('base.validate.allowOnly', key, { value: self._valids.toString() }, keyPath);
            if (self._shortCircuit) {
                return false;
            }

            result = false;
        }

        for (var i = 0, il = self._validators.length; i < il; ++i) {
            result = self._validators[i](value, obj, key, errors, keyPath);
            if (!result && self._shortCircuit) {
                return false;
            }
        }

        return finish(result);
    };

    var finish = function (result) {

        for (var m = 0, ml = self._mutators.length; m < ml && (self._shortCircuit || result) ; ++m) {
            result = self._mutators[m](value, obj, key, errors, keyPath);
        }

        return result;
    };

    return validate();
};
