// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Buffer = function () {

    Any.call(this);
    this._type = 'buffer';

    this._base(function (value, state, options) {

        if (Buffer.isBuffer(value)) {
            return null;
        }

        return Errors.create('buffer.base', null, state, options);
    });
};

Utils.inherits(internals.Buffer, Any);


internals.Buffer.create = function () {

    return new internals.Buffer();
};


internals.Buffer.prototype._convert = function (value) {

    if (typeof value !== 'string') {
        return value;
    }

    return new Buffer(value);
};
