// Load modules

var Hoek = require('hoek');


// Declare internals

var internals = {};


exports.create = function (key, options) {

    Hoek.assert(key, 'Missing reference key');
    Hoek.assert(typeof key === 'string', 'Invalid reference key:', key);

    var settings = Hoek.clone(options);         // options can be reused and modified

    var ref = function (value) {

        return Hoek.reach(value, key, settings);
    };

    ref.isJoi = true;
    ref.root = key.split((settings && settings.separator) || '.')[0];

    ref.toString = function () {

        return 'ref:' + key;
    };

    return ref;
};