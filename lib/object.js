// Load modules

var Any = require('./any');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Object = function (schema) {

    var self = this;

    Any.call(this);
    this._type = 'object';
    this._children = schema;

    this._test(function (value, state, options) {

        if (typeof value !== 'object' ||
            Array.isArray(value)) {

            return Any.error('object.base', null, state);
        }

        return self._traverse(value, state, options);
    });
};

Utils.inherits(internals.Object, Any);


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
            var configs = Array.isArray(child) ? child : [child];

            for (var n = 0, nl = configs.length; n < nl; ++n) {
                var config = (typeof configs[n].describe === 'function' ? configs[n] : new internals.Object(configs[n]));
                if (nl > 1) {
                    description.children[key] = description.children[key] || [];
                    description.children[key].push(config.describe());
                }
                else {
                    description.children[key] = config.describe();
                }
            }
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

        return Any.error('object.length', { value: limit }, state);
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

        return Any.error('object.min', { value: limit }, state);
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

        return Any.error('object.max', { value: limit }, state);
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

        var configs = Array.isArray(child) ? child : [child];

        var itemErrors = [];
        for (var c = 0, cl = configs.length; c < cl; ++c) {
            var config = (typeof configs[c]._validate === 'function' ? configs[c] : new internals.Object(configs[c]));
            var err = config._validate(item, { parent: value, key: key, path: (state.path ? state.path + '.' : '') + key, renamed: state.renamed }, options);
            if (!err) {     // Found a valid match
                itemErrors = [];
                break;
            }

            itemErrors = itemErrors.concat(err);
        }

        if (itemErrors.length) {
            errors = errors.concat(itemErrors);
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
                return null;
            }

            if (hasFunctions) {
                unprocessedKeys = Object.keys(unprocessed);
            }
        }

        if (unprocessedKeys.length &&
            !options.allowUnknown) {

            for (var e = 0, el = unprocessedKeys.length; e < el; ++e) {
                errors.push(Any.error('object.allowUnknown', null, { key: unprocessedKeys[e], path: state.path }));
            }
        }
    }

    return errors.length ? errors : null;
};