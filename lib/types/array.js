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
        // first check with isNaN, because JSON.parse convert number string to number!
        if (!isNaN(value)) {
            //given value is a string which could be converted to number, just return it.
            return value;
        }

        try {
            var converted = JSON.parse(value);
            if (Array.isArray(converted)) {
                return converted;
            }
            else {
                return [converted];
            }
        }
        catch (e) {
            //JSON.parse failed, means that given string is a string
            return value;
        }
    }
    else {
        // Defensive programming
        // throw 'Invalid data type passed to Types.Array (' + value + ', ' + typeof value + ' is not supported)';
        return value;
    }
};


internals.ArrayType.prototype._base = function () {

    return function (value, obj, key, errors, keyPath) {

        var result = Array.isArray(value);
        if (!result) {
            errors.addLocalized('array.base', key, {
                value: value
            }, keyPath);
        }

        return result;
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

    var subElement = (new internals.ArrayType.super_()).getDataKey();
    var args = Array.prototype.slice.call(arguments);
    var allowedTypes = args.map(function (d) {

        return d[subElement];
    });

    return function (values, obj, key, errors, keyPath) {

        // For each allowed Type
        var valueIsValid = true;
        var invalidValues = [];
        var failedArg = null;
        var failedIndex = null;
        var failedValue = null;
        var validatedValuesTable = {};
        var m = 0;

        for (var i = 0, il = allowedTypes.length; i < il; ++i) {
            // For each validator specified

            var validators = allowedTypes[i];
            var validatorIsValid = true;
            for (var j = 0, jl = validators.length; j < jl; ++j) {
                // For each input supplied

                for (var m = 0, ml = values.length; m < ml; ++m) {
                    var value = values[m];
                    var result = validators[j](value, obj, key, errors);
                    if (!result) {

                        validatorIsValid = false;
                        failedArg = i;
                        failedIndex = j;
                        failedValue = value;
                    }
                    else {
                        validatedValuesTable[m] = true;
                    }
                }
            }
        }

        for (m = 0, ml = values.length; m < ml; ++m) {
            if (!validatedValuesTable.hasOwnProperty(m)) {
                invalidValues.push(values[m]);
                valueIsValid = false;
            }
        }

        // Only append error if the included types' validators return errors

        if (!valueIsValid) {
            var validTypes = args.map(function (d) { return d.type; });
            var vals = invalidValues.map(function (d) { return JSON.stringify(d); }).join(', ').replace(/[\']/g, '\'');

            errors.addLocalized('array.includes', key, {
                value: vals,
                validTypes: Sys.inspect(validTypes)
            }, keyPath);
        }
        return valueIsValid;
    };
};


internals.ArrayType.prototype.includes = function () {

    this.add('includes', this._includes.apply(this, arguments), arguments);
    return this;
};


internals.ArrayType.prototype._excludes = function () {

    var self = this;
    var args = Array.prototype.slice.call(arguments);

    return function (value, obj, key, errors, keyPath) {

        var typeTable = {
            'string': require('./string')(),
            'boolean': require('./boolean')(),
            'number': require('./number')(),
            'array': internals.createType()
        };
        var validTypes = args.map(function (d) { return d.type; });

        var handler = function (arg) {

            delete typeTable[arg.type.toLowerCase()];
            var result = self._includes(arg)(value, obj, key, errors, keyPath);
            return result;
        };

        var components = args.map(handler);
        if (components.indexOf(true) >= 0) {
            errors.addLocalized('array.excludes', key, {
                validTypes: Sys.inspect(validTypes)
            }, keyPath);
            return false;
        }

        var difference = Object.keys(typeTable).map(function (d) {

            return typeTable[d];
        }).map(handler);

        if (difference.indexOf(true) >= 0) {
            return true;
        }

        errors.addLocalized('array.excludes', key, {
            validTypes: Sys.inspect(validTypes)
        }, keyPath);

        return false;
    };
};


internals.ArrayType.prototype.excludes = function () {

    this.add('excludes', this._excludes.apply(this, arguments), arguments);
    return this;
};
