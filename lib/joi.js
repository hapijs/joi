// Load modules

var Err = require('./error');
var Types = require('./types');
var Utils = require('./utils');


// Declare internals

var internals = {};


// Validate query

exports.query = function (request, next) {

    // true - anything allowed
    // false, null, {} - nothing allowed
    // {...} - ... allowed

    if (request._route.config.query === true) {
        return next();
    }

    return internals.validateRequestElement(request, 'query', request._route.config.query, next);
};


// Validate payload schema

exports.payload = function (request, next) {

    // null, undefined - anything allowed
    // false, {} - nothing allowed
    // {...} - ... allowed

    if (request._route.config.schema === null ||
        request._route.config.schema === undefined) {       // Value can be false

        return next();
    }

    return internals.validateRequestElement(request, 'payload', request._route.config.schema, next);
};


internals.validateRequestElement = function (request, elementKey, config, next) {

    var elementKeys = Object.keys(config || {});
    var submitted = Utils.clone(request[elementKey] || {});
    var isInvalid = false;
    var errorMsg = null;
    var finalizeFns = [];
    request._renamed = {};

    for (var i in elementKeys) {
        if (elementKeys.hasOwnProperty(i)) {
            var key = elementKeys[i];
            var validators = config[key]._validators;
            for (var j in validators) {
                if (validators.hasOwnProperty(j)) {
                    var validatorName = config[key]._checks[j];

                    if (validatorName in Types.mutatorMethods) {
                        finalizeFns.push(j);
                        continue;
                    }

                    var result = exports.param(key, config[key].type, request, validators[j], elementKey);
                    if (result === false) {
                        isInvalid = true;
                        errorMsg = key + ' = ' + request[elementKey][key];
                        break;
                    }

                    delete submitted[key];
                }
            }

            for (var l in finalizeFns) {
                var result = exports.param(key, config[key].type, request, validators[j], elementKey);
                if (result === false) {
                    isInvalid = true;
                    errorMsg = 'error on renaming ' + key + ' = ' + request[elementKey][key];
                    break;
                }
            }
        }
    }

    delete request._renamed;

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
        errorMsg = 'the key' + plural + ' (' + processed + ') ' + verb + ' not allowed in ' + elementKey + ' for ' + request.url;
    }

    if (isInvalid) {

        if (request.validationErrors && request.validationErrors.length > 0) {

            return next(Err.badRequest(request.validationErrors.join(".\n")));
        }
        else {

            return next(Err.badRequest('Invalid ' + elementKey + ' parameter: ' + errorMsg));
        }
    }
    else {

        return next();
    }
};


// Validate individual param

exports.param = function (key, type, req, validator, mode) {

    mode = mode || 'query';
    try {
        var value = req[mode][key];
    } catch (e) {
        throw e;
    }

    // Convert value from String if necessary

    var Type = Types[type];
    var converter = Type().convert || null;
    if (typeof converter !== 'undefined' &&
        converter !== null) {

        value = converter(value);
    }
    
    // Set request-scoped error writer
    //   errors stored as req.validationErrors = []
    req.addValidationError = Types.Base.prototype.RequestErrorFactory(req); 

    var result = validator(value, req[mode], key, req);
    
    // Remove from request object when finished
    delete req.addValidationError;
    
    return result;
};


