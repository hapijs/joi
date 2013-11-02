// Load modules

var Sys = require('sys');


// Declare internals

var internals = {};


module.exports = internals.Set = function (values) {

    this._set = {};
    if (values) {
        for (var i = 0, il = values.length; i < il; ++i) {
            this.add(values[i]);
        }
    }
};


internals.Set.prototype.add = function (value) {

    this._set[this.key(value)] = value;
};


internals.Set.prototype.remove = function (value) {

    delete this._set[this.key(value)];
};


internals.Set.prototype.has = function (value) {

    return this._set.hasOwnProperty(this.key(value));
};


internals.Set.prototype.key = function (value) {

    return Sys.inspect(value);
};


internals.Set.prototype.toString = function () {

    var list = '';
    var values = Object.keys(this._set);
    for (var i = 0, il = values.length; i < il; ++i) {

        if (i) {
            list += ', ';
        }

        var value = this._set[values[i]];
        list += (value === undefined ? 'undefined' : (value === null ? 'null' : value));
    }

    return list;
};