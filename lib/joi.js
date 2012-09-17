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
    var finalizeFns = [];

    var placeholder = {};
    placeholder._renamed = {};

    for (var i in elementKeys) {
        if (elementKeys.hasOwnProperty(i)) {
            var key = elementKeys[i];
            var validators = config[key].__validators;
            for (var j in validators) {
                if (validators.hasOwnProperty(j)) {
                    var validatorName = config[key].__checks[j];

                    if (validatorName in Types.mutatorMethods) {
                        finalizeFns.push(j);
                        continue;
                    }

                    var result = Types.validate(key, config[key].type, object, validators[j], placeholder);
                    if (result === false) {
                        isInvalid = true;
                        errorMsg = key + ' = ' + object[key];
                        break;
                    }

                    delete submitted[key];
                }
            }

            for (var l in finalizeFns) {
                var result = Types.validate(key, config[key].type, object, validators[j], placeholder);
                if (result === false) {
                    isInvalid = true;
                    errorMsg = 'error on renaming ' + key + ' = ' + object[key];
                    break;
                }
            }
        }
    }

    delete placeholder._renamed;

    // Handle inputs that haven't been defined in config

    var processed = Object.keys(submitted);
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

