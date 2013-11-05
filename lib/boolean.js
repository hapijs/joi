// Load modules

var Any = require('./any');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Boolean = function () {

    Any.call(this);
    this._type = 'boolean';

    this._test(function (value, state, options) {

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

    var lowercase = value.toLowerCase();
    return (lowercase === 'true' || lowercase === 'yes' ? true : (lowercase === 'false' || lowercase === 'no' ? false : value));
};
