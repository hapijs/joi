// Load modules

var Sys = require('sys');
var Any = require('./any');
var Errors = require('./errors');
var Hoek = require('hoek');


// Declare internals

var internals = {};


exports.create = function () {

    return new internals.Array();
};


internals.Array = function () {

    Any.call(this);
    this._type = 'array';
};

Hoek.inherits(internals.Array, Any);


internals.Array.prototype._base = function (value, state, options) {

    var result = {
        value: value
    };

    if (typeof value === 'string' &&
        options.convert) {

        try {
            var converted = JSON.parse(value);
            if (Array.isArray(converted)) {
                result.value = converted;
            }
        }
        catch (e) { }
    }

    result.errors = Array.isArray(result.value) ? null : Errors.create('array.base', { value: result.value }, state, options);
    return result;
};


internals.Array.prototype.includes = function () {

    var inclusions = Hoek.flatten(Array.prototype.slice.call(arguments));

    return this._test('includes', inclusions, function (value, state, options) {

        for (var v = 0, vl = value.length; v < vl; ++v) {
            var item = value[v];
            var isValid = false;
            for (var i = 0, il = inclusions.length; i < il; ++i) {
                var result = inclusions[i]._validate(item, { parent: value, key: v, path: (state.path ? state.path + '.' : '') + v }, options);
                if (!result.errors) {
                    value[v] = result.value;
                    isValid = true;
                    break;
                }

                // Return the actual error if only one inclusion defined

                if (il === 1) {
                    return Errors.create('array.includes-single', { value: item, pos: v, reason: result.errors }, state, options);
                }
            }

            if (!isValid) {
                return Errors.create('array.includes', { value: item, pos: v }, state, options);
            }
        }

        return null;
    });
};


internals.Array.prototype.excludes = function () {

    var exclusions = Hoek.flatten(Array.prototype.slice.call(arguments));

    return this._test('excludes', exclusions, function (value, state, options) {

        for (var v = 0, vl = value.length; v < vl; ++v) {
            var item = value[v];
            for (var i = 0, il = exclusions.length; i < il; ++i) {
                var result = exclusions[i]._validate(item, null, {});                // Not passing options to use defaults
                if (!result.errors) {
                    return Errors.create('array.excludes', { value: item, pos: i + 1 }, state, options);
                }
            }
        }

        return null;
    });
};


internals.Array.prototype.min = function (limit) {

    Hoek.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    return this._test('min', limit, function (value, state, options) {

        if (value.length >= limit) {
            return null;
        }

        return Errors.create('array.min', { value: limit }, state, options);
    });
};


internals.Array.prototype.max = function (limit) {

    Hoek.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    return this._test('max', limit, function (value, state, options) {

        if (value.length <= limit) {
            return null;
        }

        return Errors.create('array.max', { value: limit }, state, options);
    });
};


internals.Array.prototype.length = function (limit) {

    Hoek.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    return this._test('length', limit, function (value, state, options) {

        if (value.length === limit) {
            return null;
        }

        return Errors.create('array.length', { value: limit }, state, options);
    });
};
