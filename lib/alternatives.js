// Load modules

var Hoek = require('hoek');
var Any = require('./any');
var Cast = require('./cast');
var Errors = require('./errors');


// Declare internals

var internals = {};


internals.Alternatives = function () {

    Any.call(this);
    this._type = 'alternatives';
    this._invalids.remove(null);

    this._inner = [];
};

Hoek.inherits(internals.Alternatives, Any);


internals.Alternatives.prototype._base = function (value, state, options) {

    var errors = [];
    for (var i = 0, il = this._inner.length; i < il; ++i) {
        var result = this._inner[i]._validate(value, state, options);
        if (!result.errors) {     // Found a valid match
            return result;
        }

        errors = errors.concat(result.errors);
    }

    return { errors: errors.length ? errors : Errors.create('alternatives.base', null, state, options) };
};


internals.Alternatives.prototype.try = function (/* schemas */) {

    
    var schemas = Hoek.flatten(Array.prototype.slice.call(arguments));
    Hoek.assert(schemas.length, 'Cannot add other alternatives without at least one schema');

    var obj = this.clone();

    for (var i = 0, il = schemas.length; i < il; ++i) {
        obj._inner.push(Cast.schema(schemas[i]));
    }

    return obj;
};


internals.Alternatives.prototype.describe = function () {

    var descriptions = [];
    for (var i = 0, il = this._inner.length; i < il; ++i) {
        descriptions.push(this._inner[i].describe());
    }

    return descriptions;
};


module.exports = new internals.Alternatives();
