// Load modules

var Sys = require('sys');
var Base = require('./base');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.Array();
};


internals.Array = function () {

    Base.call(this);
    this._name = 'Array';

    this.allow = undefined;
    this.deny = undefined;
    this.valid = undefined;
    this.invalid = undefined;

    this._test(function (value, options) {

        if (Array.isArray(value)) {
            return null;
        }

        return Base.error('array.base', { value: value }, options);
    });
};

Utils.inherits(internals.Array, Base);


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

    this._allow([]);
    this._modifiers.add('emptyOk');
    return this;
};


internals.Array.prototype.includes = function () {


    var inclusions = Array.prototype.slice.call(arguments);

    this._test(function (value, options) {

        for (var v = 0, vl = value.length; v < vl; ++v) {
            var item = value[v];
            var isValid = false;
            for (var i = 0, il = inclusions.length; i < il; ++i) {
                var err = inclusions[i].validate(item, options);
                if (!err) {
                    isValid = true;
                    break;
                }
            }

            if (!isValid) {
                return Base.error('array.includes', { value: item }, options);
            }
        }

        return null;
    });

    return this;
};


internals.Array.prototype.excludes = function () {

    var exclusions = Array.prototype.slice.call(arguments);

    this._test(function (value, options) {

        for (var v = 0, vl = value.length; v < vl; ++v) {
            var item = value[v];
            for (var i = 0, il = exclusions.length; i < il; ++i) {
                var err = exclusions[i].validate(item, options);
                if (!err) {
                    return Base.error('array.excludes', { value: item, pos: i + 1 }, options);
                }
            }
        }

        return null;
    });

    return this;
};
