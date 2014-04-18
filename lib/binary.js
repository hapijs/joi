// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Hoek = require('hoek');


// Declare internals

var internals = {};


// Declare internals

var internals = {};


exports.create = function () {

    return new internals.Binary();
};


internals.Binary = function () {

    Any.call(this);
    this._type = 'binary';
};

Hoek.inherits(internals.Binary, Any);


internals.Binary.prototype._base = function (value, state, options) {

    var result = {
        value: value
    };

    if (typeof value === 'string' &&
        options.convert) {

        try {
            var converted = new Buffer(value);
            result.value = converted;
        }
        catch (e) { }
    }

    result.errors = Buffer.isBuffer(result.value) ? null : Errors.create('binary.base', { value: result.value }, state, options);
    return result;
};



internals.Binary.prototype.min = function (limit) {

    Hoek.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'min must be a positive integer');

    return this._test('min', limit, function (value, state, options) {

        if (value.length >= limit) {
            return null;
        }

        return Errors.create('binary.min', { value: limit }, state, options);
    });
};


internals.Binary.prototype.max = function (limit) {

    Hoek.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'max must be a positive integer');

    return this._test('max', limit, function (value, state, options) {

        if (value.length <= limit) {
            return null;
        }

        return Errors.create('binary.max', { value: limit }, state, options);
    });
};


internals.Binary.prototype.length = function (limit) {

    Hoek.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'length must be a positive integer');

    return this._test('length', limit, function (value, state, options) {

        if (value.length === limit) {
            return null;
        }

        return Errors.create('binary.length', { value: limit }, state, options);
    });
};
