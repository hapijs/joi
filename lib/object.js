// Load modules

var Hoek = require('hoek');
var Any = require('./any');
var Cast = require('./cast');
var Errors = require('./errors');


// Declare internals

var internals = {};


exports.create = function (schema) {

    var obj = new internals.Object();
    return obj.keys(schema);
};


internals.Object = function () {

    Any.call(this);
    this._type = 'object';
    this._inner = null;

    this._base(internals.traverse);
};

Hoek.inherits(internals.Object, Any);


internals.Object.prototype.keys = function (schema) {

    Hoek.assert(schema === null || schema === undefined || (typeof schema === 'object' && !schema.isJoi), 'Object schema must be a valid object and cannot be a joi schema');

    var obj = this.clone();

    if (!schema) {
        obj._inner = null;
        return obj;
    }

    obj._inner = [];
    var children = Object.keys(schema);
    for (var c = 0, cl = children.length; c < cl; ++c) {
        var key = children[c];
        var child = schema[key];
        var cast = Cast.schema(child);
        obj._inner.push({ key: key, schema: cast });
    }

    return obj;
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
        for (var i = 0, il = this._inner.length; i < il; ++i) {
            var child = this._inner[i];
            description.children[child.key] = child.schema.describe();
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


internals.traverse = function (value, state, options) {

    if (!value ||
        typeof value !== 'object' ||
        Array.isArray(value)) {

        return Errors.create('object.base', null, state, options);
    }

    if (!this._inner) {            // null allows any keys
        return null;
    }

    var unprocessed = Hoek.mapToObject(Object.keys(value));
    var errors = [];
    var key;

    for (var i = 0, il = this._inner.length; i < il; ++i) {
        var child = this._inner[i];
        var key = child.key;
        var item = value[key];

        var localState = { parent: value, key: key, path: (state.path ? state.path + '.' : '') + key, renamed: state.renamed };
        var err = child.schema._validate(item, localState, options);
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