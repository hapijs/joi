// Load modules

var Sys = require('sys');
var Any = require('./any');
var Errors = require('./errors');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Array = function () {

    Any.call(this);
    this._type = 'array';

    this._base(function (value, state, options) {

        if (Array.isArray(value)) {
            return null;
        }

        return Errors.create('array.base', { value: value }, state, options);
    });
};

Utils.inherits(internals.Array, Any);


internals.Array.create = function () {

    return new internals.Array();
};


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


internals.Array.prototype.includes = function () {

    var inclusions = Utils.flatten(Array.prototype.slice.call(arguments));

    this._test('includes', inclusions, function (value, state, options) {

        for (var v = 0, vl = value.length; v < vl; ++v) {
            var item = value[v];
            var isValid = false;
            for (var i = 0, il = inclusions.length; i < il; ++i) {
                var err = inclusions[i]._validate(item, { parent: value, key: v, path: (state.path ? state.path + '.' : '') + v, renamed: state.renamed }, options);
                if (!err) {
                    isValid = true;
                    break;
                }

                // Return the actual error if only one inclusion defined

                if (il === 1) {
                    return Errors.create('array.includes-single', { value: item, pos: v, reason: err }, state, options);
                }
            }

            if (!isValid) {
                return Errors.create('array.includes', { value: item, pos: v }, state, options);
            }
        }

        return null;
    });

    return this;
};


internals.Array.prototype.excludes = function () {

    var exclusions = Utils.flatten(Array.prototype.slice.call(arguments));

    this._test('excludes', exclusions, function (value, state, options) {

        for (var v = 0, vl = value.length; v < vl; ++v) {
            var item = value[v];
            for (var i = 0, il = exclusions.length; i < il; ++i) {
                var err = exclusions[i].validate(item, options);
                if (!err) {
                    return Errors.create('array.excludes', { value: item, pos: i + 1 }, state, options);
                }
            }
        }

        return null;
    });

    return this;
};


internals.Array.prototype.min = function (limit) {

    Utils.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    this._test('min', limit, function (value, state, options) {

        if (value && value.length >= limit) {
            return null;
        }

        return Errors.create('array.min', { value: limit }, state, options);
    });

    return this;
};


internals.Array.prototype.max = function (limit) {

    Utils.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    this._test('max', limit, function (value, state, options) {

        if (value && value.length <= limit) {
            return null;
        }

        return Errors.create('array.max', { value: limit }, state, options);
    });

    return this;
};


internals.Array.prototype.length = function (limit) {

    Utils.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    this._test('length', limit, function (value, state, options) {

        if (value && value.length === limit) {
            return null;
        }

        return Errors.create('array.length', { value: limit }, state, options);
    });

    return this;
};
