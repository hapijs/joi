var util = require("util");
var BaseType = require("./base");
var Utils = require("../utils");

function ObjectType() {

    ObjectType.super_.call(this);
    
    Utils.mixin(this, BaseType);
}

util.inherits(ObjectType, BaseType);

ObjectType.prototype.__name = "Object";

ObjectType.prototype.convert = function(value) {

    return JSON.parse(value);
}

ObjectType.prototype._base = function() {

    return function(value) {

        return (value == null || typeof value == "object");
    };
}

ObjectType.prototype.base = function() {

    this.add('base', this._base(), arguments);
    return this;
}

function CreateType() {

    return new ObjectType();
}

module.exports = CreateType;
module.exports.ObjectType = ObjectType;