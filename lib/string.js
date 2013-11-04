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

    this._test(function (value, options) {

        if (typeof value === 'string' ||
            value === null ||
            value === undefined) {

            return null;
        }

        return Base.error('string.base', null, options);
    });
};

Utils.inherits(internals.String, Base);


internals.String.prototype.emptyOk = function () {

    this._allow('');
    this._modifiers.add('emptyOk');
    return this;
};


internals.min = function (n) {

    Utils.assert((!isNaN(n) && ((n | 0) === parseFloat(n))), 'In Types.String.min(n), the n must be an integer');
    Utils.assert(n >= 0, 'In Types.String.min(n), the n must be a non-negative integer');

    return function (value, options) {

        if (value !== null &&
            value !== undefined &&
            value.length >= n) {

            return null;
        }

        return Base.error('string.min', { value: n }, options);
    };
};


internals.String.prototype.min = function (n) {

    this._valids.remove(undefined);
    this._test(internals.min(n));
    return this;
};


internals.max = function (n) {

    Utils.assert((!isNaN(n) && ((n | 0) == parseFloat(n))), 'In Types.String.max(n), the n must be an integer');
    Utils.assert(n >= 0, 'In Types.String.max(n), the n must be a non-negative integer');

    return function (value, options) {

        if (value !== null &&
            value.length <= n) {

            return null;
        }

        return Base.error('string.max', { value: n }, options);
    };
};


internals.String.prototype.max = function (n) {

    this._test(internals.max(n));
    return this;
};


internals.regex = function (n) {

    Utils.assert(n instanceof RegExp, 'In Types.String.regex(n), the n must be a RegExp');

    return function (value, options) {

        if (value !== undefined &&
            value !== null &&
            value.match(n)) {

            return null;
        }

        return Base.error('string.regex', { value: n.toString() }, options);
    };
};


internals.String.prototype.regex = function (pattern) {

    this._test(internals.regex(pattern));
    return this;
};


internals.date = function () {

    return function (value, options) {

        value = (isNaN(Number(value)) === false) ? +value : value;
        var converted = new Date(value);

        if (!isNaN(converted.getTime())) {
            return null;
        }

        return Base.error('string.date', null, options);
    };
};


internals.String.prototype.date = function () {

    this._test(internals.date.apply(arguments));
    return this;
};


internals.String.prototype.alphanum = function (spacesEnabled) {

    spacesEnabled = (spacesEnabled === null) ? true : spacesEnabled;
    var regex = (spacesEnabled ? /^[\w\s]+$/ : /^[a-zA-Z0-9]+$/);

    this._test(function (value, options) {

        if (value !== undefined &&
            value !== null &&
            value.match(regex)) {

            return null;
        }

        return Base.error('string.alphanum', { spaces: spacesEnabled ? 'or' : 'without' }, options);
    });
    
    return this;

};


internals.String.prototype.email = function () {

    var regex = /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/;

    this._test(function (value, options) {

        if (value.match(regex)) {
            return null;
        }

        return Base.error('string.email', null, options);
    });
    
    return this;
};
