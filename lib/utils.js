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
            self[i] = parent.prototype[i];
        }
    }
    return self;
};


var Set = exports.Set = function () {
    this.inspect = require('sys').inspect;
    this._values = [];
    this._exists = {};
};


Set.prototype.add = function (value) {

    var key = this.inspect(value);
    if (!(key in this._exists)) {

        this._values.push(value);
        this._exists[key] = this._values.length;
    }
};


Set.prototype.remove = function (value) {

    var key = this.inspect(value);
    if (key in this._exists) {

        this._values.splice(this._exists[key], 1);
        delete this._exists[key];
    }
};


Set.prototype.map = function (fn) {

    return this._values.map(fn);
};




