// Load modules

var Sys = require('sys');
var Utils = require('./utils');

// Declare internals

var internals = {};


module.exports = internals.Set = function (initialValue) {

    this.inspect = Sys.inspect;
    this._values = [];
    this._exists = {};

    if (initialValue !== null &&
        typeof initialValue !== 'undefined') {

        Utils.assert(initialValue instanceof Array, 'Improper initial value provided');

        for (var i = initialValue.length - 1; i >= 0; i--) {
            this.add(initialValue[i]);
        }
    }

    return this;
};


internals.Set.prototype.add = function (value) {

    var key = this.inspect(value);
    if (!(this._exists.hasOwnProperty(key))) {

        this._values.push(value);
        this._exists[key] = this._values.length - 1;
    }
};


internals.Set.prototype.remove = function (value) {

    var key = this.inspect(value);
    if (this._exists.hasOwnProperty(key)) {

        this._values.splice(this._exists[key], 1);
        delete this._exists[key];
    }
};


internals.Set.prototype.get = function () {

    return this._values;
};


internals.Set.prototype.has = function (value) {

    return this._exists.hasOwnProperty(this.inspect(value));
};


internals.Set.prototype.valueOf = function () {

    return this._values;
};


internals.Set.prototype.toJSON = internals.Set.prototype.toString = function () {

    return JSON.stringify(this.valueOf());
};


internals.Set.prototype.map = function (fn) {

    return this._values.map(fn);
};