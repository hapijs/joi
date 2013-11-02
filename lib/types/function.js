// Load modules

var Base = require('./base');
var Utils = require('../utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.Function();
};


internals.Function = function () {

    Base.call(this);
    this._name = 'Function';

    this._test('base', function (value, obj, key, errors, keyPath) {

        var result = (value === null || typeof value === 'function');

        if (!result) {
            errors.addLocalized('function.base', key, null, keyPath);
        }

        return result;
    });
};

Utils.inherits(internals.Function, Base);
