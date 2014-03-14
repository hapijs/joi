// Load modules

var Any = require('./any');
var Cast = require('./cast');
var Errors = require('./errors');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Object = function (schema) {

    var self = this;

    Any.call(this);
    this._type = 'object';
    this._children = schema;

    this._base(function (value, state, options) {

        if (typeof value !== 'object' ||
            Array.isArray(value)) {

            return Errors.create('object.base', null, state, options);
        }

        return self._traverse(value, state, options);
    });
};

Utils.inherits(internals.Object, Any);


internals.Object.create = function (schema) {

    return new internals.Object(schema);
};


internals.Object.prototype._convert = function (value) {

    if (typeof value === 'object' ||
        value === undefined) {

        return value;
    }

    try {
        return JSON.parse(value);
    }
    catch (err) {
        return value;
    }
};


internals.Object.prototype.describe = function () {

    var description = Any.prototype.describe.call(this);

    if (this._children) {
        description.children = {};
        var children = Object.keys(this._children);

        for (var c = 0, cl = children.length; c < cl; ++c) {
            var key = children[c];
            var child = this._children[key];
            description.children[key] = Cast.schema(child).describe();
        }
    }

    return description;
};


internals.Object.prototype.length = function (limit) {

    Utils.assert((!isNaN(limit) && ((limit | 0) === parseFloat(limit))), 'limit must be an integer');

    this._test('length', limit, function (value, state, options) {

        if (value !== null &&
            value !== undefined &&
            Object.keys(value).length === limit) {

            return null;
        }

        return Errors.create('object.length', { value: limit }, state, options);
    });

    return this;
};


internals.Object.prototype.min = function (limit) {

    Utils.assert((!isNaN(limit) && ((limit | 0) === parseFloat(limit))), 'limit must be an integer');

    this._test('min', limit, function (value, state, options) {

        if (value !== null &&
            value !== undefined &&
            Object.keys(value).length >= limit) {

            return null;
        }

        return Errors.create('object.min', { value: limit }, state, options);
    });

    return this;
};


internals.Object.prototype.max = function (limit) {

    Utils.assert((!isNaN(limit) && ((limit | 0) === parseFloat(limit))), 'limit must be an integer');

    this._test('max', limit, function (value, state, options) {

        if (value !== null &&
            value !== undefined &&
            Object.keys(value).length <= limit) {

            return null;
        }

        return Errors.create('object.max', { value: limit }, state, options);
    });

    return this;
};


internals.Object.prototype._traverse = function (value, state, options) {

    if (!this._children) {            // Object() null allows any keys
        return null;
    }

    var keys = Object.keys(this._children);
    var unprocessed = Utils.mapToObject(Object.keys(value));
    var errors = [];
    var key;

    for (var i = 0, il = keys.length; i < il; ++i) {
        key = keys[i];
        var child = this._children[key];
        var item = value[key];

        var localState = { parent: value, key: key, path: (state.path ? state.path + '.' : '') + key, renamed: state.renamed };
        var err = Cast.schema(child)._validate(item, localState, options);
        if (err) {
            errors = errors.concat(err);
            if (options.abortEarly) {
                return errors;
            }
        }

        delete unprocessed[key];
    }

    var unprocessedKeys = Object.keys(unprocessed);
    if (unprocessedKeys.length) {
        if (options.stripUnknown ||
            options.skipFunctions) {

            var hasFunctions = false;
            for (var k = 0, kl = unprocessedKeys.length; k < kl; ++k) {
                key = unprocessedKeys[k];
                if (options.stripUnknown) {
                    delete value[key];
                }
                else if (typeof value[key] === 'function') {
                    delete unprocessed[key];
                    hasFunctions = true;
                }
            }

            if (options.stripUnknown) {
                return errors.length ? errors : null;
            }

            if (hasFunctions) {
                unprocessedKeys = Object.keys(unprocessed);
            }
        }

        if (unprocessedKeys.length &&
            !options.allowUnknown) {

            for (var e = 0, el = unprocessedKeys.length; e < el; ++e) {
                errors.push(Errors.create('object.allowUnknown', null, { key: unprocessedKeys[e], path: state.path }, options));
            }
        }
    }

    return errors.length ? errors : null;
};