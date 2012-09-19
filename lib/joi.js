// Load modules

var Utils = require('./utils');
var Types = require('./types');


// Declare internals

var internals = {};


exports.Types = Types;


exports.validate = function (object, config, next) {

    var elementKeys = Object.keys(config || {});
    var submitted = Utils.clone(object || {});
    var isInvalid = false;
    var errorMsg = null;

    var placeholder = {};
    placeholder._renamed = {};

    for (var i in elementKeys) {
        
        var finalizeFns = [];
        
        if (elementKeys.hasOwnProperty(i)) {
            var key = elementKeys[i];
            var value = object[key];
            var validators = config[key].__validators;
            
            var T = Types[config[key].type];
            var converter = T().convert || null;
            if (typeof converter == "function") {

                value = converter(value);
            }
            
            // console.log('whereami', i, key)
            var result = config[key].validate(value, key, object, placeholder, config[key]);
            // console.log("validating", key, object[key], value, result)
            if (result === false) {
                isInvalid = true;
                errorMsg = key + ' = ' + value;
                // console.log(key, "failed to validate", value)
            }
            else {
                delete submitted[key];
            }
        }
    }

    delete placeholder._renamed;

    // Handle inputs that haven't been defined in config

    var processed = Object.keys(submitted);
    // console.log(object, submitted, processed)
    if (processed.length > 0) {

        isInvalid = true;
        var plural = '';
        var verb = 'is';
        if (processed.length > 1) {

            plural = 's';
            verb = 'are';
        }

        var plural = (processed.length > 1 ? 's' : '');
        errorMsg = 'the key' + plural + ' (' + processed + ') ' + verb + ' not allowed';
    }

    if (isInvalid) {

        if (placeholder.validationErrors && placeholder.validationErrors.length > 0) {

            return next(new Error(placeholder.validationErrors.join(".\n")));
        }
        else {

            return next(new Error('Invalid parameter: ' + errorMsg));
        }
    }
    else {

        return next();
    }
};

