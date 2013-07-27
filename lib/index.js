// Load modules

var Errors = require('./errors');
var Utils = require('./utils');
var Types = require('./types');


// Declare internals

var internals = {};


exports.Types = exports.types = Types;
exports.Utils = exports.utils = Utils;


exports.settings = {
    skipFunctions: false,
    saveConversions: false,
    skipConversions: false
};


exports.validate = function (object, config) {

    var self = this;

    var skipFunctions = this.settings.skipFunctions;
    var errors  = new Errors(object, config);

    var processConfig = function () {

        if (config instanceof Types.Base) {
            return validateKeyConfig(config, null, object);
        }

        var unprocessedObject = Utils.clone(object || {});
        var keys =  Object.keys(config || {});
        for (var i = 0, il = keys.length; i < il; ++ i) {

            var key = keys[i];
            var keyConfig = config[key];
            var value = object ? object[key] : object;
            delete unprocessedObject[key];

            validateKeyConfig(keyConfig, key, value);
        }

        Object.keys(unprocessedObject).forEach(function (unprocessedKey) {

            var unprocessedValueType = typeof unprocessedObject[unprocessedKey];
            if ((!skipFunctions || unprocessedValueType !== 'function') && unprocessedValueType !== 'undefined') {
                errors.add('the key (' + unprocessedKey + ') is not allowed', unprocessedKey);
            }
        });
    };

    var validateKeyConfig = function (keyConfig, key, value) {

        var converted;

        if (Array.isArray(keyConfig)) {
            var localErrors = new Errors(object, config);
            for (var i = 0, il = keyConfig.length; i < il; ++i) {
                converted = convertType(keyConfig[i], key, value);

                if (converted && keyConfig[i].validate(converted.value, object, key, localErrors, key)) {
                    return true;
                }
            }

            localErrors._values.map(function(error) {

                errors.add(error.message, error.path);
            });

            return false;
        }

        converted = convertType(keyConfig, key, value);

        return converted && keyConfig.validate(converted.value, object, key, errors, key);
    };

    var convertType = function (keyConfig, key, value) {

        var T = Types[keyConfig.type];
        var converter = T && T().convert || null;
        if (!self.settings.skipConversions && typeof converter === 'function') {
            value = converter(value);
            if (self.settings.saveConversions && key !== null) {
                object[key] = value;
            }

            return { value: value };
        }

        return { value: value };  // If no convert function then just return the value
    };

    processConfig();

    return errors.toError();
};
