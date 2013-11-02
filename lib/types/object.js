// Load modules

var Base = require('./base');
var Utils = require('../utils');


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

    this._test('base', function (value, obj, key, errors, keyPath) {

        if (typeof value !== 'object' ||
            Array.isArray(value)) {

            errors.addLocalized('object.base', key, null, keyPath);
            return false;
        }

        return self._traverse(value, self._config, errors, keyPath);
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


internals.Object.prototype.allowOtherKeys = function () {

    this._allowOtherKeys = true;
    return this;
};


internals.Object.prototype._traverse = function (topObj, topConfig, errors, topKeyPath) {

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

                if (self._shortCircuit) {
                    return result;
                }
            }

            if (itemConfig._name === 'Object' && value !== null && typeof value !== 'undefined') {
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

                    if (self._shortCircuit) {
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