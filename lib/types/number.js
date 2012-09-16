var util = require("util");
var BaseType = require("./base");
var Utils = require("../utils");

function NumberType() {

    NumberType.super_.call(this);
}

util.inherits(NumberType, BaseType);

NumberType.prototype.__name = "Number";

NumberType.prototype.convert = function(value) {

    return Number(value);
}

NumberType.prototype._empty = function(){

    return function(value){

        return isNaN(value); //(value === null);
    }
}

NumberType.prototype._base = function() {

    return function(value, qs, key, req) {

        if (typeof value !== "number" && typeof value !== "string") {
            return false;
        }
        
        return !isNaN(+value);
    };
}

NumberType.prototype.base = function() {

    this.add('base', this._base(), arguments);
    return this;
}

NumberType.prototype._min = function(n) {

    Utils.assert((!isNaN(n) && ((n|0) == parseFloat(n))), "In Types.Number.min(n), the n must be an integer.");
    
    return function(value, qs, key, req) {

        var result = (isNaN(value) || value >= n);
        if (result === false) {

            req = req || {addValidationError: function(){}};
            req.addValidationError("the value of `" + key + "` must be larger than (or equal to) " + n);
        }
        return result;
    };
}

NumberType.prototype.min = function(n) {

    this.add('min', this._min(n), arguments);
    return this;
}

NumberType.prototype._max = function(n) {

    Utils.assert((!isNaN(n) && ((n|0) == parseFloat(n))), "In Types.Number.max(n), the n must be an integer.");
    
    return function(value, qs, key, req) {

        var result = (value <= n);
        if (result === false) {

            req = req || {addValidationError: function(){}};
            req.addValidationError("the value of `" + key + "` must be less than (or equal to) " + n);
        }
        return result;
    };
}

NumberType.prototype.max = function(n) {

    this.add('max', this._max(n), arguments);
    return this;
}

NumberType.prototype._integer = function() {

    return function(value, qs, key, req) {
        var result = (!isNaN(value) && ((value|0) == parseFloat(value)));
        if (result === false) {

            req = req || {addValidationError: function(){}};
            req.addValidationError("the value of `" + key + "` must be an integer");
        }
        return result;
    };
}

NumberType.prototype.integer = function() {

    this.add('integer', this._integer(), arguments);
    return this;
}

NumberType.prototype._float = function() {

    var isInt = this._integer();
    return function(value, qs, key, req) {

        var result = (!isInt(value));
        if (result === false) {

            req = req || {addValidationError: function(){}};
            req.addValidationError("the value of `" + key + "` must be a float or double");
        }
        return result;
    };
}

NumberType.prototype.float = function() {

    this.add('float', this._float(), arguments);
    return this;
}

function CreateType() {

    return new NumberType();
}

module.exports = CreateType;
module.exports.NumberType = NumberType;