// Load modules

var Base = require('./base');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.Any();
};


internals.Any = function () {

    Base.call(this);
    this._name = 'Any';
};

Utils.inherits(internals.Any, Base);

