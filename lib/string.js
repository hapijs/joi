// Load modules

var Any = require('./any');
var Errors = require('./errors');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.String = function () {

    Any.call(this);
    this._type = 'string';
    this._invalids.add('');

    this._base(function (value, state, options) {

        if (typeof value === 'string' ||
            value === null ||
            value === undefined) {

            return null;
        }

        return Errors.create('string.base', null, state, options);
    });
};

Utils.inherits(internals.String, Any);


internals.String.create = function () {

    return new internals.String();
};


internals.String.prototype.insensitive = function () {

    var obj = this.clone();
    obj._flags.insensitive = true;
    return obj;
};


internals.String.prototype.min = function (limit) {

    Utils.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    return this._test('min', limit, function (value, state, options) {

        if (typeof value === 'string' &&
            value.length >= limit) {

            return null;
        }

        return Errors.create('string.min', { value: limit }, state, options);
    });
};


internals.String.prototype.max = function (limit) {

    Utils.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    return this._test('max', limit, function (value, state, options) {

        if (!value ||
            value.length <= limit) {

            return null;
        }

        return Errors.create('string.max', { value: limit }, state, options);
    });
};


internals.String.prototype.length = function (limit) {

    Utils.assert(!isNaN(limit) && ((limit | 0) === parseFloat(limit)) && limit >= 0, 'limit must be a positive integer');

    return this._test('length', limit, function (value, state, options) {

        if (typeof value === 'string' &&
            value.length === limit) {

            return null;
        }

        return Errors.create('string.length', { value: limit }, state, options);
    });
};


internals.String.prototype.regex = function (pattern) {

    Utils.assert(pattern instanceof RegExp, 'pattern must be a RegExp');

    return this._test('regex', pattern, function (value, state, options) {

        if (typeof value === 'string' &&
            value.match(pattern)) {

            return null;
        }

        return Errors.create('string.regex', { value: pattern.toString() }, state, options);
    });
};


internals.String.prototype.alphanum = function () {

    return this._test('alphanum', undefined, function (value, state, options) {

        if (typeof value === 'string' &&
            value.match(/^[a-zA-Z0-9]+$/)) {

            return null;
        }

        return Errors.create('string.alphanum', null, state, options);
    });
};


internals.String.prototype.token = function () {

    return this._test('token', undefined, function (value, state, options) {

        if (typeof value === 'string' &&
            value.match(/^\w+$/)) {

            return null;
        }

        return Errors.create('string.token', null, state, options);
    });
};


internals.String.prototype.email = function () {

    var regex = /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/;

    return this._test('email', undefined, function (value, state, options) {

        if (typeof value === 'string' &&
            value.match(regex)) {

            return null;
        }

        return Errors.create('string.email', null, state, options);
    });
};


internals.String.prototype.isoDate = function () {

    var regex = /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/;

    return this._test('isoDate', undefined, function (value, state, options) {

        if (typeof value === 'string' &&
            value.match(regex)) {

            return null;
        }

        return Errors.create('string.isoDate', null, state, options);
    });
};


internals.String.prototype.guid = function () {

    var regex = /^[A-F0-9]{8}(?:-?[A-F0-9]{4}){3}-?[A-F0-9]{12}$/i;
    var regex2 = /^\{[A-F0-9]{8}(?:-?[A-F0-9]{4}){3}-?[A-F0-9]{12}\}$/i;

    return this._test('guid', undefined, function (value, state, options) {

        if (typeof value === 'string' &&
            value.match(regex) || value.match(regex2)) {

            return null;
        }

        return Errors.create('string.guid', null, state, options);
    });
};

internals.String.prototype.hostname = function () {
    
    var regex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
    
    return this._test('hostname', undefined, function (value, state, options) {
        
        if (typeof value === 'string' &&
            value.length <= 255 &&
            value.match(regex)) {
            
            return null;
        }
        
        return Errors.create("string.hostname", null, state, options);
    });
}
