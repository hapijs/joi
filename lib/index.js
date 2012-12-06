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

    var elementKeys = Object.keys(config || {});
    var submitted = Utils.clone(object || {});
    var isInvalid = false;
    var errorMsg = null;

    var placeholder = {};
    placeholder.add = Types.Base.prototype.RequestErrorFactory(placeholder);
    placeholder._renamed = {};

    for (var i in elementKeys) {
        var finalizeFns = [];

        if (elementKeys.hasOwnProperty(i)) {
            var key = elementKeys[i];
            var value = object[key];
            var validators = config[key].__validators;

            var T = Types[config[key].type];
            var converter = T().convert || null;
            if (typeof converter === 'function') {

                value = converter(value);
                if (this.settings.saveConversions) {
                    object[key] = value;
                }
            }

            var result = config[key].validate(value, key, object, placeholder);

            if (!result) {
                isInvalid = true;
                errorMsg = key + ' = ' + value;
            }
            else {
                delete submitted[key];
            }
        }
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

        isInvalid = true;
        var plural = '';
        var verb = 'is';
        if (processed.length > 1) {
            plural = 's';
            verb = 'are';
        }

        var processedValues = processed.map(function (d) {

            var value = '(' + typeof submitted[d] + ') ';
            value += submitted[d].toString();
            var suffix = '';
            if (value.length) {
                suffix = '...';
            }
            return value.slice(0, 20) + suffix;
        });

        var plural = (processed.length > 1 ? 's' : '');
        errorMsg = 'the key' + plural + ' (' + processed + ') ' + verb + ' not allowed (values: ' + processedValues + ')';
    }

    if (isInvalid) {
        if (placeholder.validationErrors && placeholder.validationErrors.length > 0) {
            return next(new Error(placeholder.validationErrors.join('.\n')));
        }

        return next(new Error('Invalid parameter: ' + errorMsg));
    }

    return next();
};

