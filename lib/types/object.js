// Load modules

var BaseType = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function (config) {

    return new internals.ObjectType(config);
};


module.exports.ObjectType = internals.ObjectType = function (config) {

    internals.ObjectType.super_.call(this);
    Utils.mixin(this, BaseType);

    this._config = config;

    return this;
};

Utils.inherits(internals.ObjectType, BaseType);


internals.ObjectType.prototype.__name = 'Object';


internals.ObjectType.prototype.convert = function (value) {

    if (typeof value === 'object' || typeof value === 'undefined') {
        return value;
    }

    try {
        return JSON.parse(value);
    }
    catch (err) {
        return value;
    }
};


internals.ObjectType.prototype._base = function () {

    var self = this;

    return function (value, obj, key, errors, keyPath) {

        if (typeof value !== 'object') {
            errors.addLocalized('object.base', key, null, keyPath);
            return false;
        }

        return self._traverse(value, self._config, errors, keyPath);
    };
};


internals.ObjectType.prototype.base = function () {

    this.add('base', this._base(), arguments);
    return this;
};


internals.ObjectType.prototype.allowOtherKeys = function () {

    this._allowOtherKeys = true;
    return this;
};


internals.ObjectType.prototype._traverse = function (topObj, topConfig, errors, topKeyPath) {

    var self = this;

    var traverse = function (obj, config, errors, keyPath) {

        var keys = Object.keys(config || {});
        var unprocessedObject = Utils.clone(obj || {});
        var result = true;

        for (var i = 0, il = keys.length; i < il; ++i) {
            var key = keys[i];
            var itemConfig = config[key];
            var value = obj[key];

            keyPath = keyPath && topKeyPath ? (topKeyPath + '.' + key) : key;

            if (typeof itemConfig.validate === 'function' &&
                itemConfig.validate(value, obj, key, errors, keyPath) === false) {

                result = false;

                if (self.options.shortCircuit) {
                    return result;
                }
            }

            if (itemConfig.type === 'Object' && value !== null && typeof value !== 'undefined') {
                traverse(value, itemConfig._config, errors, topKeyPath);
            }

            delete unprocessedObject[key];
        }

        // Only error on unknown keys when config specifies a structure.
        // Thus new T.Object() allows any keys while T.Object({}) does not.
        if (self._allowOtherKeys !== true && typeof config === 'object') {
            var unprocessedKeys = Object.keys(unprocessedObject);
            for (i = 0, il = unprocessedKeys.length; i < il; ++i) {
                var unprocessedKey = unprocessedKeys[i];

                var unprocessedValueType = typeof unprocessedObject[unprocessedKey];
                if (unprocessedValueType !== 'function' && unprocessedValueType !== 'undefined') {
                    errors.addLocalized('object.allowOtherKeys', unprocessedKey, null, (topKeyPath ? (topKeyPath + '.' + unprocessedKey) : unprocessedKey));

                    if (self.options.shortCircuit === true) {
                        return false;
                    }

                    result = false;
                }
            }
        }

        return result;
    };

    return traverse(topObj, topConfig, errors, topKeyPath);
};