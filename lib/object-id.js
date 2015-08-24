var ObjectID = require('bson').ObjectID;

// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Hoek = require('hoek');


// Declare internals

var internals = {};


internals.ObjectID = function () {

    Any.call(this);
    this._type = 'objectId';
};

Hoek.inherits(internals.ObjectID, Any);


internals.ObjectID.prototype._base = function (value, state, options) {

    var result = {
        value: value
    };

    if (typeof value === 'string' && options.convert) {

        if (ObjectID.isValid(value)) {
            result.value = ObjectID(value);
        }
    }

    result.errors = (result.value instanceof ObjectID) ? null : Errors.create('objectId.base', null, state, options);
    return result;
};


module.exports = new internals.ObjectID();
