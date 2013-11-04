// Load modules

var Base = require('./base');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function (config) {

    return new internals.Object(config);
};


internals.Object = function (config) {

    var self = this;

    Base.call(this);
    this._name = 'Object';
    this._config = config;

    this._test(function (value, state, options) {

        if (typeof value !== 'object' ||
            Array.isArray(value)) {

            return Base.error('object.base', null, state);
        }

        return self._traverse(value, state, options);
    });
};

Utils.inherits(internals.Object, Base);


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


internals.Object.prototype._traverse = function (value, state, options) {

    if (!this._config) {            // Object() allows any keys
        return null;
    }

    var keys = Object.keys(this._config);
    var unprocessed = Utils.mapToObject(Object.keys(value));
    var errors = [];

    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var config = this._config[key];
        var item = value[key];

        config = Array.isArray(config) ? config : [config];

        var itemErrors = [];
        for (var c = 0, cl = config.length; c < cl; ++c) {
            var err = config[c]._validate(item, { parent: value, key: key, path: (state.path ? state.path + '.' : '') + key, renamed: state.renamed }, options);
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
                var key = unprocessedKeys[k];
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

            errors.push(Base.error('object.allowUnknown', { keys: unprocessedKeys.join(', ') }, state));
        }
    }

    return errors.length ? errors : null;
};