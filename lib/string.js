// Load modules

var Base = require('./base');
var Utils = require('./utils');


// Declare internals

var internals = {};


module.exports = internals.createType = function () {

    return new internals.String();
};


internals.String = function () {

    Base.call(this);
    this._name = 'String';
    this._invalids.add('');

    this._test(function (value, state, options) {

        if (typeof value === 'string' ||
            value === null ||
            value === undefined) {

            return null;
        }

        return Base.error('string.base', null, state);
    });
};

Utils.inherits(internals.String, Base);


internals.String.prototype.emptyOk = function () {

    this._allow('');
    return this;
};


internals.String.prototype.insensitive = function () {

    this._insensitive = true;
    return this;
};


internals.String.prototype.min = function (n) {

    Utils.assert(!isNaN(n) && ((n | 0) === parseFloat(n)) && n >= 0, 'n must be a positive integer');

    this._test(function (value, state, options) {

        if (value !== null &&
            value !== undefined &&
            value.length >= n) {

            return null;
        }

        return Base.error('string.min', { value: n }, state);
    });

    return this;
};


internals.String.prototype.max = function (n) {

    Utils.assert(!isNaN(n) && ((n | 0) === parseFloat(n)) && n >= 0, 'n must be a positive integer');

    this._test(function (value, state, options) {

        if (value !== null &&
            value.length <= n) {

            return null;
        }

        return Base.error('string.max', { value: n }, state);
    });

    return this;
};


internals.String.prototype.length = function (n) {

    Utils.assert(!isNaN(n) && ((n | 0) === parseFloat(n)) && n >= 0, 'n must be a positive integer');

    this._test(function (value, state, options) {

        if (value !== null &&
            value.length === n) {

            return null;
        }

        return Base.error('string.length', { value: n }, state);
    });

    return this;
};


internals.String.prototype.regex = function (pattern) {

    Utils.assert(pattern instanceof RegExp, 'pattern must be a RegExp');

    this._test(function (value, state, options) {

        if (value !== undefined &&
            value !== null &&
            value.match(pattern)) {

            return null;
        }

        return Base.error('string.regex', { value: pattern.toString() }, state);
    });

    return this;
};


internals.String.prototype.date = function () {

    this._test(function (value, state, options) {

        value = (isNaN(Number(value)) === false) ? +value : value;
        var converted = new Date(value);

        if (!isNaN(converted.getTime())) {
            return null;
        }

        return Base.error('string.date', null, state);
    });

    return this;
};


internals.String.prototype.alphanum = function (spacesEnabled) {

    spacesEnabled = (spacesEnabled === null) ? true : spacesEnabled;
    var regex = (spacesEnabled ? /^[\w\s]+$/ : /^[a-zA-Z0-9]+$/);

    this._test(function (value, state, options) {

        if (value !== undefined &&
            value !== null &&
            value.match(regex)) {

            return null;
        }

        return Base.error('string.alphanum', { spaces: spacesEnabled ? 'or' : 'without' }, state);
    });
    
    return this;

};


internals.String.prototype.email = function () {

    var regex = /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/;

    this._test(function (value, state, options) {

        if (value.match(regex)) {
            return null;
        }

        return Base.error('string.email', null, state);
    });
    
    return this;
};
