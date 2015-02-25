// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Hoek = require('hoek');
var ObjectID = require('bson').BSONPure.ObjectID;

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

    if (typeof value === 'string' &&
        options.convert) {

        try {
            result.value = new ObjectID(value);
        }
        catch (err) { }
    }

    var isObjectId = result.value &&
                     typeof result.value === 'object' &&
                     ObjectID.isValid(result.value.id);

    result.errors = isObjectId ? null : Errors.create('objectId.base', null, state, options);
    return result;
};


module.exports = new internals.ObjectID();
