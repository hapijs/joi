// Load modules


// Declare internals

var internals = {};


internals.Email = function () {

};


module.exports = new internals.Email();


// Email regular expression adapted from node-validator, Copyright (c) 2010-2012 Chris O'Hara <cohara87@gmail.com>
// node-validator is released under the MIT License and is available at https://github.com/chriso/node-validator

internals.Email.prototype._regex = /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/;