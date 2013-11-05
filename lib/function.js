// Load modules

var Any = require('./any');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.Function = function () {

    Any.call(this);
    this._type = 'func';

    this._test(function (value, state, options) {

        if (typeof value === 'function') {
            return null;
        }

        return Any.error('function.base', null, state);
    });
};

Utils.inherits(internals.Function, Any);
