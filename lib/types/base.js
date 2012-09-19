/**
 * Module dependencies.
 */
var Utils = require('../utils');

/**
 * Constants
 */
var INTERNAL_DATA_KEY = '__validators';
var INTERNAL_KEY_LIST = '__checks';
var INTERNAL_ARGS_LIST = '__args';

/**
 * BaseType Constructor
 *
 * @api public
 */
var BaseType = function() {
    this[INTERNAL_DATA_KEY] = [];
    this[INTERNAL_KEY_LIST] = [];
    this[INTERNAL_ARGS_LIST] = [];
    this.__valids = new Utils.Set(this.__defaultValids || []);
    this.__invalids = new Utils.Set(this.__defaultInvalids || []);
    this.options = {
        shortCircuit: true
    };
    this.state = {}; // internal state
    this.errors = [];
    
    if (typeof this.base !== 'undefined' && this.base !== null) {
        this.base();
    }
    
    if (typeof this.__name !== 'undefined' && this.__name !== null) {
        this['type'] = this.__name;
    }
}

BaseType.prototype.__defaultValids = [undefined];
BaseType.prototype.__defaultInvalids = [null];

BaseType.prototype.mutatorMethods = {
    rename: 1
};

BaseType.prototype.valueOf = function() {
    // return this[INTERNAL_DATA_KEY];
    var value = {
        "__valids": this.__valids,
        "__invalids": this.__invalids,
        "options": this.options
    }
    
    value[INTERNAL_DATA_KEY] = this[INTERNAL_DATA_KEY]
    value[INTERNAL_KEY_LIST] = this[INTERNAL_KEY_LIST]
    value[INTERNAL_ARGS_LIST] = this[INTERNAL_ARGS_LIST]
    
    return value;
}

BaseType.prototype.getDataKey = function() {
    return INTERNAL_DATA_KEY;
}

BaseType.prototype.toString = function() {
    return JSON.stringify(this.valueOf());
}

BaseType.prototype.add = function(key, value, args) {
    if (typeof key == 'undefined' || key == null) {
        throw '(type).add must given a key';
    }
    
    if (typeof value !== 'undefined' && value !== null) {
        // TODO: add check for invalid keys
        
        this[INTERNAL_DATA_KEY].push(value);
        this[INTERNAL_KEY_LIST].push(key)
        this[INTERNAL_ARGS_LIST].push(args);
    }
    
    return this[INTERNAL_DATA_KEY];
}

var exists = function(n) {

    return (typeof n !== 'undefined' &&
            n !== null);
}
BaseType.prototype.exists = exists;

BaseType.prototype.allow = function(value) {

    this.__invalids.remove(value);
    this.__valids.add(value);
    return this;
}

BaseType.prototype.deny = function(value) {

    this.__valids.remove(value);
    this.__invalids.add(value);
    return this;
}

BaseType.prototype.required = function() {

    this.deny(undefined);
    return this;
}

BaseType.prototype.nullOk = function() {

    this.allow(null);
    return this;
}


BaseType.prototype.valid = function() {

    var acceptable = Array.prototype.slice.call(arguments);
    for(var i = acceptable.length - 1; i >= 0; i--) {

        Utils.assert(this.validate(acceptable[i]) == true, "input to .valid() must be valid " + this.__name + "(" + acceptable[i] + ")");
        this.allow(acceptable[i]);
    }
    return this;
}

BaseType.prototype.invalid = function() {

    var unacceptable = Array.prototype.slice.call(arguments);
    for(var i = unacceptable.length - 1; i >= 0; i--) {

        Utils.assert(this.validate(unacceptable[i]) == true, "input to .invalid() must be valid " + this.__name + "(" + unacceptable[i] + ")");
        this.deny(unacceptable[i]);
    }
    return this;
}

BaseType.prototype._with = function(peers) {

    return function(value, qstr, key) {

    // return function(value, qstr) {

        // TODO: make sure keys exists
        for(var i in peers) {

            if (!qstr.hasOwnProperty(peers[i]) || peers[i] === null) {

                return false;
            }
        }
        return true;
    }
}

BaseType.prototype.with = function() {

    this.add('with', this._with(Array.prototype.slice.call(arguments)), arguments);
    return this;
}

BaseType.prototype._without = function(peers) {

    var self = this;
    return function(value, qstr) {

        return !self._with(peers)(value, qstr);
    }
}

BaseType.prototype.without = function() {

    this.add('without', this._without(Array.prototype.slice.call(arguments)), arguments);
    return this;
}

BaseType.prototype._renameDefaultOptions = {
    deleteOrig: false,
    allowMult: false,
    allowOverwrite: false
}

BaseType.prototype._rename = function(to, options) {

    var self = this;
    
    options = Utils.merge(Utils.clone(this._renameDefaultOptions), options);
    
    return function(value, qstr, key, req) {

        req = req || {};
        req.addValidationError = req.addValidationError || function(){};
        var renamed = req._renamed || {};

        if (options.allowMult === false && to in renamed) {

            req.addValidationError("allowMult false and already renamed");
            return false;
        }
        
        if (options.allowOverwrite === false && qstr.hasOwnProperty(to)) {

            // console.log(key, to, qstr)
            req.addValidationError("allowOverwrite false and target exists: " + key + ", " +  to);
            return false;
        }
        
        qstr[to] = value;
        
        if (options.deleteOrig === true) {

            delete qstr[key];
        }
        
        if (options.allowMult === false) {

            renamed[to] = renamed[to]++ || 1;
        }
        
        key = to;
        
        return true;
    }
}

BaseType.prototype.rename = function(to, options) {

    this.add('rename', this._rename(to, options), arguments);
    return this;
}

BaseType.prototype.description = function(desc) {

    Utils.assert(typeof desc === 'string', 'Validator description must be a string');
    this.description = desc || '';
    return this;
}

BaseType.prototype.notes = function(notes) {

    Utils.assert(typeof notes === 'string' || notes instanceof Array, 'Validator notes must be a string or array');
    this.notes = notes || '';
    return this;
}

BaseType.prototype.tags = function(tags) {

    Utils.assert(tags instanceof Array, 'Validator tags must be an array');
    this.tags = tags || [];
    return this;
}

BaseType.prototype.RequestErrorFactory = function(request) {

    request.validationErrors = [];
    
    return function(msg){
        var err = "[ValidationError]: " + msg.toString();
        request.validationErrors.push(err);
    }
}

BaseType.prototype.validate = function(value, key, obj, errors) {

    var status = true;
    var finalizeFns = [];
    
    // Check vs valid/invalid values
    if (this.__invalids._values.indexOf(value) >= 0) {
        status = false;
        errors.addValidationError("the value of `" + key + "` is not allowed to be " + this.__invalids._values[this.__invalids._values.indexOf(value)]);
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
    
    // Evaluate validators
    for(var j in this.__validators) {
        // TODO: handle finalizeFns aka mutators (need to run after all other validators)
        var validatorName = this.__checks[j];
        
        if (validatorName in this.mutatorMethods) {
            // console.log("mutatorMethod found", this.__checks[j])
            finalizeFns.push(j);
            continue;
        }
        
        var result = this.__validators[j](value, obj || {"0": value}, key || "0", errors)
        // console.log("validating", this.type, this.__checks[j], value, typeof value, result)
        if (result === false) {
            // console.log(this.__checks[j], "failed with ", value)
            status = false;
            if (this.options.shortCircuit === true) {
                return status;
            }
        }
    }
    
    for(var l in finalizeFns) {
        var result = this.__validators[finalizeFns[l]](value, obj || {"0": value}, key || "0", errors)
        if (result === false) {
            // console.log("finalize:", this.__checks[l], "failed with ", value)
            status = false;
            if (this.options.shortCircuit === true) {
                return status;
            }
        }
    }
    
    return status;
}

module.exports = BaseType;