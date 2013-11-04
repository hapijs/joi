// Load modules

var Base = require('./base');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.Function();
};


internals.Function = function () {

    Base.call(this);
    this._name = 'Function';

    this._test(function (value, state, options) {

        if (value === null || typeof value === 'function') {
            return null;
        }

        return Base.error('function.base', null, state);
    });
};

Utils.inherits(internals.Function, Base);
