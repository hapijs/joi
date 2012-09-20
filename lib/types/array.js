var sys = require("sys");
var util = require('util');
var BaseType = require('./base');
var Utils = require("../utils");

function ArrayType() {

    ArrayType.super_.call(this);
    
    Utils.mixin(this, BaseType);
}

util.inherits(ArrayType, BaseType);

ArrayType.prototype.__name = 'Array';

ArrayType.prototype.convert = function(value) {

    if (typeof value === 'string') {

        // No need to try/catch, `Invalid JSON Body` exception already handled elsehwere
        try {
            var converted = JSON.parse(value);
            if (converted instanceof Array) {

                return converted;
            }
            else {

                return [converted];
            }
        }
        catch (e){
            // console.log(e, value)
        }
    }
    else {

        // Defensive programming
        // throw "Invalid data type passed to Types.Array (" + value + ", " + typeof value + " is not supported)";
        return value;
    }
}

ArrayType.prototype._base = function() {

    return function(value, qs, key, errors) {
        
        // console.log('value in Array.base', value)
        return value instanceof Array;
    };
}

ArrayType.prototype.base = function() {

    this.add('base', this._base(), arguments);
    return this;
}

ArrayType.prototype._includes = function() {

    var self = this;
    var subElement = (new ArrayType.super_()).getDataKey();
    var args = Array.prototype.slice.call(arguments);
    var allowedTypes = args.map(function(d) {

        return d[subElement];
    });
    
    return function(values, qs, key, req) {

        req = req || {}
        req.add = req.add || function(){}

        // For each allowed Type
        var valueIsValid = true;
        // var intermediateInvalidValues = [];
        var invalidValues = [];
        var failedArg = null;
        var failedIndex = null;
        var failedValue = null;
        var validatedValuesTable = {};

        for(var i = 0; i < allowedTypes.length; i++) {

            // For each validator specified
            var currentType = args[i].type;
            var validators = allowedTypes[i];
            var validatorIsValid = true;
            for(var j = 0; j < validators.length; j++) {

                // For each input supplied
                for(var m = 0; m < values.length; m++) {

                    var value = values[m];
                    var result = validators[j](value, qs, key, req);
                    if (result === false) {

                        validatorIsValid = false;
                        // intermediateInvalidValues.push(value);
                        failedArg = i
                        failedIndex = j;
                        failedValue = value;
                    }
                    else {
                        
                        // console.log(value, "is valid", currentType)
                        validatedValuesTable[m] = true;
                    }
                }
            }
        }
        
        for(var m = 0; m < values.length; m++) {

            if (!validatedValuesTable.hasOwnProperty(m)) {

                invalidValues.push(values[m]);
                valueIsValid = false;
            }
        }
        
        // Only append error if the included types' validators return errors
        // if (valueIsValid === false && failedIndex >= 0 && args[0].__checks.indexOf("includes") < 0) {
        if (valueIsValid === false) {
            
            // if(self.options.debug === true) console.log("***", validatedValuesTable, values)
            var validTypes = args.map(function(d){ return d.type; });
            var vals = invalidValues.map(function(d){ return JSON.stringify(d)}).join(", ").replace(/[\"]/g, "'")
            var msg = "the value(s) `" + vals + "` in array `" + key + "` must be of the following type(s) " + sys.inspect(validTypes);
            req.add(msg);
            // console.log(msg)
            // console.log(args[failedIndex].type, args[failedArg].__checks[failedIndex], failedValue, values)
        }
        return valueIsValid;
    }
}

ArrayType.prototype.includes = function(){

    this.add('includes', this._includes.apply(this, arguments), arguments);
    return this;
}

// ArrayType.prototype._excludes = function() {

//     var self = this;
//     var args = arguments;
    
//     return function(value, qs, key, req) {
        
//         var result = self._includes.apply(self._includes, args)(value, qs, key, req);
//         console.log(value, "excludes", Array.prototype.slice.call(args).map(function(d){return d.type}), result)
//         if (result === false) {

//             var variablePattern = /[`]\S+[`]/g;
//             var typePattern = /(\S+)$/;
//             for(var i = 0; i < req.validationErrors.length; i++) {

//                 var varMatches = req.validationErrors[i].match(variablePattern);
//                 var typeMatch = req.validationErrors[i].match(typePattern)[0];
//                 req.validationErrors[i] = "the value(s) " + varMatches[0] + " in array " + varMatches[1] + " must not be " + typeMatch;
//             }
//         }
//         return result;
//     }
// }

// ArrayType.prototype.excludes = function(){

//     this.add('excludes', this._excludes.apply(this, arguments), arguments);
//     return this;
// }

function CreateType() {

    return new ArrayType();
}

module.exports = CreateType;
module.exports.ArrayType = ArrayType;