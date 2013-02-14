// Load modules

var Utils = require('./utils');
var Types = require('./types');


// Declare internals

var internals = {};


exports.Types = exports.types = Types;
exports.Utils = exports.utils = Utils;


exports.settings = {
    skipFunctions: false,
    saveConversions: false
};


exports.validate = function (object, config, options, next) {

    if (options == null) {
        options = {};
    }
    if (next == undefined && typeof options == 'function') {
        next = options;
        options = {};
    }

    var self = this;

    var submitted = Utils.clone(object || {});
    var errorMsg = null;

    var placeholder = {};
    placeholder.add = Types.Base.prototype.RequestErrorFactory(placeholder);
    placeholder._renamed = {};

    var processConfig = function () {

        Object.keys(config || {}).forEach(function (key) {

            var keyConfig = config[key];
            var value = object[key];

            if (!validateKeyConfig(keyConfig, key, value)) {
                errorMsg = key + ' = ' + value;
            }
            else {
                delete submitted[key];
            }
        });
    };

    var validateKeyConfig = function (keyConfig, key, value) {

        var converted = null;
        if (keyConfig instanceof Array) {
            for (var i = 0, il = keyConfig.length; i < il; ++i) {

                converted = convertType(keyConfig[i], key, value);
                if (converted && keyConfig[i].validate(converted.value, key, object, placeholder)) {
                    return true;
                }
            }

            return false;
        }

        converted = convertType(keyConfig, key, value);

        return converted && keyConfig.validate(converted.value, key, object, placeholder);
    };

    var convertType = function (keyConfig, key, value) {

        var T = Types[keyConfig.type];
        var converter = T && T().convert || null;
        if (typeof converter === 'function') {
            try {
                value = converter(value);
                if (self.settings.saveConversions) {
                    object[key] = value;
                }
                
                return { value: value };
            }
            catch (err) {
                return null;
            }
        }

        return { value: value };                                                            // If no convert function then just return the value
    };

    processConfig();
    delete placeholder._renamed;

    // Handle inputs that haven't been defined in config

    var processed = Object.keys(submitted);

    if (this.settings.skipFunctions) {
        for (var p in processed) {
            if (typeof submitted[processed[p]] === 'function') {
                delete submitted[processed[p]];
            }
        }
        processed = Object.keys(submitted);
    }

    if (processed.length > 0) {

        var processedValues = processed.map(function (d) {

            var value = '(' + typeof submitted[d] + ') ';
            value += submitted[d].toString();
            var suffix = '';
            if (value.length) {
                suffix = '...';
            }
            return value.slice(0, 20) + suffix;
        });

        var plural = (processed.length > 1) ? 's' : '';
        var verb = (processed.length > 1) ? 'are' : 'is';
        errorMsg = 'the key' + plural + ' (' + processed + ') ' + verb + ' not allowed (values: ' + processedValues + ')';
    }

    if (errorMsg) {
        if (placeholder.validationErrors && placeholder.validationErrors.length > 0) {
            return next(new Error(placeholder.validationErrors.join('.\n')));
        }

        return next(new Error('Invalid parameter: ' + errorMsg));
    }

    return next();
};
