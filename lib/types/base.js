// Load modules

var Errors = require('../errors');
var Utils = require('../utils');
var Set = require('../set');


// Declare internals

var internals = {
    mutatorMethods: {
        rename: 1
    }
};


module.exports = internals.Base = function () {

    this._validators = [];
    this._checks = [];

    this._modifiers = new Set();
    this._valids = new Set([undefined]);
    this._invalids = new Set([null]);
    this._allowOnly = false;
    this._shortCircuit = true;
};


internals.Base.prototype._test = function (key, value) {

    this._validators.push(value);
    this._checks.push(key);
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
        Utils.assert(this.validate(acceptable[i]) === true, 'input to .valid() must be valid ' + this._name + '(' + acceptable[i] + ')');
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
        Utils.assert(this.validate(unacceptable[i]) === true, 'input to .invalid() must be valid ' + this._name + '(' + unacceptable[i] + ')');
        this.deny(unacceptable[i]);
    }

    return this;
};


internals.with = function (peers) {

    peers = Utils.clone(peers);

    return function (value, obj, key, errors, keyPath) {

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

        errors = errors || {};
        errors.addLocalized = errors.addLocalized || function () { };
        var renamed = errors._renamed || {};

        if (options.allowMult === false && to in renamed) {
            errors.addLocalized('base.rename.allowMult', key, {
                value: to
            }, keyPath);
            return false;
        }

        if (options.allowOverwrite === false && obj.hasOwnProperty(to)) {
            errors.addLocalized('base.rename.allowOverwrite', key, {
                value: to
            }, keyPath);
            return false;
        }

        obj[to] = value;

        if (options.deleteOrig === true) {
            delete obj[key];
        }

        if (options.allowMult === false) {
            renamed[to] = renamed[to]++ || 1;
        }

        key = to;
        return true;
    };
};


internals.Base.prototype.rename = function (to, options) {

    this._test('rename', internals.rename(to, options));
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

    var status = true;
    var finalizeFns = [];
    key = key || '<root>';
    obj = obj || { '0': value };
    errors = errors || new Errors(this);

    // Check valid / invalid values

    if (this._invalids.has(value)) {
        status = false;
        errors.addLocalized('base.invalid', key, {
            value: (value === '' ? 'empty' : this._invalids.key(value))
        }, keyPath);
        if (this._shortCircuit) {
            return status;
        }
    }

    if (this._valids.has(value)) {
        status = true;
        if (this._shortCircuit) {
            return status;
        }
    }

    if (this._allowOnly === true &&
        !this._valids.has(value)) {

        status = false;
        errors.addLocalized('base.validate.allowOnly', key, { value: this._valids.toString() }, keyPath);

        if (this._shortCircuit) {
            return status;
        }
    }

    // Evaluate validators

    for (var j in this._validators) {
        // TODO: handle finalizeFns aka mutators (need to run after all other validators)
        var validatorName = this._checks[j];

        if (validatorName in internals.mutatorMethods) {
            finalizeFns.push(j);
            continue;
        }

        var result = this._validators[j](value, obj || { '0': value }, key, errors, keyPath);
        if (!result) {
            status = false;
            if (this._shortCircuit || validatorName === 'base') {  // doesn't make sense to continue validation when type is wrong
                return status;
            }
        }
    }

    for (var l in finalizeFns) {
        var resultFns = this._validators[finalizeFns[l]](value, obj || { '0': value }, key, errors, keyPath);
        if (!resultFns) {
            status = false;
            if (this._shortCircuit) {
                return status;
            }
        }
    }

    return status;
};
