// Load modules

var Sys = require('sys');
var Any = require('./any');
var Cast = require('./cast');
var Errors = require('./errors');
var Hoek = require('hoek');


// Declare internals

var internals = {};


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

    result.errors = Array.isArray(result.value) ? null : Errors.create('array.base', null, state, options);
    return result;
};


internals.Array.prototype.includes = function () {

    var inclusions = Hoek.flatten(Array.prototype.slice.call(arguments)).map(function (type) {

        return Cast.schema(type);
    });

    return this._test('includes', inclusions, function (value, state, options) {

        for (var v = 0, vl = value.length; v < vl; ++v) {
            var item = value[v];
            var isValid = false;
            var localState = { key: v, path: (state.path ? state.path + '.' : '') + v, parent: value, reference: state.reference };

            for (var i = 0, il = inclusions.length; i < il; ++i) {
                var result = inclusions[i]._validate(item, localState, options);
                if (!result.errors) {
                    value[v] = result.value;
                    isValid = true;
                    break;
                }

                // Return the actual error if only one inclusion defined

                if (il === 1) {
                    return Errors.create('array.includesOne', { pos: v, reason: result.errors }, { key: state.key, path: localState.path }, options);
                }
            }

            if (!isValid) {
                return Errors.create('array.includes', { pos: v }, { key: state.key, path: localState.path }, options);
            }
        }

        return null;
    });
};


internals.Array.prototype.excludes = function () {

    var exclusions = Hoek.flatten(Array.prototype.slice.call(arguments)).map(function (type) {

        return Cast.schema(type);
    });

    return this._test('excludes', exclusions, function (value, state, options) {

        for (var v = 0, vl = value.length; v < vl; ++v) {
            var item = value[v];
            var localState = { key: v, path: (state.path ? state.path + '.' : '') + v, parent: value, reference: state.reference };

            for (var i = 0, il = exclusions.length; i < il; ++i) {
                var result = exclusions[i]._validate(item, localState, {});                // Not passing options to use defaults
                if (!result.errors) {
                    return Errors.create('array.excludes', { pos: v }, { key: state.key, path: localState.path }, options);
                }
            }
        }

        return null;
    });
};


internals.Array.prototype.min = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('min', limit, function (value, state, options) {

        if (value.length >= limit) {
            return null;
        }

        return Errors.create('array.min', { limit: limit }, state, options);
    });
};


internals.Array.prototype.max = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('max', limit, function (value, state, options) {

        if (value.length <= limit) {
            return null;
        }

        return Errors.create('array.max', { limit: limit }, state, options);
    });
};


internals.Array.prototype.length = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('length', limit, function (value, state, options) {

        if (value.length === limit) {
            return null;
        }

        return Errors.create('array.length', { limit: limit }, state, options);
    });
};


module.exports = new internals.Array();