/**
 * Module dependencies.
 */
var BaseType = require("./base");
var StringType = require("./string");
var NumberType = require("./number");
var BooleanType = require("./boolean");
var ArrayType = require("./array");
var ObjectType = require("./object");

/**
 * Types Constructor
 *
 * @api public
 */
function Types(){

    // Load types

    this.Base = BaseType;
    this.String = StringType;
    this.Number = NumberType;
    this.Boolean = BooleanType;
    this.Array = ArrayType;
    this.Object = ObjectType;
}

Types.prototype.mutatorMethods = {

    rename: 1
}

module.exports = new Types();