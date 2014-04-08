// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Hoek = require('hoek');


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

Hoek.inherits(internals.Buffer, Any);


internals.Buffer.create = function () {

    return new internals.Buffer();
};


internals.Buffer.prototype._convert = function (value) {

    if (typeof value !== 'string') {
        return value;
    }

    return new Buffer(value);
};

internals.Buffer.prototype.min = function (limit) {

    Hoek.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    return this._test('min', limit, function (value, state, options) {

        if (value.length >= limit) {
            return null;
        }

        return Errors.create('buffer.min', { value: limit }, state, options);
    });
};


internals.Buffer.prototype.max = function (limit) {

    Hoek.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    return this._test('max', limit, function (value, state, options) {

        if (value.length <= limit) {
            return null;
        }

        return Errors.create('buffer.max', { value: limit }, state, options);
    });
};

internals.Buffer.prototype.length = function (limit) {

    Hoek.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    return this._test('length', limit, function (value, state, options) {

        if (value.length === limit) {
            return null;
        }

        return Errors.create('buffer.length', { value: limit }, state, options);
    });
};
