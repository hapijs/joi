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


exports.validate = function (object, config, next) {

    var self = this;

    var submitted = Utils.clone(object || {});
    var errorMsg = null;

    var placeholder = {};
    placeholder.add = Types.Base.prototype.RequestErrorFactory(placeholder);
    placeholder._renamed = {};

    var validateConfigObj = function(configObj) {

        Object.keys(configObj).forEach(function (key) {

            var value = object[key];

            var T = Types[configObj[key].type];
            var converter = T().convert || null;
            if (typeof converter === 'function') {
                value = converter(value);
                if (self.settings.saveConversions) {
                    object[key] = value;
                }
            }

            var result  = configObj[key].validate(value, key, object, placeholder);

            if (!result) {
                errorMsg = key + ' = ' + value;
                return;
            }
            else {
                delete submitted[key];
            }
        });
    };

    if (config instanceof Array) {
        config.forEach(function (configObj) {

            validateConfigObj(configObj || {});
            if (!errorMsg) {                                        // Return if the object is validated without error
                return;
            }

            submitted = Utils.clone(object || {});
        });
    }
    else {
        errorMsg = validateConfigObj(config || {});
    }


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