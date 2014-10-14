// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Hoek = require('hoek');

// Declare internals

var internals = {};

internals.Recurse = function () {

	Any.call(this);
    this._type = 'recurse';
}

Hoek.inherits(internals.Recurse, Any);

module.exports = new internals.Recurse();
