// Load modules

var Sys = require('sys');
var NodeUtil = require('util');
var Base = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.Array();
};


internals.Array = function () {

    Base.call(this);
    this._name = 'Array';

    this._test('base', function (value, obj, key, errors, keyPath) {

        var result = Array.isArray(value);
        if (!result) {
            errors.addLocalized('array.base', key, { value: value }, keyPath);
        }

        return result;
    });
};

NodeUtil.inherits(internals.Array, Base);


internals.Array.prototype._convert = function (value) {

    if (typeof value !== 'string') {
        return value;
    }

    if (!isNaN(value)) {        // Check with isNaN, because JSON.parse converts number string to number
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
        return value;
    }
};


internals.Array.prototype.emptyOk = function () {

    this.allow([]);
    this._modifiers.add('emptyOk');
    return this;
};


internals.includes = function () {

    var args = Array.prototype.slice.call(arguments);
    var allowedTypes = args.map(function (d) {

        return d._validators;
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
            var validTypes = args.map(function (d) { return d._name; });
            var vals = invalidValues.map(function (d) { return JSON.stringify(d); }).join(', ').replace(/[\']/g, '\'');
            errors.addLocalized('array.includes', key, { value: vals, validTypes: Sys.inspect(validTypes) }, keyPath);
        }

        return valueIsValid;
    };
};


internals.Array.prototype.includes = function () {

    this._test('includes', internals.includes.apply(this, arguments));
    return this;
};


internals.excludes = function () {

    var args = Array.prototype.slice.call(arguments);

    return function (value, obj, key, errors, keyPath) {

        var typeTable = {
            'string': require('./string')(),
            'boolean': require('./boolean')(),
            'number': require('./number')(),
            'array': internals.createType()
        };
        var validTypes = args.map(function (d) {

            return d._name;
        });

        var handler = function (arg) {

            delete typeTable[arg._name.toLowerCase()];
            var result = internals.includes(arg)(value, obj, key, errors, keyPath);
            return result;
        };

        var components = args.map(handler);
        if (components.indexOf(true) >= 0) {
            errors.addLocalized('array.excludes', key, { validTypes: Sys.inspect(validTypes) }, keyPath);
            return false;
        }

        var difference = Object.keys(typeTable).map(function (d) {

            return typeTable[d];
        }).map(handler);

        if (difference.indexOf(true) >= 0) {
            return true;
        }

        errors.addLocalized('array.excludes', key, { validTypes: Sys.inspect(validTypes) }, keyPath);
        return false;
    };
};


internals.Array.prototype.excludes = function () {

    this._test('excludes', internals.excludes.apply(this, arguments));
    return this;
};
