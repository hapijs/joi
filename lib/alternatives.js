// Load modules

var Any = require('./any');
var Cast = require('./cast');
var Errors = require('./errors');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Alternatives = function (alternatives) {

    var self = this;

    Any.call(this);
    this._type = 'alternatives';

    Utils.assert(alternatives && alternatives.length, 'Missing alternatives');
    Utils.assert(alternatives.length > 1, 'Alternatives require more than one');

    this._alternatives = alternatives;

    this._base(function (value, state, options) {

        return self._traverse(value, state, options);
    });
};

Utils.inherits(internals.Alternatives, Any);


internals.Alternatives.create = function (/* alternatives */) {

    var alt = new internals.Alternatives(Utils.flatten(Array.prototype.slice.call(arguments)));

    for (var i = 0, il = alt._alternatives.length; i < il; ++i) {
        alt.allow(Cast.schema(alt._alternatives[i])._valids.values());
    }

    return alt;
};


internals.Alternatives._create = function (/* alternatives */) {

    var alt = internals.Alternatives.create.apply(null, arguments);
    alt._invalids.remove(null);
    alt._valids.remove(undefined);
    return alt;
};


internals.Alternatives.prototype._traverse = function (value, state, options) {

    var errors = [];
    for (var i = 0, il = this._alternatives.length; i < il; ++i) {
        var err = Cast.schema(this._alternatives[i])._validate(value, state, options);
        if (!err) {     // Found a valid match
            return null;
        }

        errors = errors.concat(err);
    }

    return errors;
};


internals.Alternatives.prototype.describe = function () {

    var descriptions = [];
    for (var i = 0, il = this._alternatives.length; i < il; ++i) {
        descriptions.push(Cast.schema(this._alternatives[i]).describe());
    }

    return descriptions;
};
