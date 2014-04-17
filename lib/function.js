// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Hoek = require('hoek');


// Declare internals

var internals = {};


exports.create = function () {

    return new internals.Function();
};


internals.Function = function () {

    Any.call(this);
    this._type = 'func';
};

Hoek.inherits(internals.Function, Any);


internals.Function.prototype._base = function (value, state, options) {

    return {
        value: value,
        errors: (typeof value === 'function') ? null : Errors.create('function.base', null, state, options)
    };
};
