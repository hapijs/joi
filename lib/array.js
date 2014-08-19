// Load modules

var Any = require('./any');
var Cast = require('./cast');
var Errors = require('./errors');
var Hoek = require('hoek');


// Declare internals

var internals = {};


internals.Array = function () {

    Any.call(this);
    this._type = 'array';
    this._inner.inclusions = [];
    this._inner.exclusions = [];
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

    if (!Array.isArray(result.value)) {
        result.errors = Errors.create('array.base', null, state, options);
        return result;
    }

    var allowDuplicates = !(this._flags.allowDuplicates === false);
    var valuesSoFar = {};

    if (this._inner.inclusions.length ||
        this._inner.exclusions.length ||
        !allowDuplicates) {

        for (var v = 0, vl = result.value.length; v < vl; ++v) {
            var item = result.value[v];
            var isValid = false;
            var localState = { key: v, path: (state.path ? state.path + '.' : '') + v, parent: result.value, reference: state.reference };

            // Exclusions

            for (var i = 0, il = this._inner.exclusions.length; i < il; ++i) {
                var res = this._inner.exclusions[i]._validate(item, localState, {});                // Not passing options to use defaults
                if (!res.errors) {
                    result.errors = Errors.create('array.excludes', { pos: v }, { key: state.key, path: localState.path }, options);
                    return result;
                }
            }

            // Inclusions

            for (i = 0, il = this._inner.inclusions.length; i < il; ++i) {
                var res = this._inner.inclusions[i]._validate(item, localState, options);
                if (!res.errors) {
                    result.value[v] = res.value;
                    isValid = true;
                    break;
                }

                // Return the actual error if only one inclusion defined

                if (il === 1) {
                    result.errors = Errors.create('array.includesOne', { pos: v, reason: res.errors }, { key: state.key, path: localState.path }, options);
                    return result;
                }
            }

            if (this._inner.inclusions.length &&
                !isValid) {

                result.errors = Errors.create('array.includes', { pos: v }, { key: state.key, path: localState.path }, options);
                return result;
            }

            // Duplicates

            var type = typeof item;
            type = Object.prototype.toString.call(item) === '[object Date]' ? 'date' : type;

            if (!allowDuplicates && (
                type === 'string' ||
                type === 'number' ||
                type === 'boolean' ||
                type === 'date')) {

                if (Object.prototype.hasOwnProperty.call(valuesSoFar, item)) {
                    if (valuesSoFar[item].hasOwnProperty(type)) {
                        result.errors = Errors.create('array.allowDuplicates', { pos: v }, { key: state.key, path: localState.path }, options);
                        return result;
                    }
                } else {
                    valuesSoFar[item] = {};
                }

                valuesSoFar[item][type] = true;
            }
        }
    }

    return result;
};


internals.Array.prototype.describe = function () {

    var description = Any.prototype.describe.call(this);

    if (this._inner.inclusions.length) {
        description.includes = [];

        for (var i = 0, il = this._inner.inclusions.length; i < il; ++i) {
            description.includes.push(this._inner.inclusions[i].describe());
        }
    }

    if (this._inner.exclusions.length) {
        description.excludes = [];

        for (var i = 0, il = this._inner.exclusions.length; i < il; ++i) {
            description.excludes.push(this._inner.exclusions[i].describe());
        }
    }

    return description;
};


internals.Array.prototype.includes = function () {

    var inclusions = Hoek.flatten(Array.prototype.slice.call(arguments)).map(function (type) {

        return Cast.schema(type);
    });

    var obj = this.clone();
    obj._inner.inclusions = obj._inner.inclusions.concat(inclusions);
    return obj;
};


internals.Array.prototype.excludes = function () {

    var exclusions = Hoek.flatten(Array.prototype.slice.call(arguments)).map(function (type) {

        return Cast.schema(type);
    });

    var obj = this.clone();
    obj._inner.exclusions = obj._inner.exclusions.concat(exclusions);
    return obj;
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


internals.Array.prototype.noDuplicates = function() {

    var obj = this.clone();
    obj._flags.allowDuplicates = false;
    return obj;
};


module.exports = new internals.Array();
