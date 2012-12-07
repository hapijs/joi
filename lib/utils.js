// Load modules

var Hoek = require('hoek');


// Declare internals

var internals = {};


// Import Hoek Utilities

internals.import = function () {

    for (var i in Hoek) {
        if (Hoek.hasOwnProperty(i)) {
            exports[i] = Hoek[i];
        }
    }
};

internals.import();


exports.mixin = function (self, parent) {

    for (var i in parent.prototype) {
        if (parent.prototype.hasOwnProperty(i)) {
            if (!self.hasOwnProperty(i)) {
                self[i] = parent.prototype[i];
            }
        }
    }
    return self;
};

