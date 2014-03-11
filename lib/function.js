// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Function = function () {

    Any.call(this);
    this._type = 'func';

    this._base(function (value, state, options) {

        if (typeof value === 'function') {
            return null;
        }

        return Errors.create('function.base', null, state, options);
    });
};

Utils.inherits(internals.Function, Any);


internals.Function.create = function () {

    return new internals.Function();
};
