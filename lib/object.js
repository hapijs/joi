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
    this._allowOtherKeys = false;

    this._test(function (value, options) {

        if (typeof value !== 'object' ||
            Array.isArray(value)) {

            return Base.error('object.base', null, options);
        }

        return self._traverse(value, options);
    });
};

Utils.inherits(internals.Object, Base);


internals.Object.prototype.allowOtherKeys = function () {

    this._allowOtherKeys = true;
    return this;
};


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


internals.Object.prototype._traverse = function (value, options) {

    if (!this._config) {            // Object() allows any keys
        return null;
    }

    var keys = Object.keys(this._config);
    var unprocessed = Utils.mapToObject(Object.keys(value));
    var errors = [];

    var settings = Utils.clone(options);

    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var config = this._config[key];
        var item = value[key];

        config = Array.isArray(config) ? config : [config];

        var itemErrors = [];
        for (var c = 0, cl = config.length; c < cl; ++c) {
            settings.parent = value;
            settings.key = key;
            settings.keyPath = options.keyPath + '.' + key;

            var err = config[c]._validate(item, settings);
            if (!err) {                                             // Found a valid match
                itemErrors = [];
                break;
            }

            if (Array.isArray(err)) {
                itemErrors = itemErrors.concat(err);
            }
            else {
                itemErrors.push(err);
            }
        }

        if (itemErrors.length) {
            errors = errors.concat(itemErrors);
            if (options.earlyAbort) {
                return errors;
            }
        }

        delete unprocessed[key];
    }

    if (!this._allowOtherKeys) {
        var unprocessedKeys = Object.keys(unprocessed);
        if (unprocessedKeys.length) {
            errors.push(Base.error('object.allowOtherKeys', { keys: unprocessedKeys.join(', ') }, options));
        }
    }

    return errors.length ? errors : null;
};