// Load modules

var Hoek = require('hoek');
var Any = require('./any');
var Cast = require('./cast');
var Errors = require('./errors');


// Declare internals

var internals = {};


exports.create = function (/* alternatives */) {

    var alt = new internals.Alternatives(Hoek.flatten(Array.prototype.slice.call(arguments)));
    alt._invalids.remove(null);
    return alt;
};


exports._create = function (/* alternatives */) {                // Used to cast []

    var alt = exports.create.apply(null, arguments);
    alt._valids.remove(undefined);
    return alt;
};


internals.Alternatives = function (alternatives) {

    Any.call(this);
    this._type = 'alternatives';

    Hoek.assert(alternatives && alternatives.length, 'Missing alternatives');
    Hoek.assert(alternatives.length > 1, 'Alternatives require more than one');

    this._inner = [];
    for (var i = 0, il = alternatives.length; i < il; ++i) {
        this._inner.push(Cast.schema(alternatives[i]));
    }
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

    return { errors: errors };
};


internals.Alternatives.prototype.describe = function () {

    var descriptions = [];
    for (var i = 0, il = this._inner.length; i < il; ++i) {
        descriptions.push(this._inner[i].describe());
    }

    return descriptions;
};
