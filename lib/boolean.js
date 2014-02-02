// Load modules

var Any = require('./any');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Boolean = function () {

    Any.call(this);
    this._type = 'boolean';

    this._base(function (value, state, options) {

        if (value === null || typeof value === 'boolean') {
            return null;
        }

        return Any.error('boolean.base', null, state);
    });
};

Utils.inherits(internals.Boolean, Any);


internals.Boolean.prototype._convert = function (value) {

    if (typeof value !== 'string') {
        return value;
    }

    var lowerCase      = value.toLowerCase()
        , falseValues  = ['false', 'off', 'no']
        , trueValues   = ['true', 'on', 'yes']
        , isValueFalse = false
        , isValueTrue  = false
        ;

    isValueFalse = (-1 != falseValues.indexOf(lowerCase));
    isValueTrue  = (-1 != trueValues.indexOf(lowerCase));

    return (isValueFalse ? false : (isValueTrue ? true : value));
};
