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
};

Hoek.inherits(internals.Object, Any);


internals.Object.prototype._base = function (value, state, options) {

    var target = value;
    var errors = [];
    var finish = function () {

        return {
            value: target,
            errors: errors.length ? errors : null
        };
    };

    if (typeof value !== 'object' &&
        value !== undefined &&
        options.convert) {

        try {
            value = JSON.parse(value);
        }
        catch (err) {
        }
    }

    if (!value ||
        typeof value !== 'object' ||
        Array.isArray(value)) {

        errors.push(Errors.create('object.base', null, state, options));
        return finish();
    }

    // Ensure target is a local copy (parsed) or shallow copy

    if (target === value) {
        target = {};
        target.__proto__ = Object.getPrototypeOf(value);
        var valueKeys = Object.keys(value);
        for (var t = 0, tl = valueKeys.length; t < tl; ++t) {
            target[valueKeys[t]] = value[valueKeys[t]];
        }
    }
    else {
        target = value;
    }

    // Rename keys

    var renamed = {};
    for (var r = 0, rl = this._renames.length; r < rl; ++r) {
        var item = this._renames[r];

        if (!item.options.multiple &&
            renamed[item.to]) {

            errors.push(Errors.create('object.rename.multiple', { from: item.from, to: item.to }, state, options));
            if (options.abortEarly) {
                return finish();
            }
        }

        if (target.hasOwnProperty(item.to) &&
            !item.options.override &&
            !renamed[item.to]) {

            errors.push(Errors.create('object.rename.override', { from: item.from, to: item.to }, state, options));
            if (options.abortEarly) {
                return finish();
            }
        }

        target[item.to] = target[item.from];
        renamed[item.to] = true;

        if (!item.options.alias) {
            delete target[item.from];
        }
    }

    // Validate schema

    if (!this._inner) {            // null allows any keys
        return finish();
    }

    var unprocessed = Hoek.mapToObject(Object.keys(target));
    var key;

    for (var i = 0, il = this._inner.length; i < il; ++i) {
        var child = this._inner[i];
        var key = child.key;
        var item = target[key];

        delete unprocessed[key];

        var localState = { parent: target, key: key, path: (state.path ? state.path + '.' : '') + key };
        var result = child.schema._validate(item, localState, options);
        if (result.errors) {
            errors = errors.concat(result.errors);
            if (options.abortEarly) {
                return finish();
            }
        }

        if (result.value !== undefined) {
            target[key] = result.value;
        }
    }

    var unprocessedKeys = Object.keys(unprocessed);
    if (unprocessedKeys.length) {
        if (options.stripUnknown ||
            options.skipFunctions) {

            var hasFunctions = false;
            for (var k = 0, kl = unprocessedKeys.length; k < kl; ++k) {
                key = unprocessedKeys[k];
                if (options.stripUnknown) {
                    delete target[key];
                }
                else if (typeof target[key] === 'function') {
                    delete unprocessed[key];
                    hasFunctions = true;
                }
            }

            if (options.stripUnknown) {
                return finish();
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

    return finish();
};


internals.Object.prototype.keys = function (schema) {

    Hoek.assert(schema === null || schema === undefined || typeof schema === 'object', 'Object schema must be a valid object');
    Hoek.assert(!schema || !schema.isJoi, 'Object schema cannot be a joi schema');

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


internals.renameDefaults = {
    alias: false,                   // Keep old value in place
    multiple: false,                // Allow renaming multiple keys into the same target
    override: false                 // Overrides an existing key
};


internals.Object.prototype.rename = function (from, to, options) {

    Hoek.assert(from, 'Rename missing the from argument');
    Hoek.assert(to, 'Rename missing the to argument');
    Hoek.assert(to !== from, 'Cannot rename key to same name:', from);

    for (var i = 0, il = this._renames.length; i < il; ++i) {
        Hoek.assert(this._renames[i].from !== from, 'Cannot rename the same key multiple times');
    }

    var obj = this.clone();

    obj._renames.push({
        from: from,
        to: to,
        options: Hoek.applyToDefaults(internals.renameDefaults, options || {})
    });

    return obj;
};