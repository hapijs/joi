// Load modules

var Errors = require('../errors');
var Utils = require('../utils');
var Set = require('../set');


// Declare internals

var internals = {
    DATA_KEY: '__validators',
    KEY_LIST: '__checks',
    ARGS_LIST: '__args'
};



module.exports = internals.BaseType = function () {

    this[internals.DATA_KEY] = [];
    this[internals.KEY_LIST] = [];
    this[internals.ARGS_LIST] = [];
    this.__modifiers = new Set([]);
    this.__valids = new Set(this.__defaultValids || []);
    this.__invalids = new Set(this.__defaultInvalids || []);
    this.__allowOnly = false;
    this.options = {
        shortCircuit: true
    };

    if (typeof this.base !== 'undefined' &&
        this.base !== null) {

        this.base();
    }

    if (typeof this.__name !== 'undefined' &&
        this.__name !== null) {

        this.type = this.__name;
    }

    return this;
};


internals.BaseType.prototype.__defaultValids = [undefined];


internals.BaseType.prototype.__defaultInvalids = [null];


internals.BaseType.prototype.mutatorMethods = {
    rename: 1
};


internals.BaseType.prototype.valueOf = function () {

    var value = {
        __valids: this.__valids,
        __invalids: this.__invalids,
        __modifiers: this.__modifiers._values,
        options: this.options
    };

    value[internals.DATA_KEY] = this[internals.DATA_KEY];
    value[internals.KEY_LIST] = this[internals.KEY_LIST];
    value[internals.ARGS_LIST] = this[internals.ARGS_LIST];

    return value;
};


internals.BaseType.prototype.getDataKey = function () {

    return internals.DATA_KEY;
};


internals.BaseType.prototype.toString = function () {

    return JSON.stringify(this.valueOf());
};


internals.BaseType.prototype.add = function (key, value, args) {

    Utils.assert(typeof key !== 'undefined' && key !== null, '(type).add must be given a key');

    if (typeof value !== 'undefined' && value !== null) {
        // TODO: add check for invalid keys

        this[internals.DATA_KEY].push(value);
        this[internals.KEY_LIST].push(key);
        this[internals.ARGS_LIST].push(args);
    }

    return this[internals.DATA_KEY];
};


internals.BaseType.prototype.exists = function (n) {

    return (typeof n !== 'undefined' && n !== null);
};


internals.BaseType.prototype.allow = function (value) {

    this.__invalids.remove(value);
    this.__valids.add(value);
    return this;
};


internals.BaseType.prototype.deny = function (value) {

    this.__valids.remove(value);
    this.__invalids.add(value);
    return this;
};


internals.BaseType.prototype.required = function () {

    this.deny(undefined);
    this.__modifiers.add('required');
    return this;
};


internals.BaseType.prototype.optional = function () {

    this.__invalids.remove(undefined);
    this.__valids.add(undefined);
    return this;
};


internals.BaseType.prototype.nullOk = function () {

    this.allow(null);
    this.__modifiers.add('nullOk');
    return this;
};


internals.BaseType.prototype.empty = function () {

    this.allow(null);
    this.__modifiers.add('empty');
    return this;
};


internals.BaseType.prototype.valid = function (acceptable) {

    if(!Array.isArray(acceptable)) {
        acceptable = Array.prototype.slice.call(arguments);
    }

    for (var i = acceptable.length - 1; i >= 0; --i) {
        Utils.assert(this.validate(acceptable[i]) === true, 'input to .valid() must be valid ' + this.__name + '(' + acceptable[i] + ')');
        this.allow(acceptable[i]);
    }
    this.__allowOnly = true;
    return this;
};


internals.BaseType.prototype.invalid = function (unacceptable) {

    if(!Array.isArray(unacceptable)) {
        unacceptable = Array.prototype.slice.call(arguments);
    }

    for (var i = unacceptable.length - 1; i >= 0; --i) {
        Utils.assert(this.validate(unacceptable[i]) === true, 'input to .invalid() must be valid ' + this.__name + '(' + unacceptable[i] + ')');
        this.deny(unacceptable[i]);
    }
    return this;
};


internals.BaseType.prototype._with = function (peers) {

    return function (value, obj, key, errors, keyPath) {

        // TODO: make sure keys exists
        for (var i in peers) {
            if (!obj.hasOwnProperty(peers[i]) ||
                typeof(obj[peers[i]]) === 'undefined' ||
                obj[peers[i]] === null ||
                obj[peers[i]] === '') {

                return false;
            }
        }
        return true;
    };
};


internals.BaseType.prototype.with = function () {

    for (var i = 0, li = arguments.length; i < li; i++) {
        Utils.assert(typeof arguments[i] === 'string', 'arguments must be a string');
    }
    this.add('with', this._with(Array.prototype.slice.call(arguments)), arguments);
    return this;
};


internals.BaseType.prototype._without = function (peers) {

    var self = this;

    return function (value, obj, key, errors, keyPath) {

        return !self._with(peers)(value, obj);
    };
};


internals.BaseType.prototype.without = function () {

    for (var i = 0, li = arguments.length; i < li; i++) {
        Utils.assert(typeof arguments[i] === 'string', 'arguments must be a string');
    }
    if (this.__modifiers.has('required')) {
        return this.xor(Array.prototype.slice.call(arguments));
    }

    this.add('without', this._without(Array.prototype.slice.call(arguments)), arguments);
    return this;
};


internals.BaseType.prototype._xor = function (peers) {

    var self = this;
    var withFn = self._with(peers);

    return function (value, obj, key, errors, keyPath) {

        var result = !!((typeof value !== 'undefined' && value !== null && value !== '') ^ withFn(value, obj, key, errors, keyPath));

        if (!result) {
            errors.addLocalized('base.without', key, {
                value: peers
            }, keyPath);
        }

        return result;
    };
};


internals.BaseType.prototype.xor = function () {

    this.add('xor', this._xor(Array.prototype.slice.call(arguments)), arguments);
    this.__invalids.remove(undefined);
    this.__invalids.remove(null);
    this.__invalids.remove('');

    return this;
};


internals.BaseType.prototype._renameDefaultOptions = {
    deleteOrig: false,
    allowMult: false,
    allowOverwrite: false
};


internals.BaseType.prototype._rename = function (to, options) {

    var self = this;

    options = Utils.merge(Utils.clone(this._renameDefaultOptions), options);

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


internals.BaseType.prototype.rename = function (to, options) {

    this.add('rename', this._rename(to, options), arguments);
    return this;
};


internals.BaseType.prototype.description = function (desc) {

    Utils.assert(typeof desc === 'string', 'Validator description must be a string');
    this.description = desc || '';
    return this;
};


internals.BaseType.prototype.noShortCircuit = function () {

    this.options.shortCircuit = false;
    return this;
};


internals.BaseType.prototype.notes = function (notes) {

    Utils.assert(typeof notes === 'string' || Array.isArray(notes), 'Validator notes must be a string or array');
    this.notes = notes || '';
    return this;
};


internals.BaseType.prototype.tags = function (tags) {

    Utils.assert(Array.isArray(tags), 'Validator tags must be an array');
    this.tags = tags || [];
    return this;
};


internals.BaseType.prototype.RequestErrorFactory = function (request) {

    request.validationErrors = [];

    return function (msg) {

        var err = '[ValidationError]: ' + msg.toString();
        request.validationErrors.push(err);
    };
};


internals.BaseType.prototype.validate = function (value, obj, key, errors, keyPath) {

    var status = true;
    var finalizeFns = [];
    key = key || '<root>';
    obj = obj || { '0': value };
    errors = errors || new Errors(this);

    // Check vs valid/invalid values

    if (this.__invalids._values.indexOf(value) >= 0) {
        status = false;
        var invalidValue = this.__invalids._values[this.__invalids._values.indexOf(value)];
        if (invalidValue === '') {
            invalidValue = 'empty';
        }
        errors.addLocalized('base.invalid', key, {
            value: invalidValue
        }, keyPath);
        if (this.options.shortCircuit === true) {
            return status;
        }
    }

    if (this.__valids._values.indexOf(value) >= 0) {
        status = true;
        if (this.options.shortCircuit === true) {
            return status;
        }
    }

    if (this.__allowOnly === true &&
        this.__valids._values.indexOf(value) < 0) {

        status = false;

        var valids = this.__valids._values.map(function (valid) {

            return typeof valid === 'undefined' ? 'undefined' : valid === null ? 'null' : valid.toString();
        });

        errors.addLocalized('base.validate.allowOnly', key, {
            value: valids.join(', ')
        }, keyPath);

        if (this.options.shortCircuit === true) {
            return status;
        }
    }

    // Evaluate validators

    for (var j in this.__validators) {
        // TODO: handle finalizeFns aka mutators (need to run after all other validators)
        var validatorName = this.__checks[j];

        if (validatorName in this.mutatorMethods) {
            finalizeFns.push(j);
            continue;
        }

        var result = this.__validators[j](value, obj || { '0': value }, key, errors, keyPath);
        if (!result) {
            status = false;
            if (this.options.shortCircuit === true || validatorName == 'base') {  // doesn't make sense to continue validation when type is wrong
                return status;
            }
        }
    }

    for (var l in finalizeFns) {
        var resultFns = this.__validators[finalizeFns[l]](value, obj || { '0': value }, key, errors, keyPath);
        if (!resultFns) {
            status = false;
            if (this.options.shortCircuit === true) {
                return status;
            }
        }
    }

    return status;
};
