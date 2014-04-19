// Load modules

var Hoek = require('hoek');


// Declare internals

var internals = {};


exports.create = function (key) {

    var ref = function (value) {

        return Hoek.reach(value, key);
    };

    ref.isJoi = true;
    ref.toString = function () {

        return 'ref:' + key;
    };

    return ref;
};