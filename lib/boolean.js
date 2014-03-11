// Load modules

var Any = require('./any');
var Errors = require('./errors');
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

        return Errors.create('boolean.base', null, state, options);
    });
};

Utils.inherits(internals.Boolean, Any);


internals.Boolean.create = function () {

    return new internals.Boolean();
};


internals.Boolean.prototype._convert = function (value) {

    if (typeof value !== 'string') {
        return value;
    }

    value = value.toLowerCase();
    return (value === 'true' || value === 'yes' || value === 'on' ? true
                                                                  : (value === 'false' || value === 'no' || value === 'off' ? false : value));
};
