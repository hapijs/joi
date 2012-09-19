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


var Set = exports.Set = function (initialValue) {
    this.inspect = require('sys').inspect;
    this._values = [];
    this._exists = {};
    
    if (initialValue !== null && typeof initialValue !== "undefined") {

        if (initialValue instanceof Array) {

            for(var i = initialValue.length - 1; i >= 0; i--) {

                this.add(initialValue[i]);
            }
        }
        else {

            // Error
            console.log("given improper input to Set")
        }
    }
};


Set.prototype.add = function (value) {

    var key = this.inspect(value);
    if (!(this._exists.hasOwnProperty(key))) {

        this._values.push(value);
        this._exists[key] = this._values.length - 1;
    }
};


Set.prototype.remove = function (value) {

    var key = this.inspect(value);
    if (this._exists.hasOwnProperty(key)) {

        this._values.splice(this._exists[key], 1);
        delete this._exists[key];
    }
};

Set.prototype.get = function(){
    return this._values;
}

Set.prototype.has = function(value) {
    return this._exists.hasOwnProperty(this.inspect(value));
}

Set.prototype.valueOf = function(){
    return this._values;
}

Set.prototype.toJSON =
Set.prototype.toString = function(){
    return JSON.inspect(this.valueOf());
}


Set.prototype.map = function (fn) {

    return this._values.map(fn);
};




