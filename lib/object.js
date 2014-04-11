// Load modules

var Any = require('./any');
var Cast = require('./cast');
var Errors = require('./errors');
var Hoek = require('hoek');


// Declare internals

var internals = {};


module.exports = internals.Object = function (schema) {

    var self = this;

    Hoek.assert(schema === null || schema === undefined || (typeof schema === 'object' && !schema.isJoi), 'Object schema must be a valid object and cannot be a joi schema');

    Any.call(this);
    this._type = 'object';
    this._inner = internals.compile(schema);

    this._base(function (value, state, options) {

        if (value &&
            typeof value === 'object' &&
            !Array.isArray(value)) {

            return self._traverse(value, state, options);
        }

        return Errors.create('object.base', null, state, options);
    });
};

Hoek.inherits(internals.Object, Any);


internals.Object.create = function (schema) {

    return new internals.Object(schema);
};


internals.compile = function (schema) {

    if (!schema) {
        return schema;
    }

    var compiled = {};
    var children = Object.keys(schema);
    for (var c = 0, cl = children.length; c < cl; ++c) {
        var key = children[c];
        var child = schema[key];
        compiled[key] = Cast.schema(child);
    }

    return compiled;
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

    if (this._inner) {
        description.children = {};
        var children = Object.keys(this._inner);

        for (var c = 0, cl = children.length; c < cl; ++c) {
            var key = children[c];
            var child = this._inner[key];
            description.children[key] = child.describe();
        }
    }

    return description;
};


internals.Object.prototype.length = function (limit) {

    Hoek.assert((!isNaN(limit) && ((limit | 0) === parseFloat(limit))), 'limit must be an integer');

    return this._test('length', limit, function (value, state, options) {

        if (Object.keys(value).length === limit) {
            return null;
        }

        return Errors.create('object.length', { value: limit }, state, options);
    });
};


internals.Object.prototype.min = function (limit) {

    Hoek.assert((!isNaN(limit) && ((limit | 0) === parseFloat(limit))), 'limit must be an integer');

    return this._test('min', limit, function (value, state, options) {

        if (Object.keys(value).length >= limit) {
            return null;
        }

        return Errors.create('object.min', { value: limit }, state, options);
    });
};


internals.Object.prototype.max = function (limit) {

    Hoek.assert((!isNaN(limit) && ((limit | 0) === parseFloat(limit))), 'limit must be an integer');

    return this._test('max', limit, function (value, state, options) {

        if (Object.keys(value).length <= limit) {
            return null;
        }

        return Errors.create('object.max', { value: limit }, state, options);
    });
};


internals.Object.prototype._traverse = function (value, state, options) {

    if (!this._inner) {            // Object() null allows any keys
        return null;
    }

    var keys = Object.keys(this._inner);
    var unprocessed = Hoek.mapToObject(Object.keys(value));
    var errors = [];
    var key;

    for (var i = 0, il = keys.length; i < il; ++i) {
        key = keys[i];
        var child = this._inner[key];
        var item = value[key];

        var localState = { parent: value, key: key, path: (state.path ? state.path + '.' : '') + key, renamed: state.renamed };
        var err = child._validate(item, localState, options);
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