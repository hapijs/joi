// Load modules

var Base = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.Boolean();
};


internals.Boolean = function () {

    Base.call(this);
    this._name = 'Boolean';

    this._test('base', function (value, obj, key, errors, keyPath) {

        var result = (value === null || typeof value === 'boolean');
        if (!result) {
            errors.addLocalized('boolean.base', key, null, keyPath);
        }

        return result;
    });
};

Utils.inherits(internals.Boolean, Base);


internals.Boolean.prototype._convert = function (value) {

    if (typeof value !== 'string') {
        return value;
    }

    return value.toLowerCase() === 'true';
};
