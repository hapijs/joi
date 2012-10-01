var util = require("util");
var BaseType = require("./base");
var Utils = require("../utils");

function BooleanType() {

    BooleanType.super_.call(this);
    
    Utils.mixin(this, BaseType);
}

util.inherits(BooleanType, BaseType);

BooleanType.prototype.__name = "Boolean";

BooleanType.prototype.convert = function(value) {

    if (typeof value == "string") {

        switch (value.toLowerCase()) {

            case "true":
                return true;
                break;

            case "false":
            default:
                return false;
                break;
        }
    }
    else {

        return value;
    }
}

BooleanType.prototype._base = function() {

    return function(value, qs, key, req) {

        req = req || {}
        req.add = req.add || function(){}

        var result = (value == null || typeof value == "boolean");
        if (result === false) {

            req.add("the value of `" + key + "` must be a boolean");
        }
        return result;
    };
}

BooleanType.prototype.base = function() {

    this.add('base', this._base(), arguments);
    return this;
}

function CreateType() {

    return new BooleanType();
}

module.exports = CreateType;
module.exports.BooleanType = BooleanType;