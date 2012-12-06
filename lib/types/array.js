// Load modules

var Sys = require('sys');
var NodeUtil = require('util');
var BaseType = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.ArrayType();
};


module.exports.ArrayType = internals.ArrayType = function () {

    internals.ArrayType.super_.call(this);
    Utils.mixin(this, BaseType);

    return this;
};

NodeUtil.inherits(internals.ArrayType, BaseType);


internals.ArrayType.prototype.__name = 'Array';


internals.ArrayType.prototype.convert = function (value) {

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
        catch (e) {
        }
    }
    else {
        // Defensive programming
        // throw 'Invalid data type passed to Types.Array (' + value + ', ' + typeof value + ' is not supported)';
        return value;
    }
};


internals.ArrayType.prototype._base = function () {

    return function (value, qs, key, errors) {

        return value instanceof Array;
    };
};


internals.ArrayType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};


internals.ArrayType.prototype.emptyOk = function () {

    this.allow([]);
    this.__modifiers.add('emptyOk');
    return this;
};


internals.ArrayType.prototype._includes = function () {

    var self = this;
    var subElement = (new internals.ArrayType.super_()).getDataKey();
    var args = Array.prototype.slice.call(arguments);
    var allowedTypes = args.map(function (d) {

        return d[subElement];
    });

    return function (values, qs, key, req) {

        req = req || {};
        req.add = req.add || function () { };

        // For each allowed Type
        var valueIsValid = true;
        // var intermediateInvalidValues = [];
        var invalidValues = [];
        var failedArg = null;
        var failedIndex = null;
        var failedValue = null;
        var validatedValuesTable = {};
        var m = 0;

        for (var i = 0; i < allowedTypes.length; i++) {

            // For each validator specified
            var currentType = args[i].type;
            var validators = allowedTypes[i];
            var validatorIsValid = true;
            for (var j = 0; j < validators.length; j++) {

                // For each input supplied
                for (m = 0; m < values.length; m++) {

                    var value = values[m];
                    var result = validators[j](value, qs, key, req);
                    if (result === false) {

                        validatorIsValid = false;
                        // intermediateInvalidValues.push(value);
                        failedArg = i;
                        failedIndex = j;
                        failedValue = value;
                    }
                    else {
                        // console.log(value, 'is valid', currentType)
                        validatedValuesTable[m] = true;
                    }
                }
            }
        }

        for (m = 0; m < values.length; m++) {
            if (!validatedValuesTable.hasOwnProperty(m)) {
                invalidValues.push(values[m]);
                valueIsValid = false;
            }
        }

        // Only append error if the included types' validators return errors
        // if (valueIsValid === false && failedIndex >= 0 && args[0].__checks.indexOf('includes') < 0) {
        if (valueIsValid === false) {

            // if(self.options.debug === true) console.log('***', validatedValuesTable, values)
            var validTypes = args.map(function (d) { return d.type; });
            var vals = invalidValues.map(function (d) { return JSON.stringify(d) }).join(', ').replace(/[\']/g, '\'')
            var msg = 'the value(s) `' + vals + '` in array `' + key + '` must be of the following type(s) ' + Sys.inspect(validTypes);
            req.add(msg);
            // console.log(msg)
            // console.log(args[failedIndex].type, args[failedArg].__checks[failedIndex], failedValue, values)
        }
        return valueIsValid;
    }
};


internals.ArrayType.prototype.includes = function () {

    this.add('includes', this._includes.apply(this, arguments), arguments);
    return this;
};


internals.ArrayType.prototype._excludes = function () {

    var self = this;
    var subElement = (new internals.ArrayType.super_()).getDataKey();
    var args = Array.prototype.slice.call(arguments);
    var allowedTypes = args.map(function (d) {

        return d[subElement];
    });

    return function (value, qs, key, req) {

        req = req || {};
        req.add = req.add || function () { };

        var typeTable = {
            'string': require('./string')(),
            'boolean': require('./boolean')(),
            'number': require('./number')(),
            'array': internals.createType()
        };
        var validTypes = args.map(function (d) { return d.type; });

        var handler = function (arg) {

            delete typeTable[arg.type.toLowerCase()];
            var result = self._includes(arg)(value, qs, key, req);
            return result;
        };

        var components = args.map(handler);
        if (components.indexOf(true) >= 0) {
            req.add('the values supplied to array `' + key + '` must contain ' + JSON.stringify(validTypes));
            return false;
        }

        var difference = Object.keys(typeTable).map(function (d) {

            return typeTable[d];
        }).map(handler);

        if (difference.indexOf(true) >= 0) {
            return true;
        }

        req.add('the values supplied to array `' + key + '` must contain ' + JSON.stringify(validTypes));
        return false;
    };
};


internals.ArrayType.prototype.excludes = function () {

    this.add('excludes', this._excludes.apply(this, arguments), arguments);
    return this;
};


/*
internals.StringType.prototype._base = function () {

    return function (value, qs, key, req) {

        return typeof value === 'string';

        // Deprecated code below should be moved to Array

        // var keyDoesNotExist = !qs.hasOwnProperty(key);
        // var valueIsMinLength = (qs[key] !== undefined && qs[key].length >= 1);
        // var valueIsNotNumber = isNaN(+value) || isNaN((new Date(+value)).getTime());
        // // req = req || {};
        // // req.add = req.add || function(){};

        // // var valueIsNotArray = !(value instanceof Array);
        // var valueIsNotObject = true;
        // if (typeof value !== 'string') {
        //     valueIsNotObject = typeof value !== 'object';
        // }
        // else {
        //     try {
        //         var v = JSON.parse(value);
        //         valueIsNotObject = (typeof v !== 'object' && !(v instanceof Array))
        //     }
        //     catch (e) {

        //         // console.log(e)
        //     }
        // }

        // var valueIsDefined = (keyDoesNotExist || valueIsMinLength);
        // if (valueIsDefined === false) {

        //     req.add('the value of `' + key + '` is not allowed to be the empty string (\'\')');
        // }

        // var result = (valueIsDefined &&
        //               valueIsNotNumber &&
        //               valueIsNotObject);

        // return result;
    };
};
*/