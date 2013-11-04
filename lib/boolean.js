// Load modules

var Base = require('./base');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.Boolean();
};


internals.Boolean = function () {

    Base.call(this);
    this._name = 'Boolean';

    this._test(function (value, options) {

        if (value === null || typeof value === 'boolean') {
            return null;
        }

        return Base.error('boolean.base', null, options);
    });
};

Utils.inherits(internals.Boolean, Base);


internals.Boolean.prototype._convert = function (value) {

    if (typeof value !== 'string') {
        return value;
    }

    var lowercase = value.toLowerCase();
    return (lowercase === 'true' || lowercase === 'yes' ? true : (lowercase === 'false' || lowercase === 'no' ? false : value));
};
