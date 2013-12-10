// Load modules

var Any = require('./any');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.String = function () {

    Any.call(this);
    this._type = 'string';
    this._invalids.add('');

    this._test(function (value, state, options) {

        if (typeof value === 'string' ||
            value === null ||
            value === undefined) {

            return null;
        }

        return Any.error('string.base', null, state);
    });
};

Utils.inherits(internals.String, Any);


internals.String.prototype.emptyOk = function () {

    this._allow('');
    return this;
};


internals.String.prototype.insensitive = function () {

    this._flags.insensitive = true;
    return this;
};


internals.String.prototype.min = function (limit) {

    Utils.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    this._test('min', limit, function (value, state, options) {

        if (value !== null &&
            value !== undefined &&
            value.length >= limit) {

            return null;
        }

        return Any.error('string.min', { value: limit }, state);
    });

    return this;
};


internals.String.prototype.max = function (limit) {

    Utils.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    this._test('max', limit, function (value, state, options) {

        if (value !== null &&
            value.length <= limit) {

            return null;
        }

        return Any.error('string.max', { value: limit }, state);
    });

    return this;
};


internals.String.prototype.length = function (limit) {

    Utils.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    this._test('length', limit, function (value, state, options) {

        if (value !== null &&
            value.length === limit) {

            return null;
        }

        return Any.error('string.length', { value: limit }, state);
    });

    return this;
};


internals.String.prototype.regex = function (pattern) {

    Utils.assert(pattern instanceof RegExp, 'pattern must be a RegExp');

    this._test('regex', pattern, function (value, state, options) {

        if (value !== undefined &&
            value !== null &&
            value.match(pattern)) {

            return null;
        }

        return Any.error('string.regex', { value: pattern.toString() }, state);
    });

    return this;
};


internals.String.prototype.alphanum = function () {

    this._test('alphanum', function (value, state, options) {

        if (value !== undefined &&
            value !== null &&
            value.match(/^[a-zA-Z0-9]+$/)) {

            return null;
        }

        return Any.error('string.alphanum', null, state);
    });

    return this;
};


internals.String.prototype.token = function () {

    this._test('token', function (value, state, options) {

        if (value !== undefined &&
            value !== null &&
            value.match(/^\w+$/)) {

            return null;
        }

        return Any.error('string.token', null, state);
    });

    return this;
};


internals.String.prototype.email = function () {

    var regex = /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/;

    this._test('email', function (value, state, options) {

        if (value.match(regex)) {
            return null;
        }

        return Any.error('string.email', null, state);
    });
    
    return this;
};


internals.String.prototype.isoDate = function () {

    var regex = /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/;

    this._test(function (value, state, options) {

        if (value.match(regex)) {
            return null;
        }

        return Any.error('string.isoDate', null, state);
    });

    return this;
};


internals.String.prototype.guid = function () {

    var regex = /^[A-F0-9]{8}(?:-?[A-F0-9]{4}){3}-?[A-F0-9]{12}$/i;
    var regex2 = /^\{[A-F0-9]{8}(?:-?[A-F0-9]{4}){3}-?[A-F0-9]{12}\}$/i;

    this._test(function (value, state, options) {

        if (value.match(regex) || value.match(regex2)) {
            return null;
        }

        return Any.error('string.guid', null, state);
    });

    return this;
};
