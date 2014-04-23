// Load modules

var Hoek = require('hoek');
var Topo = require('topo');
var Any = require('./any');
var Cast = require('./cast');
var Ref = require('./ref');
var Errors = require('./errors');


// Declare internals

var internals = {};


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

    if (typeof value === 'string' &&
        options.convert) {

        try {
            value = JSON.parse(value);
        }
        catch (err) { }
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

    // Validate dependencies

    for (var d = 0, dl = this._dependencies.length; d < dl; ++d) {
        var dep = this._dependencies[d];
        var err = internals[dep.type](dep.key && value[dep.key], dep.peers, target, { key: dep.key, path: (state.path ? state.path + '.' : '') + dep.key }, options);
        if (err) {
            errors.push(err);
            if (options.abortEarly) {
                return finish();
            }
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

        var localState = { key: key, path: (state.path ? state.path + '.' : '') + key, parent: target, reference: state.reference };
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

    var children = Object.keys(schema);

    if (!children.length) {
        obj._inner = [];
        return obj;
    }

    var topo = new Topo();
    if (obj._inner) {
        for (var i = 0, il = obj._inner.length; i < il; ++i) {
            var child = obj._inner[i];
            topo.add(child, { after: child._refs, group: child.key });
        }
    }

    for (var c = 0, cl = children.length; c < cl; ++c) {
        var key = children[c];
        var child = schema[key];
        var cast = Cast.schema(child);
        topo.add({ key: key, schema: cast }, { after: cast._refs, group: key });
    }

    obj._inner = topo.nodes;

    return obj;
};


internals.Object.prototype.length = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('length', limit, function (value, state, options) {

        if (Object.keys(value).length === limit) {
            return null;
        }

        return Errors.create('object.length', { limit: limit }, state, options);
    });
};


internals.Object.prototype.min = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('min', limit, function (value, state, options) {

        if (Object.keys(value).length >= limit) {
            return null;
        }

        return Errors.create('object.min', { limit: limit }, state, options);
    });
};


internals.Object.prototype.max = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('max', limit, function (value, state, options) {

        if (Object.keys(value).length <= limit) {
            return null;
        }

        return Errors.create('object.max', { limit: limit }, state, options);
    });
};


internals.Object.prototype.with = function (key, peers) {

    return this._dependency('with', key, peers);
};


internals.Object.prototype.without = function (key, peers) {

    return this._dependency('without', key, peers);
};


internals.Object.prototype.xor = function () {

    var peers = Hoek.flatten(Array.prototype.slice.call(arguments));
    return this._dependency('xor', null, peers);
};


internals.Object.prototype.or = function () {

    var peers = Hoek.flatten(Array.prototype.slice.call(arguments));
    return this._dependency('or', null, peers);
};


internals.Object.prototype.and = function () {

    var peers = Hoek.flatten(Array.prototype.slice.call(arguments));
    return this._dependency('and', null, peers);
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


internals.Object.prototype._dependency = function (type, key, peers) {

    peers = [].concat(peers);
    for (var i = 0, li = peers.length; i < li; i++) {
        Hoek.assert(typeof peers[i] === 'string', type, 'peers must be a string or array of strings');
    }

    var obj = this.clone();
    obj._dependencies.push({ type: type, key: key, peers: peers });
    return obj;
};


internals.with = function (value, peers, parent, state, options) {

    if (value === undefined) {
        return null;
    }

    for (var i = 0, il = peers.length; i < il; ++i) {
        var peer = peers[i];
        if (!parent.hasOwnProperty(peer) ||
            parent[peer] === undefined) {
            return Errors.create('object.with', { peer: peer }, state, options);
        }
    }

    return null;
};


internals.without = function (value, peers, parent, state, options) {

    if (value === undefined) {
        return null;
    }

    for (var i = 0, il = peers.length; i < il; ++i) {
        var peer = peers[i];
        if (parent.hasOwnProperty(peer) &&
            parent[peer] !== undefined) {

            return Errors.create('object.without', { peer: peer }, state, options);
        }
    }

    return null;
};


internals.xor = function (value, peers, parent, state, options) {

    var present = [];
    for (var i = 0, il = peers.length; i < il; ++i) {
        var peer = peers[i];
        if (parent.hasOwnProperty(peer) &&
            parent[peer] !== undefined) {

            present.push(peer);
        }
    }

    if (present.length === 1) {
        return null;
    }

    if (present.length === 0) {
        return Errors.create('object.missing', { peers: peers }, state, options);
    }

    return Errors.create('object.xor', { peers: peers }, state, options);
};


internals.or = function (value, peers, parent, state, options) {

    for (var i = 0, il = peers.length; i < il; ++i) {
        var peer = peers[i];
        if (parent.hasOwnProperty(peer) &&
            parent[peer] !== undefined) {
            return null;
        }
    }

    return Errors.create('object.missing', { peers: peers }, state, options);
};


internals.and = function (value, peers, parent, state, options) {

    var missing = [];
    var present = [];
    for (var i = 0, il = peers.length; i < il; ++i) {
        var peer = peers[i];
        if (!parent.hasOwnProperty(peer) ||
            parent[peer] === undefined) {

            missing.push(peer);
        }
        else {
            present.push(peer);
        }
    }

    return missing.length ? Errors.create('object.and', { present: present, missing: missing }, state, options) : null;
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

    if (this._dependencies.length) {
        description.dependencies = Hoek.clone(this._dependencies);
    }

    return description;
};


internals.Object.prototype.assert = function (ref, schema, message) {

    ref = Cast.ref(ref);
    Hoek.assert(ref.depth > 1, 'Cannot use assertions for root level references - use direct key rules instead');

    var cast = Cast.schema(schema);
    cast = cast.options({ allowUnknown: true });

    return this._test('assert', { cast: cast, ref: ref }, function (value, state, options) {

        var result = cast._validate(ref(value), null, options, value);
        if (!result.errors) {
            return null;
        }

        return Errors.create('object.assert', { ref: ref.path.join('.'), message: message }, state, options);
    });
};


module.exports = new internals.Object();